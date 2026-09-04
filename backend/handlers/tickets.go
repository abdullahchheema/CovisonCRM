package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetTickets(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := strings.TrimSpace(c.Query("search"))
	filterTitle := strings.TrimSpace(c.Query("title"))
	filterContact := strings.TrimSpace(c.Query("contact"))
	status := strings.TrimSpace(c.Query("status"))
	priority := strings.TrimSpace(c.Query("priority"))
	category := strings.TrimSpace(c.Query("category"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}

	query := db.DB.Model(&models.Ticket{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("title LIKE ? OR contact LIKE ?", like, like)
	}
	if filterTitle != "" {
		query = query.Where("title LIKE ?", "%"+filterTitle+"%")
	}
	if filterContact != "" {
		query = query.Where("contact LIKE ?", "%"+filterContact+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch tickets", err)
		return
	}

	tickets := make([]models.Ticket, 0)
	if err := query.Order("createdAt DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&tickets).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch tickets", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  tickets,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetTicket(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid ticket ID", err)
		return
	}

	var ticket models.Ticket
	if err := db.DB.Where("id = ?", id).First(&ticket).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "Ticket not found", err)
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func CreateTicket(c *gin.Context) {
	var ticket models.Ticket
	if err := c.ShouldBindJSON(&ticket); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	ticket.ID = models.NewUUID()
	ticket.CreatedAt = time.Now()
	ticket.UpdatedAt = time.Now()

	if err := db.DB.Create(&ticket).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create ticket", err)
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func UpdateTicket(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid ticket ID", err)
		return
	}

	var body models.Ticket
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	body.UpdatedAt = time.Now()

	result := db.DB.Model(&models.Ticket{}).Where("id = ?", id).Updates(map[string]interface{}{
		"title":       body.Title,
		"description": body.Description,
		"contact":     body.Contact,
		"email":       body.Email,
		"category":    body.Category,
		"priority":    body.Priority,
		"status":      body.Status,
		"assignedTo":  body.AssignedTo,
		"updatedAt":   body.UpdatedAt,
	})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to update ticket", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Ticket not found")
		return
	}

	body.ID = id
	c.JSON(http.StatusOK, body)
}

func DeleteTicket(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid ticket ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.Ticket{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete ticket", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Ticket not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket deleted"})
}
