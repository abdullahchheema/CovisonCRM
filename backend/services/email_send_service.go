package services

import (
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"
)

// EmailSendResult reports the outcome of sending to a single contact, so
// callers (the immediate "send now" handler) can report failures back to
// the user right away instead of only logging them server-side.
type EmailSendResult struct {
	ContactID    string `json:"contactId"`
	ContactName  string `json:"contactName"`
	ContactEmail string `json:"contactEmail"`
	Success      bool   `json:"success"`
	Error        string `json:"error,omitempty"`
}

// LeadDetails carries the optional pipeline fields entered when composing an
// email. All fields may be empty — blanks fall back to sensible defaults when
// the lead is created.
type LeadDetails struct {
	Title         string
	Value         float64
	Currency      string
	AssignedTo    string
	ExpectedClose *time.Time
}

// ensureLead creates a Lead-stage deal for a contact the first time they're
// emailed. It skips creation if the contact already has a deal in the "lead"
// stage (a lead that has moved further along is allowed to spawn a fresh one).
func ensureLead(contact models.Contact, lead *LeadDetails) {
	var existing int64
	db.DB.Model(&models.Deal{}).
		Where("contactId = ? AND stage = ?", contact.ID, "lead").
		Count(&existing)
	if existing > 0 {
		return
	}

	title := ""
	currency := "USD"
	var value float64
	assignedTo := ""
	var expectedClose *time.Time
	if lead != nil {
		title = strings.TrimSpace(lead.Title)
		value = lead.Value
		if strings.TrimSpace(lead.Currency) != "" {
			currency = lead.Currency
		}
		assignedTo = lead.AssignedTo
		expectedClose = lead.ExpectedClose
	}
	if title == "" {
		// Default the title to the contact's name, falling back to company.
		if contact.Name != "" {
			title = contact.Name
		} else {
			title = contact.Company
		}
	}

	now := time.Now()
	deal := models.Deal{
		ID:            models.NewUUID(),
		Title:         title,
		ContactID:     contact.ID,
		ContactName:   contact.Name,
		Value:         value,
		Currency:      currency,
		Stage:         "lead",
		AssignedTo:    assignedTo,
		ExpectedClose: expectedClose,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	db.DB.Create(&deal)
}

// ResolveGroupContacts expands an email group into Contact rows. Static
// groups use their fixed ContactIDs list; dynamic groups resolve membership
// live from their tag rule, so they automatically include contacts tagged
// after the group was created.
func ResolveGroupContacts(groupID string) ([]models.Contact, *models.EmailGroup, error) {
	var group models.EmailGroup
	if err := db.DB.Where("id = ?", groupID).First(&group).Error; err != nil {
		return nil, nil, err
	}

	if group.Type == "dynamic" {
		ids, err := ContactIDsForTags(group.TagIDs, group.TagMatch)
		if err != nil {
			return nil, &group, err
		}
		contacts, err := ResolveContacts(ids)
		return contacts, &group, err
	}

	contacts, err := ResolveContacts(group.ContactIDs)
	return contacts, &group, err
}

// AudienceSelection composes a campaign recipient list from any combination
// of explicit contacts, groups (static or dynamic), and tag rules — with an
// optional exclude-tags list. This is the additive audience builder backing
// the Send Email dialog and its recipient preview.
type AudienceSelection struct {
	ContactIDs    []string `json:"contactIds,omitempty"`
	GroupIDs      []string `json:"groupIds,omitempty"`
	TagIDs        []string `json:"tagIds,omitempty"`
	TagMatch      string   `json:"tagMatch,omitempty"` // "any" (default) | "all"
	ExcludeTagIDs []string `json:"excludeTagIds,omitempty"`
}

// ResolveAudience unions every selection method into a single deduplicated
// contact list, then strips out anyone carrying an excluded tag.
func ResolveAudience(sel AudienceSelection) ([]models.Contact, error) {
	idSet := make(map[string]bool)

	for _, id := range sel.ContactIDs {
		idSet[id] = true
	}

	for _, groupID := range sel.GroupIDs {
		contacts, _, err := ResolveGroupContacts(groupID)
		if err != nil {
			continue // skip a bad/deleted group rather than failing the whole send
		}
		for _, ct := range contacts {
			idSet[ct.ID] = true
		}
	}

	if len(sel.TagIDs) > 0 {
		ids, err := ContactIDsForTags(sel.TagIDs, sel.TagMatch)
		if err != nil {
			return nil, err
		}
		for _, id := range ids {
			idSet[id] = true
		}
	}

	if len(sel.ExcludeTagIDs) > 0 {
		excluded, err := ContactIDsForTags(sel.ExcludeTagIDs, "any")
		if err != nil {
			return nil, err
		}
		for _, id := range excluded {
			delete(idSet, id)
		}
	}

	ids := make([]string, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}

	return ResolveContacts(ids)
}

// DescribeAudience builds a human-readable label for an audience selection,
// used in place of a single group name when logging a send (e.g. in
// EmailSend.GroupName) so history stays readable for multi-method sends.
func DescribeAudience(sel AudienceSelection, tagNames, groupNames []string) string {
	var parts []string
	if len(sel.ContactIDs) > 0 {
		parts = append(parts, "Individual contacts")
	}
	if len(groupNames) > 0 {
		parts = append(parts, "Groups: "+strings.Join(groupNames, ", "))
	}
	if len(tagNames) > 0 {
		parts = append(parts, "Tags: "+strings.Join(tagNames, ", "))
	}
	if len(parts) == 0 {
		return ""
	}
	return strings.Join(parts, " · ")
}

// ResolveContacts fetches Contact rows for a list of contact IDs.
func ResolveContacts(contactIDs []string) ([]models.Contact, error) {
	if len(contactIDs) == 0 {
		return nil, nil
	}
	var contacts []models.Contact
	if err := db.DB.Where("id IN ?", contactIDs).Find(&contacts).Error; err != nil {
		return nil, err
	}
	return contacts, nil
}

// RenderVars substitutes contact placeholders in a subject/body string.
func RenderVars(s, name, email, company, jobTitle, date string) string {
	s = strings.ReplaceAll(s, "{{name}}", name)
	s = strings.ReplaceAll(s, "{{email}}", email)
	s = strings.ReplaceAll(s, "{{company}}", company)
	s = strings.ReplaceAll(s, "{{jobTitle}}", jobTitle)
	s = strings.ReplaceAll(s, "{{date}}", date)
	return s
}

// SendAndLog sends a personalized email to every contact, then records the
// outcome (success or failure) in EmailSend (append-only history) and
// upserts EmailSendSummary (one row per contact, replaced in place).
func SendAndLog(
	contacts []models.Contact,
	subject, body string,
	sourceType string,
	sourceTemplateID *string,
	sourceTemplateName string,
	recipientMode string,
	groupID *string,
	groupName string,
	lead *LeadDetails,
) []EmailSendResult {
	results := make([]EmailSendResult, 0, len(contacts))
	today := time.Now().Format("2006-01-02")

	for _, contact := range contacts {
		if contact.Email == "" {
			continue
		}

		renderedSubject := RenderVars(subject, contact.Name, contact.Email, contact.Company, contact.JobTitle, today)
		// renderedBody stays as the (placeholder-filled) Lexical JSON so the
		// history view can re-render it; the email itself gets HTML.
		renderedBody := RenderVars(body, contact.Name, contact.Email, contact.Company, contact.JobTitle, today)
		htmlBody := utils.LexicalToHTML(renderedBody)

		sendErr := utils.SendEmail(contact.Email, renderedSubject, htmlBody)

		status := "sent"
		errMsg := ""
		if sendErr != nil {
			status = "failed"
			errMsg = sendErr.Error()
		}

		now := time.Now()
		send := models.EmailSend{
			ID:                 models.NewUUID(),
			ContactID:          contact.ID,
			ContactName:        contact.Name,
			ContactEmail:       contact.Email,
			Subject:            renderedSubject,
			Body:               renderedBody,
			SourceType:         sourceType,
			SourceTemplateID:   sourceTemplateID,
			SourceTemplateName: sourceTemplateName,
			RecipientMode:      recipientMode,
			GroupID:            groupID,
			GroupName:          groupName,
			Status:             status,
			ErrorMessage:       errMsg,
			SentAt:             now,
			CreatedAt:          now,
		}
		db.DB.Create(&send)

		summaryUpdates := map[string]interface{}{
			"contactName":        contact.Name,
			"contactEmail":       contact.Email,
			"subject":            renderedSubject,
			"body":               renderedBody,
			"sourceType":         sourceType,
			"sourceTemplateId":   sourceTemplateID,
			"sourceTemplateName": sourceTemplateName,
			"recipientMode":      recipientMode,
			"groupId":            groupID,
			"groupName":          groupName,
			"status":             status,
			"errorMessage":       errMsg,
			"lastSendId":         send.ID,
			"sentAt":             now,
			"updatedAt":          now,
		}
		result := db.DB.Model(&models.EmailSendSummary{}).Where("contactId = ?", contact.ID).Updates(summaryUpdates)
		if result.RowsAffected == 0 {
			summary := models.EmailSendSummary{
				ContactID:          contact.ID,
				ContactName:        contact.Name,
				ContactEmail:       contact.Email,
				Subject:            renderedSubject,
				Body:               renderedBody,
				SourceType:         sourceType,
				SourceTemplateID:   sourceTemplateID,
				SourceTemplateName: sourceTemplateName,
				RecipientMode:      recipientMode,
				GroupID:            groupID,
				GroupName:          groupName,
				Status:             status,
				ErrorMessage:       errMsg,
				LastSendID:         send.ID,
				SentAt:             now,
				UpdatedAt:          now,
			}
			db.DB.Create(&summary)
		}

		// Emailing a contact makes them a lead. Only on a successful send —
		// a failed attempt didn't actually reach them.
		if sendErr == nil {
			ensureLead(contact, lead)
		}

		results = append(results, EmailSendResult{
			ContactID:    contact.ID,
			ContactName:  contact.Name,
			ContactEmail: contact.Email,
			Success:      sendErr == nil,
			Error:        errMsg,
		})
	}

	return results
}
