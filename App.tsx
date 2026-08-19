import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { TabBar } from './src/components/TabBar';
import { useCountdownTimer } from './src/hooks/useCountdownTimer';
import { useHistory } from './src/hooks/useHistory';
import { useRunTracker } from './src/hooks/useRunTracker';
import { useSettings } from './src/hooks/useSettings';
import { useStopwatch } from './src/hooks/useStopwatch';
import { useTabata } from './src/hooks/useTabata';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RunScreen } from './src/screens/RunScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { TimersScreen } from './src/screens/TimersScreen';
import { colors } from './src/theme';
import type { TabId, TimerMode } from './src/types';

function KeepAwakeOn() {
  useKeepAwake();
  return null;
}

export default function App() {
  const [tab, setTab] = useState<TabId>('run');
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const { settings, update } = useSettings();
  const history = useHistory();
  const run = useRunTracker({ settings, onCommit: history.addDelta });
  const countdown = useCountdownTimer();
  const stopwatch = useStopwatch();
  const tabata = useTabata();

  const stayAwake = useMemo(
    () =>
      run.snapshot.status === 'running' ||
      countdown.running ||
      stopwatch.running ||
      tabata.running,
    [countdown.running, run.snapshot.status, stopwatch.running, tabata.running],
  );

  return (
    <SafeAreaProvider>
      {stayAwake ? <KeepAwakeOn /> : null}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.body}>
          {tab === 'run' ? (
            <RunScreen
              snapshot={run.snapshot}
              settings={settings}
              onStart={run.start}
              onPause={run.pause}
              onStop={run.stop}
            />
          ) : null}
          {tab === 'stats' ? (
            <StatsScreen stats={history.stats} settings={settings} />
          ) : null}
          {tab === 'timers' ? (
            <TimersScreen
              mode={timerMode}
              onModeChange={setTimerMode}
              countdown={{
                remainingMs: countdown.remainingMs,
                durationMs: countdown.durationMs,
                running: countdown.running,
                done: countdown.done,
                onStart: countdown.start,
                onPause: countdown.pause,
                onReset: countdown.reset,
                onSetDuration: countdown.setDuration,
              }}
              stopwatch={{
                elapsedMs: stopwatch.elapsedMs,
                running: stopwatch.running,
                laps: stopwatch.laps,
                onStart: stopwatch.start,
                onPause: stopwatch.pause,
                onLap: stopwatch.lap,
                onReset: stopwatch.reset,
              }}
              tabata={{
                config: tabata.config,
                phase: tabata.phase,
                round: tabata.round,
                remainingMs: tabata.remainingMs,
                phaseDuration: tabata.phaseDuration,
                running: tabata.running,
                paused: tabata.paused,
                onStart: tabata.start,
                onPause: tabata.pause,
                onReset: tabata.reset,
                onUpdateConfig: tabata.updateConfig,
              }}
            />
          ) : null}
          {tab === 'profile' ? (
            <ProfileScreen settings={settings} onChange={update} />
          ) : null}
        </View>
        <TabBar active={tab} onChange={setTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});
