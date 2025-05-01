package controllers

import (
	"net/http"
	"os"
	"server/internal/models"
	response "server/pkg/responses"
	"server/pkg/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserController struct {
	DB *gorm.DB
}

func NewUserController(db *gorm.DB) *UserController {
	return &UserController{DB: db}
}

func (controller *UserController) CreateUser(ctx *gin.Context) {
	var user models.CreateUserRequest
	if err := ctx.BindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(err.Error()))
		return
	}

	// 验证密码匹配
	if user.Password != user.RepeatPassword {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("两次密码不一致"))
		return
	}

	// 验证邮箱格式
	if !utils.IsValidEmail(user.Email) {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("邮箱格式不正确"))
		return
	}

	// 验证密码强度
	if !utils.IsStrongPassword(user.Password) {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("密码强度不够，密码应该至少8位，包含大小写字母、数字或特殊字符"))
		return
	}

	// 检查邮箱或用户名是否已存在
	var existingUser models.User
	if err := controller.DB.Where("email = ?", user.Email).Or("username = ?", user.Username).First(&existingUser).Error; err == nil {
		ctx.JSON(http.StatusConflict, response.ErrorWithMessage("邮箱或用户名已存在"))
		return
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}
	user.Password = hashedPassword

	var count int64
	var role string
	controller.DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		role = "admin"
	} else {
		role = "user"
	}
	var avatar string
	if os.Getenv("AVATAR_URL") != "" {
		avatar = os.Getenv("AVATAR_URL")
	}

	newUser := models.User{
		Email:       user.Email,
		Username:    user.Username,
		Password:    user.Password,
		Role:        role,
		Active:      true,
		Avatar:      avatar,
		LastLoginIP: ctx.ClientIP(),
		LastLoginAt: time.Now(),
	}

	if err := controller.DB.Create(&newUser).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}
	ctx.JSON(http.StatusCreated, response.SuccessWithMessage("用户创建成功", nil))
}

func (controller *UserController) Login(ctx *gin.Context) {
	var user models.LoginUserRequest
	if err := ctx.BindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(err.Error()))
		return
	}

	if !utils.IsValidEmail(user.Email) {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("邮箱格式不正确"))
		return
	}

	var existingUser models.User
	if err := controller.DB.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户不存在"))
		return
	}

	if !utils.ValidatePassword(user.Password, existingUser.Password) {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("密码错误"))
		return
	}

	token, err := utils.GenerateToken(int(existingUser.ID), existingUser.Role)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	existingUser.LastLoginIP = ctx.ClientIP()
	existingUser.LastLoginAt = time.Now()

	if err := controller.DB.Save(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	data := models.LoginUserResponse{
		Token: token,
		User: models.UserResponse{
			ID:          existingUser.ID,
			Email:       existingUser.Email,
			Username:    existingUser.Username,
			Avatar:      existingUser.Avatar,
			Role:        existingUser.Role,
			Active:      existingUser.Active,
			LastLoginIP: existingUser.LastLoginIP,
			LastLoginAt: existingUser.LastLoginAt,
			CreatedAt:   existingUser.CreatedAt,
			UpdatedAt:   existingUser.UpdatedAt,
		},
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("用户登录成功", data))
}

func (controller *UserController) ChangePassword(ctx *gin.Context) {
	var changePasswordRequest models.ChangePasswordRequest

	// 绑定请求参数
	if err := ctx.BindJSON(&changePasswordRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(err.Error()))
		return
	}

	// 验证两次密码是否一致
	if changePasswordRequest.NewPassword != changePasswordRequest.RepeatNewPassword {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("两次密码不一致"))
		return
	}

	// 获取当前登录用户 ID
	user_id, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户未登录"))
		return
	}

	userId := user_id.(int)
	var existingUser models.User

	// 查询用户
	if err := controller.DB.Where("id = ?", userId).First(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("用户未登录"))
		return
	}

	// 验证当前密码
	if !utils.ValidatePassword(changePasswordRequest.OldPassword, existingUser.Password) {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("当前密码错误"))
		return
	}

	// 更新密码
	hashedPassword, err := utils.HashPassword(changePasswordRequest.NewPassword)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	existingUser.Password = hashedPassword

	// 更新用户密码
	if err := controller.DB.Save(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("密码修改成功", nil))
}

// 更新用户信息
func (controller *UserController) UpdateUser(ctx *gin.Context) {
	// 创建一个请求结构体，仅包含允许用户更新的字段
	type UpdateUserRequest struct {
		Username string `json:"username"`
		Avatar   string `json:"avatar"`
		Email    string `json:"email"`
	}

	var updateRequest UpdateUserRequest
	if err := ctx.BindJSON(&updateRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(err.Error()))
		return
	}

	// 获取当前登录用户 ID
	user_id, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.ErrorWithMessage("用户未登录"))
		return
	}

	userId := user_id.(int)
	var existingUser models.User

	// 查询用户
	if err := controller.DB.Where("id = ?", userId).First(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("用户不存在"))
		return
	}

	// 更新允许修改的字段
	if updateRequest.Username != "" {
		// 检查用户名是否已存在
		var count int64
		controller.DB.Model(&models.User{}).Where("username = ? AND id != ?", updateRequest.Username, userId).Count(&count)
		if count > 0 {
			ctx.JSON(http.StatusConflict, response.ErrorWithMessage("用户名已存在"))
			return
		}
		existingUser.Username = updateRequest.Username
	}

	if updateRequest.Avatar != "" {
		existingUser.Avatar = updateRequest.Avatar
	}

	if updateRequest.Email != "" {
		// 检查邮箱是否已存在
		var count int64
		controller.DB.Model(&models.User{}).Where("email = ? AND id != ?", updateRequest.Email, userId).Count(&count)
		if count > 0 {
			ctx.JSON(http.StatusConflict, response.ErrorWithMessage("邮箱已绑定其他账户"))
			return
		}
		existingUser.Email = updateRequest.Email
	}

	// 保存更新后的用户信息
	if err := controller.DB.Save(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	// 创建用户响应对象，仅返回安全的用户信息
	userResponse := models.UserResponse{
		ID:          existingUser.ID,
		Email:       existingUser.Email,
		Username:    existingUser.Username,
		Avatar:      existingUser.Avatar,
		Role:        existingUser.Role,
		Active:      existingUser.Active,
		LastLoginIP: existingUser.LastLoginIP,
		LastLoginAt: existingUser.LastLoginAt,
		CreatedAt:   existingUser.CreatedAt,
		UpdatedAt:   existingUser.UpdatedAt,
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("用户信息更新成功", userResponse))
}

// 获取指定用户的公共信息
func (controller *UserController) GetPublicUserInfoById(ctx *gin.Context) {
	// 获取指定用户的 ID
	id := ctx.Param("id")
	if id == "" {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("用户ID不能为空"))
		return
	}

	var existingUser models.User

	// 查询用户
	if err := controller.DB.Where("id = ?", id).First(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("用户不存在"))
		return
	}

	// 创建用户响应对象，仅返回安全的用户信息
	userResponse := models.UserResponse{
		ID:          existingUser.ID,
		Email:       existingUser.Email,
		Username:    existingUser.Username,
		Avatar:      existingUser.Avatar,
		Role:        existingUser.Role,
		Active:      existingUser.Active,
		LastLoginIP: existingUser.LastLoginIP,
		LastLoginAt: existingUser.LastLoginAt,
		CreatedAt:   existingUser.CreatedAt,
		UpdatedAt:   existingUser.UpdatedAt,
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("获取用户信息成功", userResponse))
}

// 获取用户列表：分页、可按用户名、角色搜索
func (controller *UserController) GetUsers(ctx *gin.Context) {
	// 定义分页和返回数据结构
	type Pagination struct {
		Total    int64              `json:"total"`
		Current  int               `json:"current"`
		PageSize int               `json:"page_size"`
		Data     []models.UserResponse `json:"data"`
	}

	// 获取分页参数
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))

	// 限制最大分页大小，避免过大查询
	if pageSize > 100 {
		pageSize = 100
	}

	// 确保分页参数有效
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 获取查询参数
	username := ctx.Query("username")
	role := ctx.Query("role")
	active := ctx.Query("active")

	// 初始化查询构建器
	query := controller.DB.Model(&models.User{})

	// 构建查询条件，做到条件组合
	if username != "" {
		query = query.Where("username LIKE ?", "%"+username+"%")
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if active != "" {
		activeValue := false
		if active == "true" {
			activeValue = true
		}
		query = query.Where("active = ?", activeValue)
	}

	// 获取总记录数
	var total int64
	query.Count(&total)

	// 使用选择字段和分页执行查询
	var users []models.User
	query.Select("id, email, username, avatar, role, active, last_login_ip, last_login_at, created_at, updated_at").  // 显式选择字段避免返回敏感信息
		Offset(offset).Limit(pageSize).  // 分页
		Order("created_at DESC").        // 排序
		Find(&users)

	// 高效的数据转换，预先分配内存容量
	userResponses := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		userResponses = append(userResponses, models.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Username:    user.Username,
			Avatar:      user.Avatar,
			Role:        user.Role,
			Active:      user.Active,
			LastLoginIP: user.LastLoginIP,
			LastLoginAt: user.LastLoginAt,
			CreatedAt:   user.CreatedAt,
			UpdatedAt:   user.UpdatedAt,
		})
	}

	// 构造分页响应数据
	paginationResponse := Pagination{
		Total:    total,
		Current:  page,
		PageSize: pageSize,
		Data:     userResponses,
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("获取用户列表成功", paginationResponse))
}

// 删除用户
func (controller *UserController) DeleteUser(ctx *gin.Context) {
	// 获取要删除的用户 ID
	userId := ctx.Param("id")
	if userId == "" {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage("要删除的用户ID不能为空"))
		return
	}

	var existingUser models.User

	// 查询用户
	if err := controller.DB.Where("id = ?", userId).First(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusNotFound, response.ErrorWithMessage("用户不存在"))
		return
	}

	// 删除用户
	if err := controller.DB.Delete(&existingUser).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("用户删除成功", nil))
}


