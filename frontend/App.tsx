import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { TemaProvider } from './src/theme/ThemeContext';
import { getDatabase } from './src/database/database';
import { getConfiguracao } from './src/database/configuracaoRepository';

export default function App() {
  const [dbPronto, setDbPronto] = useState(false);
  const [temaInicial, setTemaInicial] = useState<'claro' | 'escuro'>('claro');
  const [mostrarApp, setMostrarApp] = useState(false);

  useEffect(() => {
    getDatabase()
      .then(() => getConfiguracao('tema'))
      .then((val) => {
        if (val === 'escuro') setTemaInicial('escuro');
        setDbPronto(true);
      });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {!mostrarApp && (
        <SplashScreen dbPronto={dbPronto} onConcluir={() => setMostrarApp(true)} />
      )}
      {mostrarApp && (
        <TemaProvider inicial={temaInicial}>
          <AppNavigator />
        </TemaProvider>
      )}
    </View>
  );
}
