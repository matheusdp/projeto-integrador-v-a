import * as repo from '../database/agendamentoRepository';
import * as historicoRepo from '../database/historicoRepository';
import { Agendamento } from '../types';

export async function listarAgendamentos(): Promise<Agendamento[]> {
  return repo.listarAgendamentos();
}

export async function listarAgendamentosDoDia(data: string): Promise<Agendamento[]> {
  return repo.listarAgendamentosDoDia(data);
}

export async function listarDiasComAgendamentos(ano: number, mes: number): Promise<Map<string, number>> {
  return repo.listarDiasComAgendamentos(ano, mes);
}

export async function buscarAgendamento(id: number): Promise<Agendamento | null> {
  return repo.buscarAgendamentoPorId(id);
}

export async function criarAgendamento(dados: {
  clienteId: number;
  dataAtendimento: string;
  horaAtendimento: string;
  servico: string;
  observacoes?: string;
}): Promise<number> {
  if (!dados.servico.trim()) throw new Error('Serviço é obrigatório.');
  const conflito = await repo.verificarConflito(dados.dataAtendimento, dados.horaAtendimento);
  if (conflito) throw new Error('Já existe um agendamento para este horário.');
  return repo.criarAgendamento({ ...dados, status: 'agendado', observacoes: dados.observacoes ?? '', valor: 0 });
}

export async function atualizarAgendamento(id: number, dados: {
  clienteId: number;
  dataAtendimento: string;
  horaAtendimento: string;
  servico: string;
  observacoes?: string;
}): Promise<void> {
  if (!dados.servico.trim()) throw new Error('Serviço é obrigatório.');
  const conflito = await repo.verificarConflito(dados.dataAtendimento, dados.horaAtendimento, id);
  if (conflito) throw new Error('Já existe um agendamento para este horário.');
  const atual = await repo.buscarAgendamentoPorId(id);
  if (!atual) throw new Error('Agendamento não encontrado.');
  return repo.atualizarAgendamento(id, { ...dados, status: atual.status, observacoes: dados.observacoes ?? '', valor: atual.valor ?? 0 });
}

export async function concluirAgendamento(id: number, valor: number = 0): Promise<void> {
  const agendamento = await repo.buscarAgendamentoPorId(id);
  if (!agendamento) throw new Error('Agendamento não encontrado.');
  await repo.atualizarStatus(id, 'concluido');
  await repo.atualizarValor(id, valor);
  await historicoRepo.criarHistorico({
    clienteId: agendamento.clienteId,
    agendamentoId: id,
    dataAtendimento: agendamento.dataAtendimento,
    servicoRealizado: agendamento.servico,
    valor,
  });
}

export async function reabrirAgendamento(id: number): Promise<void> {
  await repo.atualizarStatus(id, 'agendado');
  await repo.atualizarValor(id, 0);
  await historicoRepo.excluirHistoricoPorAgendamento(id);
}

export async function cancelarAgendamento(id: number): Promise<void> {
  return repo.atualizarStatus(id, 'cancelado');
}

export async function excluirAgendamento(id: number): Promise<void> {
  return repo.excluirAgendamento(id);
}
