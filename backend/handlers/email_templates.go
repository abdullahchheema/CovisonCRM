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

func GetEmailTemplates(c *gin.Context) {
	templates := make([]models.EmailTemplate, 0)
	if err := db.DB.Order("createdAt DESC").Find(&templates).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch email templates", err)
		return
	}

	c.JSON(http.StatusOK, templates)
}

func GetEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid template ID", err)
		return
	}

	var tmpl models.EmailTemplate
	if err := db.DB.Where("id = ?", id).First(&tmpl).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "Email template not found", err)
		return
	}

	c.JSON(http.StatusOK, tmpl)
}

func CreateEmailTemplate(c *gin.Context) {
	var tmpl models.EmailTemplate
	if err := c.ShouldBindJSON(&tmpl); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	tmpl.ID = models.NewUUID()
	tmpl.CreatedAt = time.Now()
	tmpl.UpdatedAt = time.Now()

	if err := db.DB.Create(&tmpl).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create email template", err)
		return
	}

	c.JSON(http.StatusCreated, tmpl)
}

func UpdateEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid template ID", err)
		return
	}

	var body models.EmailTemplate
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	body.UpdatedAt = time.Now()

	result := db.DB.Model(&models.EmailTemplate{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":       body.Name,
		"subject":    body.Subject,
		"body":       body.Body,
		"recipient":  body.Recipient,
		"frequency":  body.Frequency,
		"sendDate":   body.SendDate,
		"sendTime":   body.SendTime,
		"dayOfWeek":  body.DayOfWeek,
		"dayOfMonth": body.DayOfMonth,
		"status":     body.Status,
		"updatedAt":  body.UpdatedAt,
	})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to update email template", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Email template not found")
		return
	}

	body.ID = id
	c.JSON(http.StatusOK, body)
}

func DeleteEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid template ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.EmailTemplate{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete email template", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Email template not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email template deleted"})
}
