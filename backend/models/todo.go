package models

import (
	"time"
)

type TodoAuthor struct {
	Name  string `json:"name"`
	Image string `json:"image"`
}

type Todo struct {
	ID          string     `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	ProjectID   string     `gorm:"column:projectId" json:"projectId"`
	ColumnID    string     `gorm:"column:columnId" json:"columnId"`
	Title       string     `gorm:"column:title" json:"title"`
	Description string     `gorm:"column:description" json:"description"`
	Author      TodoAuthor `gorm:"column:author;serializer:json;type:json" json:"author"`
	StatusColor string     `gorm:"column:statusColor" json:"statusColor,omitempty"`
	// Generic, niche-agnostic card metadata.
	Label             string     `gorm:"column:label" json:"label"`
	LabelColor        string     `gorm:"column:labelColor" json:"labelColor"`
	Priority          string     `gorm:"column:priority" json:"priority"`
	DueDate           string     `gorm:"column:dueDate" json:"dueDate"`
	EstimatedDuration string     `gorm:"column:estimatedDuration" json:"estimatedDuration"`
	// Set when the task enters a Done column, cleared when it leaves. Powers the
	// planner's "Completed Today" stat.
	CompletedAt *time.Time `gorm:"column:completedAt" json:"completedAt,omitempty"`
	CreatedAt   time.Time  `gorm:"column:date" json:"date"`
}
