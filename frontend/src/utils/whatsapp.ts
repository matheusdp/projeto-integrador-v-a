import { Linking } from 'react-native';

export async function enviarConfirmacaoWhatsApp(
  telefone: string,
  nomeCliente: string,
  dataAtendimento: string,
  horaAtendimento: string,
  servico: string,
  nomeBarbearia: string
): Promise<void> {
  const numero = `55${telefone.replace(/\D/g, '')}`;
  const [ano, mes, dia] = dataAtendimento.split('-');
  const dataFormatada = `${dia}/${mes}/${ano}`;
  const local = nomeBarbearia ? `\n📍 ${nomeBarbearia}` : '';
  const mensagem =
    `Olá, ${nomeCliente}! ✂️\n\n` +
    `Seu agendamento está *confirmado*:\n` +
    `📅 *${dataFormatada}* às *${horaAtendimento}*\n` +
    `💈 ${servico}${local}\n\n` +
    `Te esperamos!`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  await Linking.openURL(url);
}
