package com.projeto.enums;

import com.projeto.exception.ValidacaoException;

public enum StatusQuadra {
    DISPONIVEL,
    INDISPONIVEL,
    MANUTENCAO;

    public static StatusQuadra fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return DISPONIVEL;
        }

        try {
            return StatusQuadra.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidacaoException("Status da quadra invalido.");
        }
    }
}
