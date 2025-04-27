package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type JwtClaims struct {
	UserId   int    `json:"id"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userId int, role string) (string, error) {
	SecretKey := os.Getenv("JWT_SECRET")
	if len(SecretKey) == 0 {
		return "", errors.New("JWT_SECRET not set")
	}

	expireStrTime := os.Getenv("JWT_EXPIRES")
	if len(expireStrTime) == 0 {
		expireStrTime = "24h"
	}

	expireTime, err := time.ParseDuration(expireStrTime)
	if err != nil {
		return "", err
	}

	claims := &JwtClaims{
		UserId:   userId,
		UserRole: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(SecretKey))
}

func ParseToken(tokenString string) (*JwtClaims, error) {
	SecretKey := os.Getenv("JWT_SECRET")
	if len(SecretKey) == 0 {
		return nil, errors.New("JWT_SECRET not set")
	}

	token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(SecretKey), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JwtClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
