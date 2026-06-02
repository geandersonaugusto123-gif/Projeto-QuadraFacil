package com.projeto.dao;

import com.projeto.connection.ConnectionFactory;
import com.projeto.exception.BancoDadosException;
import com.projeto.exception.ConflitoException;
import com.projeto.model.Usuario;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UsuarioDAO {
    public Usuario cadastrar(Usuario usuario) {
        String sql = "INSERT INTO usuarios (nome, email, senha, telefone) "
                + "VALUES (?, ?, ?, ?) "
                + "RETURNING id, data_criacao";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, usuario.getNome());
            statement.setString(2, usuario.getEmail());
            statement.setString(3, usuario.getSenha());
            statement.setString(4, usuario.getTelefone());

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    usuario.setId(resultSet.getInt("id"));
                    Timestamp dataCriacao = resultSet.getTimestamp("data_criacao");
                    usuario.setDataCriacao(dataCriacao.toLocalDateTime());
                }
            }

            return usuario;
        } catch (SQLException ex) {
            throw tratarSQLException(ex);
        }
    }

    public List<Usuario> listar() {
        String sql = "SELECT id, nome, email, senha, telefone, data_criacao FROM usuarios ORDER BY id";
        List<Usuario> usuarios = new ArrayList<>();

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                usuarios.add(mapear(resultSet));
            }

            return usuarios;
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao listar usuarios.", ex);
        }
    }

    public Optional<Usuario> buscarPorId(int id) {
        String sql = "SELECT id, nome, email, senha, telefone, data_criacao FROM usuarios WHERE id = ?";

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
            throw new BancoDadosException("Erro ao buscar usuario por id.", ex);
        }
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        String sql = "SELECT id, nome, email, senha, telefone, data_criacao FROM usuarios WHERE LOWER(email) = LOWER(?)";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email);

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return Optional.of(mapear(resultSet));
                }
            }

            return Optional.empty();
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao buscar usuario por email.", ex);
        }
    }

    public Usuario atualizar(Usuario usuario, boolean atualizarSenha) {
        String sqlSemSenha = "UPDATE usuarios "
                + "SET nome = ?, email = ?, telefone = ? "
                + "WHERE id = ?";
        String sqlComSenha = "UPDATE usuarios "
                + "SET nome = ?, email = ?, senha = ?, telefone = ? "
                + "WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(atualizarSenha ? sqlComSenha : sqlSemSenha)) {

            statement.setString(1, usuario.getNome());
            statement.setString(2, usuario.getEmail());

            if (atualizarSenha) {
                statement.setString(3, usuario.getSenha());
                statement.setString(4, usuario.getTelefone());
                statement.setInt(5, usuario.getId());
            } else {
                statement.setString(3, usuario.getTelefone());
                statement.setInt(4, usuario.getId());
            }

            statement.executeUpdate();
            return buscarPorId(usuario.getId()).orElse(usuario);
        } catch (SQLException ex) {
            throw tratarSQLException(ex);
        }
    }

    public boolean excluir(int id) {
        String sql = "DELETE FROM usuarios WHERE id = ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, id);
            return statement.executeUpdate() > 0;
        } catch (SQLException ex) {
            if ("23503".equals(ex.getSQLState())) {
                throw new ConflitoException("Usuario possui agendamentos vinculados e nao pode ser excluido.");
            }
            throw new BancoDadosException("Erro ao excluir usuario.", ex);
        }
    }

    public boolean emailExiste(String email, Integer idIgnorado) {
        String sql = idIgnorado == null
                ? "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?)"
                : "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?) AND id <> ?";

        try (Connection connection = ConnectionFactory.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email);
            if (idIgnorado != null) {
                statement.setInt(2, idIgnorado);
            }

            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1) > 0;
            }
        } catch (SQLException ex) {
            throw new BancoDadosException("Erro ao verificar email.", ex);
        }
    }

    private Usuario mapear(ResultSet resultSet) throws SQLException {
        Usuario usuario = new Usuario();
        usuario.setId(resultSet.getInt("id"));
        usuario.setNome(resultSet.getString("nome"));
        usuario.setEmail(resultSet.getString("email"));
        usuario.setSenha(resultSet.getString("senha"));
        usuario.setTelefone(resultSet.getString("telefone"));
        usuario.setDataCriacao(resultSet.getTimestamp("data_criacao").toLocalDateTime());
        return usuario;
    }

    private RuntimeException tratarSQLException(SQLException ex) {
        if ("23505".equals(ex.getSQLState())) {
            return new ConflitoException("Email ja cadastrado.");
        }
        return new BancoDadosException("Erro ao salvar usuario.", ex);
    }
}
