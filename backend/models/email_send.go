package models

import (
	"time"
)

// EmailSend is an append-only history row, one per recipient per send,
// created by the ad-hoc "Send Email" feature (and the recurring scheduler).
type EmailSend struct {
	ID                 string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id,omitempty"`
	ContactID          string    `gorm:"column:contactId;index" json:"contactId"`
	ContactName        string    `gorm:"column:contactName" json:"contactName"`
	ContactEmail       string    `gorm:"column:contactEmail" json:"contactEmail"`
	Subject            string    `gorm:"column:subject" json:"subject"`
	Body               string    `gorm:"column:body;type:text" json:"body"`
	SourceType         string    `gorm:"column:sourceType" json:"sourceType"` // template | custom
	SourceTemplateID   *string   `gorm:"column:sourceTemplateId" json:"sourceTemplateId,omitempty"`
	SourceTemplateName string    `gorm:"column:sourceTemplateName" json:"sourceTemplateName,omitempty"`
	RecipientMode      string    `gorm:"column:recipientMode" json:"recipientMode"` // group | individual
	GroupID            *string   `gorm:"column:groupId" json:"groupId,omitempty"`
	GroupName          string    `gorm:"column:groupName" json:"groupName,omitempty"`
	Status             string    `gorm:"column:status" json:"status"` // sent | failed
	ErrorMessage       string    `gorm:"column:errorMessage;type:text" json:"errorMessage,omitempty"`
	SentAt             time.Time `gorm:"column:sentAt" json:"sentAt"`
	CreatedAt          time.Time `gorm:"column:createdAt" json:"createdAt"`
}
