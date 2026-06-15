import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { HistoricoAtendimento, Cliente } from '../types';
import { listarHistorico, listarHistoricoPorCliente } from '../services/historicoService';
import { listarClientes } from '../services/clienteService';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

type Secao = { titulo: string; data: HistoricoAtendimento[] };

function agruparPorMes(lista: HistoricoAtendimento[]): Secao[] {
  const mapa = new Map<string, Secao>();
  for (const item of lista) {
    const [ano, mes] = item.dataAtendimento.split('-');
    const chave = `${ano}-${mes}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, { titulo: `${MESES[parseInt(mes) - 1]} de ${ano}`, data: [] });
    }
    mapa.get(chave)!.data.push(item);
  }
  return Array.from(mapa.values());
}

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function tempoRelativo(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const dataItem = new Date(ano, mes - 1, dia);
  const dataHoje = new Date();
  dataHoje.setHours(0, 0, 0, 0);
  const diff = Math.round((dataHoje.getTime() - dataItem.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff > 1 && diff < 7) return `${diff}d atrás`;
  if (diff >= 7 && diff < 30) return `${Math.floor(diff / 7)}sem`;
  return '';
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    statsBar: {
      flexDirection: 'row',
      backgroundColor: c.primaria,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValor: { fontSize: 18, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    statDivisor: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },

    // Filtro — dropdown style
    filtroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
      backgroundColor: c.bg,
    },
    filtroBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borda,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    filtroBtnTexto: {
      flex: 1,
      fontSize: 14,
      color: c.texto,
      fontWeight: '500',
    },
    filtroLimpar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borda,
      backgroundColor: c.card,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Modal de filtro
    filtroModalBg: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    filtroModalCaixa: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '72%',
    },
    filtroModalTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    filtroModalTitulo: {
      fontSize: 16,
      fontWeight: '700',
      color: c.texto,
    },
    filtroItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    filtroItemTexto: {
      flex: 1,
      fontSize: 15,
      color: c.texto,
    },
    filtroItemTextoAtivo: {
      color: c.primaria,
      fontWeight: '600',
    },

    // Lista
    lista: { paddingHorizontal: 16, paddingBottom: 24 },
    secaoTitulo: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSec,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 16,
      marginBottom: 8,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.borda,
      overflow: 'hidden',
    },
    cardEsq: {
      width: 64,
      backgroundColor: c.primariaSuave,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRightWidth: 1,
      borderRightColor: c.borda,
    },
    cardDia: { fontSize: 15, fontWeight: '700', color: c.primaria },
    cardRel: { fontSize: 11, color: c.textoSec, marginTop: 2 },
    cardDir: { flex: 1, padding: 12 },
    cardNome: { fontSize: 15, fontWeight: '600', color: c.texto },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tag: { backgroundColor: c.cardAlt, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    tagTexto: { fontSize: 12, color: c.primaria, fontWeight: '500' },
    valorTexto: { fontSize: 13, color: c.sucesso, fontWeight: '600', marginTop: 4 },
    vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    vazioTexto: { fontSize: 15, color: c.textoSec },
  });
}

export default function HistoricoScreen() {
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);

  const [todoHistorico, setTodoHistorico] = useState<HistoricoAtendimento[]>([]);
  const [historico, setHistorico] = useState<HistoricoAtendimento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<number | null>(null);
  const [showFiltroModal, setShowFiltroModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listarHistorico(), listarClientes()]).then(([hist, cli]) => {
        setTodoHistorico(hist);
        setHistorico(hist);
        setClientes(cli);
        setFiltro(null);
      });
    }, [])
  );

  const aplicarFiltro = async (clienteId: number | null) => {
    setFiltro(clienteId);
    setHistorico(clienteId === null ? todoHistorico : await listarHistoricoPorCliente(clienteId));
  };

  const stats = useMemo(() => {
    if (todoHistorico.length === 0) return { total: 0, favorito: '—', totalClientes: 0 };
    const contagem = new Map<string, number>();
    todoHistorico.forEach((h) => {
      h.servicoRealizado.split(',').forEach((sv) => {
        const k = sv.trim();
        if (k) contagem.set(k, (contagem.get(k) ?? 0) + 1);
      });
    });
    let favorito = '—';
    let maxN = 0;
    contagem.forEach((n, sv) => { if (n > maxN) { maxN = n; favorito = sv; } });
    return { total: todoHistorico.length, favorito, totalClientes: clientes.length };
  }, [todoHistorico, clientes]);

  const secoes = useMemo(() => agruparPorMes(historico), [historico]);

  const nomeClienteFiltrado = filtro !== null
    ? (clientes.find((c) => c.id === filtro)?.nome ?? '—')
    : null;

  return (
    <View style={s.container}>
      {todoHistorico.length > 0 && (
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statValor}>{stats.total}</Text>
            <Text style={s.statLabel}>Atendimentos</Text>
          </View>
          <View style={s.statDivisor} />
          <View style={s.statItem}>
            <Text style={s.statValor} numberOfLines={1}>{stats.favorito}</Text>
            <Text style={s.statLabel}>Serviço + pedido</Text>
          </View>
          <View style={s.statDivisor} />
          <View style={s.statItem}>
            <Text style={s.statValor}>{stats.totalClientes}</Text>
            <Text style={s.statLabel}>Clientes</Text>
          </View>
        </View>
      )}

      {/* Filtro por cliente — dropdown */}
      <View style={s.filtroRow}>
        <TouchableOpacity style={s.filtroBtn} onPress={() => setShowFiltroModal(true)} activeOpacity={0.8}>
          <Ionicons
            name={filtro === null ? 'people-outline' : 'person-outline'}
            size={16}
            color={filtro === null ? cores.textoSec : cores.primaria}
          />
          <Text style={s.filtroBtnTexto} numberOfLines={1}>
            {nomeClienteFiltrado ?? 'Todos os clientes'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={cores.textoSec} />
        </TouchableOpacity>
        {filtro !== null && (
          <TouchableOpacity style={s.filtroLimpar} onPress={() => aplicarFiltro(null)} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color={cores.textoSec} />
          </TouchableOpacity>
        )}
      </View>

      {historico.length === 0 ? (
        <View style={s.vazio}>
          <Ionicons name="time-outline" size={48} color={cores.borda} />
          <Text style={s.vazioTexto}>
            {filtro === null ? 'Nenhum atendimento concluído ainda.' : 'Nenhum atendimento para este cliente.'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={secoes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.lista}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={s.secaoTitulo}>{section.titulo}</Text>
          )}
          renderItem={({ item }) => {
            const rel = tempoRelativo(item.dataAtendimento);
            const tags = item.servicoRealizado.split(',').map((sv) => sv.trim()).filter(Boolean);
            return (
              <View style={s.card}>
                <View style={s.cardEsq}>
                  <Text style={s.cardDia}>{formatarDia(item.dataAtendimento)}</Text>
                  {rel ? <Text style={s.cardRel}>{rel}</Text> : null}
                </View>
                <View style={s.cardDir}>
                  <Text style={s.cardNome}>{item.clienteNome}</Text>
                  <View style={s.tags}>
                    {tags.map((t, i) => (
                      <View key={i} style={s.tag}>
                        <Text style={s.tagTexto}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  {item.valor != null && item.valor > 0 && (
                    <Text style={s.valorTexto}>R$ {item.valor.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal de seleção de cliente */}
      <Modal
        visible={showFiltroModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFiltroModal(false)}
      >
        <TouchableOpacity
          style={s.filtroModalBg}
          activeOpacity={1}
          onPress={() => setShowFiltroModal(false)}
        >
          <View style={s.filtroModalCaixa}>
            <View style={s.filtroModalTopo}>
              <Text style={s.filtroModalTitulo}>Filtrar por cliente</Text>
              <TouchableOpacity onPress={() => setShowFiltroModal(false)}>
                <Ionicons name="close" size={22} color={cores.textoSec} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={s.filtroItem}
                onPress={() => { aplicarFiltro(null); setShowFiltroModal(false); }}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={18} color={filtro === null ? cores.primaria : cores.textoSec} />
                <Text style={[s.filtroItemTexto, filtro === null && s.filtroItemTextoAtivo]}>
                  Todos os clientes
                </Text>
                {filtro === null && <Ionicons name="checkmark" size={18} color={cores.primaria} />}
              </TouchableOpacity>
              {clientes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={s.filtroItem}
                  onPress={() => { aplicarFiltro(c.id); setShowFiltroModal(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person" size={18} color={filtro === c.id ? cores.primaria : cores.textoSec} />
                  <Text style={[s.filtroItemTexto, filtro === c.id && s.filtroItemTextoAtivo]} numberOfLines={1}>
                    {c.nome}
                  </Text>
                  {filtro === c.id && <Ionicons name="checkmark" size={18} color={cores.primaria} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
