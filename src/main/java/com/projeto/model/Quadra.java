package com.projeto.model;

import com.projeto.enums.StatusQuadra;
import com.projeto.enums.TipoQuadra;
import java.math.BigDecimal;

public class Quadra {
    private Integer id;
    private String nome;
    private TipoQuadra tipo;
    private String descricao;
    private BigDecimal precoHora;
    private StatusQuadra status;

    public Quadra() {
    }

    public Quadra(Integer id, String nome, TipoQuadra tipo, String descricao, BigDecimal precoHora, StatusQuadra status) {
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.descricao = descricao;
        this.precoHora = precoHora;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public TipoQuadra getTipo() {
        return tipo;
    }

    public void setTipo(TipoQuadra tipo) {
        this.tipo = tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getPrecoHora() {
        return precoHora;
    }

    public void setPrecoHora(BigDecimal precoHora) {
        this.precoHora = precoHora;
    }

    public StatusQuadra getStatus() {
        return status;
    }

    public void setStatus(StatusQuadra status) {
        this.status = status;
    }
}
