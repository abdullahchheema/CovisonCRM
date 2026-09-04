package middleware

import (
	"net/http"
	"os"

	"tinycrm/db"
	"tinycrm/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("auth-token")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied. No token provided."})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("TOKEN_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		email, ok := claims["email"].(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		var user models.User
		if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}
