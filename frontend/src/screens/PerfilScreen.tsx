import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { getConfiguracao, salvarConfiguracao } from '../database/configuracaoRepository';
import {
  calcularFaturamento,
  calcularFaturamentoPeriodo,
} from '../database/historicoRepository';

function isoLocal(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function parseDateFromISO(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20 },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: c.primaria,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 8,
    },
    avatarLetra: { fontSize: 34, fontWeight: '800', color: '#fff' },
    avatarHint: { textAlign: 'center', color: c.textoSec, fontSize: 12, marginBottom: 24 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.borda,
    },
    cardTitulo: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textoSec,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    label: { fontSize: 13, color: c.textoSec, marginBottom: 4 },
    input: {
      backgroundColor: c.bgSec,
      borderWidth: 1,
      borderColor: c.borda,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: c.texto,
      marginBottom: 12,
    },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    toggleLabel: { fontSize: 15, color: c.texto, flex: 1 },
    toggleSub: { fontSize: 12, color: c.textoSec, marginTop: 1 },
    // Faturamento
    fatRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    fatCard: {
      flex: 1,
      backgroundColor: c.primariaSuave,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.borda,
    },
    fatValor: { fontSize: 15, fontWeight: '800', color: c.primaria, textAlign: 'center' },
    fatLabel: { fontSize: 10, color: c.textoSec, marginTop: 3, textAlign: 'center' },
    fatDivisor: { height: 1, backgroundColor: c.borda, marginBottom: 12 },
    fatPeriodoTitulo: { fontSize: 13, color: c.textoSec, marginBottom: 10, fontWeight: '600' },
    fatPeriodoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    fatPeriodoBtn: {
      flex: 1,
      backgroundColor: c.bgSec,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borda,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    fatPeriodoBtnTexto: { flex: 1, fontSize: 13, color: c.texto, fontWeight: '500' },
    fatResultado: {
      backgroundColor: c.cardAlt,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.borda,
    },
    fatResultadoValor: { fontSize: 24, fontWeight: '800', color: c.primaria },
    fatResultadoLabel: { fontSize: 12, color: c.textoSec, marginTop: 4 },
    // Botão salvar
    botao: {
      backgroundColor: c.primaria,
      borderRadius: 12,
      padding: 15,
      alignItems: 'center',
      marginTop: 12,
    },
    botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Modal iOS datepicker
    modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
    modalCaixa: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    modalCancelar: { fontSize: 15, color: c.textoSec },
    modalOk: { fontSize: 15, color: c.primaria, fontWeight: '700' },
  });
}

export default function PerfilScreen() {
  const { cores, isDark, toggle } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);

  // Dados do barbeiro
  const [nome, setNome] = useState('');
  const [barbearia, setBarbearia] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Faturamento — períodos fixos
  const [fat7, setFat7] = useState(0);
  const [fat15, setFat15] = useState(0);
  const [fat30, setFat30] = useState(0);

  // Faturamento — período personalizado
  const hoje = isoLocal();
  const [periodoInicio, setPeriodoInicio] = useState(hoje);
  const [periodoFim, setPeriodoFim] = useState(hoje);
  const [fatPeriodo, setFatPeriodo] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [showPicker, setShowPicker] = useState<'inicio' | 'fim' | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        getConfiguracao('perfil_nome'),
        getConfiguracao('perfil_barbearia'),
        calcularFaturamento(7),
        calcularFaturamento(15),
        calcularFaturamento(30),
      ]).then(([n, b, f7, f15, f30]) => {
        setNome(n ?? '');
        setBarbearia(b ?? '');
        setFat7(f7);
        setFat15(f15);
        setFat30(f30);
      });
    }, [])
  );

  const iniciais = nome.trim()
    ? nome.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function salvar() {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe seu nome.'); return; }
    setSalvando(true);
    try {
      await Promise.all([
        salvarConfiguracao('perfil_nome', nome.trim()),
        salvarConfiguracao('perfil_barbearia', barbearia.trim()),
      ]);
      Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
    } finally {
      setSalvando(false);
    }
  }

  async function calcularPeriodo() {
    if (periodoInicio > periodoFim) {
      Alert.alert('Atenção', 'A data inicial deve ser anterior à data final.');
      return;
    }
    setCalculando(true);
    try {
      const total = await calcularFaturamentoPeriodo(periodoInicio, periodoFim);
      setFatPeriodo(total);
    } finally {
      setCalculando(false);
    }
  }

  function abrirPicker(tipo: 'inicio' | 'fim') {
    const dataAtual = tipo === 'inicio' ? parseDateFromISO(periodoInicio) : parseDateFromISO(periodoFim);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataAtual,
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            if (tipo === 'inicio') setPeriodoInicio(isoLocal(selected));
            else setPeriodoFim(isoLocal(selected));
            setFatPeriodo(null);
          }
        },
      });
    } else {
      setShowPicker(tipo);
    }
  }

  const pickerValue = showPicker === 'inicio'
    ? parseDateFromISO(periodoInicio)
    : parseDateFromISO(periodoFim);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={s.avatar}>
          <Text style={s.avatarLetra}>{iniciais}</Text>
        </View>
        <Text style={s.avatarHint}>Suas iniciais como avatar</Text>

        {/* Dados do Barbeiro */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Dados do Barbeiro</Text>
          <Text style={s.label}>Nome</Text>
          <TextInput
            style={s.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor={cores.textoSec}
          />
          <Text style={s.label}>Nome da Barbearia</Text>
          <TextInput
            style={[s.input, { marginBottom: 0 }]}
            value={barbearia}
            onChangeText={setBarbearia}
            placeholder="Ex: Barbearia do João"
            placeholderTextColor={cores.textoSec}
          />

          <TouchableOpacity style={[s.botao, { borderRadius: 10, padding: 12 }]} onPress={salvar} activeOpacity={0.8} disabled={salvando}>
            <Text style={s.botaoTexto}>{salvando ? 'Salvando…' : 'Salvar Perfil'}</Text>
          </TouchableOpacity>
        </View>

        {/* Aparência */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Aparência</Text>
          <View style={s.toggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={s.toggleLabel}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={cores.primaria} />
                {'  '}{isDark ? 'Modo Escuro' : 'Modo Claro'}
              </Text>
              <Text style={s.toggleSub}>Toque para alternar o tema</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: cores.borda, true: cores.primaria }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Faturamento */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Faturamento</Text>

          <View style={s.fatRow}>
            {([['7 dias', fat7], ['15 dias', fat15], ['30 dias', fat30]] as [string, number][]).map(
              ([label, val]) => (
                <View key={label} style={s.fatCard}>
                  <Text style={s.fatValor}>R$&nbsp;{val.toFixed(2)}</Text>
                  <Text style={s.fatLabel}>{label}</Text>
                </View>
              )
            )}
          </View>

          <View style={s.fatDivisor} />
          <Text style={s.fatPeriodoTitulo}>Período personalizado</Text>

          <View style={s.fatPeriodoRow}>
            <TouchableOpacity style={s.fatPeriodoBtn} onPress={() => abrirPicker('inicio')} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={15} color={cores.primaria} />
              <Text style={s.fatPeriodoBtnTexto}>De: {formatarData(periodoInicio)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.fatPeriodoBtn} onPress={() => abrirPicker('fim')} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={15} color={cores.primaria} />
              <Text style={s.fatPeriodoBtnTexto}>Até: {formatarData(periodoFim)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.botao, { marginTop: 0, borderRadius: 10, padding: 12 }]}
            onPress={calcularPeriodo}
            activeOpacity={0.8}
            disabled={calculando}
          >
            <Text style={s.botaoTexto}>{calculando ? 'Calculando…' : 'Calcular Período'}</Text>
          </TouchableOpacity>

          {fatPeriodo !== null && (
            <View style={[s.fatResultado, { marginTop: 12 }]}>
              <Text style={s.fatResultadoValor}>R$ {fatPeriodo.toFixed(2)}</Text>
              <Text style={s.fatResultadoLabel}>
                {formatarData(periodoInicio)} até {formatarData(periodoFim)}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal DatePicker iOS */}
      {Platform.OS === 'ios' && !!showPicker && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalCaixa}>
              <View style={s.modalTopo}>
                <TouchableOpacity onPress={() => setShowPicker(null)}>
                  <Text style={s.modalCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPicker(null)}>
                  <Text style={s.modalOk}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                textColor={cores.texto}
                onChange={(_, d) => {
                  if (d) {
                    if (showPicker === 'inicio') setPeriodoInicio(isoLocal(d));
                    else setPeriodoFim(isoLocal(d));
                    setFatPeriodo(null);
                  }
                }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
