import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ModeSwitch } from '../components/ModeSwitch';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { Stepper } from '../components/Stepper';
import { colors, radius, spacing } from '../theme';
import type { Lap, TimerMode } from '../types';
import { formatClock } from '../utils/format';
import type { TabataConfig, TabataPhase } from '../hooks/useTabata';

interface CountdownProps {
  remainingMs: number;
  durationMs: number;
  running: boolean;
  done: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetDuration: (ms: number) => void;
}

interface StopwatchProps {
  elapsedMs: number;
  running: boolean;
  laps: Lap[];
  onStart: () => void;
  onPause: () => void;
  onLap: () => void;
  onReset: () => void;
}

interface TabataProps {
  config: TabataConfig;
  phase: TabataPhase;
  round: number;
  remainingMs: number;
  phaseDuration: number;
  running: boolean;
  paused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onUpdateConfig: (patch: Partial<TabataConfig>) => void;
}

interface Props {
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  countdown: CountdownProps;
  stopwatch: StopwatchProps;
  tabata: TabataProps;
}

const PRESETS = [
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '20 min', ms: 20 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
];

function phaseLabel(phase: TabataPhase, paused: boolean): string {
  if (paused) return 'Paused';
  if (phase === 'prepare') return 'Get ready';
  if (phase === 'work') return 'Work';
  if (phase === 'rest') return 'Rest';
  if (phase === 'done') return 'Complete';
  return 'Tabata';
}

function phaseColor(phase: TabataPhase): string {
  if (phase === 'work') return colors.mint;
  if (phase === 'rest') return colors.orange;
  if (phase === 'done') return colors.accent;
  return colors.blue;
}

export function TimersScreen({
  mode,
  onModeChange,
  countdown,
  stopwatch,
  tabata,
}: Props) {
  return (
    <Screen title="Timers" subtitle="Countdown, laps, and Tabata">
      <ModeSwitch mode={mode} onChange={onModeChange} />
      {mode === 'countdown' ? <CountdownView {...countdown} /> : null}
      {mode === 'stopwatch' ? <StopwatchView {...stopwatch} /> : null}
      {mode === 'tabata' ? <TabataView {...tabata} /> : null}
    </Screen>
  );
}

function CountdownView({
  remainingMs,
  durationMs,
  running,
  done,
  onStart,
  onPause,
  onReset,
  onSetDuration,
}: CountdownProps) {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return (
    <View>
      <Text style={styles.clock}>{formatClock(remainingMs)}</Text>
      {done ? <Text style={styles.done}>Time’s up</Text> : null}
      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => onSetDuration(preset.ms)}
            disabled={running}
            style={[styles.chip, durationMs === preset.ms && styles.chipActive]}
          >
            <Text style={styles.chipText}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>
      <Stepper
        label="Minutes"
        value={`${minutes}`}
        onMinus={() => onSetDuration(Math.max(1000, durationMs - 60_000))}
        onPlus={() => onSetDuration(durationMs + 60_000)}
      />
      <Stepper
        label="Seconds"
        value={`${seconds}`}
        onMinus={() => onSetDuration(Math.max(1000, durationMs - 10_000))}
        onPlus={() => onSetDuration(durationMs + 10_000)}
      />
      <View style={styles.actions}>
        {running ? (
          <PrimaryButton label="Pause" onPress={onPause} variant="ghost" />
        ) : (
          <PrimaryButton label={done ? 'Restart' : 'Start timer'} onPress={onStart} />
        )}
        <PrimaryButton label="Reset" onPress={onReset} variant="ghost" />
      </View>
    </View>
  );
}

function StopwatchView({
  elapsedMs,
  running,
  laps,
  onStart,
  onPause,
  onLap,
  onReset,
}: StopwatchProps) {
  return (
    <View>
      <Text style={styles.clock}>{formatClock(elapsedMs, true)}</Text>
      <View style={styles.actions}>
        {running ? (
          <>
            <PrimaryButton label="Lap" onPress={onLap} variant="mint" />
            <PrimaryButton label="Pause" onPress={onPause} variant="ghost" />
          </>
        ) : (
          <>
            <PrimaryButton label={elapsedMs > 0 ? 'Resume' : 'Start stopwatch'} onPress={onStart} />
            <PrimaryButton label="Reset" onPress={onReset} variant="ghost" disabled={elapsedMs === 0} />
          </>
        )}
      </View>
      {laps.length > 0 ? (
        <View style={styles.laps}>
          <View style={styles.lapHeader}>
            <Text style={styles.lapHead}>Lap</Text>
            <Text style={styles.lapHead}>Split</Text>
            <Text style={styles.lapHead}>Total</Text>
          </View>
          {laps.map((lap) => (
            <View key={lap.index} style={styles.lapRow}>
              <Text style={styles.lapCell}>{lap.index}</Text>
              <Text style={styles.lapCell}>{formatClock(lap.splitMs, true)}</Text>
              <Text style={styles.lapCell}>{formatClock(lap.totalMs, true)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Start the stopwatch, then tap Lap to mark splits.</Text>
      )}
    </View>
  );
}

function TabataView({
  config,
  phase,
  round,
  remainingMs,
  phaseDuration,
  running,
  paused,
  onStart,
  onPause,
  onReset,
  onUpdateConfig,
}: TabataProps) {
  const progress = phaseDuration > 0 ? 1 - remainingMs / phaseDuration : 0;
  const color = phaseColor(phase);
  return (
    <View>
      <View style={[styles.tabataCard, { borderColor: color }]}>
        <Text style={[styles.phase, { color }]}>{phaseLabel(phase, paused)}</Text>
        <Text style={styles.clock}>{formatClock(remainingMs)}</Text>
        <Text style={styles.round}>
          Round {Math.min(round, config.rounds)} / {config.rounds}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Stepper
        label="Work"
        value={`${config.workSec}s`}
        onMinus={() => onUpdateConfig({ workSec: Math.max(5, config.workSec - 5) })}
        onPlus={() => onUpdateConfig({ workSec: config.workSec + 5 })}
      />
      <Stepper
        label="Rest"
        value={`${config.restSec}s`}
        onMinus={() => onUpdateConfig({ restSec: Math.max(5, config.restSec - 5) })}
        onPlus={() => onUpdateConfig({ restSec: config.restSec + 5 })}
      />
      <Stepper
        label="Rounds"
        value={`${config.rounds}`}
        onMinus={() => onUpdateConfig({ rounds: Math.max(1, config.rounds - 1) })}
        onPlus={() => onUpdateConfig({ rounds: config.rounds + 1 })}
      />
      <View style={styles.actions}>
        {running ? (
          <PrimaryButton label="Pause" onPress={onPause} variant="ghost" />
        ) : (
          <PrimaryButton
            label={paused ? 'Resume' : phase === 'done' ? 'Restart' : 'Start Tabata'}
            onPress={onStart}
          />
        )}
        <PrimaryButton label="Reset" onPress={onReset} variant="ghost" />
      </View>
      <Text style={styles.hint}>
        Classic Tabata is 20 seconds work, 10 seconds rest, 8 rounds. Your phone will vibrate on each phase change.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clock: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginVertical: 12,
  },
  done: {
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  laps: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  lapHeader: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lapHead: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  lapRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lapCell: {
    flex: 1,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  hint: {
    color: colors.muted2,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  tabataCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  phase: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  round: {
    color: colors.muted,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
