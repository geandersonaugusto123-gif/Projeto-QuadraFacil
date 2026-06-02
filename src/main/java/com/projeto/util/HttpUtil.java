package com.projeto.util;

import com.projeto.exception.ValidacaoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.Arrays;

public final class HttpUtil {
    private HttpUtil() {
    }

    public static void configurarJson(HttpServletResponse response) {
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        configurarCors(response);
    }

    public static void configurarCors(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    public static void escreverJson(HttpServletResponse response, int status, Object body) throws IOException {
        configurarJson(response);
        response.setStatus(status);
        response.getWriter().write(JsonUtil.toJson(body));
    }

    public static <T> T lerJson(HttpServletRequest request, Class<T> clazz) throws IOException {
        String body = lerBody(request);
        if (body == null || body.trim().isEmpty()) {
            throw new ValidacaoException("Corpo da requisicao JSON e obrigatorio.");
        }
        T result = JsonUtil.fromJson(body, clazz);
        if (result == null) {
            throw new ValidacaoException("Corpo da requisicao JSON e obrigatorio.");
        }
        return result;
    }

    public static String lerBody(HttpServletRequest request) throws IOException {
        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String linha;
            while ((linha = reader.readLine()) != null) {
                body.append(linha);
            }
        }
        return body.toString();
    }

    public static String[] getPathParts(HttpServletRequest request) {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.trim().isEmpty() || "/".equals(pathInfo)) {
            return new String[0];
        }

        return Arrays.stream(pathInfo.split("/"))
                .filter(part -> part != null && !part.trim().isEmpty())
                .toArray(String[]::new);
    }

    public static Integer parseId(String valor, String nomeCampo) {
        try {
            int id = Integer.parseInt(valor);
            if (id <= 0) {
                throw new NumberFormatException("Id menor ou igual a zero.");
            }
            return id;
        } catch (NumberFormatException ex) {
            throw new ValidacaoException(nomeCampo + " deve ser um numero inteiro positivo.");
        }
    }

    public static Integer parseParametroInteiro(HttpServletRequest request, String nome) {
        String valor = request.getParameter(nome);
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        return parseId(valor, nome);
    }
}

