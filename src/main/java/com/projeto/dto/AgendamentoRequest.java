package com.projeto.dto;

import com.google.gson.annotations.SerializedName;
import java.time.LocalDate;
import java.time.LocalTime;

public class AgendamentoRequest {
    @SerializedName(value = "usuarioId", alternate = {"usuario_id"})
    private Integer usuarioId;

    @SerializedName(value = "quadraId", alternate = {"quadra_id"})
    private Integer quadraId;

    @SerializedName(value = "dataAgendamento", alternate = {"data_agendamento"})
    private LocalDate dataAgendamento;

    @SerializedName(value = "horaInicio", alternate = {"hora_inicio"})
    private LocalTime horaInicio;

    @SerializedName(value = "horaFim", alternate = {"hora_fim"})
    private LocalTime horaFim;

    private String status;
    private String observacoes;

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public Integer getQuadraId() {
        return quadraId;
    }

    public LocalDate getDataAgendamento() {
        return dataAgendamento;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public LocalTime getHoraFim() {
        return horaFim;
    }

    public String getStatus() {
        return status;
    }

    public String getObservacoes() {
        return observacoes;
    }
}
