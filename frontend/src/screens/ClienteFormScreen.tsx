import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { buscarCliente, criarCliente, atualizarCliente } from '../services/clienteService';

function maskPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  const n = nums.length;
  if (n === 0) return '';
  if (n <= 2) return `(${nums}`;
  if (n === 3) return `(${nums.slice(0, 2)}) ${nums[2]}`;
  if (n <= 7) return `(${nums.slice(0, 2)}) ${nums[2]} ${nums.slice(3)}`;
  return `(${nums.slice(0, 2)}) ${nums[2]} ${nums.slice(3, 7)}-${nums.slice(7)}`;
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    label: { fontSize: 13, fontWeight: '600', color: c.textoSec, marginTop: 18, marginBottom: 6 },
    input: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      borderWidth: 1,
      borderColor: c.borda,
      color: c.texto,
    },
    inputErro: { borderColor: c.perigo },
    erroTexto: { fontSize: 12, color: c.perigo, marginTop: 4, marginLeft: 4 },
    checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 4 },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.borda,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkBoxAtivo: { backgroundColor: c.whatsapp, borderColor: c.whatsapp },
    checkLabel: { fontSize: 14, color: c.texto, marginLeft: 8 },
    btn: {
      backgroundColor: c.primaria,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    btnDisabled: { opacity: 0.6 },
    btnTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}

export default function ClienteFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const clienteId: number | undefined = route.params?.clienteId;
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState(false);
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (clienteId) {
      buscarCliente(clienteId).then((c) => {
        if (c) {
          setNome(c.nome);
          setTelefone(c.telefone);
          setEmail(c.email);
          setWhatsapp(c.whatsapp ?? false);
          setEndereco(c.endereco ?? '');
        }
      });
    }
  }, [clienteId]);

  const salvar = async () => {
    try {
      setSalvando(true);
      const dados = { nome, telefone, email, whatsapp, endereco };
      if (clienteId) {
        await atualizarCliente(clienteId, dados);
      } else {
        await criarCliente(dados);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  };

  const emailInvalido = email.length > 0 && !emailValido(email);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Nome *</Text>
        <TextInput
          style={s.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome completo"
          placeholderTextColor={cores.textoSec}
          autoCapitalize="words"
        />

        <Text style={s.label}>Telefone *</Text>
        <TextInput
          style={s.input}
          value={telefone}
          onChangeText={(v) => setTelefone(maskPhone(v))}
          placeholder="(11) 9 9999-9999"
          placeholderTextColor={cores.textoSec}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={s.checkRow} onPress={() => setWhatsapp(!whatsapp)}>
          <View style={[s.checkBox, whatsapp && s.checkBoxAtivo]}>
            {whatsapp && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Ionicons name="logo-whatsapp" size={18} color={cores.whatsapp} style={{ marginLeft: 8, marginRight: 6 }} />
          <Text style={s.checkLabel}>Este número é WhatsApp</Text>
        </TouchableOpacity>

        <Text style={s.label}>E-mail</Text>
        <TextInput
          style={[s.input, emailInvalido && s.inputErro]}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemplo.com"
          placeholderTextColor={cores.textoSec}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailInvalido && <Text style={s.erroTexto}>E-mail inválido</Text>}

        <Text style={s.label}>Endereço / Localização</Text>
        <TextInput
          style={s.input}
          value={endereco}
          onChangeText={setEndereco}
          placeholder="Rua, bairro, cidade..."
          placeholderTextColor={cores.textoSec}
          autoCapitalize="words"
        />

        <TouchableOpacity style={[s.btn, salvando && s.btnDisabled]} onPress={salvar} disabled={salvando}>
          <Text style={s.btnTexto}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
