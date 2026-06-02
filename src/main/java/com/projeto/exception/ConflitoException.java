package com.projeto.exception;

public class ConflitoException extends AppException {
    public ConflitoException(String message) {
        super(message, 409);
    }
}
