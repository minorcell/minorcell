package services

import (
	"errors"
	"os"
	"server/internal/models"
	"server/pkg/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserService struct {
	DB *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

func (s *UserService) CreateUser(user models.CreateUserRequest, ctx *gin.Context) error {
	// 验证密码匹配
	if user.Password != user.RepeatPassword {
		return errors.New("passwords do not match")
	}

	// 验证邮箱格式
	if !utils.IsValidEmail(user.Email) {
		return errors.New("invalid email format")
	}

	// 验证密码强度
	if !utils.IsStrongPassword(user.Password) {
		return errors.New("password is too weak, it should be at least 8 characters and contain uppercase, lowercase, numbers or special characters")
	}

	// 检查邮箱或用户名是否已存在
	var existingUser models.User
	if err := s.DB.Where("email = ?", user.Email).Or("username = ?", user.Username).First(&existingUser).Error; err == nil {
		return errors.New("email or username already exists")
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword

	var count int64
	var role string
	s.DB.Model(&models.User{}).Count(&count)
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

	if err := s.DB.Create(&newUser).Error; err != nil {
		return err
	}

	return nil
}

func (s *UserService) Login(user models.LoginUserRequest, ctx *gin.Context) (models.LoginUserResponse, error) {
	if !utils.IsValidEmail(user.Email) {
		return models.LoginUserResponse{}, errors.New("invalid email format")
	}

	var existingUser models.User
	if err := s.DB.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
		return models.LoginUserResponse{}, errors.New("user not found")
	}

	if !utils.ValidatePassword(user.Password, existingUser.Password) {
		return models.LoginUserResponse{}, errors.New("invalid password")
	}

	token, err := utils.GenerateToken(int(existingUser.ID), existingUser.Role)
	if err != nil {
		return models.LoginUserResponse{}, err
	}

	existingUser.LastLoginIP = ctx.ClientIP()
	existingUser.LastLoginAt = time.Now()

	if err := s.DB.Save(&existingUser).Error; err != nil {
		return models.LoginUserResponse{}, err
	}

	return models.LoginUserResponse{
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
	}, nil
}
