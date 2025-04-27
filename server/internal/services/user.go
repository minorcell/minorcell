package services

import (
	"errors"
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
	if user.Password != user.RepeatPassword {
		return errors.New("passwords do not match")
	}

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

	newUser := models.User{
		Email:       user.Email,
		Username:    user.Username,
		Password:    user.Password,
		Role:        role,
		Active:      true,
		Avatar:      "",
		LastLoginIP: ctx.ClientIP(),
		LastLoginAt: time.Now(),
	}

	if err := s.DB.Create(&newUser).Error; err != nil {
		return err
	}

	return nil
}

func (s *UserService) Login(user models.CreateUserRequest, ctx *gin.Context) (models.LoginUserResponse, error) {
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

	return models.LoginUserResponse{
		Token: token,
		User:  existingUser,
	}, nil
}
