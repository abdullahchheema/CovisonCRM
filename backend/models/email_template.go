package models

import (
	"time"
)

// EmailTemplate stores a user-created email template with scheduling info.
// JSON tags match the frontend EmailTemplate interface in Emails.tsx.
type EmailTemplate struct {
	ID         string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id,omitempty"`
	Name       string    `gorm:"column:name" json:"name"`
	Subject    string    `gorm:"column:subject" json:"subject"`
	Body       string    `gorm:"column:body;type:text" json:"body"`
	Recipient  string    `gorm:"column:recipient" json:"recipient"`
	Frequency  string    `gorm:"column:frequency" json:"frequency"` // one-time | daily | weekly | monthly
	SendDate   string    `gorm:"column:sendDate" json:"sendDate"`   // YYYY-MM-DD
	SendTime   string    `gorm:"column:sendTime" json:"sendTime"`   // HH:MM
	DayOfWeek  string    `gorm:"column:dayOfWeek" json:"dayOfWeek,omitempty"`
	DayOfMonth string    `gorm:"column:dayOfMonth" json:"dayOfMonth,omitempty"`
	Status     string    `gorm:"column:status" json:"status"` // active | draft | paused
	CreatedAt  time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}
