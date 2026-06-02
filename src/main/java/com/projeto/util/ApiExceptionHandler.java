package com.projeto.util;

import com.projeto.dto.ApiResponse;
import com.projeto.exception.AppException;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public final class ApiExceptionHandler {
    private ApiExceptionHandler() {
    }

    public static void tratar(HttpServletResponse response, Exception exception) throws IOException {
        if (exception instanceof AppException) {
            AppException appException = (AppException) exception;
            HttpUtil.escreverJson(response, appException.getHttpStatus(), ApiResponse.error(appException.getMessage()));
            return;
        }

        exception.printStackTrace();
        HttpUtil.escreverJson(response, 500, ApiResponse.error("Erro interno no servidor."));
    }
}

