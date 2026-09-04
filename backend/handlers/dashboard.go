package handlers

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
)

type DashboardStats struct {
	TotalContacts     int64            `json:"totalContacts"`
	TotalTickets      int64            `json:"totalTickets"`
	OpenTickets       int64            `json:"openTickets"`
	InProgressTickets int64            `json:"inProgressTickets"`
	ResolvedTickets   int64            `json:"resolvedTickets"`
	TotalProjects     int64            `json:"totalProjects"`
	TotalUsers        int64            `json:"totalUsers"`
	RecentContacts    []models.Contact `json:"recentContacts"`
	RecentTickets     []models.Ticket  `json:"recentTickets"`
}

// GET /api/dashboard/stats
func GetDashboardStats(c *gin.Context) {
	user, _ := c.Get("user")
	currentUser, ok := user.(models.User)
	if !ok || currentUser.CompanyID == "" {
		utils.Err(c, http.StatusForbidden, "Forbidden")
		return
	}

	var stats DashboardStats

	// Contacts (no companyId field on contact rows)
	db.DB.Model(&models.Contact{}).Count(&stats.TotalContacts)

	// Tickets (no companyId field on ticket rows)
	db.DB.Model(&models.Ticket{}).Count(&stats.TotalTickets)
	db.DB.Model(&models.Ticket{}).Where("status = ?", "open").Count(&stats.OpenTickets)
	db.DB.Model(&models.Ticket{}).Where("status = ?", "inProgress").Count(&stats.InProgressTickets)
	db.DB.Model(&models.Ticket{}).Where("status = ?", "resolved").Count(&stats.ResolvedTickets)

	// Projects
	db.DB.Model(&models.Project{}).Count(&stats.TotalProjects)

	// Users in same company
	db.DB.Model(&models.User{}).Where("companyId = ?", currentUser.CompanyID).Count(&stats.TotalUsers)

	// Recent contacts (last 5, sorted by date desc — Contact.CreatedAt maps to column "date")
	stats.RecentContacts = []models.Contact{}
	db.DB.Order("date DESC").Limit(5).Find(&stats.RecentContacts) //nolint

	// Recent tickets (last 5, sorted by createdAt desc)
	stats.RecentTickets = []models.Ticket{}
	db.DB.Order("createdAt DESC").Limit(5).Find(&stats.RecentTickets) //nolint

	c.JSON(http.StatusOK, stats)
}

// PlannerTask is a flattened, project-aware view of a Todo for the planner page.
type PlannerTask struct {
	ID                string `json:"_id"`
	Title             string `json:"title"`
	ProjectID         string `json:"projectId"`
	ProjectName       string `json:"projectName"`
	Status            string `json:"status"`
	Priority          string `json:"priority"`
	DueDate           string `json:"dueDate"`
	EstimatedDuration string `json:"estimatedDuration"`
}

type PlannerStats struct {
	DueToday       int `json:"dueToday"`
	Overdue        int `json:"overdue"`
	DueNext3Days   int `json:"dueNext3Days"`
	CompletedToday int `json:"completedToday"`
}

type PlannerResponse struct {
	Stats    PlannerStats  `json:"stats"`
	Overdue  []PlannerTask `json:"overdue"`
	Today    []PlannerTask `json:"today"`
	Upcoming []PlannerTask `json:"upcoming"`
}

var priorityRank = map[string]int{
	"critical": 0,
	"veryHigh": 0,
	"high":     1,
	"medium":   2,
	"low":      3,
}

func rankOf(priority string) int {
	if r, ok := priorityRank[priority]; ok {
		return r
	}
	return 4
}

// GET /api/dashboard/planner
//
// Reads tasks directly from the existing Kanban data (Todo/Column/Project) — no
// separate storage. Groups non-done, due-dated tasks into Overdue / Today / Upcoming
// (next 3 days), matching the agenda-style planner UI.
func GetPlanner(c *gin.Context) {
	now := time.Now()
	today := now.Format("2006-01-02")
	plus3 := now.AddDate(0, 0, 3).Format("2006-01-02")

	projects := make([]models.Project, 0)
	if err := db.DB.Find(&projects).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch projects", err)
		return
	}
	projectNames := make(map[string]string, len(projects))
	for _, p := range projects {
		projectNames[p.ID] = p.Name
	}

	columns := make([]models.Column, 0)
	if err := db.DB.Find(&columns).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch columns", err)
		return
	}
	columnNames := make(map[string]string, len(columns))
	doneColumns := make(map[string]bool, len(columns))
	for _, col := range columns {
		columnNames[col.ID] = col.Name
		if strings.EqualFold(col.Name, "done") {
			doneColumns[col.ID] = true
		}
	}

	todos := make([]models.Todo, 0)
	if err := db.DB.Find(&todos).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch todos", err)
		return
	}

	resp := PlannerResponse{
		Overdue:  []PlannerTask{},
		Today:    []PlannerTask{},
		Upcoming: []PlannerTask{},
	}

	for _, t := range todos {
		isDone := doneColumns[t.ColumnID]

		if isDone {
			if t.CompletedAt != nil && t.CompletedAt.Format("2006-01-02") == today {
				resp.Stats.CompletedToday++
			}
			continue
		}

		if t.DueDate == "" {
			continue
		}

		task := PlannerTask{
			ID:                t.ID,
			Title:             t.Title,
			ProjectID:         t.ProjectID,
			ProjectName:       projectNames[t.ProjectID],
			Status:            columnNames[t.ColumnID],
			Priority:          t.Priority,
			DueDate:           t.DueDate,
			EstimatedDuration: t.EstimatedDuration,
		}

		switch {
		case t.DueDate < today:
			resp.Overdue = append(resp.Overdue, task)
			resp.Stats.Overdue++
		case t.DueDate == today:
			resp.Today = append(resp.Today, task)
			resp.Stats.DueToday++
		case t.DueDate > today && t.DueDate <= plus3:
			resp.Upcoming = append(resp.Upcoming, task)
			resp.Stats.DueNext3Days++
		}
	}

	sortTasks := func(tasks []PlannerTask) {
		sort.Slice(tasks, func(i, j int) bool {
			if tasks[i].DueDate != tasks[j].DueDate {
				return tasks[i].DueDate < tasks[j].DueDate
			}
			return rankOf(tasks[i].Priority) < rankOf(tasks[j].Priority)
		})
	}
	sortTasks(resp.Overdue)
	sortTasks(resp.Today)
	sortTasks(resp.Upcoming)

	c.JSON(http.StatusOK, resp)
}
