package models

import (
	"time"
)

type Deal struct {
	ID            string     `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Title         string     `gorm:"column:title" json:"title"`
	ContactID     string     `gorm:"column:contactId" json:"contactId,omitempty"`
	ContactName   string     `gorm:"column:contactName" json:"contactName,omitempty"`
	Value         float64    `gorm:"column:value" json:"value"`
	Currency      string     `gorm:"column:currency" json:"currency"`
	Stage         string     `gorm:"column:stage" json:"stage"`
	AssignedTo    string     `gorm:"column:assignedTo" json:"assignedTo,omitempty"`
	ExpectedClose *time.Time `gorm:"column:expectedClose" json:"expectedClose,omitempty"`
	CreatedAt     time.Time  `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"column:updatedAt" json:"updatedAt"`
}
