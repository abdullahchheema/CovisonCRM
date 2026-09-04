package models

import (
	"time"
)

// Tag is a reusable label that can be attached to any number of contacts via
// ContactTag. Used as the primary segmentation mechanism for campaigns.
type Tag struct {
	ID        string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name      string    `gorm:"column:name;uniqueIndex;size:150" json:"name"`
	Color     string    `gorm:"column:color" json:"color"` // a CustomBadge variant name
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

// ContactTag is the many-to-many join row between Contact and Tag — a
// normalized relationship (not a text field) so filtering/counting scale.
type ContactTag struct {
	ContactID string `gorm:"column:contactId;primaryKey;type:char(36);index" json:"contactId"`
	TagID     string `gorm:"column:tagId;primaryKey;type:char(36);index" json:"tagId"`
}
