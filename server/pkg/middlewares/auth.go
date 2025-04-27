package middlewares

import (
	"net/http"
	"server/pkg/responses"
	"server/pkg/utils"

	"github.com/gin-gonic/gin"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			token, _ = c.Cookie("token")
		}

		if token == "" {
			c.JSON(http.StatusUnauthorized, response.ErrorWithMessage(
				http.StatusUnauthorized,
				"unauthorized",
			))
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.ErrorWithMessage(
				http.StatusUnauthorized,
				err.Error(),
			))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserId)
		c.Set("user_role", claims.UserRole)

		c.Next()
	}
}

func AuthAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		Auth()(c)

		if c.IsAborted() {
			return
		}

		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, response.ErrorWithMessage(
				http.StatusForbidden,
				"user role not found",
			))
			c.Abort()
			return
		}

		if userRole != "admin" {
			c.JSON(http.StatusForbidden, response.ErrorWithMessage(
				http.StatusForbidden,
				"admin access required",
			))
			c.Abort()
			return
		}

		c.Next()
	}
}
