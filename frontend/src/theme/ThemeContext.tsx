import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { getConfiguracao, salvarConfiguracao } from '../database/configuracaoRepository';

export type Cores = {
  bg: string;
  bgSec: string;
  card: string;
  cardAlt: string;
  texto: string;
  textoSec: string;
  borda: string;
  primaria: string;
  primariaSuave: string;
  tabBar: string;
  header: string;
  sucesso: string;
  perigo: string;
  aviso: string;
  whatsapp: string;
  statusBar: 'light' | 'dark';
};

export type Tema = {
  cores: Cores;
  isDark: boolean;
  toggle: () => void;
};

const CLARO: Cores = {
  bg: '#f0f4ff',
  bgSec: '#e8ecf8',
  card: '#ffffff',
  cardAlt: '#e8f0fe',
  texto: '#1a1a2e',
  textoSec: '#64648a',
  borda: '#dde3f0',
  primaria: '#1a73e8',
  primariaSuave: '#e8f0fe',
  tabBar: '#ffffff',
  header: '#1a73e8',
  sucesso: '#34a853',
  perigo: '#e53935',
  aviso: '#fb8c00',
  whatsapp: '#25d366',
  statusBar: 'light',
};

const ESCURO: Cores = {
  bg: '#0d0d12',
  bgSec: '#1a1a24',
  card: '#1c1c28',
  cardAlt: '#252535',
  texto: '#f2f2f7',
  textoSec: '#9898b0',
  borda: '#2e2e42',
  primaria: '#4a9ff5',
  primariaSuave: '#1a2a3a',
  tabBar: '#1c1c28',
  header: '#1c1c28',
  sucesso: '#30d158',
  perigo: '#ff453a',
  aviso: '#ffd60a',
  whatsapp: '#25d366',
  statusBar: 'light',
};

const TemaContext = createContext<Tema>({ cores: CLARO, isDark: false, toggle: () => {} });

type Props = { children: React.ReactNode; inicial?: 'claro' | 'escuro' };

export function TemaProvider({ children, inicial = 'claro' }: Props) {
  const [isDark, setIsDark] = useState(inicial === 'escuro');

  const toggle = useCallback(async () => {
    setIsDark((prev) => {
      const novo = !prev;
      salvarConfiguracao('tema', novo ? 'escuro' : 'claro');
      return novo;
    });
  }, []);

  const value = useMemo(
    () => ({ cores: isDark ? ESCURO : CLARO, isDark, toggle }),
    [isDark, toggle]
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema(): Tema {
  return useContext(TemaContext);
}
