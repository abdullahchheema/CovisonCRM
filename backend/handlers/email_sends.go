package handlers

import (
	"net/http"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/services"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
)

type sendEmailRequest struct {
	SourceType    string   `json:"sourceType" binding:"required"` // template | custom
	TemplateID    *string  `json:"templateId,omitempty"`
	Subject       string   `json:"subject" binding:"required"`
	Body          string   `json:"body" binding:"required"`
	RecipientMode string   `json:"recipientMode" binding:"required"` // group | individual | audience
	GroupID       *string  `json:"groupId,omitempty"`
	ContactIDs    []string `json:"contactIds,omitempty"`
	// Audience is the additive builder (contacts + groups + tags + excludes).
	// When present (RecipientMode == "audience"), it takes precedence over the
	// legacy GroupID/ContactIDs fields above, which remain for back-compat
	// with anything still sending the old shape.
	Audience *services.AudienceSelection `json:"audience,omitempty"`
	SendDate string                      `json:"sendDate,omitempty"` // YYYY-MM-DD
	SendTime string                      `json:"sendTime,omitempty"` // HH:MM
	// Optional pipeline/lead fields — used to populate the auto-created Lead.
	LeadTitle         string     `json:"leadTitle,omitempty"`
	LeadValue         float64    `json:"leadValue,omitempty"`
	LeadCurrency      string     `json:"leadCurrency,omitempty"`
	LeadAssignedTo    string     `json:"leadAssignedTo,omitempty"`
	LeadExpectedClose *time.Time `json:"leadExpectedClose,omitempty"`
}

// resolveSendContacts expands a send request into its recipient list and a
// human-readable label describing how they were selected (stored in
// EmailSend.GroupName so send history stays readable for audience-built sends).
func resolveSendContacts(req sendEmailRequest) ([]models.Contact, string, error) {
	if req.Audience != nil {
		contacts, err := services.ResolveAudience(*req.Audience)
		if err != nil {
			return nil, "", err
		}
		return contacts, describeAudienceForLog(*req.Audience), nil
	}

	if req.RecipientMode == "group" {
		if req.GroupID == nil || *req.GroupID == "" {
			return nil, "", errMissingGroupID
		}
		contacts, group, err := services.ResolveGroupContacts(*req.GroupID)
		if err != nil {
			return nil, "", err
		}
		return contacts, group.Name, nil
	}

	contacts, err := services.ResolveContacts(req.ContactIDs)
	return contacts, "", err
}

var errMissingGroupID = &missingFieldError{"groupId is required when recipientMode is 'group'"}

type missingFieldError struct{ msg string }

func (e *missingFieldError) Error() string { return e.msg }

// describeAudienceForLog resolves tag/group names for AudienceSelection so
// DescribeAudience can build a readable label.
func describeAudienceForLog(sel services.AudienceSelection) string {
	var tagNames []string
	if len(sel.TagIDs) > 0 {
		var tags []models.Tag
		db.DB.Where("id IN ?", sel.TagIDs).Find(&tags) //nolint
		for _, t := range tags {
			tagNames = append(tagNames, t.Name)
		}
	}
	var groupNames []string
	if len(sel.GroupIDs) > 0 {
		var groups []models.EmailGroup
		db.DB.Where("id IN ?", sel.GroupIDs).Find(&groups) //nolint
		for _, g := range groups {
			groupNames = append(groupNames, g.Name)
		}
	}
	return services.DescribeAudience(sel, tagNames, groupNames)
}

// GetEmailSends returns one row per contact: their most recent send via the
// Send Email feature.
func GetEmailSends(c *gin.Context) {
	sends := make([]models.EmailSendSummary, 0)
	if err := db.DB.Order("sentAt DESC").Find(&sends).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch sent emails", err)
		return
	}
	c.JSON(http.StatusOK, sends)
}

// GetEmailSendHistory returns every send ever made to a given contact,
// newest first.
func GetEmailSendHistory(c *gin.Context) {
	contactID := c.Param("contactId")
	history := make([]models.EmailSend, 0)
	if err := db.DB.Where("contactId = ?", contactID).Order("sentAt DESC").Find(&history).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch send history", err)
		return
	}
	c.JSON(http.StatusOK, history)
}

// DeleteEmailSend removes a single send-history row. If it was the contact's
// most recent send, the per-contact summary is recomputed from whatever
// history remains (or removed entirely if none is left).
func DeleteEmailSend(c *gin.Context) {
	id := c.Param("id")

	var send models.EmailSend
	if err := db.DB.Where("id = ?", id).First(&send).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "Send not found", err)
		return
	}

	if err := db.DB.Where("id = ?", id).Delete(&models.EmailSend{}).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete send", err)
		return
	}

	// Re-point (or remove) the contact's summary to the latest remaining send.
	var latest models.EmailSend
	err := db.DB.Where("contactId = ?", send.ContactID).Order("sentAt DESC").First(&latest).Error
	if err != nil {
		// No history left for this contact — drop the summary row too, and
		// remove the lead it created from the pipeline. Only a deal still in
		// the "lead" stage is deleted; a lead that has been moved forward
		// (qualified+) represents real work and is left untouched.
		db.DB.Where("contactId = ?", send.ContactID).Delete(&models.EmailSendSummary{})
		db.DB.Where("contactId = ? AND stage = ?", send.ContactID, "lead").Delete(&models.Deal{})
	} else {
		db.DB.Model(&models.EmailSendSummary{}).Where("contactId = ?", send.ContactID).Updates(map[string]interface{}{
			"subject":            latest.Subject,
			"body":               latest.Body,
			"sourceType":         latest.SourceType,
			"sourceTemplateId":   latest.SourceTemplateID,
			"sourceTemplateName": latest.SourceTemplateName,
			"recipientMode":      latest.RecipientMode,
			"groupId":            latest.GroupID,
			"groupName":          latest.GroupName,
			"status":             latest.Status,
			"errorMessage":       latest.ErrorMessage,
			"lastSendId":         latest.ID,
			"sentAt":             latest.SentAt,
			"updatedAt":          time.Now(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Send deleted"})
}

// CreateEmailSend sends an ad-hoc email immediately, or schedules it for a
// single future date/time if one is provided.
func CreateEmailSend(c *gin.Context) {
	var req sendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Audience == nil {
		if req.RecipientMode == "group" && (req.GroupID == nil || *req.GroupID == "") {
			utils.Err(c, http.StatusBadRequest, "groupId is required when recipientMode is 'group'")
			return
		}
		if req.RecipientMode == "individual" && len(req.ContactIDs) == 0 {
			utils.Err(c, http.StatusBadRequest, "contactIds is required when recipientMode is 'individual'")
			return
		}
	}

	sourceTemplateName := ""
	if req.SourceType == "template" && req.TemplateID != nil {
		var tmpl models.EmailTemplate
		if err := db.DB.Where("id = ?", *req.TemplateID).First(&tmpl).Error; err == nil {
			sourceTemplateName = tmpl.Name
		}
	}

	lead := &services.LeadDetails{
		Title:         req.LeadTitle,
		Value:         req.LeadValue,
		Currency:      req.LeadCurrency,
		AssignedTo:    req.LeadAssignedTo,
		ExpectedClose: req.LeadExpectedClose,
	}

	due := isImmediate(req.SendDate, req.SendTime)

	if !due {
		job := models.EmailSendJob{
			ID:                 models.NewUUID(),
			Subject:            req.Subject,
			Body:               req.Body,
			SourceType:         req.SourceType,
			SourceTemplateID:   req.TemplateID,
			SourceTemplateName: sourceTemplateName,
			RecipientMode:      req.RecipientMode,
			GroupID:            req.GroupID,
			ContactIDs:         req.ContactIDs,
			SendDate:           req.SendDate,
			SendTime:           req.SendTime,
			Status:             "pending",
			LeadTitle:          req.LeadTitle,
			LeadValue:          req.LeadValue,
			LeadCurrency:       req.LeadCurrency,
			LeadAssignedTo:     req.LeadAssignedTo,
			LeadExpectedClose:  req.LeadExpectedClose,
			CreatedAt:          time.Now(),
			UpdatedAt:          time.Now(),
		}
		if req.Audience != nil {
			job.RecipientMode = "audience"
			job.GroupIDs = req.Audience.GroupIDs
			job.ContactIDs = req.Audience.ContactIDs
			job.TagIDs = req.Audience.TagIDs
			job.TagMatch = req.Audience.TagMatch
			job.ExcludeTagIDs = req.Audience.ExcludeTagIDs
		}
		if err := db.DB.Create(&job).Error; err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to schedule email", err)
			return
		}
		c.JSON(http.StatusCreated, gin.H{"scheduled": true, "job": job})
		return
	}

	contacts, label, err := resolveSendContacts(req)
	if err != nil {
		utils.Err(c, http.StatusBadRequest, "Failed to resolve recipients", err)
		return
	}

	if len(contacts) == 0 {
		utils.Err(c, http.StatusBadRequest, "No resolvable recipients")
		return
	}

	recipientMode := req.RecipientMode
	if req.Audience != nil {
		recipientMode = "audience"
	}

	results := services.SendAndLog(
		contacts,
		req.Subject,
		req.Body,
		req.SourceType,
		req.TemplateID,
		sourceTemplateName,
		recipientMode,
		req.GroupID,
		label,
		lead,
	)

	c.JSON(http.StatusOK, gin.H{"scheduled": false, "results": results})
}

// POST /api/contacts/audience-count
// Body: services.AudienceSelection → live recipient-count preview for the
// Send Email dialog's audience builder, without actually sending anything.
func GetAudienceCount(c *gin.Context) {
	var sel services.AudienceSelection
	if err := c.ShouldBindJSON(&sel); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	contacts, err := services.ResolveAudience(sel)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to resolve audience", err)
		return
	}

	withEmail := 0
	for _, ct := range contacts {
		if ct.Email != "" {
			withEmail++
		}
	}

	c.JSON(http.StatusOK, gin.H{"total": len(contacts), "withEmail": withEmail})
}

// isImmediate reports whether a send should fire right away: either no
// schedule was provided, or the provided date/time is now or in the past.
func isImmediate(sendDate, sendTime string) bool {
	if sendDate == "" || sendTime == "" {
		return true
	}
	scheduled, err := time.ParseInLocation("2006-01-02 15:04", sendDate+" "+sendTime, time.Local)
	if err != nil {
		return true
	}
	return !scheduled.After(time.Now())
}
