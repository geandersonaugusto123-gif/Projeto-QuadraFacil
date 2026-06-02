package com.projeto.exception;

public class AutenticacaoException extends AppException {
    public AutenticacaoException(String message) {
        super(message, 401);
    }
}
