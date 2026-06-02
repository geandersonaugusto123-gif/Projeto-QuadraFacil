-- Execute este script conectado ao banco agendamento_quadras_db.

DROP TABLE IF EXISTS agendamentos;
DROP TABLE IF EXISTS quadras;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuarios_nome CHECK (LENGTH(TRIM(nome)) >= 3),
    CONSTRAINT chk_usuarios_email CHECK (email LIKE '%@%.%'),
    CONSTRAINT chk_usuarios_senha CHECK (LENGTH(senha) >= 6)
);

CREATE UNIQUE INDEX uk_usuarios_email_lower
ON usuarios (LOWER(email));

CREATE TABLE quadras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descricao TEXT,
    preco_hora NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',

    CONSTRAINT chk_quadras_tipo CHECK (
        tipo IN ('FUTSAL', 'SOCIETY', 'BASQUETE', 'VOLEI', 'TENIS')
    ),

    CONSTRAINT chk_quadras_status CHECK (
        status IN ('DISPONIVEL', 'INDISPONIVEL', 'MANUTENCAO')
    ),

    CONSTRAINT chk_quadras_preco CHECK (preco_hora >= 0)
);

CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    quadra_id INTEGER NOT NULL,
    data_agendamento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    observacoes TEXT,

    CONSTRAINT fk_agendamentos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_agendamentos_quadra
        FOREIGN KEY (quadra_id)
        REFERENCES quadras(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_agendamentos_status CHECK (
        status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'FINALIZADO')
    ),

    CONSTRAINT chk_agendamentos_horario CHECK (hora_fim > hora_inicio)
);
-- Evita duplicidade exata de agendamentos ativos.
-- A validacao completa de sobreposicao de horarios tambem e feita no DAO,
-- pois precisa comparar intervalos parcialmente cruzados.

CREATE UNIQUE INDEX uk_agendamento_mesma_faixa_ativa
ON agendamentos (quadra_id, data_agendamento, hora_inicio, hora_fim)
WHERE status <> 'CANCELADO';

CREATE INDEX idx_agendamentos_usuario
ON agendamentos (usuario_id);

CREATE INDEX idx_agendamentos_quadra_data
ON agendamentos (quadra_id, data_agendamento);
