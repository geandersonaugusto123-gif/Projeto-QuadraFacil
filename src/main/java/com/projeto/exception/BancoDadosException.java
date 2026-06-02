package com.projeto.exception;

public class BancoDadosException extends AppException {
    public BancoDadosException(String message, Throwable cause) {
        super(message, 500, cause);
    }
}
