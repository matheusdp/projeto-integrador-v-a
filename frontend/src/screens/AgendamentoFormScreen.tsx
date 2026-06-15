import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { Cliente } from '../types';
import { listarClientes } from '../services/clienteService';
import { buscarAgendamento, criarAgendamento, atualizarAgendamento } from '../services/agendamentoService';

const SERVICOS = ['Corte', 'Barba', 'Sobrancelha', 'Pigmentação', 'Hidratação', 'Outros'];

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDisplayDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    label: { fontSize: 13, fontWeight: '600', color: c.textoSec, marginTop: 20, marginBottom: 8 },
    clienteBox: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.borda,
      overflow: 'hidden',
    },
    buscaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
      gap: 8,
    },
    buscaInput: { flex: 1, fontSize: 14, color: c.texto },
    clienteLista: { maxHeight: 180 },
    clienteItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
    },
    clienteItemAtivo: { backgroundColor: c.primaria },
    clienteItemNome: { fontSize: 14, color: c.texto },
    clienteItemNomeAtivo: { color: '#fff', fontWeight: '600' },
    semClientes: { padding: 14, fontSize: 13, color: c.textoSec, fontStyle: 'italic' },
    pickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borda,
      padding: 14,
      gap: 10,
    },
    pickerBtnTexto: { flex: 1, fontSize: 15, color: c.texto, fontWeight: '500' },
    servicosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    servicoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borda,
    },
    servicoChipAtivo: { backgroundColor: c.primaria, borderColor: c.primaria },
    servicoChipTexto: { fontSize: 13, color: c.textoSec },
    servicoChipTextoAtivo: { color: '#fff', fontWeight: '600' },
    input: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      borderWidth: 1,
      borderColor: c.borda,
      color: c.texto,
    },
    textarea: { height: 80 },
    btn: { backgroundColor: c.primaria, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 },
    btnDisabled: { opacity: 0.6 },
    btnTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
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

export default function AgendamentoFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const agendamentoId: number | undefined = route.params?.agendamentoId;
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [clienteId, setClienteId] = useState<number>(0);
  const [dataDate, setDataDate] = useState<Date>(new Date());
  const [horaDate, setHoraDate] = useState<Date>(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  });
  const [servicos, setServicos] = useState<string[]>(['Corte']);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [showModal, setShowModal] = useState<'date' | 'time' | null>(null);

  const clientesFiltrados = useMemo(
    () => clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [clientes, busca]
  );

  useEffect(() => {
    listarClientes().then((lista) => {
      setClientes(lista);
      if (lista.length > 0 && !agendamentoId) setClienteId(lista[0].id);
    });
    if (agendamentoId) {
      buscarAgendamento(agendamentoId).then((a) => {
        if (!a) return;
        setClienteId(a.clienteId);
        setDataDate(new Date(`${a.dataAtendimento}T12:00:00`));
        const [hh, mm] = a.horaAtendimento.split(':').map(Number);
        const h = new Date();
        h.setHours(hh, mm, 0, 0);
        setHoraDate(h);
        setServicos(a.servico.split(',').map((sv) => sv.trim()).filter(Boolean));
        setObservacoes(a.observacoes ?? '');
      });
    }
  }, [agendamentoId]);

  const toggleServico = (sv: string) => {
    setServicos((prev) => (prev.includes(sv) ? prev.filter((x) => x !== sv) : [...prev, sv]));
  };

  const abrirPicker = (tipo: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: tipo === 'date' ? dataDate : horaDate,
        mode: tipo,
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            if (tipo === 'date') setDataDate(selected);
            else setHoraDate(selected);
          }
        },
      });
    } else {
      setShowModal(tipo);
    }
  };

  const salvar = async () => {
    if (!clienteId) return Alert.alert('Erro', 'Selecione um cliente.');
    if (servicos.length === 0) return Alert.alert('Erro', 'Selecione ao menos um serviço.');
    try {
      setSalvando(true);
      const dados = {
        clienteId,
        dataAtendimento: dateToISO(dataDate),
        horaAtendimento: dateToTime(horaDate),
        servico: servicos.join(', '),
        observacoes,
      };
      if (agendamentoId) {
        await atualizarAgendamento(agendamentoId, dados);
      } else {
        await criarAgendamento(dados);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Cliente *</Text>
        <View style={s.clienteBox}>
          <View style={s.buscaRow}>
            <Ionicons name="search-outline" size={16} color={cores.textoSec} />
            <TextInput
              style={s.buscaInput}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar cliente..."
              placeholderTextColor={cores.textoSec}
              clearButtonMode="while-editing"
            />
          </View>
          <ScrollView style={s.clienteLista} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {clientesFiltrados.length === 0 ? (
              <Text style={s.semClientes}>
                {clientes.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum resultado.'}
              </Text>
            ) : (
              clientesFiltrados.map((c) => {
                const ativo = clienteId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.clienteItem, ativo && s.clienteItemAtivo]}
                    onPress={() => setClienteId(c.id)}
                  >
                    <Text style={[s.clienteItemNome, ativo && s.clienteItemNomeAtivo]}>{c.nome}</Text>
                    {ativo && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        <Text style={s.label}>Data *</Text>
        <TouchableOpacity style={s.pickerBtn} onPress={() => abrirPicker('date')}>
          <Ionicons name="calendar-outline" size={18} color={cores.primaria} />
          <Text style={s.pickerBtnTexto}>{formatDisplayDate(dataDate)}</Text>
          <Ionicons name="chevron-down" size={16} color={cores.textoSec} />
        </TouchableOpacity>

        <Text style={s.label}>Horário *</Text>
        <TouchableOpacity style={s.pickerBtn} onPress={() => abrirPicker('time')}>
          <Ionicons name="time-outline" size={18} color={cores.primaria} />
          <Text style={s.pickerBtnTexto}>{dateToTime(horaDate)}</Text>
          <Ionicons name="chevron-down" size={16} color={cores.textoSec} />
        </TouchableOpacity>

        <Text style={s.label}>
          Serviços *{servicos.length > 0 ? ` (${servicos.length} selecionado${servicos.length > 1 ? 's' : ''})` : ''}
        </Text>
        <View style={s.servicosGrid}>
          {SERVICOS.map((sv) => {
            const ativo = servicos.includes(sv);
            return (
              <TouchableOpacity
                key={sv}
                style={[s.servicoChip, ativo && s.servicoChipAtivo]}
                onPress={() => toggleServico(sv)}
              >
                {ativo && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
                <Text style={[s.servicoChipTexto, ativo && s.servicoChipTextoAtivo]}>{sv}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.label}>Observações</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Observações opcionais..."
          placeholderTextColor={cores.textoSec}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity style={[s.btn, salvando && s.btnDisabled]} onPress={salvar} disabled={salvando}>
          <Text style={s.btnTexto}>{salvando ? 'Salvando...' : 'Salvar Agendamento'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS === 'ios' && showModal && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalCaixa}>
              <View style={s.modalTopo}>
                <TouchableOpacity onPress={() => setShowModal(null)}>
                  <Text style={s.modalCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowModal(null)}>
                  <Text style={s.modalOk}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={showModal === 'date' ? dataDate : horaDate}
                mode={showModal}
                display="spinner"
                is24Hour
                textColor={cores.texto}
                onChange={(_, d) => {
                  if (d) {
                    if (showModal === 'date') setDataDate(d);
                    else setHoraDate(d);
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
