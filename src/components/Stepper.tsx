import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}

export function Stepper({ label, value, onMinus, onPlus }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={onMinus} style={styles.btn}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  value: {
    color: colors.text,
    minWidth: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    fontSize: 16,
  },
});
