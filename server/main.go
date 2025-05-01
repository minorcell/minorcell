package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"server/internal/controllers"
	"server/internal/models"
	"server/pkg/middlewares"
	response "server/pkg/responses"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitRouter() *gin.Engine {

	// 设置gin模式
	gin.SetMode(gin.ReleaseMode)

	// 调试模式
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	// 初始化路由
	r := gin.Default()

	// 恢复
	r.Use(gin.Recovery())
	// 跨域
	r.Use(middlewares.CORS())
	// 压缩
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// 静态文件
	r.Static("/uploads", "uploads")

	// 控制器
	userController := controllers.NewUserController(DB)
	fileController := controllers.NewFileController(DB)
	articleController := controllers.NewArticleController(DB)
	tagController := controllers.NewTagController(DB)

	// API
	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, response.SuccessWithMessage("ok", nil))
		})

		user := api.Group("/user")
		{
			// 用户注册
			user.POST("/register", userController.CreateUser)
			// 用户登录
			user.POST("/login", userController.Login)
			// 修改密码
			user.POST("/change-password", middlewares.Auth(), userController.ChangePassword)
			// 修改用户信息
			user.PUT("", middlewares.Auth(), userController.UpdateUser)
			// 用户获取指定用户的公共信息
			user.GET("/:id", middlewares.Auth(), userController.GetPublicUserInfoById)
			// 用户自己删除用户
			user.DELETE("", middlewares.AuthAdmin(), userController.DeleteUser)
		}

		file := api.Group("/file")
		{
			// 上传文件
			file.POST("", middlewares.Auth(), fileController.UploadFile)
		}

		article := api.Group("/article")
		{
			// 公开接口
			article.GET("/:id", articleController.GetArticle) // 获取单篇文章
			article.GET("", articleController.ListArticles)   // 获取文章列表

			article.POST("", middlewares.AuthAdmin(), articleController.CreateArticle)       // 创建文章
			article.PUT("/:id", middlewares.AuthAdmin(), articleController.UpdateArticle)    // 更新文章
			article.DELETE("/:id", middlewares.AuthAdmin(), articleController.DeleteArticle) // 删除文章
		}

		tag := api.Group("/tag")
		{
			// 公开接口
			tag.GET("", tagController.ListTags)
			// 需要管理员权限的接口
			tag.POST("", middlewares.AuthAdmin(), tagController.CreateTag)
			tag.PUT("/:id", middlewares.AuthAdmin(), tagController.UpdateTag)
			tag.DELETE("/:id", middlewares.AuthAdmin(), tagController.DeleteTag)
		}
	}

	// 404
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, response.ErrorWithMessage("路由不存在"))
	})

	return r
}

func InitDB() *gorm.DB {
	// 初始化数据库连接
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	// 打开数据库连接
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
		panic("数据库连接失败: " + err.Error())
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic("数据库连接失败: " + err.Error())
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// ping数据库
	if err := sqlDB.Ping(); err != nil {
		panic("数据库ping失败: " + err.Error())
	}

	fmt.Println("数据库连接成功！")

	// 自动迁移
	db.AutoMigrate(
		&models.User{},
		&models.File{},
		&models.Tag{},
		&models.Article{},
	)

	return db
}

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("加载.env文件失败: " + err.Error())
	}

	// 初始化数据库
	DB = InitDB()

	// 初始化路由
	r := InitRouter()

	// 获取端口
	port := os.Getenv("SERVER_PORT")
	if len(port) == 0 {
		port = "6666"
		fmt.Println("未设置SERVER_PORT, 使用默认端口6666")
	}

	// 服务器地址
	serverAddr := fmt.Sprintf(":%s", port)
	fmt.Printf("Server is running on http://localhost%s\n", serverAddr)

	// 启动服务器
	server := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// 启动服务器
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		panic(fmt.Sprintf("启动服务器失败: %v", err))
	}
}
