package com.projeto.dao;

import com.projeto.connection.ConnectionFactory;
import com.projeto.dto.HorarioDisponivelDTO;
import com.projeto.enums.StatusAgendamento;
import com.projeto.exception.BancoDadosException;
import com.projeto.exception.ConflitoException;
import com.projeto.model.Agendamento;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class AgendamentoDAO {
    private static final LocalTime HORA_ABERTURA = LocalTime.of(8, 0);
    private static final LocalTime HORA_FECHAMENTO = LocalTime.of(22, 0);

    public Agendamento cadastrar(Agendamento agendamento) {
        String sql = "INSERT INTO agendamentos "
                + "(usuario_id, quadra_id, data_agendamento, hora_inicio, hora_fim, status, observacoes) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?) "
                + "RETURNING id";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            preencherStatement(agendamento, statement);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    agendamento.setId(resultSet.getInt("id"));
                }
            }

            return agendamento;
        } catch (SQLException ex) {
            throw tratarSQLException(ex);
        }
    }

    public List<Agendamento> listar(Integer usuarioId, Integer quadraId, LocalDate data) {
        StringBuilder sql = new StringBuilder("SELECT id, usuario_id, quadra_id, data_agendamento, "
                + "hora_inicio, hora_fim, status, observacoes "
                + "FROM agendamentos "
                + "WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (usuarioId != null) {
            sql.append(" AND usuario_id = ?");
            parametros.add(usuarioId);
        }

        if (quadraId != null) {
            sql.append(" AND quadra_id = ?");
            parametros.add(quadraId);
        }

        if (data != null) {
            sql.append(" AND data_agendamento = ?");
            parametros.add(data);
        }

        sql.append(" ORDER BY data_agendamento, hora_inicio, id");
        List<Agendamento> agendamentos = new ArrayList<>();

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {

            preencherParametros(statement, parametros);

            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    agendamentos.add(mapear(resultSet));
                }
            }

            return agendamentos;
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao listar agendamentos.", ex);
        }
    }

    public Optional<Agendamento> buscarPorId(int id) {
        String sql = "SELECT id, usuario_id, quadra_id, data_agendamento, hora_inicio, hora_fim, status, observacoes "
                + "FROM agendamentos "
                + "WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, id);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return Optional.of(mapear(resultSet));
                }
            }

            return Optional.empty();
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao buscar agendamento por id.", ex);
        }
    }

    public Agendamento atualizar(Agendamento agendamento) {
        String sql = "UPDATE agendamentos "
                + "SET usuario_id = ?, quadra_id = ?, data_agendamento = ?, hora_inicio = ?, hora_fim = ?, status = ?, observacoes = ? "
                + "WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            preencherStatement(agendamento, statement);
            statement.setInt(8, agendamento.getId());
            statement.executeUpdate();

            return buscarPorId(agendamento.getId()).orElse(agendamento);
        } catch (SQLException ex) {
            throw tratarSQLException(ex);
        }
    }

    public boolean atualizarStatus(int id, StatusAgendamento status) {
        String sql = "UPDATE agendamentos SET status = ? WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, status.name());
            statement.setInt(2, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao atualizar status do agendamento.", ex);
        }
    }

    public boolean cancelar(int id) {
        return atualizarStatus(id, StatusAgendamento.CANCELADO);
    }

    public boolean existeConflito(Integer quadraId, LocalDate data, LocalTime inicio, LocalTime fim, Integer idIgnorado) {
        String sql = "SELECT COUNT(*) "
                + "FROM agendamentos "
                + "WHERE quadra_id = ? "
                + "AND data_agendamento = ? "
                + "AND status <> 'CANCELADO' "
                + "AND hora_inicio < ? "
                + "AND hora_fim > ?";

        if (idIgnorado != null) {
            sql += " AND id <> ?";
        }

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, quadraId);
            statement.setDate(2, Date.valueOf(data));
            statement.setTime(3, Time.valueOf(fim));
            statement.setTime(4, Time.valueOf(inicio));
            if (idIgnorado != null) {
                statement.setInt(5, idIgnorado);
            }

            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao verificar conflito de horario.", ex);
        }
    }

    public List<HorarioDisponivelDTO> listarHorariosDisponiveis(Integer quadraId, LocalDate data) {
        List<HorarioDisponivelDTO> horarios = new ArrayList<>();
        LocalTime inicio = HORA_ABERTURA;

        while (!inicio.plusHours(1).isAfter(HORA_FECHAMENTO)) {
            LocalTime fim = inicio.plusHours(1);
            boolean horarioJaPassouHoje = data.isEqual(LocalDate.now()) && !fim.isAfter(LocalTime.now());

            if (!horarioJaPassouHoje && !existeConflito(quadraId, data, inicio, fim, null)) {
                horarios.add(new HorarioDisponivelDTO(inicio, fim));
            }

            inicio = fim;
        }

        return horarios;
    }

    private void preencherStatement(Agendamento agendamento, PreparedStatement statement) throws SQLException {
        statement.setInt(1, agendamento.getUsuarioId());
        statement.setInt(2, agendamento.getQuadraId());
        statement.setDate(3, Date.valueOf(agendamento.getDataAgendamento()));
        statement.setTime(4, Time.valueOf(agendamento.getHoraInicio()));
        statement.setTime(5, Time.valueOf(agendamento.getHoraFim()));
        statement.setString(6, agendamento.getStatus().name());
        statement.setString(7, agendamento.getObservacoes());
    }

    private void preencherParametros(PreparedStatement statement, List<Object> parametros) throws SQLException {
        for (int i = 0; i < parametros.size(); i++) {
            Object parametro = parametros.get(i);
            int posicao = i + 1;

            if (parametro instanceof Integer) {
                Integer valorInteiro = (Integer) parametro;
                statement.setInt(posicao, valorInteiro);
            } else if (parametro instanceof LocalDate) {
                LocalDate valorData = (LocalDate) parametro;
                statement.setDate(posicao, Date.valueOf(valorData));
            } else {
                statement.setObject(posicao, parametro);
            }
        }
    }

    private Agendamento mapear(ResultSet resultSet) throws SQLException {
        Agendamento agendamento = new Agendamento();
        agendamento.setId(resultSet.getInt("id"));
        agendamento.setUsuarioId(resultSet.getInt("usuario_id"));
        agendamento.setQuadraId(resultSet.getInt("quadra_id"));
        agendamento.setDataAgendamento(resultSet.getDate("data_agendamento").toLocalDate());
        agendamento.setHoraInicio(resultSet.getTime("hora_inicio").toLocalTime());
        agendamento.setHoraFim(resultSet.getTime("hora_fim").toLocalTime());
        agendamento.setStatus(StatusAgendamento.valueOf(resultSet.getString("status")));
        agendamento.setObservacoes(resultSet.getString("observacoes"));
        return agendamento;
    }

    private RuntimeException tratarSQLException(SQLException ex) {
        if ("23505".equals(ex.getSQLState())) {
            return new ConflitoException("Ja existe agendamento para esta quadra no mesmo horario.");
        }
        if ("23503".equals(ex.getSQLState())) {
            return new ConflitoException("Usuario ou quadra informados nao existem.");
        }
        return new BancoDadosException("Erro ao salvar agendamento.", ex);
    }
}
