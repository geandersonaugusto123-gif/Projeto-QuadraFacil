package com.projeto.enums;

import com.projeto.exception.ValidacaoException;

public enum StatusAgendamento {
    PENDENTE,
    CONFIRMADO,
    CANCELADO,
    FINALIZADO;

    public static StatusAgendamento fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return PENDENTE;
        }

        try {
            return StatusAgendamento.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidacaoException("Status de agendamento invalido.");
        }
    }
}
