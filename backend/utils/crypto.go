package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"os"
	"strconv"
	"strings"
	"time"
)

func deriveKey() []byte {
	secret := os.Getenv("CRYPTR_SECRET")
	hash := sha256.Sum256([]byte(secret))
	return hash[:]
}

func Encrypt(plaintext string) (string, error) {
	key := deriveKey()

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.URLEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(encoded string) (string, error) {
	key := deriveKey()

	ciphertext, err := base64.URLEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// EncryptWithExpiry encrypts payload alongside the current time, so the
// resulting token can be time-bound by DecryptWithExpiry. Used for
// verification/reset links, which must not be permanent bearer credentials.
func EncryptWithExpiry(payload string) (string, error) {
	return Encrypt(payload + "|" + strconv.FormatInt(time.Now().Unix(), 10))
}

// DecryptWithExpiry reverses EncryptWithExpiry and rejects tokens older than ttl.
func DecryptWithExpiry(encoded string, ttl time.Duration) (string, error) {
	plaintext, err := Decrypt(encoded)
	if err != nil {
		return "", err
	}

	payload, issuedAtStr, found := strings.Cut(plaintext, "|")
	if !found {
		return "", errors.New("malformed or legacy token")
	}

	issuedAtUnix, err := strconv.ParseInt(issuedAtStr, 10, 64)
	if err != nil {
		return "", errors.New("malformed token")
	}

	if time.Since(time.Unix(issuedAtUnix, 0)) > ttl {
		return "", errors.New("token expired")
	}

	return payload, nil
}
