package models

import (
	"time"
)

// EmailSendJob queues a one-time future send created via the "Send Email"
// feature. Immediate ("send now") sends bypass this table entirely.
type EmailSendJob struct {
	ID                 string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id,omitempty"`
	Subject            string    `gorm:"column:subject" json:"subject"`
	Body               string    `gorm:"column:body;type:text" json:"body"`
	SourceType         string    `gorm:"column:sourceType" json:"sourceType"` // template | custom
	SourceTemplateID   *string   `gorm:"column:sourceTemplateId" json:"sourceTemplateId,omitempty"`
	SourceTemplateName string    `gorm:"column:sourceTemplateName" json:"sourceTemplateName,omitempty"`
	RecipientMode      string    `gorm:"column:recipientMode" json:"recipientMode"` // group | individual | audience
	GroupID            *string   `gorm:"column:groupId" json:"groupId,omitempty"`
	ContactIDs         []string  `gorm:"column:contactIds;serializer:json;type:json" json:"contactIds"`
	// Audience selection fields — populated when RecipientMode is "audience"
	// (the additive builder), so the scheduler resolves the same way a
	// "send now" request does.
	GroupIDs      []string  `gorm:"column:groupIds;serializer:json;type:json" json:"groupIds,omitempty"`
	TagIDs        []string  `gorm:"column:tagIds;serializer:json;type:json" json:"tagIds,omitempty"`
	TagMatch      string    `gorm:"column:tagMatch" json:"tagMatch,omitempty"`
	ExcludeTagIDs []string  `gorm:"column:excludeTagIds;serializer:json;type:json" json:"excludeTagIds,omitempty"`
	SendDate      string    `gorm:"column:sendDate" json:"sendDate"` // YYYY-MM-DD
	SendTime      string    `gorm:"column:sendTime" json:"sendTime"` // HH:MM
	Status        string    `gorm:"column:status" json:"status"`     // pending | sent | failed
	// Optional pipeline/lead fields captured at compose time, applied when the
	// job fires and the lead is created.
	LeadTitle         string     `gorm:"column:leadTitle" json:"leadTitle,omitempty"`
	LeadValue         float64    `gorm:"column:leadValue" json:"leadValue,omitempty"`
	LeadCurrency      string     `gorm:"column:leadCurrency" json:"leadCurrency,omitempty"`
	LeadAssignedTo    string     `gorm:"column:leadAssignedTo" json:"leadAssignedTo,omitempty"`
	LeadExpectedClose *time.Time `gorm:"column:leadExpectedClose" json:"leadExpectedClose,omitempty"`
	CreatedAt         time.Time  `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt         time.Time  `gorm:"column:updatedAt" json:"updatedAt"`
}
