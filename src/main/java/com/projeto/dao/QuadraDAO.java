package com.projeto.dao;

import com.projeto.connection.ConnectionFactory;
import com.projeto.enums.StatusQuadra;
import com.projeto.enums.TipoQuadra;
import com.projeto.exception.BancoDadosException;
import com.projeto.exception.ConflitoException;
import com.projeto.model.Quadra;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class QuadraDAO {
    public Quadra cadastrar(Quadra quadra) {
        String sql = "INSERT INTO quadras (nome, tipo, descricao, preco_hora, status) "
                + "VALUES (?, ?, ?, ?, ?) "
                + "RETURNING id";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            preencherStatement(quadra, statement);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    quadra.setId(resultSet.getInt("id"));
                }
            }

            return quadra;
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao cadastrar quadra.", ex);
        }
    }

    public List<Quadra> listar() {
        String sql = "SELECT id, nome, tipo, descricao, preco_hora, status FROM quadras ORDER BY id";
        List<Quadra> quadras = new ArrayList<>();

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                quadras.add(mapear(resultSet));
            }

            return quadras;
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao listar quadras.", ex);
        }
    }

    public Optional<Quadra> buscarPorId(int id) {
        String sql = "SELECT id, nome, tipo, descricao, preco_hora, status FROM quadras WHERE id = ?";

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
            throw new BancoDadosException("Erro ao buscar quadra por id.", ex);
        }
    }

    public Quadra atualizar(Quadra quadra) {
        String sql = "UPDATE quadras "
                + "SET nome = ?, tipo = ?, descricao = ?, preco_hora = ?, status = ? "
                + "WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            preencherStatement(quadra, statement);
            statement.setInt(6, quadra.getId());
            statement.executeUpdate();

            return buscarPorId(quadra.getId()).orElse(quadra);
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao atualizar quadra.", ex);
        }
    }

    public boolean excluir(int id) {
        String sql = "DELETE FROM quadras WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException ex) {
            if ("23503".equals(ex.getSQLState())) {
                throw new ConflitoException("Quadra possui agendamentos vinculados e nao pode ser excluida.");
            }
            throw new BancoDadosException("Erro ao excluir quadra.", ex);
        }
    }

    private void preencherStatement(Quadra quadra, PreparedStatement statement) throws SQLException {
        statement.setString(1, quadra.getNome());
        statement.setString(2, quadra.getTipo().name());
        statement.setString(3, quadra.getDescricao());
        statement.setBigDecimal(4, quadra.getPrecoHora());
        statement.setString(5, quadra.getStatus().name());
    }

    private Quadra mapear(ResultSet resultSet) throws SQLException {
        Quadra quadra = new Quadra();
        quadra.setId(resultSet.getInt("id"));
        quadra.setNome(resultSet.getString("nome"));
        quadra.setTipo(TipoQuadra.valueOf(resultSet.getString("tipo")));
        quadra.setDescricao(resultSet.getString("descricao"));
        quadra.setPrecoHora(resultSet.getBigDecimal("preco_hora"));
        quadra.setStatus(StatusQuadra.valueOf(resultSet.getString("status")));
        return quadra;
    }
}
