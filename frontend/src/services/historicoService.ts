import * as repo from '../database/historicoRepository';
import { HistoricoAtendimento } from '../types';

export async function listarHistorico(): Promise<HistoricoAtendimento[]> {
  return repo.listarHistorico();
}

export async function listarHistoricoPorCliente(clienteId: number): Promise<HistoricoAtendimento[]> {
  return repo.listarHistoricoPorCliente(clienteId);
}
