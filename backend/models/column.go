package models

import (
	"time"
)

type Column struct {
	ID        string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	ProjectID string    `gorm:"column:projectId" json:"projectId"`
	Name      string    `gorm:"column:name" json:"name"`
	Order     int       `gorm:"column:order" json:"order"`
	CreatedAt time.Time `gorm:"column:date" json:"date"`
}

// ColumnWithTodos is returned by the board endpoint
type ColumnWithTodos struct {
	Column
	Todos []Todo `json:"todos"`
}
