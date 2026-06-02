package com.projeto.controller;

import com.projeto.dto.ApiResponse;
import com.projeto.util.ApiExceptionHandler;
import com.projeto.util.HttpUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public abstract class BaseServlet extends HttpServlet {
    protected <T> T lerJson(HttpServletRequest request, Class<T> clazz) throws IOException {
        return HttpUtil.lerJson(request, clazz);
    }

    protected void enviar(HttpServletResponse response, int status, ApiResponse<?> body) throws IOException {
        HttpUtil.escreverJson(response, status, body);
    }

    protected void tratarErro(HttpServletResponse response, Exception exception) throws IOException {
        ApiExceptionHandler.tratar(response, exception);
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        HttpUtil.configurarCors(response);
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
}

