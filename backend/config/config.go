package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// These secrets sign JWTs and derive the AES key for verification/reset
	// links. Left unset, the app would silently sign tokens with an empty
	// key and mint reset links anyone could forge — fail loudly instead.
	requireSecret("TOKEN_SECRET")
	requireSecret("CRYPTR_SECRET")
}

func requireSecret(name string) {
	if os.Getenv(name) == "" {
		log.Fatalf("%s is not set — refusing to start with an empty secret", name)
	}
}
