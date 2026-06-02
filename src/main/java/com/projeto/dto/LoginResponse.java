package com.projeto.dto;

public class LoginResponse {
    private UsuarioDTO usuario;

    public LoginResponse(UsuarioDTO usuario) {
        this.usuario = usuario;
    }

    public UsuarioDTO getUsuario() {
        return usuario;
    }
}
