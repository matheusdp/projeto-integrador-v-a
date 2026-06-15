import * as repo from '../database/clienteRepository';
import { Cliente } from '../types';

export async function listarClientes(): Promise<Cliente[]> {
  return repo.listarClientes();
}

export async function buscarCliente(id: number): Promise<Cliente | null> {
  return repo.buscarClientePorId(id);
}

export async function criarCliente(dados: {
  nome: string;
  telefone: string;
  email: string;
  whatsapp?: boolean;
  endereco?: string;
}): Promise<number> {
  if (!dados.nome.trim()) throw new Error('Nome é obrigatório.');
  const digitos = dados.telefone.replace(/\D/g, '');
  if (digitos.length < 10) throw new Error('Telefone inválido. Informe DDD + número completo.');
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    throw new Error('E-mail inválido.');
  }
  const dataCadastro = new Date().toISOString().split('T')[0];
  return repo.criarCliente({ ...dados, dataCadastro, whatsapp: dados.whatsapp ?? false, endereco: dados.endereco ?? '' });
}

export async function atualizarCliente(id: number, dados: {
  nome: string;
  telefone: string;
  email: string;
  whatsapp?: boolean;
  endereco?: string;
}): Promise<void> {
  if (!dados.nome.trim()) throw new Error('Nome é obrigatório.');
  const digitos = dados.telefone.replace(/\D/g, '');
  if (digitos.length < 10) throw new Error('Telefone inválido. Informe DDD + número completo.');
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    throw new Error('E-mail inválido.');
  }
  return repo.atualizarCliente(id, { ...dados, whatsapp: dados.whatsapp ?? false, endereco: dados.endereco ?? '' });
}

export async function excluirCliente(id: number): Promise<void> {
  return repo.excluirCliente(id);
}
