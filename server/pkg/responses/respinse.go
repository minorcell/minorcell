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

// Response struct
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// Success response
func Success(data interface{}) *Response {
	return &Response{
		Code:    StatusSuccess,
		Message: "success",
		Data:    data,
	}
}

// Error response
func Error(code int, message string) *Response {
	return &Response{
		Code:    code,
		Message: message,
		Data:    nil,
	}
}

// Success with message
func SuccessWithMessage(message string, data interface{}) *Response {
	return &Response{
		Code:    StatusSuccess,
		Message: message,
		Data:    data,
	}
}

// Error with message
func ErrorWithMessage(code int, message string) *Response {
	return &Response{
		Code:    code,
		Message: message,
		Data:    nil,
	}
}
