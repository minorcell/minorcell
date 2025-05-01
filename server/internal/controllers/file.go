package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"server/internal/models"
	response "server/pkg/responses"
	"server/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FileController struct {
	DB *gorm.DB
}

func NewFileController(db *gorm.DB) *FileController {
	return &FileController{DB: db}
}

// 上传文件
func (controller *FileController) UploadFile(c *gin.Context) {
	// 获取上传的文件
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, response.ErrorWithMessage(err.Error()))
		return
	}

	// 大于10mb
	if fileHeader.Size > 1024*1024*10 {
		c.JSON(http.StatusBadRequest, response.ErrorWithMessage("文件大小超过10MB"))
		return
	}

	// 生成文件hash
	hash, err := utils.GenerateFileHash(fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	// 查询文件是否已存在
	var existingFile models.File
	result := controller.DB.Where("hash = ?", hash).First(&existingFile)
	if result.Error == nil {
		// 文件已存在，直接返回
		c.JSON(http.StatusOK, response.SuccessWithMessage("文件已存在", existingFile))
		return
	} else if result.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, response.ErrorWithMessage(result.Error.Error()))
		return
	}

	// 保存文件到指定目录
	filePath := filepath.Join("uploads", hash+filepath.Ext(fileHeader.Filename))
	if err := os.MkdirAll("uploads", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	if err := c.SaveUploadedFile(fileHeader, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	userId := c.GetInt("user_id")
	// 保存文件信息到数据库
	newFile := models.File{
		Name:       fileHeader.Filename,
		Path:       os.Getenv("BASE_URL") + "/" + filePath,
		Hash:       hash,
		UploadedBy: uint(userId),
		Size:       fileHeader.Size,
		Type:       fileHeader.Header.Get("Content-Type"),
	}

	if err := controller.DB.Create(&newFile).Error; err != nil {
		// 如果数据库保存失败，删除已上传的文件
		_ = os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.SuccessWithMessage("文件上传成功", newFile))
}
