import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  large?: boolean;
}

export function StatCard({ label, value, unit, hint, large }: Props) {
  return (
    <View style={[styles.card, large && styles.large]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={[styles.value, large && styles.valueLarge]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  large: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  valueLarge: {
    fontSize: 56,
    letterSpacing: -1,
  },
  unit: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.muted2,
    fontSize: 12,
    marginTop: 4,
  },
});
