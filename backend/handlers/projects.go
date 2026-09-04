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

type ProjectSummary struct {
	ID              string    `json:"_id"`
	Name            string    `json:"name"`
	Date            time.Time `json:"date"`
	Description     string    `json:"description,omitempty"`
	Priority        string    `json:"priority,omitempty"`
	StartDate       string    `json:"startDate,omitempty"`
	ExpectedEndDate string    `json:"expectedEndDate,omitempty"`
	TotalTasks      int       `json:"totalTasks"`
	DoneTasks       int       `json:"doneTasks"`
}

func GetProjects(c *gin.Context) {
	projects := make([]models.Project, 0)
	if err := db.DB.Find(&projects).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch projects", err)
		return
	}

	if len(projects) == 0 {
		c.JSON(http.StatusOK, []ProjectSummary{})
		return
	}

	// Collect project IDs for batch queries
	projectIDs := make([]string, len(projects))
	for i, p := range projects {
		projectIDs[i] = p.ID
	}

	// Fetch all todos for these projects in one query
	type todoDoc struct {
		ColumnID  string `gorm:"column:columnId"`
		ProjectID string `gorm:"column:projectId"`
	}
	allTodos := make([]todoDoc, 0)
	if err := db.DB.Model(&models.Todo{}).Where("projectId IN ?", projectIDs).Find(&allTodos).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch tasks", err)
		return
	}

	// Fetch all "Done" columns for these projects
	type colDoc struct {
		ID string `gorm:"column:id"`
	}
	doneColumns := make([]colDoc, 0)
	db.DB.Model(&models.Column{}).
		Where("projectId IN ? AND LOWER(name) = ?", projectIDs, "done").
		Find(&doneColumns) //nolint

	doneColSet := make(map[string]bool, len(doneColumns))
	for _, col := range doneColumns {
		doneColSet[col.ID] = true
	}

	// Aggregate stats per project
	totalMap := make(map[string]int)
	doneMap := make(map[string]int)
	for _, t := range allTodos {
		totalMap[t.ProjectID]++
		if doneColSet[t.ColumnID] {
			doneMap[t.ProjectID]++
		}
	}

	summaries := make([]ProjectSummary, len(projects))
	for i, p := range projects {
		summaries[i] = ProjectSummary{
			ID:              p.ID,
			Name:            p.Name,
			Date:            p.CreatedAt,
			Description:     p.Description,
			Priority:        p.Priority,
			StartDate:       p.StartDate,
			ExpectedEndDate: p.ExpectedEndDate,
			TotalTasks:      totalMap[p.ID],
			DoneTasks:       doneMap[p.ID],
		}
	}

	c.JSON(http.StatusOK, summaries)
}

func CreateProject(c *gin.Context) {
	var project models.Project
	if err := c.ShouldBindJSON(&project); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	project.ID = models.NewUUID()
	project.CreatedAt = time.Now()

	if err := db.DB.Create(&project).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create project", err)
		return
	}

	// Insert default columns
	defaultNames := []string{"Todo", "In Progress", "Done"}
	defaultCols := make([]models.Column, len(defaultNames))
	for i, name := range defaultNames {
		defaultCols[i] = models.Column{
			ID:        models.NewUUID(),
			ProjectID: project.ID,
			Name:      name,
			Order:     i,
			CreatedAt: time.Now(),
		}
	}
	db.DB.Create(&defaultCols) //nolint

	c.JSON(http.StatusCreated, project)
}

func UpdateProject(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	var body struct {
		Name            string `json:"name"`
		Description     string `json:"description"`
		Priority        string `json:"priority"`
		StartDate       string `json:"startDate"`
		ExpectedEndDate string `json:"expectedEndDate"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result := db.DB.Model(&models.Project{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":            body.Name,
		"description":     body.Description,
		"priority":        body.Priority,
		"startDate":       body.StartDate,
		"expectedEndDate": body.ExpectedEndDate,
	})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Project not found", result.Error)
		return
	}

	var updated models.Project
	db.DB.Where("id = ?", id).First(&updated) //nolint
	c.JSON(http.StatusOK, updated)
}

func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	// Cascade: delete all todos and columns in this project
	db.DB.Where("projectId = ?", id).Delete(&models.Todo{})   //nolint
	db.DB.Where("projectId = ?", id).Delete(&models.Column{}) //nolint

	result := db.DB.Where("id = ?", id).Delete(&models.Project{})
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "Project not found", result.Error)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted"})
}

// GetBoard returns all columns for the project with their todos embedded, ordered by column order.
func GetBoard(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	// Fetch columns ordered by order field
	columns := make([]models.Column, 0)
	if err := db.DB.Where("projectId = ?", id).Order("`order` ASC").Find(&columns).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch columns", err)
		return
	}

	// Fetch all todos for this project
	todos := make([]models.Todo, 0)
	if err := db.DB.Where("projectId = ?", id).Find(&todos).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch todos", err)
		return
	}

	// Group todos by columnId
	todosByCol := make(map[string][]models.Todo)
	for _, t := range todos {
		todosByCol[t.ColumnID] = append(todosByCol[t.ColumnID], t)
	}

	// Build response
	board := make([]models.ColumnWithTodos, len(columns))
	for i, col := range columns {
		colTodos := todosByCol[col.ID]
		if colTodos == nil {
			colTodos = []models.Todo{}
		}
		board[i] = models.ColumnWithTodos{Column: col, Todos: colTodos}
	}

	c.JSON(http.StatusOK, board)
}
