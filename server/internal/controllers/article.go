package controllers

import (
	"net/http"
	"server/internal/models"
	response "server/pkg/responses"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ArticleController struct {
	DB *gorm.DB
}

func NewArticleController(db *gorm.DB) *ArticleController {
	return &ArticleController{DB: db}
}

// CreateArticle 创建文章（需要登录权限）
func (controller *ArticleController) CreateArticle(ctx *gin.Context) {
	// 获取当前登录用户ID
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户未登录"))
		return
	}

	// 绑定请求数据
	var articleRequest struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
		Content     string `json:"content" binding:"required"`
		Tags        string `json:"tags" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&articleRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("请求数据无效: "+err.Error()))
		return
	}


	// 创建文章
	article := models.Article{
		Title:       articleRequest.Title,
		Description: articleRequest.Description,
		Content:     articleRequest.Content,
		Tags:        articleRequest.Tags,
		UserId:      uint(userID.(int)),
		LookCount:   0,
	}

	// 保存到数据库
	if err := controller.DB.Create(&article).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("创建文章失败: "+err.Error()))
		return
	}

	// 加载关联的标签和用户信息
	controller.DB.Preload("Tags").Preload("User").First(&article, article.ID)

	ctx.JSON(http.StatusCreated, response.SuccessWithMessage("文章创建成功", article))
}

// GetArticle 获取单篇文章（公开权限）
func (controller *ArticleController) GetArticle(ctx *gin.Context) {
	// 获取文章ID
	id := ctx.Param("id")
	articleID, err := strconv.Atoi(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("无效的文章ID"))
		return
	}

	// 查询文章
	var article models.Article
	result := controller.DB.Preload("Tags").Preload("User").First(&article, articleID)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("文章不存在"))
		return
	}

	// 更新浏览量
	controller.DB.Model(&article).Update("look_count", article.LookCount+1)

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("获取文章成功", article))
}

// UpdateArticle 更新文章（需要作者或管理员权限）
func (controller *ArticleController) UpdateArticle(ctx *gin.Context) {
	// 获取当前登录用户ID和角色
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户未登录"))
		return
	}

	userRole, _ := ctx.Get("user_role")
	isAdmin := userRole.(string) == "admin"

	// 获取文章ID
	id := ctx.Param("id")
	articleID, err := strconv.Atoi(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("无效的文章ID"))
		return
	}

	// 查询文章
	var article models.Article
	result := controller.DB.First(&article, articleID)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("文章不存在"))
		return
	}

	// 检查权限（只有作者或管理员可以更新文章）
	if article.UserId != uint(userID.(int)) && !isAdmin {
		ctx.JSON(http.StatusForbidden, response.ErrorWithMessage("您没有权限修改此文章"))
		return
	}

	// 绑定请求数据
	var articleRequest struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Content     string `json:"content"`
		Tags        string `json:"tags"`
	}

	if err := ctx.ShouldBindJSON(&articleRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("请求数据无效: "+err.Error()))
		return
	}

	// 更新文章
	if articleRequest.Title != "" {
		article.Title = articleRequest.Title
	}
	if articleRequest.Description != "" {
		article.Description = articleRequest.Description
	}
	if articleRequest.Content != "" {
		article.Content = articleRequest.Content
	}
	if articleRequest.Tags != "" {
		article.Tags = articleRequest.Tags
	}
	article.UpdatedAt = time.Now()

	// 保存到数据库
	if err := controller.DB.Save(&article).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("更新文章失败: "+err.Error()))
		return
	}

	// 加载关联的标签和用户信息
	controller.DB.Preload("Tags").Preload("User").First(&article, article.ID)

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("文章更新成功", article))
}

// DeleteArticle 删除文章（需要作者或管理员权限）
func (controller *ArticleController) DeleteArticle(ctx *gin.Context) {
	// 获取当前登录用户ID和角色
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户未登录"))
		return
	}

	userRole, _ := ctx.Get("user_role")
	isAdmin := userRole.(string) == "admin"

	// 获取文章ID
	id := ctx.Param("id")
	articleID, err := strconv.Atoi(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("无效的文章ID"))
		return
	}

	// 查询文章
	var article models.Article
	result := controller.DB.First(&article, articleID)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("文章不存在"))
		return
	}

	// 检查权限（只有作者或管理员可以删除文章）
	if article.UserId != uint(userID.(int)) && !isAdmin {
		ctx.JSON(http.StatusForbidden, response.ErrorWithMessage("您没有权限删除此文章"))
		return
	}

	// 从数据库删除
	if err := controller.DB.Delete(&article).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("删除文章失败: "+err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("文章删除成功", nil))
}

// ListArticles 获取文章列表（公开权限）
func (controller *ArticleController) ListArticles(ctx *gin.Context) {
	// 分页参数
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))

	// 确保分页参数有效
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 50 {
		pageSize = 50
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 过滤参数
	tagID := ctx.Query("tag_id")
	userID := ctx.Query("user_id")
	keyword := ctx.Query("keyword")

	// 构建查询
	query := controller.DB.Model(&models.Article{})

	// 应用过滤条件
	if tagID != "" {
		query = query.Joins("JOIN article_tags ON article_tags.article_id = articles.id").
			Where("article_tags.tag_id = ?", tagID)
	}

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if keyword != "" {
		query = query.Where("title LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	// 获取总记录数
	var total int64
	query.Count(&total)

	// 查询文章列表
	var articles []models.Article
	query.Preload("Tags").Preload("User").
		Offset(offset).Limit(pageSize).
		Order("created_at DESC").
		Find(&articles)

	// 构造分页响应
	datas := gin.H{
		"total":        total,
		"current_page": page,
		"page_size":    pageSize,
		"data":         articles,
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("获取文章列表成功", datas))
}
