package handlers

import (
	"net/http"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/contacts/:id/notes
// Returns all notes for a contact, newest first.
func GetNotes(c *gin.Context) {
	contactID := c.Param("id")
	if _, err := uuid.Parse(contactID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid contact ID", err)
		return
	}

	notes := make([]models.Note, 0)
	if err := db.DB.Where("contactId = ?", contactID).Order("createdAt DESC").Find(&notes).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch notes", err)
		return
	}

	c.JSON(http.StatusOK, notes)
}

// POST /api/contacts/:id/notes
// Body: { "type": "note|call|email|meeting", "body": "..." }
func AddNote(c *gin.Context) {
	contactID := c.Param("id")
	if _, err := uuid.Parse(contactID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid contact ID", err)
		return
	}

	var body struct {
		Type models.NoteType `json:"type"`
		Body string          `json:"body"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Body == "" {
		utils.Err(c, http.StatusBadRequest, "body is required")
		return
	}
	if body.Type == "" {
		body.Type = models.NoteTypeNote
	}

	user, _ := c.Get("user")
	authorName := ""
	if u, ok := user.(models.User); ok {
		authorName = u.Name
	}

	note := models.Note{
		ID:        models.NewUUID(),
		ContactID: contactID,
		Type:      body.Type,
		Body:      body.Body,
		Author:    authorName,
		CreatedAt: time.Now(),
	}

	if err := db.DB.Create(&note).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to save note", err)
		return
	}

	// Bump contact's lastActivity
	db.DB.Model(&models.Contact{}).Where("id = ?", contactID).Update("lastActivity", note.CreatedAt)

	c.JSON(http.StatusCreated, note)
}

// DELETE /api/contacts/:id/notes/:noteId
func DeleteNote(c *gin.Context) {
	noteID := c.Param("noteId")
	if _, err := uuid.Parse(noteID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid note ID", err)
		return
	}

	result := db.DB.Where("id = ?", noteID).Delete(&models.Note{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Note not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": noteID})
}
