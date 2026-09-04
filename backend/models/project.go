package models

import (
	"time"
)

type Project struct {
	ID          string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Description string    `gorm:"column:description;type:text" json:"description,omitempty"`
	Priority    string    `gorm:"column:priority" json:"priority,omitempty"`
	// Stored as plain "YYYY-MM-DD" text (not time.Time) since the date picker
	// sends a date-only string with no timezone component.
	StartDate       string    `gorm:"column:startDate" json:"startDate,omitempty"`
	ExpectedEndDate string    `gorm:"column:expectedEndDate" json:"expectedEndDate,omitempty"`
	CreatedAt       time.Time `gorm:"column:date" json:"date"`
}
