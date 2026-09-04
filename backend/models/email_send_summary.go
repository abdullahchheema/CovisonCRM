package models

import (
	"time"
)

// EmailSendSummary holds exactly one row per contact: their most recent
// send via the "Send Email" feature. It is upserted in place on every new
// send so the list never grows per-contact; full history lives in EmailSend.
type EmailSendSummary struct {
	ContactID          string    `gorm:"column:contactId;primaryKey;type:char(36)" json:"contactId"`
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
	LastSendID         string    `gorm:"column:lastSendId" json:"lastSendId"`
	SentAt             time.Time `gorm:"column:sentAt" json:"sentAt"`
	UpdatedAt          time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}
