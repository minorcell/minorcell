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

type TagController struct {
	DB *gorm.DB
}

func NewTagController(db *gorm.DB) *TagController {
	return &TagController{DB: db}
}

// CreateTag 创建标签（需要管理员权限）
func (controller *TagController) CreateTag(ctx *gin.Context) {
	// 绑定请求数据
	var tagRequest struct {
		Name string `json:"name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&tagRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("请求数据无效: "+err.Error()))
		return
	}

	// 检查标签是否已存在
	var existingTag models.Tag
	result := controller.DB.Where("name = ?", tagRequest.Name).First(&existingTag)
	if result.Error == nil {
		ctx.JSON(http.StatusConflict, response.ErrorWithMessage("标签已存在"))
		return
	}

	// 创建标签
	tag := models.Tag{
		Name:      tagRequest.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存到数据库
	if err := controller.DB.Create(&tag).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("创建标签失败: "+err.Error()))
		return
	}

	ctx.JSON(http.StatusCreated, response.SuccessWithMessage("标签创建成功", tag))
}

// UpdateTag 更新标签（需要管理员权限）
func (controller *TagController) UpdateTag(ctx *gin.Context) {

	// 获取标签ID
	id := ctx.Param("id")
	tagID, err := strconv.Atoi(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("无效的标签ID"))
		return
	}

	// 查询标签
	var tag models.Tag
	result := controller.DB.First(&tag, tagID)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("标签不存在"))
		return
	}

	// 绑定请求数据
	var tagRequest struct {
		Name string `json:"name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&tagRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("请求数据无效: "+err.Error()))
		return
	}

	// 检查新标签名是否已存在（排除当前标签）
	var existingTag models.Tag
	result = controller.DB.Where("name = ? AND id != ?", tagRequest.Name, tagID).First(&existingTag)
	if result.Error == nil {
		ctx.JSON(http.StatusConflict, response.ErrorWithMessage("标签名已存在"))
		return
	}

	// 更新标签
	tag.Name = tagRequest.Name
	tag.UpdatedAt = time.Now()

	// 保存到数据库
	if err := controller.DB.Save(&tag).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("更新标签失败: "+err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("标签更新成功", tag))
}

// DeleteTag 删除标签（需要管理员权限）
func (controller *TagController) DeleteTag(ctx *gin.Context) {
	// 获取标签ID
	id := ctx.Param("id")
	tagID, err := strconv.Atoi(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("无效的标签ID"))
		return
	}

	// 查询标签
	var tag models.Tag
	result := controller.DB.First(&tag, tagID)
	if result.Error != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("标签不存在"))
		return
	}

	// 检查是否有文章使用该标签
	var count int64
	controller.DB.Table("article_tags").Where("tag_id = ?", tagID).Count(&count)
	if count > 0 {
		ctx.JSON(http.StatusConflict, response.ErrorWithMessage("该标签正在被文章使用，无法删除"))
		return
	}

	// 从数据库删除
	if err := controller.DB.Delete(&tag).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage("删除标签失败: "+err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("标签删除成功", nil))
}

// ListTags 获取标签列表（公开权限）
func (controller *TagController) ListTags(ctx *gin.Context) {
	// 分页参数
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "50"))

	// 确保分页参数有效
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 搜索参数
	keyword := ctx.Query("keyword")

	// 构建查询
	query := controller.DB.Model(&models.Tag{})

	// 应用搜索条件
	if keyword != "" {
		query = query.Where("name LIKE ?", "%"+keyword+"%")
	}

	// 获取总记录数
	var total int64
	query.Count(&total)

	// 查询标签列表
	var tags []models.Tag
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&tags)

	// 构造分页响应
	responseData := gin.H{
		"total":        total,
		"current_page": page,
		"page_size":    pageSize,
		"data":         tags,
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("获取标签列表成功", responseData))
}
