package models

import (
	"time"
)

type EmailGroup struct {
	ID          string   `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name        string   `gorm:"column:name" json:"name"`
	Description string   `gorm:"column:description" json:"description,omitempty"`
	ContactIDs  []string `gorm:"column:contactIds;serializer:json;type:json" json:"contactIds"`
	// Type is "static" (fixed ContactIDs list) or "dynamic" (membership is
	// resolved live from TagIDs/TagMatch at send/preview time, so it grows
	// automatically as matching contacts are added).
	Type      string    `gorm:"column:type" json:"type"`
	TagIDs    []string  `gorm:"column:tagIds;serializer:json;type:json" json:"tagIds,omitempty"`
	TagMatch  string    `gorm:"column:tagMatch" json:"tagMatch,omitempty"` // "any" | "all"
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}
