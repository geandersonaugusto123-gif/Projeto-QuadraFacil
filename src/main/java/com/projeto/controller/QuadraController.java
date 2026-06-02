package com.projeto.controller;

import com.projeto.dao.QuadraDAO;
import com.projeto.dto.ApiResponse;
import com.projeto.dto.QuadraRequest;
import com.projeto.enums.StatusQuadra;
import com.projeto.enums.TipoQuadra;
import com.projeto.exception.RecursoNaoEncontradoException;
import com.projeto.model.Quadra;
import com.projeto.util.HttpUtil;
import com.projeto.util.ValidationUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "QuadraController", urlPatterns = {"/api/quadras/*"})
public class QuadraController extends BaseServlet {
    private final QuadraDAO quadraDAO = new QuadraDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);

            if (partes.length == 0) {
                enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Quadras listadas com sucesso.", quadraDAO.listar()));
                return;
            }

            Integer id = HttpUtil.parseId(partes[0], "Id da quadra");
            Quadra quadra = quadraDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Quadra nao encontrada."));

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Quadra encontrada.", quadra));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            QuadraRequest quadraRequest = lerJson(request, QuadraRequest.class);
            Quadra quadra = montarQuadra(quadraRequest, null);
            Quadra cadastrada = quadraDAO.cadastrar(quadra);

            enviar(response, HttpServletResponse.SC_CREATED, ApiResponse.success("Quadra cadastrada com sucesso.", cadastrada));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id da quadra na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id da quadra");
            quadraDAO.buscarPorId(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Quadra nao encontrada."));

            QuadraRequest quadraRequest = lerJson(request, QuadraRequest.class);
            Quadra quadra = montarQuadra(quadraRequest, id);
            Quadra atualizada = quadraDAO.atualizar(quadra);

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Quadra atualizada com sucesso.", atualizada));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            String[] partes = HttpUtil.getPathParts(request);
            if (partes.length == 0) {
                throw new RecursoNaoEncontradoException("Informe o id da quadra na URL.");
            }

            Integer id = HttpUtil.parseId(partes[0], "Id da quadra");
            if (!quadraDAO.excluir(id)) {
                throw new RecursoNaoEncontradoException("Quadra nao encontrada.");
            }

            enviar(response, HttpServletResponse.SC_OK, ApiResponse.success("Quadra excluida com sucesso."));
        } catch (Exception ex) {
            tratarErro(response, ex);
        }
    }

    private Quadra montarQuadra(QuadraRequest request, Integer id) {
        Quadra quadra = new Quadra();
        quadra.setId(id);
        quadra.setNome(ValidationUtil.textoObrigatorio(request.getNome(), "Nome"));
        quadra.setTipo(TipoQuadra.fromString(request.getTipo()));
        quadra.setDescricao(request.getDescricao() == null ? null : request.getDescricao().trim());
        ValidationUtil.precoValido(request.getPrecoHora());
        quadra.setPrecoHora(request.getPrecoHora());
        quadra.setStatus(StatusQuadra.fromString(request.getStatus()));
        return quadra;
    }
}

