package com.projeto.dto;

import java.time.LocalTime;

public class HorarioDisponivelDTO {
    private LocalTime horaInicio;
    private LocalTime horaFim;

    public HorarioDisponivelDTO(LocalTime horaInicio, LocalTime horaFim) {
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public LocalTime getHoraFim() {
        return horaFim;
    }
}
