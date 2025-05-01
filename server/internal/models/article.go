package models

import "time"

type Article struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `gorm:"not null" json:"description"`
	Content     string     `gorm:"not null;type:text" json:"content"`
	Cover       string     `gorm:"default:''" json:"cover"`
	LookCount   uint       `gorm:"default:0" json:"look_count"`
	Tags        string     `gorm:"many2many:article_tags" json:"tags"`
	UserId      uint       `gorm:"not null;index" json:"user_id"`
	User        User       `gorm:"foreignKey:UserId;references:ID" json:"user"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"autoDeleteTime" json:"deleted_at"`
}
