package com.projeto.controller;

import com.projeto.dao.AgendamentoDAO;
import com.projeto.dao.QuadraDAO;
import com.projeto.dao.UsuarioDAO;
import com.projeto.dto.AgendamentoRequest;
import com.projeto.dto.ApiResponse;
import com.projeto.dto.StatusAgendamentoRequest;
import com.projeto.enums.StatusAgendamento;
import com.projeto.enums.StatusQuadra;
import com.projeto.exception.ConflitoException;
import com.projeto.exception.RecursoNaoEncontradoException;
import com.projeto.exception.ValidacaoException;
import com.projeto.model.Agendamento;
import com.projeto.model.Quadra;
import com.projeto.util.HttpUtil;
import com.projeto.util.ValidationUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

@WebServlet(name = "AgendamentoController", urlPatterns = {"/api/agendamentos/*"})
public class AgendamentoController extends BaseServlet {
    private static final LocalTime HORA_ABERTURA = LocalTime.of(8, 0);
    private static final LocalTime HORA_FECHAMENTO = LocalTime.of(22, 0);

    private final AgendamentoDAO agendamentoDAO = new AgendamentoDAO();
    private final UsuarioDAO usuarioDAO = new UsuarioDAO();
    private final QuadraDAO quadraDAO = new QuadraDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);

            if (partes.length == 1 && "disponiveis".equalsIgnoreCase(partes[0])) {
                listarHorariosDisponiveis(request, response);
                return;
            }

            if (partes.length == 0) {
                Integer usuarioId = HttpUtil.parseParametroInteiro(request, "usuarioId");
                Integer quadraId = HttpUtil.parseParametroInteiro(request, "quadraId");
                LocalDate data = parseDataOpcional(request.getParameter("data"));

                enviar(response, HttpServletResponse.SC_OK, ApiResponse.success(
                        "Agendamentos listados com sucesso.",
                        agendamentoDAO.listar(usuarioId, quadraId, data)
                ));
                return;
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do agendamento");
            Agendamento agendamento = agendamentoDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento nao encontrado."));

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Agendamento encontrado.", agendamento));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            AgendamentoRequest agendamentoRequest = lerJson(request, AgendamentoRequest.class);
            Agendamento agendamento = montarAgendamento(agendamentoRequest, null, StatusAgendamento.PENDENTE);
            validarAgendamento(agendamento, null);

            Agendamento cadastrado = agendamentoDAO.cadastrar(agendamento);
            enviar(response, HttpServletResponse.SC_CREATED, ApiResponse.success("Agendamento criado com sucesso.", cadastrado));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id do agendamento na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do agendamento");

            if (partes.length > 1 && "cancelar".equalsIgnoreCase(partes[1])) {
                cancelarAgendamento(id, response);
                return;
            }

            if (partes.length > 1 && "status".equalsIgnoreCase(partes[1])) {
                atualizarStatus(request, response, id);
                return;
            }

            Agendamento existente = agendamentoDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento nao encontrado."));

            AgendamentoRequest agendamentoRequest = lerJson(request, AgendamentoRequest.class);
            Agendamento agendamento = montarAgendamento(agendamentoRequest, id, existente.getStatus());
            validarAgendamento(agendamento, id);

            Agendamento atualizado = agendamentoDAO.atualizar(agendamento);
            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Agendamento atualizado com sucesso.", atualizado));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id do agendamento na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do agendamento");
            cancelarAgendamento(id, response);
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    private void listarHorariosDisponiveis(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Integer quadraId = HttpUtil.parseParametroInteiro(request, "quadraId");
        if (quadraId == null) {
            throw new ValidacaoException("Parametro quadraId e obrigatorio.");
        }

        LocalDate data = parseDataObrigatoria(request.getParameter("data"));
        ValidationUtil.dataNaoPassada(data);
        Quadra quadra = buscarQuadra(quadraId);
        if (quadra.getStatus() != StatusQuadra.DISPONIVEL) {
            throw new ConflitoException("Quadra nao esta disponivel para agendamentos.");
        }

        enviar(response, HttpServletResponse.SC_OK, ApiResponse.success(
                "Horarios disponiveis listados com sucesso.",
                agendamentoDAO.listarHorariosDisponiveis(quadraId, data)
        ));
    }

    private void atualizarStatus(HttpServletRequest request, HttpServletResponse response, Integer id) throws IOException {
        Agendamento agendamento = agendamentoDAO.buscarPorId(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento nao encontrado."));

        StatusAgendamentoRequest statusRequest = lerJson(request, StatusAgendamentoRequest.class);
        StatusAgendamento novoStatus = StatusAgendamento.fromString(statusRequest.getStatus());

        if (novoStatus != StatusAgendamento.CANCELADO
                && agendamentoDAO.existeConflito(agendamento.getQuadraId(), agendamento.getDataAgendamento(),
                        agendamento.getHoraInicio(), agendamento.getHoraFim(), id)) {
            throw new ConflitoException("Existe outro agendamento neste horario para a mesma quadra.");
        }

        agendamentoDAO.atualizarStatus(id, novoStatus);
        enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Status do agendamento atualizado com sucesso."));
    }

    private void cancelarAgendamento(Integer id, HttpServletResponse response) throws IOException {
        if (!agendamentoDAO.cancelar(id)) {
            throw new RecursoNaoEncontradoException("Agendamento nao encontrado.");
        }

        enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Agendamento cancelado com sucesso."));
    }

    private Agendamento montarAgendamento(AgendamentoRequest request, Integer id, StatusAgendamento statusPadrao) {
        ValidationUtil.idObrigatorio(request.getUsuarioId(), "Usuario");
        ValidationUtil.idObrigatorio(request.getQuadraId(), "Quadra");
        ValidationUtil.dataNaoPassada(request.getDataAgendamento());
        ValidationUtil.horarioValido(request.getHoraInicio(), request.getHoraFim());
        validarHorarioFuncionamento(request.getDataAgendamento(), request.getHoraInicio(), request.getHoraFim());

        StatusAgendamento status = request.getStatus() == null || request.getStatus().trim().isEmpty()
                ? statusPadrao
                : StatusAgendamento.fromString(request.getStatus());

        Agendamento agendamento = new Agendamento();
        agendamento.setId(id);
        agendamento.setUsuarioId(request.getUsuarioId());
        agendamento.setQuadraId(request.getQuadraId());
        agendamento.setDataAgendamento(request.getDataAgendamento());
        agendamento.setHoraInicio(request.getHoraInicio());
        agendamento.setHoraFim(request.getHoraFim());
        agendamento.setStatus(status);
        agendamento.setObservacoes(request.getObservacoes() == null ? null : request.getObservacoes().trim());
        return agendamento;
    }

    private void validarAgendamento(Agendamento agendamento, Integer idIgnorado) {
        usuarioDAO.buscarPorId(agendamento.getUsuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario informado nao existe."));

        Quadra quadra = buscarQuadra(agendamento.getQuadraId());

        if (agendamento.getStatus() != StatusAgendamento.CANCELADO
                && quadra.getStatus() != StatusQuadra.DISPONIVEL) {
            throw new ConflitoException("Quadra nao esta disponivel para novos agendamentos.");
        }

        if (agendamento.getStatus() != StatusAgendamento.CANCELADO
                && agendamentoDAO.existeConflito(agendamento.getQuadraId(), agendamento.getDataAgendamento(),
                        agendamento.getHoraInicio(), agendamento.getHoraFim(), idIgnorado)) {
            throw new ConflitoException("Existe outro agendamento neste horario para a mesma quadra.");
        }
    }

    private Quadra buscarQuadra(Integer quadraId) {
        return quadraDAO.buscarPorId(quadraId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Quadra informada nao existe."));
    }

    private void validarHorarioFuncionamento(LocalDate data, LocalTime inicio, LocalTime fim) {
        if (inicio.isBefore(HORA_ABERTURA) || fim.isAfter(HORA_FECHAMENTO)) {
            throw new ValidacaoException("Horario deve estar entre 08:00 e 22:00.");
        }

        if (data.isEqual(LocalDate.now()) && !inicio.isAfter(LocalTime.now())) {
            throw new ValidacaoException("Horario inicial deve ser maior que o horario atual.");
        }
    }

    private LocalDate parseDataObrigatoria(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ValidacaoException("Parametro data e obrigatorio.");
        }
        return parseData(valor);
    }

    private LocalDate parseDataOpcional(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        return parseData(valor);
    }

    private LocalDate parseData(String valor) {
        try {
            return LocalDate.parse(valor);
        } catch (DateTimeParseException ex) {
            throw new ValidacaoException("Data deve estar no formato yyyy-MM-dd.");
        }
    }
}

