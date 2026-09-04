package models

import (
	"time"
)

type User struct {
	ID          string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Email       string    `gorm:"column:email;uniqueIndex;size:255" json:"email"`
	Password    string    `gorm:"column:password" json:"password,omitempty"`
	Token       string    `gorm:"column:token" json:"token,omitempty"`
	Permissions []string  `gorm:"column:permissions;serializer:json;type:json" json:"permissions"`
	Verified    bool      `gorm:"column:verified" json:"verified"`
	Date        time.Time `gorm:"column:date" json:"date"`
	CompanyID   string    `gorm:"column:companyId" json:"companyId,omitempty"`
	Company     string    `gorm:"column:company" json:"company,omitempty"`
}
