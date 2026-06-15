import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('barber.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT DEFAULT '',
      dataCadastro TEXT NOT NULL,
      whatsapp INTEGER DEFAULT 0,
      endereco TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL,
      dataAtendimento TEXT NOT NULL,
      horaAtendimento TEXT NOT NULL,
      servico TEXT NOT NULL,
      observacoes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'agendado',
      valor REAL DEFAULT 0,
      FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historico_atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL,
      agendamentoId INTEGER NOT NULL,
      dataAtendimento TEXT NOT NULL,
      servicoRealizado TEXT NOT NULL,
      valor REAL DEFAULT 0,
      FOREIGN KEY (clienteId) REFERENCES clientes(id),
      FOREIGN KEY (agendamentoId) REFERENCES agendamentos(id)
    );
  `);

  const migrations = [
    'ALTER TABLE clientes ADD COLUMN whatsapp INTEGER DEFAULT 0',
    'ALTER TABLE clientes ADD COLUMN endereco TEXT DEFAULT \'\'',
    'ALTER TABLE agendamentos ADD COLUMN valor REAL DEFAULT 0',
    'ALTER TABLE historico_atendimentos ADD COLUMN valor REAL DEFAULT 0',
  ];
  for (const sql of migrations) {
    try { await db.runAsync(sql); } catch {}
  }

  return db;
}
