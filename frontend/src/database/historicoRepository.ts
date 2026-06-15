import { getDatabase } from './database';
import { HistoricoAtendimento } from '../types';

export async function listarHistorico(): Promise<HistoricoAtendimento[]> {
  const db = await getDatabase();
  return db.getAllAsync<HistoricoAtendimento>(`
    SELECT h.*, c.nome AS clienteNome
    FROM historico_atendimentos h
    JOIN clientes c ON h.clienteId = c.id
    ORDER BY h.dataAtendimento DESC
  `);
}

export async function listarHistoricoPorCliente(clienteId: number): Promise<HistoricoAtendimento[]> {
  const db = await getDatabase();
  return db.getAllAsync<HistoricoAtendimento>(
    `SELECT h.*, c.nome AS clienteNome
     FROM historico_atendimentos h
     JOIN clientes c ON h.clienteId = c.id
     WHERE h.clienteId = ?
     ORDER BY h.dataAtendimento DESC`,
    [clienteId]
  );
}

export async function criarHistorico(historico: Omit<HistoricoAtendimento, 'id' | 'clienteNome'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO historico_atendimentos (clienteId, agendamentoId, dataAtendimento, servicoRealizado, valor) VALUES (?, ?, ?, ?, ?)',
    [historico.clienteId, historico.agendamentoId, historico.dataAtendimento, historico.servicoRealizado, historico.valor ?? 0]
  );
  return result.lastInsertRowId;
}

export async function excluirHistoricoPorAgendamento(agendamentoId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM historico_atendimentos WHERE agendamentoId = ?', [agendamentoId]);
}

function isoLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isoHaDias(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return isoLocal(d);
}

export async function contarPorPeriodo(diasAtras: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM historico_atendimentos WHERE dataAtendimento >= ?',
    [isoHaDias(diasAtras)]
  );
  return result?.count ?? 0;
}

export async function calcularFaturamento(diasAtras: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(valor), 0) AS total FROM historico_atendimentos WHERE dataAtendimento >= ?',
    [isoHaDias(diasAtras)]
  );
  return result?.total ?? 0;
}

export async function calcularFaturamentoPeriodo(inicio: string, fim: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(valor), 0) AS total FROM historico_atendimentos WHERE dataAtendimento >= ? AND dataAtendimento <= ?',
    [inicio, fim]
  );
  return result?.total ?? 0;
}
