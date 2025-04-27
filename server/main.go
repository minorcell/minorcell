package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"server/internal/models"
	"server/pkg/middlewares"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitRouter() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.Default()

	r.Use(middlewares.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	api := r.Group("/api")
	{
		_ = api.Group("/v1")
	}

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    http.StatusNotFound,
			"message": "Route not found",
		})
	})

	return r
}

func InitDB() *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		PrepareStmt: true,
		Logger: logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  logger.Info,
				IgnoreRecordNotFoundError: true,
				ParameterizedQueries:      true,
				Colorful:                  true,
			},
		),
	})
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic("Failed to get database instance: " + err.Error())
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		panic("Failed to ping database: " + err.Error())
	}

	fmt.Println("Database connected successfully")

	db.AutoMigrate(&models.User{})

	return db
}

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}

	DB = InitDB()

	r := InitRouter()

	port := os.Getenv("SERVER_PORT")
	if len(port) == 0 {
		port = "8080" // 默认端口
		fmt.Println("SERVER_PORT not set, using default port 8080")
	}

	// 启动服务器
	serverAddr := fmt.Sprintf(":%s", port)
	fmt.Printf("Server is running on http://localhost%s\n", serverAddr)

	server := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		panic(fmt.Sprintf("Failed to start server: %v", err))
	}
}
