package com.projeto.exception;

public class RecursoNaoEncontradoException extends AppException {
    public RecursoNaoEncontradoException(String message) {
        super(message, 404);
    }
}
