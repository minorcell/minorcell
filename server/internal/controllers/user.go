package controllers

import (
	"net/http"
	"server/internal/models"
	"server/internal/services"
	response "server/pkg/responses"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	userService *services.UserService
}

func NewUserController(userService *services.UserService) *UserController {
	return &UserController{userService: userService}
}

func (controller *UserController) CreateUser(ctx *gin.Context) {
	var user models.CreateUserRequest
	if err := ctx.BindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(http.StatusBadRequest, err.Error()))
		return
	}

	if err := controller.userService.CreateUser(user, ctx); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(http.StatusInternalServerError, err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("User created successfully", nil))
}

func (controller *UserController) Login(ctx *gin.Context) {
	var user models.LoginUserRequest
	if err := ctx.BindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, response.ErrorWithMessage(http.StatusBadRequest, err.Error()))
		return
	}

	data, err := controller.userService.Login(user, ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.ErrorWithMessage(http.StatusInternalServerError, err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, response.SuccessWithMessage("User logged in successfully", data))
}
