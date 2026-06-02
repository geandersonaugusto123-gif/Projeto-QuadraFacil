package com.projeto.exception;

public class ValidacaoException extends AppException {
    public ValidacaoException(String message) {
        super(message, 400);
    }
}
