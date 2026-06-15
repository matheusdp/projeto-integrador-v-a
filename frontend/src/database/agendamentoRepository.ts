import { getDatabase } from './database';
import { Agendamento } from '../types';

const SELECT_BASE = `
  SELECT a.*,
    c.nome AS clienteNome,
    c.telefone AS clienteTelefone,
    c.whatsapp AS clienteWhatsapp
  FROM agendamentos a
  JOIN clientes c ON a.clienteId = c.id
`;

function mapAgendamento(row: any): Agendamento {
  return { ...row, clienteWhatsapp: row.clienteWhatsapp === 1 };
}

export async function listarAgendamentos(): Promise<Agendamento[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`${SELECT_BASE} ORDER BY a.dataAtendimento DESC, a.horaAtendimento ASC`);
  return rows.map(mapAgendamento);
}

export async function listarAgendamentosDoDia(data: string): Promise<Agendamento[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `${SELECT_BASE} WHERE a.dataAtendimento = ? AND a.status = 'agendado' ORDER BY a.horaAtendimento ASC`,
    [data]
  );
  return rows.map(mapAgendamento);
}

export async function buscarAgendamentoPorId(id: number): Promise<Agendamento | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`${SELECT_BASE} WHERE a.id = ?`, [id]);
  return row ? mapAgendamento(row) : null;
}

export async function listarDiasComAgendamentos(ano: number, mes: number): Promise<Map<string, number>> {
  const db = await getDatabase();
  const mesStr = String(mes + 1).padStart(2, '0');
  const rows = await db.getAllAsync<{ dataAtendimento: string; count: number }>(
    `SELECT dataAtendimento, COUNT(*) AS count
     FROM agendamentos
     WHERE dataAtendimento LIKE ? AND status = 'agendado'
     GROUP BY dataAtendimento`,
    [`${ano}-${mesStr}-%`]
  );
  const mapa = new Map<string, number>();
  rows.forEach((r) => mapa.set(r.dataAtendimento, r.count));
  return mapa;
}

export async function verificarConflito(data: string, hora: string, excludeId?: number): Promise<boolean> {
  const db = await getDatabase();
  const query = excludeId
    ? "SELECT COUNT(*) AS count FROM agendamentos WHERE dataAtendimento = ? AND horaAtendimento = ? AND status = 'agendado' AND id != ?"
    : "SELECT COUNT(*) AS count FROM agendamentos WHERE dataAtendimento = ? AND horaAtendimento = ? AND status = 'agendado'";
  const params = excludeId ? [data, hora, excludeId] : [data, hora];
  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return (result?.count ?? 0) > 0;
}

export async function criarAgendamento(agendamento: Omit<Agendamento, 'id' | 'clienteNome' | 'clienteTelefone' | 'clienteWhatsapp'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO agendamentos (clienteId, dataAtendimento, horaAtendimento, servico, observacoes, status, valor) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [agendamento.clienteId, agendamento.dataAtendimento, agendamento.horaAtendimento, agendamento.servico, agendamento.observacoes ?? '', agendamento.status, agendamento.valor ?? 0]
  );
  return result.lastInsertRowId;
}

export async function atualizarAgendamento(id: number, agendamento: Omit<Agendamento, 'id' | 'clienteNome' | 'clienteTelefone' | 'clienteWhatsapp'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE agendamentos SET clienteId = ?, dataAtendimento = ?, horaAtendimento = ?, servico = ?, observacoes = ?, status = ?, valor = ? WHERE id = ?',
    [agendamento.clienteId, agendamento.dataAtendimento, agendamento.horaAtendimento, agendamento.servico, agendamento.observacoes ?? '', agendamento.status, agendamento.valor ?? 0, id]
  );
}

export async function atualizarStatus(id: number, status: Agendamento['status']): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE agendamentos SET status = ? WHERE id = ?', [status, id]);
}

export async function atualizarValor(id: number, valor: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE agendamentos SET valor = ? WHERE id = ?', [valor, id]);
}

export async function excluirAgendamento(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM agendamentos WHERE id = ?', [id]);
}
