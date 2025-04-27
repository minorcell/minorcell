package middlewares

import (
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func CORS() gin.HandlerFunc {
	_ = godotenv.Load()

	origins := os.Getenv("CORS_ALLOW_ORIGINS")
	var allowOrigins []string
	if origins == "" || origins == "*" {
		allowOrigins = []string{"*"}
	} else {
		allowOrigins = strings.Split(origins, ",")
	}

	config := cors.DefaultConfig()
	if len(allowOrigins) == 1 && allowOrigins[0] == "*" {
		config.AllowAllOrigins = true
	} else {
		config.AllowOrigins = allowOrigins
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept"}

	return cors.New(config)
}
