import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema, Cores } from '../theme/ThemeContext';
import { Cliente } from '../types';
import { listarClientes, excluirCliente } from '../services/clienteService';

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    contadorBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borda,
      backgroundColor: c.bg,
    },
    contadorTexto: { fontSize: 13, color: c.textoSec, fontWeight: '500' },
    lista: { padding: 16, gap: 10, paddingBottom: 80 },
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.borda,
      alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    nome: { fontSize: 16, fontWeight: '600', color: c.texto },
    contatoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    contato: { fontSize: 13, color: c.textoSec },
    endereco: { fontSize: 12, color: c.textoSec, marginTop: 2, fontStyle: 'italic' },
    waIcon: { marginLeft: 6 },
    deleteBtn: { padding: 8 },
    vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    vazioTexto: { fontSize: 15, color: c.textoSec },
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
  });
}

export default function ClientesScreen() {
  const navigation = useNavigation<any>();
  const { cores } = useTema();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useFocusEffect(
    useCallback(() => { listarClientes().then(setClientes); }, [])
  );

  const confirmarExclusao = (cliente: Cliente) => {
    Alert.alert(
      'Excluir Cliente',
      `Deseja excluir "${cliente.nome}"? Todos os agendamentos vinculados também serão excluídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => { await excluirCliente(cliente.id); listarClientes().then(setClientes); },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      {clientes.length === 0 ? (
        <View style={s.vazio}>
          <Ionicons name="people-outline" size={48} color={cores.borda} />
          <Text style={s.vazioTexto}>Nenhum cliente cadastrado.</Text>
        </View>
      ) : (
        <>
          <View style={s.contadorBar}>
            <Ionicons name="people-outline" size={14} color={cores.textoSec} />
            <Text style={s.contadorTexto}>
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <FlatList
            data={clientes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={s.lista}
          renderItem={({ item }) => (
            <View style={s.card}>
              <TouchableOpacity
                style={s.cardInfo}
                onPress={() => navigation.navigate('ClienteForm', { clienteId: item.id })}
              >
                <Text style={s.nome}>{item.nome}</Text>
                <View style={s.contatoRow}>
                  <Text style={s.contato}>{item.telefone}</Text>
                  {item.whatsapp && (
                    <Ionicons name="logo-whatsapp" size={14} color={cores.whatsapp} style={s.waIcon} />
                  )}
                </View>
                {item.email ? <Text style={s.contato}>{item.email}</Text> : null}
                {item.endereco ? <Text style={s.endereco}>{item.endereco}</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmarExclusao(item)} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={cores.perigo} />
              </TouchableOpacity>
            </View>
          )}
        />
        </>
      )}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('ClienteForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
