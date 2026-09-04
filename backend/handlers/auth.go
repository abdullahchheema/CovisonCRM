package handlers

import (
	"net/http"
	"os"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/templates"
	"tinycrm/utils"

	"slices"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type registerInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Company  string `json:"company" binding:"required"`
}

type loginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	var existingCompany models.Company
	if err := db.DB.Where("name = ?", input.Company).First(&existingCompany).Error; err == nil {
		utils.Err(c, http.StatusBadRequest, "Company name already exists")
		return
	}

	var existingUser models.User
	if err := db.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		utils.Err(c, http.StatusBadRequest, "Email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to hash password", err)
		return
	}

	token, err := generateToken(input.Email)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	// Create company first so its ID is available when inserting the user.
	company := models.Company{
		ID:   models.NewUUID(),
		Name: input.Company,
		Date: time.Now(),
	}

	if err := db.DB.Create(&company).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create company", err)
		return
	}

	user := models.User{
		ID:       models.NewUUID(),
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hash),
		Permissions: []string{
			"admin",
			"users-view", "users-edit", "users-delete",
			"contacts-view", "contacts-edit", "contacts-delete",
			"pipeline-view", "pipeline-edit", "pipeline-delete",
			"tickets-view", "tickets-edit", "tickets-delete",
			"projects-view", "projects-edit", "projects-delete",
		},
		Token: token,
		// Email verification is disabled for this local/personal deployment —
		// SMTP isn't configured with real credentials, so accounts are
		// auto-verified at signup instead of requiring a clicked email link.
		Verified:  true,
		Date:      time.Now(),
		CompanyID: company.ID,
		Company:   company.Name,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	// Patch company.createdBy now that we have the user ID.
	db.DB.Model(&models.Company{}).Where("id = ?", company.ID).
		Update("createdBy", user.ID) //nolint

	// Frontend checks res.status === "201"
	utils.Success(c, http.StatusCreated, "Registration successful.")
}

func Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.Err(c, http.StatusBadRequest, "Email or password is incorrect")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.Err(c, http.StatusBadRequest, "Email or password is incorrect")
		return
	}

	if !user.Verified {
		// Frontend checks res.status === "401" to redirect to /verification
		utils.Err(c, http.StatusUnauthorized, "Please verify your email before logging in")
		return
	}

	token, err := generateToken(user.Email)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	db.DB.Model(&models.User{}).Where("id = ?", user.ID).Update("token", token)

	c.Header("auth-token", token)

	// Frontend reads: res.message.id, res.message.name, res.message.email,
	// res.message.type (role), res.message.token, res.message.companyId, res.message.company
	scope := "user"
	if slices.Contains(user.Permissions, "admin") {
		scope = "admin"
	}

	permissions := user.Permissions
	if permissions == nil {
		permissions = []string{}
	}

	utils.Success(c, http.StatusOK, gin.H{
		"id":          user.ID,
		"name":        user.Name,
		"email":       user.Email,
		"type":        scope,
		"token":       token,
		"companyId":   user.CompanyID,
		"company":     user.Company,
		"permissions": permissions,
	})
}

func VerifyEmail(c *gin.Context) {
	email, err := utils.Decrypt(c.Param("id"))
	if err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid verification link", err)
		return
	}

	result := db.DB.Model(&models.User{}).Where("email = ?", email).Update("verified", true)
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusBadRequest, "User not found", result.Error)
		return
	}

	utils.Success(c, http.StatusOK, "Email verified successfully")
}

func ResendVerification(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.Err(c, http.StatusBadRequest, "User not found")
		return
	}

	encryptedEmail, err := utils.Encrypt(input.Email)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to generate verification link", err)
		return
	}

	frontendLink := os.Getenv("FRONTEND_LINK")
	if frontendLink == "" {
		frontendLink = "http://127.0.0.1:5173/"
	}
	verificationURL := frontendLink + "verification/" + encryptedEmail
	emailBody := templates.VerificationEmail(user.Name, verificationURL)
	go utils.SendEmail(input.Email, "Verify Your Email - Tiny CRM", emailBody)

	utils.Success(c, http.StatusOK, "Verification email sent")
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.Err(c, http.StatusBadRequest, "User not found")
		return
	}

	encryptedEmail, err := utils.Encrypt(input.Email)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to generate reset link", err)
		return
	}

	frontendLink := os.Getenv("FRONTEND_LINK")
	if frontendLink == "" {
		frontendLink = "http://127.0.0.1:5173/"
	}
	resetURL := frontendLink + "reset-password/" + encryptedEmail
	emailBody := templates.ResetPasswordEmail(user.Name, resetURL)
	go utils.SendEmail(input.Email, "Reset Your Password - Tiny CRM", emailBody)

	utils.Success(c, http.StatusOK, "Password reset email sent")
}

func ChangePassword(c *gin.Context) {
	email, err := utils.Decrypt(c.Param("token"))
	if err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid reset link", err)
		return
	}

	var input struct {
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to hash password", err)
		return
	}

	result := db.DB.Model(&models.User{}).Where("email = ?", email).Update("password", string(hash))
	if result.Error != nil || result.RowsAffected == 0 {
		utils.Err(c, http.StatusBadRequest, "User not found", result.Error)
		return
	}

	utils.Success(c, http.StatusOK, "Password updated successfully")
}

func generateToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("TOKEN_SECRET")))
}
