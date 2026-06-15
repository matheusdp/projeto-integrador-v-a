import { getDatabase } from './database';
import { Cliente } from '../types';

type ClienteRow = Omit<Cliente, 'whatsapp'> & { whatsapp: number };

function mapCliente(row: ClienteRow): Cliente {
  return { ...row, whatsapp: row.whatsapp === 1, endereco: row.endereco ?? '' };
}

export async function listarClientes(): Promise<Cliente[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ClienteRow>('SELECT * FROM clientes ORDER BY nome ASC');
  return rows.map(mapCliente);
}

export async function buscarClientePorId(id: number): Promise<Cliente | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ClienteRow>('SELECT * FROM clientes WHERE id = ?', [id]);
  return row ? mapCliente(row) : null;
}

export async function criarCliente(cliente: Omit<Cliente, 'id'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO clientes (nome, telefone, email, dataCadastro, whatsapp, endereco) VALUES (?, ?, ?, ?, ?, ?)',
    [cliente.nome, cliente.telefone, cliente.email, cliente.dataCadastro, cliente.whatsapp ? 1 : 0, cliente.endereco ?? '']
  );
  return result.lastInsertRowId;
}

export async function atualizarCliente(id: number, dados: Omit<Cliente, 'id' | 'dataCadastro'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE clientes SET nome = ?, telefone = ?, email = ?, whatsapp = ?, endereco = ? WHERE id = ?',
    [dados.nome, dados.telefone, dados.email, dados.whatsapp ? 1 : 0, dados.endereco ?? '', id]
  );
}

export async function excluirCliente(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM clientes WHERE id = ?', [id]);
}
