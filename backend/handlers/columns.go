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

func CreateColumn(c *gin.Context) {
	projectID := c.Param("id")
	if _, err := uuid.Parse(projectID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" {
		utils.Err(c, http.StatusBadRequest, "Name is required")
		return
	}

	// Count existing columns to set order
	var count int64
	db.DB.Model(&models.Column{}).Where("projectId = ?", projectID).Count(&count)

	col := models.Column{
		ID:        models.NewUUID(),
		ProjectID: projectID,
		Name:      body.Name,
		Order:     int(count),
		CreatedAt: time.Now(),
	}

	if err := db.DB.Create(&col).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create column", err)
		return
	}

	c.JSON(http.StatusCreated, col)
}

func UpdateColumn(c *gin.Context) {
	colID := c.Param("colId")
	if _, err := uuid.Parse(colID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid column ID", err)
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" {
		utils.Err(c, http.StatusBadRequest, "Name is required")
		return
	}

	result := db.DB.Model(&models.Column{}).Where("id = ?", colID).Update("name", body.Name)
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Column not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"_id": colID, "name": body.Name})
}

func ReorderColumns(c *gin.Context) {
	projectID := c.Param("id")
	if _, err := uuid.Parse(projectID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	var body struct {
		ColumnIDs []string `json:"columnIds"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	for i, colID := range body.ColumnIDs {
		if _, err := uuid.Parse(colID); err != nil {
			continue
		}
		db.DB.Model(&models.Column{}).
			Where("id = ? AND projectId = ?", colID, projectID).
			Update("order", i) //nolint
	}

	c.JSON(http.StatusOK, gin.H{"message": "Columns reordered"})
}

func DeleteColumn(c *gin.Context) {
	colID := c.Param("colId")
	if _, err := uuid.Parse(colID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid column ID", err)
		return
	}

	// Move todos in this column to the first column of the same project, or delete them
	db.DB.Where("columnId = ?", colID).Delete(&models.Todo{}) //nolint

	result := db.DB.Where("id = ?", colID).Delete(&models.Column{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Column not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Column deleted"})
}
