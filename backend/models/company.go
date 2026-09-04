package models

import (
	"time"
)

type Company struct {
	ID          string    `gorm:"column:id;primaryKey;type:char(36)" json:"_id"`
	Name        string    `gorm:"column:name;uniqueIndex;size:255" json:"name"`
	CreatedBy   string    `gorm:"column:createdBy" json:"createdBy,omitempty"`
	Number      string    `gorm:"column:number" json:"number,omitempty"`
	CMail       string    `gorm:"column:cmail" json:"cmail,omitempty"`
	Address     string    `gorm:"column:address" json:"address,omitempty"`
	Website     string    `gorm:"column:website" json:"website,omitempty"`
	CompanySize int       `gorm:"column:companySize" json:"companySize,omitempty"`
	Logo        string    `gorm:"column:logo;type:longtext" json:"logo,omitempty"`
	Date        time.Time `gorm:"column:date" json:"date"`
}
