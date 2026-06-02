-- Senhas para teste:
-- admin@quadras.com.br / admin123
-- joao@email.com / senha123

INSERT INTO usuarios (nome, email, senha, telefone)
VALUES
    ('Administrador', 'admin@quadras.com.br', 'pbkdf2_sha256$65536$YWRtaW4tZGVtby1zYWx0LTAx$jlsdK717VHCmLdDIeDMSZUfhCehQiNrDeiOwiKYge7U=', '(11) 99999-0000'),
    ('Joao Silva', 'joao@email.com', 'pbkdf2_sha256$65536$dXN1YXJpby1kZW1vLXNhbHQtMDI=$KGNFxRAIdlJBe37rxW8LGX+i6kuNNaytfwdYfQ1OYXA=', '(11) 98888-1111');

INSERT INTO quadras (nome, tipo, descricao, preco_hora, status)
VALUES
    ('Quadra Futsal Principal', 'FUTSAL', 'Quadra coberta com piso oficial.', 120.00, 'DISPONIVEL'),
    ('Campo Society 1', 'SOCIETY', 'Campo de grama sintetica para ate 14 jogadores.', 180.00, 'DISPONIVEL'),
    ('Quadra de Tenis A', 'TENIS', 'Quadra rapida com iluminacao noturna.', 90.00, 'MANUTENCAO');

INSERT INTO agendamentos (usuario_id, quadra_id, data_agendamento, hora_inicio, hora_fim, status, observacoes)
VALUES
    (2, 1, CURRENT_DATE + INTERVAL '1 day', '18:00', '19:00', 'CONFIRMADO', 'Reserva de teste para demonstracao.'),
    (2, 2, CURRENT_DATE + INTERVAL '2 days', '20:00', '21:00', 'PENDENTE', 'Aguardando confirmacao.');
