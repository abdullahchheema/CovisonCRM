package handlers

import (
	"net/http"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TagWithCount is a Tag plus how many contacts currently carry it.
type TagWithCount struct {
	models.Tag
	ContactCount int64 `json:"contactCount"`
}

// DefaultTagColors cycles through CustomBadge variants so new tags get a
// readable color without the user having to pick one.
var DefaultTagColors = []string{
	"primary", "blue", "success", "warning", "violet", "sky", "orange", "teal", "purple", "emerald",
}

func GetTags(c *gin.Context) {
	tags := make([]models.Tag, 0)
	if err := db.DB.Order("name ASC").Find(&tags).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch tags", err)
		return
	}

	type countRow struct {
		TagID string `gorm:"column:tagId"`
		Count int64  `gorm:"column:count"`
	}
	counts := make([]countRow, 0)
	db.DB.Model(&models.ContactTag{}).
		Select("tagId, COUNT(*) as count").
		Group("tagId").
		Find(&counts) //nolint

	countMap := make(map[string]int64, len(counts))
	for _, cr := range counts {
		countMap[cr.TagID] = cr.Count
	}

	result := make([]TagWithCount, len(tags))
	for i, t := range tags {
		result[i] = TagWithCount{Tag: t, ContactCount: countMap[t.ID]}
	}

	c.JSON(http.StatusOK, result)
}

func CreateTag(c *gin.Context) {
	var body struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	name := strings.TrimSpace(body.Name)
	if name == "" {
		utils.Err(c, http.StatusBadRequest, "Tag name is required")
		return
	}

	var existing models.Tag
	if err := db.DB.Where("LOWER(name) = ?", strings.ToLower(name)).First(&existing).Error; err == nil {
		utils.Err(c, http.StatusConflict, "A tag with this name already exists")
		return
	}

	color := strings.TrimSpace(body.Color)
	if color == "" {
		var count int64
		db.DB.Model(&models.Tag{}).Count(&count)
		color = DefaultTagColors[int(count)%len(DefaultTagColors)]
	}

	tag := models.Tag{
		ID:        models.NewUUID(),
		Name:      name,
		Color:     color,
		CreatedAt: time.Now(),
	}
	if err := db.DB.Create(&tag).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create tag", err)
		return
	}

	c.JSON(http.StatusCreated, tag)
}

func UpdateTag(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid tag ID", err)
		return
	}

	var body struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if name := strings.TrimSpace(body.Name); name != "" {
		var existing models.Tag
		if err := db.DB.Where("LOWER(name) = ? AND id != ?", strings.ToLower(name), id).First(&existing).Error; err == nil {
			utils.Err(c, http.StatusConflict, "A tag with this name already exists")
			return
		}
		updates["name"] = name
	}
	if color := strings.TrimSpace(body.Color); color != "" {
		updates["color"] = color
	}

	result := db.DB.Model(&models.Tag{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Tag not found", result.Error)
		return
	}

	var updated models.Tag
	db.DB.Where("id = ?", id).First(&updated) //nolint
	c.JSON(http.StatusOK, updated)
}

// GetOrCreateTagByName finds a tag by case-insensitive name, creating it (with
// an auto-assigned color) if it doesn't exist yet. Used by CSV import's
// "auto-tag from niche" option.
func GetOrCreateTagByName(name string) (models.Tag, error) {
	name = strings.TrimSpace(name)
	var tag models.Tag
	if err := db.DB.Where("LOWER(name) = ?", strings.ToLower(name)).First(&tag).Error; err == nil {
		return tag, nil
	}

	var count int64
	db.DB.Model(&models.Tag{}).Count(&count)

	tag = models.Tag{
		ID:        models.NewUUID(),
		Name:      name,
		Color:     DefaultTagColors[int(count)%len(DefaultTagColors)],
		CreatedAt: time.Now(),
	}
	if err := db.DB.Create(&tag).Error; err != nil {
		return models.Tag{}, err
	}
	return tag, nil
}

func DeleteTag(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid tag ID", err)
		return
	}

	db.DB.Where("tagId = ?", id).Delete(&models.ContactTag{}) //nolint

	result := db.DB.Where("id = ?", id).Delete(&models.Tag{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Tag not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted"})
}
