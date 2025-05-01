package middlewares

import (
	"net/http"
	response "server/pkg/responses"
	"server/pkg/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenWithBearer := c.GetHeader("Authorization")

		if tokenWithBearer == "" {
			c.JSON(http.StatusUnauthorized, response.ErrorWithMessage("当前用户未登录"))
			c.Abort()
			return
		}

		token := strings.Split(tokenWithBearer, " ")[1]

		claims, err := utils.ParseToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.ErrorWithMessage(err.Error()))
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
			c.JSON(http.StatusForbidden, response.ErrorWithMessage("当前用户无权限"))
			c.Abort()
			return
		}

		if userRole != "admin" {
			c.JSON(http.StatusForbidden, response.ErrorWithMessage("当前用户无权限"))
			c.Abort()
			return
		}

		c.Set("user_role", userRole)

		c.Next()
	}
}
