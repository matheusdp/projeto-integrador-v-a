-- Barber Scheduler — SQLite Schema
-- Banco de dados local em: barber.db
-- Criado e migrado automaticamente por frontend/src/database/database.ts na inicialização do app.

PRAGMA journal_mode = WAL;

-- Configurações gerais do app (chave/valor)
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
  -- Valores usados:
  -- 'tema'             → 'claro' | 'escuro'
  -- 'perfil_nome'      → nome do barbeiro
  -- 'perfil_barbearia' → nome da barbearia
);

-- Clientes cadastrados
CREATE TABLE IF NOT EXISTS clientes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  telefone    TEXT    NOT NULL,
  email       TEXT    DEFAULT '',
  dataCadastro TEXT   NOT NULL,           -- 'YYYY-MM-DD'
  whatsapp    INTEGER DEFAULT 0,          -- 0 = não, 1 = sim
  endereco    TEXT    DEFAULT ''
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  clienteId        INTEGER NOT NULL,
  dataAtendimento  TEXT    NOT NULL,      -- 'YYYY-MM-DD'
  horaAtendimento  TEXT    NOT NULL,      -- 'HH:MM'
  servico          TEXT    NOT NULL,      -- serviços separados por vírgula
  observacoes      TEXT    DEFAULT '',
  status           TEXT    NOT NULL DEFAULT 'agendado',
                                          -- 'agendado' | 'concluido' | 'cancelado'
  valor            REAL    DEFAULT 0,     -- valor recebido ao concluir
  FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Histórico de atendimentos concluídos
CREATE TABLE IF NOT EXISTS historico_atendimentos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  clienteId        INTEGER NOT NULL,
  agendamentoId    INTEGER NOT NULL,
  dataAtendimento  TEXT    NOT NULL,      -- 'YYYY-MM-DD'
  servicoRealizado TEXT    NOT NULL,
  valor            REAL    DEFAULT 0,
  FOREIGN KEY (clienteId)     REFERENCES clientes(id),
  FOREIGN KEY (agendamentoId) REFERENCES agendamentos(id)
);
