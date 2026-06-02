package com.projeto.util;

import com.projeto.exception.ValidacaoException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.regex.Pattern;

public final class ValidationUtil {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

    private ValidationUtil() {
    }

    public static String textoObrigatorio(String valor, String campo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ValidacaoException(campo + " e obrigatorio.");
        }
        return valor.trim();
    }

    public static void idObrigatorio(Integer valor, String campo) {
        if (valor == null || valor <= 0) {
            throw new ValidacaoException(campo + " e obrigatorio.");
        }
    }

    public static String emailValido(String email) {
        String emailNormalizado = textoObrigatorio(email, "Email").toLowerCase();
        if (!EMAIL_PATTERN.matcher(emailNormalizado).matches()) {
            throw new ValidacaoException("Email invalido.");
        }
        return emailNormalizado;
    }

    public static void senhaValida(String senha) {
        if (senha == null || senha.length() < 6) {
            throw new ValidacaoException("Senha deve possuir no minimo 6 caracteres.");
        }
    }

    public static void precoValido(BigDecimal preco) {
        if (preco == null || preco.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidacaoException("Preco por hora deve ser maior ou igual a zero.");
        }
    }

    public static void dataNaoPassada(LocalDate data) {
        if (data == null) {
            throw new ValidacaoException("Data do agendamento e obrigatoria.");
        }
        if (data.isBefore(LocalDate.now())) {
            throw new ValidacaoException("Data do agendamento nao pode estar no passado.");
        }
    }

    public static void horarioValido(LocalTime inicio, LocalTime fim) {
        if (inicio == null || fim == null) {
            throw new ValidacaoException("Hora inicial e hora final sao obrigatorias.");
        }
        if (!fim.isAfter(inicio)) {
            throw new ValidacaoException("Hora final deve ser maior que hora inicial.");
        }
    }
}
