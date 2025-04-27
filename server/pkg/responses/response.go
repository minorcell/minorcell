package response

const (
	StatusSuccess       = 200
	StatusCreated       = 201
	StatusAccepted      = 202
	StatusNoContent     = 204
	StatusNotModified   = 304
	StatusBadRequest    = 400
	StatusUnauthorized  = 401
	StatusForbidden     = 403
	StatusNotFound      = 404
	StatusInternalError = 500
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func Success(data interface{}) *Response {
	return &Response{
		Code:    StatusSuccess,
		Message: "success",
		Data:    data,
	}
}

func Error(code int, message string) *Response {
	return &Response{
		Code:    code,
		Message: message,
		Data:    nil,
	}
}

func SuccessWithMessage(message string, data interface{}) *Response {
	return &Response{
		Code:    StatusSuccess,
		Message: message,
		Data:    data,
	}
}

func ErrorWithMessage(code int, message string) *Response {
	return &Response{
		Code:    code,
		Message: message,
		Data:    nil,
	}
}
