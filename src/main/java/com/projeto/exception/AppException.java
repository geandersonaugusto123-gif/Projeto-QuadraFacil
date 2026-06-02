package com.projeto.exception;

public class AppException extends RuntimeException {
    private final int httpStatus;

    public AppException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public AppException(String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
