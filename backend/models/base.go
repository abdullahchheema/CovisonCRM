package models

import "github.com/google/uuid"

// NewUUID generates a new UUID string for use as a primary key.
func NewUUID() string {
	return uuid.New().String()
}
