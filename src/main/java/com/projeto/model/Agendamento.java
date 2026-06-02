package com.projeto.model;

import com.projeto.enums.StatusAgendamento;
import java.time.LocalDate;
import java.time.LocalTime;

public class Agendamento {
    private Integer id;
    private Integer usuarioId;
    private Integer quadraId;
    private LocalDate dataAgendamento;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private StatusAgendamento status;
    private String observacoes;

    public Agendamento() {
    }

    public Agendamento(Integer id, Integer usuarioId, Integer quadraId, LocalDate dataAgendamento,
            LocalTime horaInicio, LocalTime horaFim, StatusAgendamento status, String observacoes) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.quadraId = quadraId;
        this.dataAgendamento = dataAgendamento;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
        this.status = status;
        this.observacoes = observacoes;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Integer usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Integer getQuadraId() {
        return quadraId;
    }

    public void setQuadraId(Integer quadraId) {
        this.quadraId = quadraId;
    }

    public LocalDate getDataAgendamento() {
        return dataAgendamento;
    }

    public void setDataAgendamento(LocalDate dataAgendamento) {
        this.dataAgendamento = dataAgendamento;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(LocalTime horaFim) {
        this.horaFim = horaFim;
    }

    public StatusAgendamento getStatus() {
        return status;
    }

    public void setStatus(StatusAgendamento status) {
        this.status = status;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
