import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { Agendamento } from '../types';
import {
  listarAgendamentos,
  concluirAgendamento,
  reabrirAgendamento,
  cancelarAgendamento,
  excluirAgendamento,
} from '../services/agendamentoService';
import { getConfiguracao } from '../database/configuracaoRepository';
import { enviarConfirmacaoWhatsApp } from '../utils/whatsapp';

// ── Helpers de data (sem UTC) ─────────────────────────────────────────────────

function isoLocal(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getFimSemana(): string {
  const d = new Date();
  d.setDate(d.getDate() + (6 - d.getDay()));
  return isoLocal(d);
}

function getFimProxSemana(): string {
  const d = new Date();
  d.setDate(d.getDate() + (6 - d.getDay()) + 7);
  return isoLocal(d);
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ── Agrupamento ───────────────────────────────────────────────────────────────

type GrupoKey = 'atrasados' | 'hoje' | 'semana' | 'proxima' | 'futuro' | 'concluidos' | 'cancelados';

const GRUPO_LABELS: Record<GrupoKey, string> = {
  atrasados: 'Atrasados',
  hoje: 'Hoje',
  semana: 'Esta Semana',
  proxima: 'Próxima Semana',
  futuro: 'Em Breve',
  concluidos: 'Concluídos',
  cancelados: 'Cancelados',
};

const GRUPO_ORDEM: GrupoKey[] = ['atrasados', 'hoje', 'semana', 'proxima', 'futuro', 'concluidos', 'cancelados'];

const GRUPOS_INICIALMENTE_ABERTOS: Set<GrupoKey> = new Set(['atrasados', 'hoje', 'semana']);

function classificar(ag: Agendamento, hoje: string, fimSemana: string, fimProxSemana: string): GrupoKey {
  if (ag.status === 'concluido') return 'concluidos';
  if (ag.status === 'cancelado') return 'cancelados';
  if (ag.dataAtendimento < hoje) return 'atrasados';
  if (ag.dataAtendimento === hoje) return 'hoje';
  if (ag.dataAtendimento <= fimSemana) return 'semana';
  if (ag.dataAtendimento <= fimProxSemana) return 'proxima';
  return 'futuro';
}

// ── Estilos ───────────────────────────────────────────────────────────────────

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    secaoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: c.bgSec,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    secaoHeaderEsq: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    secaoTitulo: { fontSize: 12, fontWeight: '700', color: c.textoSec, textTransform: 'uppercase', letterSpacing: 0.5 },
    secaoBadge: {
      backgroundColor: c.primariaSuave,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      minWidth: 22,
      alignItems: 'center',
    },
    secaoBadgeTexto: { fontSize: 11, color: c.primaria, fontWeight: '700' },
    card: {
      backgroundColor: c.card,
      marginHorizontal: 14,
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.borda,
    },
    cardDestaque: { borderColor: c.primaria, borderWidth: 2, backgroundColor: c.cardAlt },
    cardAtrasado: { borderLeftWidth: 3, borderLeftColor: c.perigo },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    dataHora: { fontSize: 13, color: c.textoSec, fontWeight: '500' },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeTexto: { fontSize: 12, fontWeight: '600' },
    nome: { fontSize: 16, fontWeight: '600', color: c.texto },
    servico: { fontSize: 13, color: c.textoSec, marginTop: 2 },
    obs: { fontSize: 12, color: c.textoSec, marginTop: 4, fontStyle: 'italic' },
    valorTexto: { fontSize: 13, color: c.sucesso, fontWeight: '600', marginTop: 4 },
    listaBottom: { height: 80 },
    vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    vazioTexto: { fontSize: 15, color: c.textoSec, marginTop: 12 },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primaria,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalCaixa: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
    modalTitulo: {
      fontSize: 13,
      color: c.textoSec,
      textAlign: 'center',
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    opcao: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    opcaoTexto: { fontSize: 15, color: c.texto },
    opcaoDestructive: { color: c.perigo },
    valorModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    valorModalCaixa: { backgroundColor: c.card, borderRadius: 16, padding: 24, width: '100%' },
    valorModalTitulo: { fontSize: 17, fontWeight: '700', color: c.texto, marginBottom: 6 },
    valorModalSub: { fontSize: 13, color: c.textoSec, marginBottom: 16 },
    valorInput: {
      backgroundColor: c.bgSec,
      borderWidth: 1,
      borderColor: c.borda,
      borderRadius: 10,
      padding: 14,
      fontSize: 22,
      fontWeight: '700',
      color: c.texto,
      textAlign: 'center',
      marginBottom: 16,
    },
    valorBtnRow: { flexDirection: 'row', gap: 10 },
    valorBtnCancelar: {
      flex: 1, padding: 14, borderRadius: 10, alignItems: 'center',
      backgroundColor: c.bgSec, borderWidth: 1, borderColor: c.borda,
    },
    valorBtnConfirmar: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: c.primaria },
    valorBtnCancelarTexto: { fontSize: 15, color: c.textoSec, fontWeight: '600' },
    valorBtnConfirmarTexto: { fontSize: 15, color: '#fff', fontWeight: '700' },
  });
}

const STATUS_COR: Record<string, keyof Cores> = {
  agendado: 'primaria',
  concluido: 'sucesso',
  cancelado: 'perigo',
};
const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

// ── Componente ────────────────────────────────────────────────────────────────

type Secao = { key: GrupoKey; titulo: string; data: ReadonlyArray<Agendamento>; total: number };

export default function AgendamentosScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const destaqueId: number | undefined = route.params?.destaqueId;
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(
    new Set<string>(GRUPOS_INICIALMENTE_ABERTOS)
  );
  const [itemSelecionado, setItemSelecionado] = useState<Agendamento | null>(null);
  const [modalOpcoes, setModalOpcoes] = useState(false);
  const [modalValor, setModalValor] = useState(false);
  const [valorInput, setValorInput] = useState('');
  const sectionListRef = useRef<SectionList<Agendamento>>(null);

  const hoje = useMemo(() => isoLocal(), []);
  const fimSemana = useMemo(() => getFimSemana(), []);
  const fimProxSemana = useMemo(() => getFimProxSemana(), []);

  const recarregar = useCallback(() => { listarAgendamentos().then(setAgendamentos); }, []);
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  // Quando há destaqueId, garante que a seção correspondente esteja aberta
  useEffect(() => {
    if (!destaqueId || agendamentos.length === 0) return;
    const ag = agendamentos.find((a) => a.id === destaqueId);
    if (!ag) return;
    const grupoKey = classificar(ag, hoje, fimSemana, fimProxSemana);
    setSecoesAbertas((prev) => {
      if (prev.has(grupoKey)) return prev;
      const novo = new Set(prev);
      novo.add(grupoKey);
      return novo;
    });
  }, [destaqueId, agendamentos]);

  const sections: Secao[] = useMemo(() => {
    const grupos: Record<string, Agendamento[]> = {
      atrasados: [], hoje: [], semana: [], proxima: [], futuro: [], concluidos: [], cancelados: [],
    };
    for (const ag of agendamentos) {
      grupos[classificar(ag, hoje, fimSemana, fimProxSemana)].push(ag);
    }
    return GRUPO_ORDEM
      .filter((k) => grupos[k].length > 0)
      .map((k) => ({
        key: k as GrupoKey,
        titulo: GRUPO_LABELS[k as GrupoKey],
        data: secoesAbertas.has(k) ? grupos[k] : [],
        total: grupos[k].length,
      }));
  }, [agendamentos, secoesAbertas, hoje, fimSemana, fimProxSemana]);

  // Rola até o item destacado após as seções serem atualizadas
  useEffect(() => {
    if (!destaqueId || sections.length === 0) return;
    for (let si = 0; si < sections.length; si++) {
      const ii = sections[si].data.findIndex((a) => a.id === destaqueId);
      if (ii !== -1) {
        const t = setTimeout(() => {
          try {
            sectionListRef.current?.scrollToLocation({ sectionIndex: si, itemIndex: ii, animated: true, viewPosition: 0.3 });
          } catch {}
        }, 350);
        return () => clearTimeout(t);
      }
    }
  }, [destaqueId, sections]);

  function toggleSecao(chave: string) {
    setSecoesAbertas((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  function abrirOpcoes(item: Agendamento) { setItemSelecionado(item); setModalOpcoes(true); }
  function fecharOpcoes() { setModalOpcoes(false); setItemSelecionado(null); }

  async function handleConcluir() {
    setModalOpcoes(false); // mantém itemSelecionado para o modal de valor
    setValorInput('');
    setModalValor(true);
  }

  async function confirmarConclusao() {
    if (!itemSelecionado) return;
    const valor = parseFloat(valorInput.replace(',', '.')) || 0;
    await concluirAgendamento(itemSelecionado.id, valor);
    setModalValor(false);
    setItemSelecionado(null);
    recarregar();
  }

  async function handleReabrir() {
    if (!itemSelecionado) return;
    const id = itemSelecionado.id;
    fecharOpcoes();
    Alert.alert(
      'Reabrir Agendamento',
      'O agendamento voltará ao status "Agendado" e o registro do histórico será removido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reabrir', onPress: async () => { await reabrirAgendamento(id); recarregar(); } },
      ]
    );
  }

  async function handleCancelar() {
    if (!itemSelecionado) return;
    const id = itemSelecionado.id;
    fecharOpcoes();
    await cancelarAgendamento(id);
    recarregar();
  }

  async function handleWhatsApp() {
    if (!itemSelecionado) return;
    const item = itemSelecionado; // captura antes de fechar
    fecharOpcoes();
    try {
      const barbearia = (await getConfiguracao('perfil_barbearia')) ?? '';
      await enviarConfirmacaoWhatsApp(
        item.clienteTelefone ?? '',
        item.clienteNome ?? '',
        item.dataAtendimento,
        item.horaAtendimento,
        item.servico,
        barbearia
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  }

  async function handleExcluir() {
    if (!itemSelecionado) return;
    const id = itemSelecionado.id;
    fecharOpcoes();
    Alert.alert('Excluir Agendamento', 'Deseja excluir este agendamento permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await excluirAgendamento(id); recarregar(); } },
    ]);
  }

  function renderSecaoHeader({ section }: { section: Secao }) {
    const aberta = secoesAbertas.has(section.key);
    const isAtrasado = section.key === 'atrasados';
    return (
      <TouchableOpacity style={s.secaoHeader} onPress={() => toggleSecao(section.key)} activeOpacity={0.8}>
        <View style={s.secaoHeaderEsq}>
          {isAtrasado && <Ionicons name="alert-circle" size={14} color={cores.perigo} />}
          <Text style={[s.secaoTitulo, isAtrasado && { color: cores.perigo }]}>{section.titulo}</Text>
          <View style={s.secaoBadge}>
            <Text style={s.secaoBadgeTexto}>{section.total}</Text>
          </View>
        </View>
        <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color={cores.textoSec} />
      </TouchableOpacity>
    );
  }

  function renderItem({ item }: { item: Agendamento }) {
    const corStatus = cores[STATUS_COR[item.status]] as string;
    const ehDestaque = item.id === destaqueId;
    const ehAtrasado = item.status === 'agendado' && item.dataAtendimento < hoje;
    return (
        <TouchableOpacity
            style={[s.card, ehDestaque && s.cardDestaque, ehAtrasado && !ehDestaque && s.cardAtrasado]}
            onPress={() => abrirOpcoes(item)}
            activeOpacity={0.8}
        >
          <View style={s.cardHeader}>
            <Text style={s.dataHora}>{formatarData(item.dataAtendimento)}  {item.horaAtendimento}</Text>
            <View style={[s.badge, { backgroundColor: corStatus + '22' }]}>
              <Text style={[s.badgeTexto, { color: corStatus }]}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
          <Text style={s.nome}>{item.clienteNome}</Text>
          <Text style={s.servico}>{item.servico}</Text>
          {item.observacoes ? <Text style={s.obs}>{item.observacoes}</Text> : null}
          {item.valor != null && item.valor > 0 && (
              <Text style={s.valorTexto}>R$ {item.valor.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      {agendamentos.length === 0 ? (
        <View style={s.vazio}>
          <Ionicons name="calendar-outline" size={56} color={cores.borda} />
          <Text style={s.vazioTexto}>Nenhum agendamento cadastrado.</Text>
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={renderSecaoHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled
          ListFooterComponent={<View style={s.listaBottom} />}
          onScrollToIndexFailed={() => {}}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AgendamentoForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal de opções */}
      <Modal visible={modalOpcoes} transparent animationType="slide" onRequestClose={fecharOpcoes}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={fecharOpcoes}>
          <View style={s.modalCaixa}>
            <Text style={s.modalTitulo}>
              {itemSelecionado?.clienteNome} — {itemSelecionado ? formatarData(itemSelecionado.dataAtendimento) : ''}
            </Text>

            {itemSelecionado?.status === 'agendado' && (
              <>
                <TouchableOpacity style={s.opcao} onPress={() => {
                  fecharOpcoes();
                  navigation.navigate('AgendamentoForm', { agendamentoId: itemSelecionado?.id });
                }}>
                  <Ionicons name="pencil-outline" size={20} color={cores.primaria} />
                  <Text style={s.opcaoTexto}>Editar</Text>
                </TouchableOpacity>
                {itemSelecionado?.clienteWhatsapp && (
                  <TouchableOpacity style={s.opcao} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={20} color={cores.whatsapp} />
                    <Text style={s.opcaoTexto}>Enviar Confirmação WhatsApp</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.opcao} onPress={handleConcluir}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={cores.sucesso} />
                  <Text style={s.opcaoTexto}>Marcar como Concluído</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.opcao} onPress={handleCancelar}>
                  <Ionicons name="close-circle-outline" size={20} color={cores.perigo} />
                  <Text style={[s.opcaoTexto, s.opcaoDestructive]}>Cancelar Atendimento</Text>
                </TouchableOpacity>
              </>
            )}

            {itemSelecionado?.status === 'concluido' && (
              <TouchableOpacity style={s.opcao} onPress={handleReabrir}>
                <Ionicons name="refresh-circle-outline" size={20} color={cores.aviso} />
                <Text style={s.opcaoTexto}>Reabrir Agendamento</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.opcao} onPress={handleExcluir}>
              <Ionicons name="trash-outline" size={20} color={cores.perigo} />
              <Text style={[s.opcaoTexto, s.opcaoDestructive]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de valor ao concluir */}
      <Modal
        visible={modalValor}
        transparent
        animationType="fade"
        onRequestClose={() => { setModalValor(false); setItemSelecionado(null); }}
      >
        <View style={s.valorModalBg}>
          <View style={s.valorModalCaixa}>
            <Text style={s.valorModalTitulo}>Valor do Atendimento</Text>
            <Text style={s.valorModalSub}>Informe o valor recebido (opcional)</Text>
            <TextInput
              style={s.valorInput}
              value={valorInput}
              onChangeText={setValorInput}
              placeholder="0,00"
              placeholderTextColor={cores.textoSec}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={s.valorBtnRow}>
              <TouchableOpacity
                style={s.valorBtnCancelar}
                onPress={() => { setModalValor(false); setItemSelecionado(null); }}
              >
                <Text style={s.valorBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.valorBtnConfirmar} onPress={confirmarConclusao}>
                <Text style={s.valorBtnConfirmarTexto}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
