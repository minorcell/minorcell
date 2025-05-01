package models

import "time"

type File struct {
	ID         uint      `gorm:"primaryKey" json:"id"`             // 文件ID
	Name       string    `gorm:"not null" json:"name"`             // 文件名
	UploadedBy uint      `gorm:"not null" json:"uploaded_by"`      // 上传者ID
	Size       int64     `gorm:"not null" json:"size"`             // 文件大小
	Type       string    `gorm:"not null" json:"type"`             // 文件类型
	Hash       string    `gorm:"not null" json:"hash"`             // 文件的哈希值
	Path       string    `gorm:"not null" json:"path"`             // 文件的存储路径
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"` // 创建时间
}
