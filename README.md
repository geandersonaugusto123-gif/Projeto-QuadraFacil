# AgendamentoQuadrasBackend

Backend Java Web manual para agendamento de quadras esportivas.

## Tecnologias usadas

- Java Web tradicional
- Maven
- GlassFish compatível com Jakarta EE / Servlet 6 Jakarta Servlet API 6.0
- Servlets manuais com `HttpServlet`
- JDBC manual com `Connection`, `PreparedStatement` e `ResultSet`
- PostgreSQL
- Gson apenas para converter JSON

Nao foram usados Spring Boot, Hibernate, JPA, Docker, Swagger, Lombok ou frameworks REST automaticos.

## Nome do banco

Banco escolhido: `agendamento_quadras_db`.

O nome foi escolhido porque descreve diretamente o dominio do sistema, usa letras minusculas e underscore, que e um padrao seguro e simples no PostgreSQL.

## Como configurar o banco

No pgAdmin ou no `psql`, execute os scripts nesta ordem:

1. `src/main/resources/sql/01_create_database.sql`
2. Conecte no banco `agendamento_quadras_db`
3. `src/main/resources/sql/02_create_tables.sql`
4. `src/main/resources/sql/03_insert_test_data.sql`

Depois confira o arquivo `src/main/resources/db.properties`:

```properties
db.url=jdbc:postgresql://localhost:5432/agendamento_quadras_db
db.user=postgres
db.password=postgres
```

Se a senha do PostgreSQL local for diferente, altere `db.password`.

## Como executar no NetBeans

1. Abra o NetBeans.
2. Use `File > Open Project`.
3. Abra a pasta `C:\Users\geand\OneDrive\Documentos\NetBeansProjects\AgendamentoQuadrasBackend`.
4. Clique com o botao direito no projeto e escolha `Clean and Build`.
5. Configure um servidor GlassFish compatível com Jakarta EE / Servlet 6.
6. Clique com o botão direito no projeto e selecione `Clean and Build`.
7. Em seguida, execute o projeto.

URL esperada:

```text
http://localhost:8080/AgendamentoQuadrasBackend/
```

O arquivo gerado pelo build fica em:

```text
target/AgendamentoQuadrasBackend.war
```

## Padrao de resposta JSON

Todas as rotas retornam o mesmo formato:

```json
{
  "success": true,
  "message": "Mensagem clara da operacao.",
  "data": {}
}
```

Em erros:

```json
{
  "success": false,
  "message": "Descricao do erro.",
  "errors": ["Descricao do erro."]
}
```

## Rotas principais

Base URL:

```text
/AgendamentoQuadrasBackend/api
```

### Usuarios

- `GET /usuarios` - lista usuarios
- `GET /usuarios/{id}` - busca usuario por id
- `POST /usuarios` - cadastra usuario
- `PUT /usuarios/{id}` - atualiza perfil
- `DELETE /usuarios/{id}` - exclui usuario, se nao houver agendamentos vinculados
- `POST /login` - autentica usuario

### Quadras

- `GET /quadras` - lista quadras
- `GET /quadras/{id}` - busca quadra por id
- `POST /quadras` - cadastra quadra
- `PUT /quadras/{id}` - atualiza quadra
- `DELETE /quadras/{id}` - exclui quadra, se nao houver agendamentos vinculados

### Agendamentos

- `GET /agendamentos` - lista agendamentos
- `GET /agendamentos/{id}` - busca agendamento por id
- `GET /agendamentos?usuarioId=1` - filtra por usuario
- `GET /agendamentos?quadraId=1&data=2026-06-01` - filtra por quadra e data
- `POST /agendamentos` - cria agendamento
- `PUT /agendamentos/{id}` - atualiza agendamento
- `PUT /agendamentos/{id}/status` - altera status
- `PUT /agendamentos/{id}/cancelar` - cancela agendamento
- `DELETE /agendamentos/{id}` - cancela agendamento
- `GET /agendamentos/disponiveis?quadraId=1&data=2026-06-01` - lista horarios livres

## Exemplos de JSON

Cadastrar usuario:

```json
{
  "nome": "Maria Souza",
  "email": "maria@email.com",
  "senha": "123456",
  "telefone": "(11) 97777-2222"
}
```

Cadastrar quadra:

```json
{
  "nome": "Quadra Volei 1",
  "tipo": "VOLEI",
  "descricao": "Quadra coberta para jogos noturnos.",
  "precoHora": 100.00,
  "status": "DISPONIVEL"
}
```

Criar agendamento:

```json
{
  "usuarioId": 1,
  "quadraId": 1,
  "dataAgendamento": "2026-06-01",
  "horaInicio": "18:00",
  "horaFim": "19:00",
  "observacoes": "Reserva para jogo entre amigos."
}
```

Alterar status:

```json
{
  "status": "CONFIRMADO"
}
```

## Fluxo MVC simples

1. O frontend envia uma requisicao HTTP para uma Servlet em `controller`.
2. A Servlet le o JSON, valida os dados e chama o DAO correto.
3. O DAO abre uma conexao JDBC pela `ConnectionFactory`.
4. O DAO executa SQL com `PreparedStatement`.
5. O resultado vem pelo `ResultSet` e e convertido em `model`.
6. A Servlet devolve uma resposta JSON padronizada.

## Regras implementadas

- Email unico.
- Senha com minimo de 6 caracteres.
- Senha armazenada com hash PBKDF2.
- Datas no passado sao rejeitadas.
- Hora final deve ser maior que hora inicial.
- Horario de funcionamento: 08:00 ate 22:00.
- Uma quadra indisponivel ou em manutencao nao aceita novos agendamentos.
- Dois agendamentos ativos nao podem ocupar o mesmo horario da mesma quadra.
- Cancelamento altera o status para `CANCELADO`.

## Dados de teste

Usuarios inseridos pelo script `03_insert_test_data.sql`:

- `admin@quadras.com.br` / `admin123`
- `joao@email.com` / `senha123`

## Observacao de ambiente

Observação: o arquivo `db.properties` deve ser ajustado de acordo com a senha local do PostgreSQL de quem for executar o projeto. Por segurança, a senha real do ambiente local não deve ser exposta publicamente no repositório.
