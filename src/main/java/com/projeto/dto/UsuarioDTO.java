package com.projeto.dto;

import com.projeto.model.Usuario;
import java.time.LocalDateTime;

public class UsuarioDTO {
    private Integer id;
    private String nome;
    private String email;
    private String telefone;
    private LocalDateTime dataCriacao;

    public UsuarioDTO(Integer id, String nome, String email, String telefone, LocalDateTime dataCriacao) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.dataCriacao = dataCriacao;
    }

    public static UsuarioDTO fromModel(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getDataCriacao()
        );
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }
}
