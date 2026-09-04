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

func GetDeals(c *gin.Context) {
	query := db.DB.Model(&models.Deal{})
	if contactID := c.Query("contactId"); contactID != "" {
		query = query.Where("contactId = ?", contactID)
	}

	deals := make([]models.Deal, 0)
	if err := query.Order("createdAt DESC").Find(&deals).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch deals", err)
		return
	}

	c.JSON(http.StatusOK, deals)
}

func GetDeal(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid deal ID", err)
		return
	}

	var deal models.Deal
	if err := db.DB.Where("id = ?", id).First(&deal).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "Deal not found", err)
		return
	}

	c.JSON(http.StatusOK, deal)
}

func CreateDeal(c *gin.Context) {
	var deal models.Deal
	if err := c.ShouldBindJSON(&deal); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	deal.ID = models.NewUUID()
	deal.CreatedAt = time.Now()
	deal.UpdatedAt = time.Now()

	if deal.Currency == "" {
		deal.Currency = "USD"
	}
	if deal.Stage == "" {
		deal.Stage = "lead"
	}

	if err := db.DB.Create(&deal).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create deal", err)
		return
	}

	c.JSON(http.StatusCreated, deal)
}

func UpdateDeal(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid deal ID", err)
		return
	}

	var body models.Deal
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	body.UpdatedAt = time.Now()

	result := db.DB.Model(&models.Deal{}).Where("id = ?", id).Updates(map[string]interface{}{
		"title":         body.Title,
		"contactId":     body.ContactID,
		"contactName":   body.ContactName,
		"value":         body.Value,
		"currency":      body.Currency,
		"stage":         body.Stage,
		"assignedTo":    body.AssignedTo,
		"expectedClose": body.ExpectedClose,
		"updatedAt":     body.UpdatedAt,
	})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to update deal", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Deal not found")
		return
	}

	body.ID = id
	c.JSON(http.StatusOK, body)
}

func DeleteDeal(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid deal ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.Deal{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete deal", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Deal not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deal deleted"})
}
