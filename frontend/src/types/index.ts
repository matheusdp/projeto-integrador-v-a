export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  whatsapp?: boolean;
  endereco?: string;
}

export interface Agendamento {
  id: number;
  clienteId: number;
  clienteNome?: string;
  clienteTelefone?: string;
  clienteWhatsapp?: boolean;
  dataAtendimento: string;
  horaAtendimento: string;
  servico: string;
  observacoes?: string;
  status: 'agendado' | 'concluido' | 'cancelado';
  valor?: number;
}

export interface HistoricoAtendimento {
  id: number;
  clienteId: number;
  clienteNome?: string;
  agendamentoId: number;
  dataAtendimento: string;
  servicoRealizado: string;
  valor?: number;
}
