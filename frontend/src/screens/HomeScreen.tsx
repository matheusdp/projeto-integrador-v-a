import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { getConfiguracao } from '../database/configuracaoRepository';
import { listarDiasComAgendamentos, listarAgendamentosDoDia } from '../services/agendamentoService';
import { contarPorPeriodo } from '../database/historicoRepository';
import { Agendamento } from '../types';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function isoHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { flex: 1 },
    dashRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 16, gap: 10 },
    dashCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.borda,
    },
    dashNum: { fontSize: 26, fontWeight: '800', color: c.primaria },
    dashLabel: { fontSize: 11, color: c.textoSec, marginTop: 2, textAlign: 'center' },
    greeting: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    greetingNome: { fontSize: 18, fontWeight: '700', color: c.texto },
    greetingBarbearia: { fontSize: 13, color: c.textoSec, marginTop: 1 },
    calCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      marginHorizontal: 14,
      marginTop: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.borda,
    },
    calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    calMes: { fontSize: 15, fontWeight: '700', color: c.texto },
    calNavBtn: { padding: 6 },
    calSemanaRow: { flexDirection: 'row', marginBottom: 4 },
    calSemanaLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: c.textoSec, fontWeight: '600' },
    calRow: { flexDirection: 'row' },
    calCell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
    calDiaBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    calDiaNum: { fontSize: 13, color: c.texto, fontWeight: '500' },
    calDiaSelecionado: { backgroundColor: c.primaria },
    calDiaHoje: { borderWidth: 2, borderColor: c.primaria },
    calDiaNumSelecionado: { color: '#fff', fontWeight: '700' },
    calDiaMarcador: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: c.primaria,
      position: 'absolute',
      bottom: 3,
    },
    secaoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    secaoTitulo: { fontSize: 15, fontWeight: '700', color: c.texto },
    novoBtn: {
      backgroundColor: c.primariaSuave,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    novoBtnTexto: { fontSize: 13, color: c.primaria, fontWeight: '600' },
    vazio: { alignItems: 'center', paddingVertical: 30 },
    vazioCon: { fontSize: 36, marginBottom: 8 },
    vazioTexto: { fontSize: 14, color: c.textoSec, textAlign: 'center' },
    agCard: {
      backgroundColor: c.card,
      borderRadius: 12,
      marginHorizontal: 14,
      marginBottom: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: c.borda,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    agHoraBox: {
      backgroundColor: c.primariaSuave,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      alignItems: 'center',
      minWidth: 50,
    },
    agHora: { fontSize: 14, fontWeight: '700', color: c.primaria },
    agInfo: { flex: 1 },
    agNome: { fontSize: 14, fontWeight: '600', color: c.texto },
    agServico: { fontSize: 12, color: c.textoSec, marginTop: 2 },
    listBottom: { height: 20 },
  });
}

export default function HomeScreen() {
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const navigation = useNavigation<any>();

  const hoje = isoHoje();
  const [anoMes, setAnoMes] = useState(() => {
    const d = new Date();
    return { ano: d.getFullYear(), mes: d.getMonth() };
  });
  const [diasMarcados, setDiasMarcados] = useState<Map<string, number>>(new Map());
  const [diaSel, setDiaSel] = useState(hoje);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [stats, setStats] = useState({ s7: 0, s15: 0, s30: 0 });
  const [nomePerfil, setNomePerfil] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');

  const carregarCalendario = useCallback(async (ano: number, mes: number) => {
    const mapa = await listarDiasComAgendamentos(ano, mes);
    setDiasMarcados(mapa);
  }, []);

  const carregarDia = useCallback(async (data: string) => {
    const lista = await listarAgendamentosDoDia(data);
    setAgendamentos(lista);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarCalendario(anoMes.ano, anoMes.mes);
      carregarDia(diaSel);
      Promise.all([contarPorPeriodo(7), contarPorPeriodo(15), contarPorPeriodo(30)]).then(
        ([s7, s15, s30]) => setStats({ s7, s15, s30 })
      );
      Promise.all([getConfiguracao('perfil_nome'), getConfiguracao('perfil_barbearia')]).then(
        ([n, b]) => { setNomePerfil(n ?? ''); setNomeBarbearia(b ?? ''); }
      );
    }, [diaSel, anoMes.ano, anoMes.mes])
  );

  function mudarMes(delta: number) {
    setAnoMes((prev) => {
      let mes = prev.mes + delta;
      let ano = prev.ano;
      if (mes < 0) { mes = 11; ano--; }
      if (mes > 11) { mes = 0; ano++; }
      carregarCalendario(ano, mes);
      return { ano, mes };
    });
  }

  function selecionarDia(iso: string) {
    setDiaSel(iso);
    carregarDia(iso);
  }

  const semanas = useMemo(() => {
    const { ano, mes } = anoMes;
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const cells: (number | null)[] = Array(primeiroDia).fill(null);
    for (let i = 1; i <= totalDias; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [anoMes]);

  function renderCelula(dia: number | null, si: number, di: number) {
    if (!dia) return <View key={`e-${si}-${di}`} style={s.calCell} />;
    const mesStr = String(anoMes.mes + 1).padStart(2, '0');
    const iso = `${anoMes.ano}-${mesStr}-${String(dia).padStart(2, '0')}`;
    const selecionado = iso === diaSel;
    const ehHoje = iso === hoje;
    const temAgend = diasMarcados.has(iso);
    return (
      <View key={iso} style={s.calCell}>
        <TouchableOpacity
          style={[s.calDiaBtn, selecionado && s.calDiaSelecionado, !selecionado && ehHoje && s.calDiaHoje]}
          onPress={() => selecionarDia(iso)}
          activeOpacity={0.7}
        >
          <Text style={[s.calDiaNum, selecionado && s.calDiaNumSelecionado]}>{dia}</Text>
          {temAgend && !selecionado && <View style={s.calDiaMarcador} />}
        </TouchableOpacity>
      </View>
    );
  }

  const [dY, dM, dD] = diaSel.split('-');
  const dataFormatada = `${dD}/${dM}/${dY}`;
  const saudacao = nomePerfil ? `Olá, ${nomePerfil.split(' ')[0]}!` : 'Bem-vindo!';

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.greeting}>
          <Text style={s.greetingNome}>{saudacao}</Text>
          {!!nomeBarbearia && <Text style={s.greetingBarbearia}>{nomeBarbearia}</Text>}
        </View>

        <View style={s.dashRow}>
          {([['7 dias', stats.s7], ['15 dias', stats.s15], ['30 dias', stats.s30]] as [string, number][]).map(
            ([label, val]) => (
              <View key={label} style={s.dashCard}>
                <Text style={s.dashNum}>{val}</Text>
                <Text style={s.dashLabel}>Atend.{'\n'}{label}</Text>
              </View>
            )
          )}
        </View>

        <View style={s.calCard}>
          <View style={s.calHeader}>
            <TouchableOpacity style={s.calNavBtn} onPress={() => mudarMes(-1)}>
              <Ionicons name="chevron-back" size={20} color={cores.primaria} />
            </TouchableOpacity>
            <Text style={s.calMes}>{MESES[anoMes.mes]} {anoMes.ano}</Text>
            <TouchableOpacity style={s.calNavBtn} onPress={() => mudarMes(1)}>
              <Ionicons name="chevron-forward" size={20} color={cores.primaria} />
            </TouchableOpacity>
          </View>
          <View style={s.calSemanaRow}>
            {DIAS_SEMANA_CURTO.map((d) => (
              <Text key={d} style={s.calSemanaLabel}>{d}</Text>
            ))}
          </View>
          {semanas.map((semana, si) => (
            <View key={si} style={s.calRow}>
              {semana.map((dia, di) => renderCelula(dia, si, di))}
            </View>
          ))}
        </View>

        <View style={s.secaoHeader}>
          <Text style={s.secaoTitulo}>Agenda — {dataFormatada}</Text>
          <TouchableOpacity
            style={s.novoBtn}
            onPress={() => navigation.navigate('Agendamentos', { screen: 'AgendamentoForm', params: {} })}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={cores.primaria} />
            <Text style={s.novoBtnTexto}>Novo</Text>
          </TouchableOpacity>
        </View>

        {agendamentos.length === 0 ? (
          <View style={s.vazio}>
            <Text style={s.vazioCon}>📅</Text>
            <Text style={s.vazioTexto}>Nenhum agendamento{'\n'}para este dia</Text>
          </View>
        ) : (
          agendamentos.map((ag) => (
            <TouchableOpacity
              key={ag.id}
              style={s.agCard}
              onPress={() => navigation.navigate('Agendamentos', { screen: 'AgendamentosList', params: { destaqueId: ag.id } })}
              activeOpacity={0.75}
            >
              <View style={s.agHoraBox}>
                <Text style={s.agHora}>{ag.horaAtendimento}</Text>
              </View>
              <View style={s.agInfo}>
                <Text style={s.agNome}>{ag.clienteNome}</Text>
                <Text style={s.agServico}>{ag.servico}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={cores.textoSec} />
            </TouchableOpacity>
          ))
        )}
        <View style={s.listBottom} />
      </ScrollView>
    </View>
  );
}
