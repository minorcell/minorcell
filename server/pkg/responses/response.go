package response

// HTTP 状态码常量，按照标准HTTP状态码定义
const (
	// 2xx 成功
	StatusOK             = 200 // 请求成功
	StatusCreated        = 201 // 已创建，新资源成功创建
	StatusAccepted       = 202 // 已接受，但尚未处理完成
	StatusNoContent      = 204 // 无内容，请求成功但无返回内容
	
	// 3xx 重定向
	StatusNotModified    = 304 // 未修改，资源未发生变化
	
	// 4xx 客户端错误
	StatusBadRequest     = 400 // 错误请求，通常是请求参数错误
	StatusUnauthorized   = 401 // 未授权，需要身份验证
	StatusForbidden      = 403 // 禁止，权限不足
	StatusNotFound       = 404 // 未找到，资源不存在
	StatusConflict       = 409 // 冲突，例如资源已存在
	
	// 5xx 服务器错误
	StatusInternalError  = 500 // 服务器内部错误
	StatusNotImplemented = 501 // 未实现
	StatusUnavailable    = 503 // 服务不可用
)

type Response struct {
	Success bool        `json:"success"`   // 请求是否成功
	Message string      `json:"message"`  // 响应信息
	Data    interface{} `json:"data"`     // 响应数据
}

func Success(data interface{}) *Response {
	return &Response{
		Success: true,
		Message: "success",
		Data:    data,
	}
}

func Error(message string) *Response {
	return &Response{
		Success: false,
		Message: message,
		Data:    nil,
	}
}

func SuccessWithMessage(message string, data interface{}) *Response {
	return &Response{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func ErrorWithMessage(message string) *Response {
	return &Response{
		Success: false,
		Message: message,
		Data:    nil,
	}
}
