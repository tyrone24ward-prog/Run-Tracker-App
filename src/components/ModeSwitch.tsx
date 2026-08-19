import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { TimerMode } from '../types';

const MODES: { id: TimerMode; label: string }[] = [
  { id: 'countdown', label: 'Timer' },
  { id: 'stopwatch', label: 'Stopwatch' },
  { id: 'tabata', label: 'Tabata' },
];

interface Props {
  mode: TimerMode;
  onChange: (mode: TimerMode) => void;
}

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {MODES.map((item) => {
        const active = item.id === mode;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  active: {
    backgroundColor: colors.surface2,
  },
  text: {
    color: colors.muted,
    fontWeight: '700',
  },
  textActive: {
    color: colors.accent,
  },
});
