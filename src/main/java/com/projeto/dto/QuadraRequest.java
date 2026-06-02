package com.projeto.dto;

import com.google.gson.annotations.SerializedName;
import java.math.BigDecimal;

public class QuadraRequest {
    private String nome;
    private String tipo;
    private String descricao;

    @SerializedName(value = "precoHora", alternate = {"preco_hora"})
    private BigDecimal precoHora;

    private String status;

    public String getNome() {
        return nome;
    }

    public String getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getPrecoHora() {
        return precoHora;
    }

    public String getStatus() {
        return status;
    }
}
