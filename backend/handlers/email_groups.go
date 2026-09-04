package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/services"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EmailGroupWithCount adds the resolved member count: len(ContactIDs) for
// static groups, or the live tag-rule match count for dynamic groups — which
// is what lets a dynamic group's displayed size grow automatically.
type EmailGroupWithCount struct {
	models.EmailGroup
	ContactCount int `json:"contactCount"`
}

func resolveGroupCount(g models.EmailGroup) int {
	if g.Type == "dynamic" {
		ids, err := services.ContactIDsForTags(g.TagIDs, g.TagMatch)
		if err != nil {
			return 0
		}
		return len(ids)
	}
	return len(g.ContactIDs)
}

func GetEmailGroups(c *gin.Context) {
	groups := make([]models.EmailGroup, 0)
	if err := db.DB.Order("createdAt DESC").Find(&groups).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch email groups", err)
		return
	}

	result := make([]EmailGroupWithCount, len(groups))
	for i, g := range groups {
		result[i] = EmailGroupWithCount{EmailGroup: g, ContactCount: resolveGroupCount(g)}
	}

	c.JSON(http.StatusOK, result)
}

func GetEmailGroup(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid group ID", err)
		return
	}

	var group models.EmailGroup
	if err := db.DB.Where("id = ?", id).First(&group).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "Email group not found", err)
		return
	}

	c.JSON(http.StatusOK, group)
}

func CreateEmailGroup(c *gin.Context) {
	var group models.EmailGroup
	if err := c.ShouldBindJSON(&group); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	group.ID = models.NewUUID()
	group.CreatedAt = time.Now()
	group.UpdatedAt = time.Now()
	if group.ContactIDs == nil {
		group.ContactIDs = []string{}
	}
	if group.Type == "" {
		group.Type = "static"
	}
	if group.TagIDs == nil {
		group.TagIDs = []string{}
	}

	if err := db.DB.Create(&group).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create email group", err)
		return
	}

	c.JSON(http.StatusCreated, group)
}

func UpdateEmailGroup(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid group ID", err)
		return
	}

	var body models.EmailGroup
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	body.UpdatedAt = time.Now()
	if body.ContactIDs == nil {
		body.ContactIDs = []string{}
	}
	if body.Type == "" {
		body.Type = "static"
	}
	if body.TagIDs == nil {
		body.TagIDs = []string{}
	}

	// "contactIds"/"tagIds" are JSON-serialized columns; raw map updates
	// bypass the model's field serializer, so marshal them ourselves.
	contactIDsJSON, err := json.Marshal(body.ContactIDs)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to encode contactIds", err)
		return
	}
	tagIDsJSON, err := json.Marshal(body.TagIDs)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to encode tagIds", err)
		return
	}

	result := db.DB.Model(&models.EmailGroup{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        body.Name,
		"description": body.Description,
		"contactIds":  string(contactIDsJSON),
		"type":        body.Type,
		"tagIds":      string(tagIDsJSON),
		"tagMatch":    body.TagMatch,
		"updatedAt":   body.UpdatedAt,
	})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to update email group", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Email group not found")
		return
	}

	body.ID = id
	c.JSON(http.StatusOK, body)
}

func DeleteEmailGroup(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid group ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.EmailGroup{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete email group", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Email group not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email group deleted"})
}
