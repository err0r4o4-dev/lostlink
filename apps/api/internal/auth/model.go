package auth

import (
	"errors"
	"time"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleStaff Role = "staff"
	RoleAdmin Role = "admin"
)

var (
	ErrConflict       = errors.New("account already exists")
	ErrInvalidLogin   = errors.New("invalid credentials")
	ErrInvalidRefresh = errors.New("invalid refresh credential")
	ErrRefreshReuse   = errors.New("refresh credential reuse detected")
)

type User struct {
	ID           string
	Identifier   string
	PasswordHash string
	Role         Role
	CreatedAt    time.Time
}

type Session struct {
	AccessToken  string
	RefreshToken string
	AccessExpiry time.Time
	User         User
}

type PublicUser struct {
	ID         string    `json:"id"`
	Identifier string    `json:"identifier"`
	Role       Role      `json:"role"`
	CreatedAt  time.Time `json:"created_at"`
}

func publicUser(user User) PublicUser {
	return PublicUser{ID: user.ID, Identifier: user.Identifier, Role: user.Role, CreatedAt: user.CreatedAt}
}
