package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"tinycrm/db"
	"tinycrm/models"
	"tinycrm/templates"
	"tinycrm/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *gin.Context) {
	currentUser := c.MustGet("user").(models.User)

	if currentUser.CompanyID == "" {
		utils.Err(c, http.StatusForbidden, "User is not associated with a company")
		return
	}

	users := make([]models.User, 0)
	if err := db.DB.Where("companyId = ?", currentUser.CompanyID).Find(&users).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to fetch users", err)
		return
	}

	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

type createUserInput struct {
	Name        string   `json:"name" binding:"required"`
	Email       string   `json:"email" binding:"required,email"`
	Password    string   `json:"password" binding:"required,min=6"`
	Permissions []string `json:"permissions"`
}

func GetUser(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	var user models.User
	if err := db.DB.Where("id = ?", id).First(&user).Error; err != nil {
		utils.Err(c, http.StatusNotFound, "User not found", err)
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, user)
}

type updateUserInput struct {
	Name        string   `json:"name"        binding:"required"`
	Email       string   `json:"email"       binding:"required,email"`
	Permissions []string `json:"permissions"`
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	var input updateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	// "permissions" is a JSON-serialized column; raw map updates bypass the
	// model's field serializer, so marshal it to JSON ourselves.
	permissionsJSON, err := json.Marshal(input.Permissions)
	if err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to encode permissions", err)
		return
	}

	result := db.DB.Model(&models.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        input.Name,
		"email":       input.Email,
		"permissions": string(permissionsJSON),
	})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to update user", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "User not found")
		return
	}

	var updated models.User
	db.DB.Where("id = ?", id).First(&updated) //nolint
	updated.Password = ""
	c.JSON(http.StatusOK, updated)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		utils.Err(c, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	result := db.DB.Where("id = ?", id).Delete(&models.User{})
	if result.Error != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to delete user", result.Error)
		return
	}
	if result.RowsAffected == 0 {
		utils.Err(c, http.StatusNotFound, "User not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

func CreateUser(c *gin.Context) {
	var input createUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	currentUser := c.MustGet("user").(models.User)

	var existing models.User
	if err := db.DB.Where("email = ?", input.Email).First(&existing).Error; err == nil {
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

	permissions := input.Permissions
	if permissions == nil {
		permissions = []string{}
	}

	newUser := models.User{
		ID:          models.NewUUID(),
		Name:        input.Name,
		Email:       input.Email,
		Password:    string(hash),
		Token:       token,
		Verified:    true,
		Date:        time.Now(),
		CompanyID:   currentUser.CompanyID,
		Company:     currentUser.Company,
		Permissions: permissions,
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		utils.Err(c, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	emailBody := templates.InviteUserEmail(input.Name, input.Email, input.Password)
	go utils.SendEmail(input.Email, "You're Invited to Tiny CRM", emailBody)

	newUser.Password = ""
	// Frontend checks res.status === "200" for user creation
	utils.Success(c, http.StatusOK, gin.H{"user": newUser})
}
