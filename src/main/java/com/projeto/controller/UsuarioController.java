package com.projeto.controller;

import com.projeto.dao.UsuarioDAO;
import com.projeto.dto.ApiResponse;
import com.projeto.dto.UsuarioDTO;
import com.projeto.dto.UsuarioRequest;
import com.projeto.exception.ConflitoException;
import com.projeto.exception.RecursoNaoEncontradoException;
import com.projeto.model.Usuario;
import com.projeto.util.HttpUtil;
import com.projeto.util.PasswordUtil;
import com.projeto.util.ValidationUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@WebServlet(name = "UsuarioController", urlPatterns = {"/api/usuarios/*"})
public class UsuarioController extends BaseServlet {
    private final UsuarioDAO usuarioDAO = new UsuarioDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);

            if (partes.length == 0) {
                List<UsuarioDTO> usuarios = usuarioDAO.listar()
                        .stream()
                        .map(UsuarioDTO::fromModel)
                        .collect(Collectors.toList());
                enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Usuarios listados com sucesso.", usuarios));
                return;
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do usuario");
            Usuario usuario = usuarioDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado."));

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Usuario encontrado.", UsuarioDTO.fromModel(usuario)));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            UsuarioRequest usuarioRequest = lerJson(request, UsuarioRequest.class);
            Usuario usuario = montarUsuario(usuarioRequest, null, true);

            if (usuarioDAO.emailExiste(usuario.getEmail(), null)) {
                throw new ConflitoException("Email ja cadastrado.");
            }

            Usuario cadastrado = usuarioDAO.cadastrar(usuario);
            enviar(response, HttpServletResponse.SC_CREATED, ApiResponse.success("Usuario cadastrado com sucesso.", UsuarioDTO.fromModel(cadastrado)));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id do usuario na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do usuario");
            usuarioDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado."));

            UsuarioRequest usuarioRequest = lerJson(request, UsuarioRequest.class);
            boolean atualizarSenha = usuarioRequest.getSenha() != null && !usuarioRequest.getSenha().trim().isEmpty();
            Usuario usuario = montarUsuario(usuarioRequest, id, atualizarSenha);

            if (usuarioDAO.emailExiste(usuario.getEmail(), id)) {
                throw new ConflitoException("Email ja cadastrado para outro usuario.");
            }

            Usuario atualizado = usuarioDAO.atualizar(usuario, atualizarSenha);
            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Usuario atualizado com sucesso.", UsuarioDTO.fromModel(atualizado)));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id do usuario na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id do usuario");
            if (!usuarioDAO.excluir(id)) {
                throw new RecursoNaoEncontradoException("Usuario nao encontrado.");
            }

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Usuario excluido com sucesso."));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    private Usuario montarUsuario(UsuarioRequest request, Integer id, boolean validarSenha) {
        String nome = ValidationUtil.textoObrigatorio(request.getNome(), "Nome");
        String email = ValidationUtil.emailValido(request.getEmail());
        String telefone = request.getTelefone() == null ? null : request.getTelefone().trim();

        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setTelefone(telefone);

        if (validarSenha) {
            ValidationUtil.senhaValida(request.getSenha());
            usuario.setSenha(PasswordUtil.gerarHash(request.getSenha()));
        }

        return usuario;
    }
}

