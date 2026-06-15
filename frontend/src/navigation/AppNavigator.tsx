import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTema, Cores } from '../theme/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ClienteFormScreen from '../screens/ClienteFormScreen';
import AgendamentosScreen from '../screens/AgendamentosScreen';
import AgendamentoFormScreen from '../screens/AgendamentoFormScreen';
import HistoricoScreen from '../screens/HistoricoScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TRANSITION = {
  animation: 'slide_from_right' as const,
  animationDuration: 280,
};

function headerOptions(cores: Cores) {
  return {
    headerStyle: { backgroundColor: cores.header },
    headerTintColor: '#fff' as const,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
    headerShadowVisible: false,
  };
}

// Cada aba usa createNativeStackNavigator para garantir que TODOS
// os headers venham do mesmo renderer nativo — sem diferenças visuais.

function HomeStack() {
  const { cores } = useTema();
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions(cores), ...TRANSITION }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Barber Scheduler' }} />
    </Stack.Navigator>
  );
}

function ClientesStack() {
  const { cores } = useTema();
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions(cores), ...TRANSITION }}>
      <Stack.Screen name="ClientesList" component={ClientesScreen} options={{ title: 'Clientes' }} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ title: 'Cliente' }} />
    </Stack.Navigator>
  );
}

function AgendamentosStack() {
  const { cores } = useTema();
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions(cores), ...TRANSITION }}>
      <Stack.Screen name="AgendamentosList" component={AgendamentosScreen} options={{ title: 'Agendamentos' }} />
      <Stack.Screen name="AgendamentoForm" component={AgendamentoFormScreen} options={{ title: 'Agendamento' }} />
    </Stack.Navigator>
  );
}

function HistoricoStack() {
  const { cores } = useTema();
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions(cores), ...TRANSITION }}>
      <Stack.Screen name="HistoricoMain" component={HistoricoScreen} options={{ title: 'Histórico' }} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  const { cores } = useTema();
  return (
    <Stack.Navigator screenOptions={{ ...headerOptions(cores), ...TRANSITION }}>
      <Stack.Screen name="PerfilMain" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  );
}

const TAB_ICONS: Record<string, { ativo: keyof typeof Ionicons.glyphMap; inativo: keyof typeof Ionicons.glyphMap }> = {
  Home: { ativo: 'home', inativo: 'home-outline' },
  Clientes: { ativo: 'people', inativo: 'people-outline' },
  Agendamentos: { ativo: 'calendar', inativo: 'calendar-outline' },
  Historico: { ativo: 'time', inativo: 'time-outline' },
  Perfil: { ativo: 'person-circle', inativo: 'person-circle-outline' },
};

export default function AppNavigator() {
  const { cores } = useTema();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size, focused }) => {
            const icons = TAB_ICONS[route.name];
            return <Ionicons name={focused ? icons.ativo : icons.inativo} size={size} color={color} />;
          },
          tabBarActiveTintColor: cores.primaria,
          tabBarInactiveTintColor: cores.textoSec,
          tabBarStyle: {
            backgroundColor: cores.tabBar,
            borderTopColor: cores.borda,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          headerShown: false, // todos os headers vêm dos stacks acima
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Início' }} />
        <Tab.Screen name="Clientes" component={ClientesStack} options={{ title: 'Clientes' }} />
        <Tab.Screen name="Agendamentos" component={AgendamentosStack} options={{ title: 'Agenda' }} />
        <Tab.Screen name="Historico" component={HistoricoStack} options={{ title: 'Histórico' }} />
        <Tab.Screen name="Perfil" component={PerfilStack} options={{ title: 'Perfil' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
