package db

import (
	"log"
	"os"

	"tinycrm/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := os.Getenv("DB_CONNECT")

	gdb, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to MySQL:", err)
	}

	if err := gdb.AutoMigrate(
		&models.Company{},
		&models.User{},
		&models.Contact{},
		&models.Tag{},
		&models.ContactTag{},
		&models.Note{},
		&models.Deal{},
		&models.Ticket{},
		&models.Project{},
		&models.Column{},
		&models.Todo{},
		&models.EmailTemplate{},
		&models.EmailGroup{},
		&models.EmailSend{},
		&models.EmailSendSummary{},
		&models.EmailSendJob{},
	); err != nil {
		log.Fatal("Failed to migrate database schema:", err)
	}

	DB = gdb
	log.Println("Connected to MySQL")
}
