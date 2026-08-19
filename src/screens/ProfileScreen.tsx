import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Stepper } from '../components/Stepper';
import { colors, radius, spacing } from '../theme';
import type { Settings, UnitSystem } from '../types';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export function ProfileScreen({ settings, onChange }: Props) {
  const weightDisplay =
    settings.units === 'imperial'
      ? `${Math.round(settings.weightKg * 2.20462)} lb`
      : `${Math.round(settings.weightKg)} kg`;
  const heightDisplay =
    settings.units === 'imperial'
      ? formatFeetInches(settings.heightCm)
      : `${Math.round(settings.heightCm)} cm`;

  const changeWeight = (deltaKg: number) => {
    onChange({ weightKg: Math.min(200, Math.max(35, settings.weightKg + deltaKg)) });
  };

  const changeHeight = (deltaCm: number) => {
    onChange({ heightCm: Math.min(220, Math.max(120, settings.heightCm + deltaCm)) });
  };

  const setUnits = (units: UnitSystem) => onChange({ units });

  return (
    <Screen title="Profile" subtitle="Used for calories and step estimates">
      <Text style={styles.section}>Units</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setUnits('imperial')}
          style={[styles.segItem, settings.units === 'imperial' && styles.segActive]}
        >
          <Text style={styles.segText}>Miles / mph</Text>
        </Pressable>
        <Pressable
          onPress={() => setUnits('metric')}
          style={[styles.segItem, settings.units === 'metric' && styles.segActive]}
        >
          <Text style={styles.segText}>Km / km/h</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Body</Text>
      <Stepper
        label="Weight"
        value={weightDisplay}
        onMinus={() => changeWeight(settings.units === 'imperial' ? -0.45 : -1)}
        onPlus={() => changeWeight(settings.units === 'imperial' ? 0.45 : 1)}
      />
      <Stepper
        label="Height"
        value={heightDisplay}
        onMinus={() => changeHeight(settings.units === 'imperial' ? -2.54 : -1)}
        onPlus={() => changeHeight(settings.units === 'imperial' ? 2.54 : 1)}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How estimates work</Text>
        <Text style={styles.body}>
          Calories use MET values based on your current speed and the weight above.
          If the phone cannot count steps, stride length is estimated from height.
        </Text>
        <Text style={styles.body}>
          Daily totals stay on this device for 14 days. Share your averages from the Stats tab.
        </Text>
      </View>
    </Screen>
  );
}

function formatFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

const styles = StyleSheet.create({
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  segItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  segActive: {
    backgroundColor: colors.surface2,
  },
  segText: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
});
