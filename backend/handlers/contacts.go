package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/services"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// logActivity inserts a system-generated activity note and bumps the contact's lastActivity.
func logActivity(contactID, author, body string) {
	note := models.Note{
		ID:        models.NewUUID(),
		ContactID: contactID,
		Type:      models.NoteTypeActivity,
		Body:      body,
		Author:    author,
		CreatedAt: time.Now(),
	}
	db.DB.Create(&note)
	db.DB.Model(&models.Contact{}).Where("id = ?", contactID).Update("lastActivity", note.CreatedAt)
}

func getAuthorName(c *gin.Context) string {
	if u, ok := c.Get("user"); ok {
		if user, ok := u.(models.User); ok {
			return user.Name
		}
	}
	return ""
}

func GetContacts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := strings.TrimSpace(c.Query("search"))
	filterName := strings.TrimSpace(c.Query("name"))
	filterEmail := strings.TrimSpace(c.Query("email"))
	filterPhone := strings.TrimSpace(c.Query("phone"))
	status := strings.TrimSpace(c.Query("status"))
	priority := strings.TrimSpace(c.Query("priority"))
	company := strings.TrimSpace(c.Query("company"))
	contactOwner := strings.TrimSpace(c.Query("contactOwner"))
	lastActivityFrom := strings.TrimSpace(c.Query("lastActivityFrom"))
	lastActivityTo := strings.TrimSpace(c.Query("lastActivityTo"))
	dateFrom := strings.TrimSpace(c.Query("dateFrom"))
	dateTo := strings.TrimSpace(c.Query("dateTo"))
	tagIDs := splitCSV(c.Query("tagIds"))
	tagMatch := strings.TrimSpace(c.Query("tagMatch")) // "any" (default) | "all"
	excludeTagIDs := splitCSV(c.Query("excludeTagIds"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	if limit > 10000 {
		limit = 10000
	}

	query := db.DB.Model(&models.Contact{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"name LIKE ? OR mail LIKE ? OR number LIKE ? OR company LIKE ?",
			like, like, like, like,
		)
	}
	if filterName != "" {
		query = query.Where("name LIKE ?", "%"+filterName+"%")
	}
	if filterEmail != "" {
		query = query.Where("mail LIKE ?", "%"+filterEmail+"%")
	}
	if filterPhone != "" {
		query = query.Where("number LIKE ?", "%"+filterPhone+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if company != "" {
		query = query.Where("company LIKE ?", "%"+company+"%")
	}
	if contactOwner != "" {
		query = query.Where("contactOwner LIKE ?", "%"+contactOwner+"%")
	}
	if lastActivityFrom != "" {
		if t, err := time.Parse("2006-01-02", lastActivityFrom); err == nil {
			query = query.Where("lastActivity >= ?", t)
		}
	}
	if lastActivityTo != "" {
		if t, err := time.Parse("2006-01-02", lastActivityTo); err == nil {
			query = query.Where("lastActivity <= ?", t.Add(24*time.Hour-time.Second))
		}
	}
	if dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			query = query.Where("date >= ?", t)
		}
	}
	if dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			query = query.Where("date <= ?", t.Add(24*time.Hour-time.Second))
		}
	}

	if len(tagIDs) > 0 {
		matchedIDs, err := services.ContactIDsForTags(tagIDs, tagMatch)
		if err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to filter by tags", err)
			return
		}
		if len(matchedIDs) == 0 {
			c.JSON(http.StatusOK, gin.H{"data": []models.Contact{}, "total": 0, "page": page, "limit": limit})
			return
		}
		query = query.Where("id IN ?", matchedIDs)
	}
	if len(excludeTagIDs) > 0 {
		excludedIDs, err := services.ContactIDsForTags(excludeTagIDs, "any")
		if err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to filter by tags", err)
			return
		}
		if len(excludedIDs) > 0 {
			query = query.Where("id NOT IN ?", excludedIDs)
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch contacts", err)
		return
	}

	contacts := make([]models.Contact, 0)
	if err := query.Order("date DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&contacts).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch contacts", err)
		return
	}

	if err := services.AttachTags(contacts); err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch tags", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  contacts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// splitCSV parses a comma-separated query param into a trimmed, non-empty slice.
func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func CreateContact(c *gin.Context) {
	var contact models.Contact
	if err := c.ShouldBindJSON(&contact); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	contact.ID = models.NewUUID()
	contact.CreatedAt = time.Now()
	contact.LastActivity = time.Now()

	if contact.Email != "" {
		var count int64
		db.DB.Model(&models.Contact{}).Where("mail = ?", contact.Email).Count(&count)
		if count > 0 {
			utils.Err(c, http.StatusConflict, "A contact with this email already exists")
			return
		}
	}

	if err := db.DB.Create(&contact).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create contact", err)
		return
	}

	if len(contact.TagIDs) > 0 {
		if err := services.SyncContactTags(contact.ID, contact.TagIDs); err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to assign tags", err)
			return
		}
	}

	logActivity(contact.ID, getAuthorName(c), "Contact created")

	contacts := []models.Contact{contact}
	services.AttachTags(contacts) //nolint

	c.JSON(http.StatusCreated, contacts[0])
}

var csvHeaders = []string{
	"name", "email", "number", "company", "jobTitle",
	"priority", "companySize", "probability", "status",
	"linkedinUrl", "website", "country", "city", "niche",
}

func ExportContacts(c *gin.Context) {
	contacts := make([]models.Contact, 0)
	if err := db.DB.Find(&contacts).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch contacts", err)
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=contacts.csv")

	w := csv.NewWriter(c.Writer)
	_ = w.Write(csvHeaders)

	for _, ct := range contacts {
		_ = w.Write([]string{
			ct.Name,
			ct.Email,
			ct.Number,
			ct.Company,
			ct.JobTitle,
			ct.Priority,
			strconv.Itoa(ct.CompanySize),
			ct.Probability,
			ct.Status,
			ct.LinkedinURL,
			ct.Website,
			ct.Country,
			ct.City,
			ct.Niche,
		})
	}

	w.Flush()
}

func ImportContacts(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		utils.Err(c, http.StatusBadRequest, "CSV file is required", err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	rows, err := reader.ReadAll()
	if err != nil {
		utils.Err(c, http.StatusBadRequest, "Failed to parse CSV", err)
		return
	}
	if len(rows) < 2 {
		utils.Err(c, http.StatusBadRequest, "CSV has no data rows")
		return
	}

	// Build column index from header row so order doesn't matter.
	header := rows[0]
	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// col looks up a value by any of the given header keys (case-insensitive),
	// returning the first one found. Multiple keys let us recognize the same
	// field under different names from different lead-scraping tools.
	col := func(row []string, keys ...string) string {
		for _, key := range keys {
			if i, ok := idx[key]; ok && i < len(row) {
				if v := strings.TrimSpace(row[i]); v != "" {
					return v
				}
			}
		}
		return ""
	}

	// Collect non-empty emails from the CSV for duplicate checking
	var csvEmails []string
	for _, row := range rows[1:] {
		if e := col(row, "email"); e != "" {
			csvEmails = append(csvEmails, e)
		}
	}

	// Fetch which of those emails already exist in one query. Comparisons are
	// case-insensitive so "Jane@x.com" and "jane@x.com" are treated as the same.
	existingEmails := make(map[string]bool)
	if len(csvEmails) > 0 {
		var existing []models.Contact
		if err := db.DB.Select("mail").Where("mail IN ?", csvEmails).Find(&existing).Error; err == nil {
			for _, e := range existing {
				existingEmails[strings.ToLower(e.Email)] = true
			}
		}
	}

	var docs []models.Contact
	var skipped []string
	// Tracks emails already accepted earlier in this same CSV, so duplicate
	// rows within one file are caught too, not just duplicates against the DB.
	seenInFile := make(map[string]bool)

	for rowNum, row := range rows[1:] {
		name := col(row, "name")
		if name == "" {
			skipped = append(skipped, fmt.Sprintf("row %d: missing name", rowNum+2))
			continue
		}

		email := col(row, "email")
		emailKey := strings.ToLower(email)
		if email != "" && (existingEmails[emailKey] || seenInFile[emailKey]) {
			skipped = append(skipped, fmt.Sprintf("row %d: duplicate email %s", rowNum+2, email))
			continue
		}
		if email != "" {
			seenInFile[emailKey] = true
		}

		size, _ := strconv.Atoi(col(row, "companysize"))

		// Default these when the CSV doesn't include them, matching the
		// Add Contact form's defaults, instead of leaving them blank.
		priority := col(row, "priority")
		if priority == "" {
			priority = "low"
		}
		probability := col(row, "probability")
		if probability == "" {
			probability = "0.5"
		}
		status := col(row, "status")
		if status == "" {
			status = "new"
		}

		contact := models.Contact{
			ID:           models.NewUUID(),
			Name:         name,
			Email:        email,
			Number:       col(row, "number"),
			Company:      col(row, "company"),
			JobTitle:     col(row, "jobtitle"),
			Priority:     priority,
			CompanySize:  size,
			Probability:  probability,
			Status:       status,
			LastActivity: time.Now(),
			CreatedAt:    time.Now(),
			LinkedinURL:  col(row, "linkedinurl", "prospect_linkedin", "linkedin"),
			Website:      col(row, "website", "business_website"),
			Country:      col(row, "country", "business_country_name"),
			City:         col(row, "city", "business_region", "region"),
			Niche:        col(row, "niche", "business_naics_description", "industry"),
		}
		docs = append(docs, contact)
	}

	if len(docs) == 0 {
		utils.Err(c, http.StatusBadRequest, "No valid rows to import")
		return
	}

	if err := db.DB.Create(&docs).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to import contacts", err)
		return
	}

	// Assign Tags (optional step): apply the chosen tags to every imported
	// contact, and/or auto-create+apply a tag per distinct niche value.
	tagIDs := splitCSV(c.PostForm("tagIds"))
	autoTagNiche := c.PostForm("autoTagNiche") == "true"

	nicheTagCache := make(map[string]string) // niche (lowercased) -> tagID
	tagRows := make([]models.ContactTag, 0, len(docs)*(len(tagIDs)+1))
	for _, doc := range docs {
		for _, tagID := range tagIDs {
			tagRows = append(tagRows, models.ContactTag{ContactID: doc.ID, TagID: tagID})
		}
		if autoTagNiche && doc.Niche != "" {
			key := strings.ToLower(doc.Niche)
			tagID, ok := nicheTagCache[key]
			if !ok {
				tag, err := GetOrCreateTagByName(doc.Niche)
				if err == nil {
					tagID = tag.ID
					nicheTagCache[key] = tagID
				}
			}
			if tagID != "" {
				tagRows = append(tagRows, models.ContactTag{ContactID: doc.ID, TagID: tagID})
			}
		}
	}
	if len(tagRows) > 0 {
		db.DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&tagRows) //nolint
	}

	c.JSON(http.StatusCreated, gin.H{
		"imported": len(docs),
		"skipped":  skipped,
	})
}

func UpdateContact(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid contact ID", err)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}
	delete(body, "_id")
	body["lastActivity"] = time.Now()

	// "tagIds" is not a real column — it's resolved through the contact_tags
	// join table — so pull it out before the raw-map Updates() and sync it
	// separately.
	var tagIDs []string
	var syncTags bool
	if rawTagIDs, ok := body["tagIds"]; ok {
		syncTags = true
		delete(body, "tagIds")
		if arr, ok := rawTagIDs.([]interface{}); ok {
			for _, v := range arr {
				if s, ok := v.(string); ok {
					tagIDs = append(tagIDs, s)
				}
			}
		}
	}
	delete(body, "tags")

	// The JSON key "email" maps to the "mail" column (carried over from the
	// original bson tag); raw map updates use the key as-is, so translate it.
	if email, ok := body["email"]; ok {
		delete(body, "email")
		body["mail"] = email
	}

	// "assignee" is a JSON-serialized column; raw map updates bypass the
	// model's field serializer, so marshal it to JSON ourselves.
	if assignee, ok := body["assignee"]; ok {
		raw, err := json.Marshal(assignee)
		if err != nil {
			utils.Err(c, http.StatusBadRequest, "Invalid assignee", err)
			return
		}
		body["assignee"] = string(raw)
	}

	// Fetch existing contact before update so we can diff fields.
	var existing models.Contact
	db.DB.Where("id = ?", id).First(&existing)

	author := getAuthorName(c)

	strField := func(key string) (string, bool) {
		v, ok := body[key]
		if !ok {
			return "", false
		}
		s, ok := v.(string)
		return s, ok
	}

	if s, ok := strField("status"); ok && s != "" && s != existing.Status {
		logActivity(id, author, fmt.Sprintf("Status changed from %s to %s", existing.Status, s))
	}
	if p, ok := strField("priority"); ok && p != "" && p != existing.Priority {
		logActivity(id, author, fmt.Sprintf("Priority changed from %s to %s", existing.Priority, p))
	}
	if n, ok := strField("name"); ok && n != "" && n != existing.Name {
		logActivity(id, author, fmt.Sprintf("Name updated to %s", n))
	}
	if co, ok := strField("company"); ok && co != "" && co != existing.Company {
		logActivity(id, author, fmt.Sprintf("Company updated to %s", co))
	}
	if jt, ok := strField("jobTitle"); ok && jt != "" && jt != existing.JobTitle {
		logActivity(id, author, fmt.Sprintf("Job title updated to %s", jt))
	}
	if a, ok := strField("contactOwner"); ok && a != existing.ContactOwner {
		if existing.ContactOwner == "" {
			logActivity(id, author, fmt.Sprintf("Assigned to %s", a))
		} else if a == "" {
			logActivity(id, author, fmt.Sprintf("Unassigned from %s", existing.ContactOwner))
		} else {
			logActivity(id, author, fmt.Sprintf("Reassigned from %s to %s", existing.ContactOwner, a))
		}
	}

	var updated models.Contact
	if len(body) > 0 {
		if err := db.DB.Model(&models.Contact{}).Where("id = ?", id).Updates(body).Error; err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to update contact", err)
			return
		}
	}
	if syncTags {
		if err := services.SyncContactTags(id, tagIDs); err != nil {
			utils.Err(c, http.StatusInternalServerError, "Failed to update tags", err)
			return
		}
	}
	if err := db.DB.Where("id = ?", id).First(&updated).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Err(c, http.StatusNotFound, "Contact not found", err)
			return
		}
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch updated contact", err)
		return
	}

	contacts := []models.Contact{updated}
	services.AttachTags(contacts) //nolint

	c.JSON(http.StatusOK, contacts[0])
}

// POST /api/contacts/bulk-tag
// Body: { "ids": ["..."], "tagIds": ["..."], "action": "add" | "remove" | "replace" }
func BulkTagContacts(c *gin.Context) {
	var body struct {
		IDs    []string `json:"ids"`
		TagIDs []string `json:"tagIds"`
		Action string   `json:"action"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		utils.Err(c, http.StatusBadRequest, "ids is required")
		return
	}
	if body.Action != "add" && body.Action != "remove" && body.Action != "replace" {
		utils.Err(c, http.StatusBadRequest, "action must be add, remove, or replace")
		return
	}

	validIDs := make([]string, 0, len(body.IDs))
	for _, id := range body.IDs {
		if _, err := uuid.Parse(id); err == nil {
			validIDs = append(validIDs, id)
		}
	}
	if len(validIDs) == 0 {
		utils.Err(c, http.StatusBadRequest, "No valid contact IDs provided")
		return
	}

	switch body.Action {
	case "replace":
		for _, id := range validIDs {
			if err := services.SyncContactTags(id, body.TagIDs); err != nil {
				utils.Err(c, http.StatusInternalServerError, "Failed to replace tags", err)
				return
			}
		}
	case "remove":
		if len(body.TagIDs) > 0 {
			if err := db.DB.Where("contactId IN ? AND tagId IN ?", validIDs, body.TagIDs).
				Delete(&models.ContactTag{}).Error; err != nil {
				utils.Err(c, http.StatusInternalServerError, "Failed to remove tags", err)
				return
			}
		}
	case "add":
		rows := make([]models.ContactTag, 0, len(validIDs)*len(body.TagIDs))
		for _, id := range validIDs {
			for _, tagID := range body.TagIDs {
				rows = append(rows, models.ContactTag{ContactID: id, TagID: tagID})
			}
		}
		if len(rows) > 0 {
			if err := db.DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&rows).Error; err != nil {
				utils.Err(c, http.StatusInternalServerError, "Failed to add tags", err)
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"updated": len(validIDs)})
}

func DeleteContact(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid contact ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.Contact{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Contact not found", result.Error)
		return
	}

	// cascade — delete associated notes
	db.DB.Where("contactId = ?", id).Delete(&models.Note{})

	c.JSON(http.StatusOK, gin.H{"deleted": id})
}

// POST /api/contacts/bulk-delete
// Body: { "ids": ["...", "..."] }
func BulkDeleteContacts(c *gin.Context) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		utils.Err(c, http.StatusBadRequest, "ids is required")
		return
	}

	validIDs := make([]string, 0, len(body.IDs))
	for _, id := range body.IDs {
		if _, err := uuid.Parse(id); err == nil {
			validIDs = append(validIDs, id)
		}
	}
	if len(validIDs) == 0 {
		utils.Err(c, http.StatusBadRequest, "No valid contact IDs provided")
		return
	}

	// cascade — delete associated notes first
	db.DB.Where("contactId IN ?", validIDs).Delete(&models.Note{})

	result := db.DB.Where("id IN ?", validIDs).Delete(&models.Contact{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete contacts", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": result.RowsAffected})
}
