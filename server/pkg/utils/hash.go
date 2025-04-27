package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"mime/multipart"
)

func GenerateFileHash(file *multipart.FileHeader) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	hash := sha256.New()

	if _, err := io.Copy(hash, src); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
