import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = { onConcluir: () => void; dbPronto: boolean };

export default function SplashScreen({ onConcluir, dbPronto }: Props) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const [minTimeOk, setMinTimeOk] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => setMinTimeOk(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (minTimeOk && dbPronto) {
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) onConcluir(); }
      );
    }
  }, [minTimeOk, dbPronto]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View style={{ opacity: fadeIn, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.iconCircle}>
          <Ionicons name="cut" size={54} color="#fff" />
        </View>
        <Text style={styles.titulo}>Barber Scheduler</Text>
        <Text style={styles.sub}>Gerencie sua barbearia</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6 },
});
