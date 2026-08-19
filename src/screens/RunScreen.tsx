import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { StatCard } from '../components/StatCard';
import { colors, spacing } from '../theme';
import type { RunSnapshot, Settings } from '../types';
import {
  distanceUnitLabel,
  formatCalories,
  formatClock,
  formatDistanceValue,
  formatPace,
  formatSpeed,
  formatSteps,
  speedUnitLabel,
} from '../utils/format';

interface Props {
  snapshot: RunSnapshot;
  settings: Settings;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function RunScreen({ snapshot, settings, onStart, onPause, onStop }: Props) {
  const { units } = settings;
  const statusLabel =
    snapshot.status === 'running'
      ? 'Tracking'
      : snapshot.status === 'paused'
        ? 'Paused'
        : 'Ready';

  return (
    <Screen
      title="Track my run"
      subtitle={statusLabel}
      scroll
    >
      <View style={styles.hero}>
        <StatCard
          large
          label="Distance"
          value={formatDistanceValue(snapshot.distanceMeters, units)}
          unit={distanceUnitLabel(units)}
        />
      </View>

      <View style={styles.grid}>
        <StatCard label="Time" value={formatClock(snapshot.elapsedMs)} />
        <StatCard
          label="Speed"
          value={formatSpeed(snapshot.currentSpeedMps, units)}
          unit={speedUnitLabel(units)}
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Steps"
          value={formatSteps(snapshot.steps)}
          hint={snapshot.usingStepEstimate ? 'Estimated from distance' : 'Pedometer'}
        />
        <StatCard
          label="Calories"
          value={formatCalories(snapshot.calories)}
          unit="kcal"
          hint="Estimated from speed & weight"
        />
      </View>
      <View style={styles.grid}>
        <StatCard label="Pace" value={formatPace(snapshot.currentSpeedMps, units)} />
        <StatCard
          label="GPS"
          value={snapshot.gpsReady ? 'Live' : 'Off'}
          hint={
            snapshot.gpsAccuracy != null
              ? `Accuracy ${Math.round(snapshot.gpsAccuracy)} m`
              : 'Waiting for a fix'
          }
        />
      </View>

      {snapshot.permissionError ? (
        <Text style={styles.error}>{snapshot.permissionError}</Text>
      ) : null}

      <View style={styles.actions}>
        {snapshot.status === 'idle' ? (
          <PrimaryButton label="Start tracking" onPress={onStart} />
        ) : (
          <>
            {snapshot.status === 'running' ? (
              <PrimaryButton label="Pause" onPress={onPause} variant="ghost" />
            ) : (
              <PrimaryButton label="Resume" onPress={onStart} variant="mint" />
            )}
            <PrimaryButton label="Stop & save" onPress={onStop} variant="danger" />
          </>
        )}
      </View>
      <Text style={styles.help}>
        Keep tracking on while you run. On the installed app, a notification stays up so GPS
        continues if the phone locks or you open YouTube. Choose Allow all the time for location.
        Calories are an estimate based on your weight in Profile.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  error: {
    color: colors.red,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  help: {
    color: colors.muted2,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
