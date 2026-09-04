package models

import (
	"time"
)

// JSON tags match the field names the frontend form (AddTicket) sends
// and the Tickets table reads.
type Ticket struct {
	ID          string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Title       string    `gorm:"column:title" json:"title"`
	Description string    `gorm:"column:description" json:"description,omitempty"`
	Contact     string    `gorm:"column:contact" json:"contact"`
	Email       string    `gorm:"column:email" json:"email,omitempty"`
	Category    string    `gorm:"column:category" json:"category"`
	Priority    string    `gorm:"column:priority" json:"priority"`
	Status      string    `gorm:"column:status" json:"status"`
	AssignedTo  string    `gorm:"column:assignedTo" json:"assignedTo,omitempty"`
	CreatedAt   time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}
