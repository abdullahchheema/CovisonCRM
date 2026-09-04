package models

import (
	"time"
)

// JSON tags use the same field names the frontend form (AddContact) sends,
// and that the Contacts table reads.
type Contact struct {
	ID              string     `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name            string     `gorm:"column:name" json:"name"`
	Email           string     `gorm:"column:mail" json:"email"`
	Number          string     `gorm:"column:number" json:"number"`
	Company         string     `gorm:"column:company" json:"company"`
	ContactOwner    string     `gorm:"column:contactOwner" json:"contactOwner,omitempty"`
	Assignee        []string   `gorm:"column:assignee;serializer:json;type:json" json:"assignee,omitempty"`
	Priority        string     `gorm:"column:priority" json:"priority,omitempty"`
	CompanySize     int        `gorm:"column:companySize" json:"companySize,omitempty"`
	JobTitle        string     `gorm:"column:jobTitle" json:"jobTitle,omitempty"`
	ExpectedRevenue float64    `gorm:"column:expectedRevenue" json:"expectedRevenue,omitempty"`
	ExpectedClosing *time.Time `gorm:"column:expectedClosing" json:"expectedClosing,omitempty"`
	Probability     string     `gorm:"column:probability" json:"probability,omitempty"`
	Status          string     `gorm:"column:status" json:"status"`
	LastActivity    time.Time  `gorm:"column:lastActivity" json:"lastActivity"`
	CreatedAt       time.Time  `gorm:"column:date" json:"createdAt"`
	LinkedinURL     string     `gorm:"column:linkedinUrl" json:"linkedinUrl,omitempty"`
	Website         string     `gorm:"column:website" json:"website,omitempty"`
	Country         string     `gorm:"column:country" json:"country,omitempty"`
	City            string     `gorm:"column:city" json:"city,omitempty"`
	Niche           string     `gorm:"column:niche" json:"niche,omitempty"`

	// Transient — populated by handlers from the contact_tags join table, never
	// persisted directly on this row (see models.ContactTag).
	Tags   []Tag    `gorm:"-" json:"tags,omitempty"`
	TagIDs []string `gorm:"-" json:"tagIds,omitempty"`
}
