package com.projeto.enums;

import com.projeto.exception.ValidacaoException;
import java.text.Normalizer;

public enum TipoQuadra {
    FUTSAL,
    SOCIETY,
    BASQUETE,
    VOLEI,
    TENIS;

    public static TipoQuadra fromString(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ValidacaoException("Tipo da quadra e obrigatorio.");
        }

        String semAcento = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String normalizado = semAcento.toUpperCase();

        try {
            return TipoQuadra.valueOf(normalizado);
        } catch (IllegalArgumentException ex) {
            throw new ValidacaoException("Tipo da quadra invalido.");
        }
    }
}
