package models

import "time"

type User struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Email       string    `gorm:"unique;not null" json:"email"`
	Username    string    `gorm:"not null" json:"username"`
	Password    string    `gorm:"not null" json:"password"`
	Avatar      string    `gorm:"default:" json:"avatar"`
	Role        string    `gorm:"default:user" json:"role"`
	Active      bool      `gorm:"default:true" json:"active"`
	LastLoginIP string    `gorm:"default:" json:"last_login_ip"`
	LastLoginAt time.Time `gorm:"default:null" json:"last_login_at"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type CreateUserRequest struct {
	Email          string `json:"email"`
	Username       string `json:"username"`
	Password       string `json:"password"`
	RepeatPassword string `json:"repeat_password"`
}

type LoginUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginUserResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
