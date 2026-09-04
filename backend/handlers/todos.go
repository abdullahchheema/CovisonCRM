package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
)

func CreateTodo(c *gin.Context) {
	projectID := c.Param("id")
	if _, err := uuid.Parse(projectID); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	var todo models.Todo
	if err := c.ShouldBindJSON(&todo); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	todo.ID = models.NewUUID()
	todo.ProjectID = projectID
	todo.CreatedAt = time.Now()

	if err := db.DB.Create(&todo).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create todo", err)
		return
	}

	c.JSON(http.StatusCreated, todo)
}

func UpdateTodo(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid todo ID", err)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}
	delete(body, "_id")

	// The "author" column is a JSON-serialized struct; raw map updates bypass
	// the model's field serializer, so marshal it to JSON ourselves.
	if author, ok := body["author"]; ok {
		raw, err := json.Marshal(author)
		if err != nil {
			utils.Err(c, http.StatusBadRequest, "Invalid author", err)
			return
		}
		body["author"] = string(raw)
	}

	// When a task is moved between columns, stamp/clear completedAt so the
	// planner's "Completed Today" stat stays accurate. A column counts as Done
	// when its name is "done" (case-insensitive) — the same convention used by
	// the project board stats.
	if colID, ok := body["columnId"].(string); ok && colID != "" {
		var col models.Column
		if err := db.DB.Where("id = ?", colID).First(&col).Error; err == nil {
			if strings.EqualFold(col.Name, "done") {
				body["completedAt"] = time.Now()
			} else {
				body["completedAt"] = nil
			}
		}
	}

	result := db.DB.Model(&models.Todo{}).Where("id = ?", id).Updates(body)
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Todo not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo updated"})
}

func DeleteTodo(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid todo ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.Todo{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Todo not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted"})
}
