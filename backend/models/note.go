package models

import (
	"time"
)

// NoteType distinguishes manual notes from activity-log entries.
// The frontend can filter/render each type differently.
type NoteType string

const (
	NoteTypeNote     NoteType = "note"
	NoteTypeCall     NoteType = "call"
	NoteTypeEmail    NoteType = "email"
	NoteTypeMeeting  NoteType = "meeting"
	NoteTypeActivity NoteType = "activity" // auto-generated (e.g. status change)
)

type Note struct {
	ID        string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	ContactID string    `gorm:"column:contactId" json:"contactId"`
	Type      NoteType  `gorm:"column:type" json:"type"`
	Body      string    `gorm:"column:body;type:text" json:"body"`
	Author    string    `gorm:"column:author" json:"author"` // user name from JWT
	CreatedAt time.Time `gorm:"column:createdAt" json:"createdAt"`
}

func (Note) TableName() string {
	return "contact_notes"
}
