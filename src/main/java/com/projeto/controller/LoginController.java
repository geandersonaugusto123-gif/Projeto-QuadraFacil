package com.projeto.controller;

import com.projeto.dao.UsuarioDAO;
import com.projeto.dto.ApiResponse;
import com.projeto.dto.LoginRequest;
import com.projeto.dto.LoginResponse;
import com.projeto.dto.UsuarioDTO;
import com.projeto.exception.AutenticacaoException;
import com.projeto.model.Usuario;
import com.projeto.util.PasswordUtil;
import com.projeto.util.ValidationUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "LoginController", urlPatterns = {"/api/login"})
public class LoginController extends BaseServlet {
    private final UsuarioDAO usuarioDAO = new UsuarioDAO();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            LoginRequest loginRequest = lerJson(request, LoginRequest.class);
            String email = ValidationUtil.emailValido(loginRequest.getEmail());
            String senha = ValidationUtil.textoObrigatorio(loginRequest.getSenha(), "Senha");

            Usuario usuario = usuarioDAO.buscarPorEmail(email)
                    .orElseThrow(() -> new AutenticacaoException("Email ou senha invalidos."));

            if (!PasswordUtil.verificarSenha(senha, usuario.getSenha())) {
                throw new AutenticacaoException("Email ou senha invalidos.");
            }

            LoginResponse loginResponse = new LoginResponse(UsuarioDTO.fromModel(usuario));
            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Login realizado com sucesso.", loginResponse));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }
}

