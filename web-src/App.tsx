import { useMemo, useState } from 'react';
import type { Lap, Settings, TabId, TimerMode } from '../src/types';
import {
  distanceUnitLabel,
  formatCalories,
  formatClock,
  formatDayLabel,
  formatDistance,
  formatDistanceValue,
  formatPace,
  formatSpeed,
  formatSteps,
  speedUnitLabel,
} from '../src/utils/format';
import { averagesFor, addHistoryDelta, loadHistory, loadSettings, saveSettings } from './storage';
import { useRunTracker } from './useRunTracker';
import { useCountdown, useStopwatch, useTabata } from './useTimers';

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'run', label: 'Run' },
  { id: 'stats', label: 'Stats' },
  { id: 'timers', label: 'Timers' },
  { id: 'profile', label: 'Me' },
];

const WALLPAPER_SRC = './vader-wallpaper.png';

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [history, setHistory] = useState(() => loadHistory());
  const stats = useMemo(() => averagesFor(history), [history]);
  const run = useRunTracker({
    settings,
    onCommit: (delta) => setHistory((prev) => addHistoryDelta(prev, delta)),
  });
  const countdown = useCountdown();
  const stopwatch = useStopwatch();
  const tabata = useTabata();

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className={tab === 'home' ? 'app on-home' : 'app'}>
      <img className="app-wallpaper" src={WALLPAPER_SRC} alt="" />
      <main className="body">
        {tab === 'home' && <HomeView />}
        {tab === 'run' && (
          <RunView snapshot={run.snapshot} settings={settings} onStart={run.start} onPause={run.pause} onStop={run.stop} />
        )}
        {tab === 'stats' && <StatsView stats={stats} settings={settings} />}
        {tab === 'timers' && (
          <TimersView
            mode={timerMode}
            onModeChange={setTimerMode}
            countdown={countdown}
            stopwatch={stopwatch}
            tabata={tabata}
          />
        )}
        {tab === 'profile' && <ProfileView settings={settings} onChange={updateSettings} />}
      </main>
      <nav className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'tab active' : 'tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeView() {
  return (
    <section className="home">
      <h1 className="home-title">You Better Run</h1>
      <img className="home-hero" src={WALLPAPER_SRC} alt="Darth Vader" />
    </section>
  );
}

function RunView({
  snapshot,
  settings,
  onStart,
  onPause,
  onStop,
}: {
  snapshot: ReturnType<typeof useRunTracker>['snapshot'];
  settings: Settings;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}) {
  const { units } = settings;
  const status =
    snapshot.status === 'running' ? 'Tracking' : snapshot.status === 'paused' ? 'Paused' : 'Ready';
  return (
    <section>
      <header>
        <h1>Track my run</h1>
        <p className="sub">{status}</p>
      </header>
      <article className="card hero">
        <span className="label">Distance</span>
        <div className="hero-row">
          <strong>{formatDistanceValue(snapshot.distanceMeters, units)}</strong>
          <span>{distanceUnitLabel(units)}</span>
        </div>
      </article>
      <div className="grid">
        <Stat label="Time" value={formatClock(snapshot.elapsedMs)} />
        <Stat label="Speed" value={formatSpeed(snapshot.currentSpeedMps, units)} unit={speedUnitLabel(units)} />
        <Stat label="Steps" value={formatSteps(snapshot.steps)} hint="Estimated from distance" />
        <Stat label="Calories" value={formatCalories(snapshot.calories)} unit="kcal" />
        <Stat label="Pace" value={formatPace(snapshot.currentSpeedMps, units)} />
        <Stat
          label="GPS"
          value={snapshot.gpsReady ? 'Live' : 'Off'}
          hint={
            snapshot.gpsAccuracy != null
              ? `Accuracy ${Math.round(snapshot.gpsAccuracy)} m`
              : 'Waiting for a fix'
          }
        />
      </div>
      {snapshot.permissionError ? <p className="error">{snapshot.permissionError}</p> : null}
      <div className="actions">
        {snapshot.status === 'idle' ? (
          <button className="btn primary" onClick={onStart}>
            Start tracking
          </button>
        ) : (
          <>
            {snapshot.status === 'running' ? (
              <button className="btn ghost" onClick={onPause}>
                Pause
              </button>
            ) : (
              <button className="btn mint" onClick={onStart}>
                Resume
              </button>
            )}
            <button className="btn danger" onClick={onStop}>
              Stop & save
            </button>
          </>
        )}
      </div>
      <p className="hint">Keep this page open while you run.</p>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <article className="card">
      <span className="label">{label}</span>
      <div className="value-row">
        <strong>{value}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

function StatsView({
  stats,
  settings,
}: {
  stats: ReturnType<typeof averagesFor>;
  settings: Settings;
}) {
  const { units } = settings;
  const maxDistance = Math.max(1, ...stats.records.map((d) => d.distanceMeters));
  const share = async () => {
    const message = [
      'My 14-day Run Tracker averages',
      '',
      `Steps: ${formatSteps(stats.avgSteps)} / day`,
      `Distance: ${formatDistance(stats.avgDistanceMeters, units)} / day`,
      `Speed: ${formatSpeed(stats.avgSpeedMps, units)} ${speedUnitLabel(units)}`,
      `Calories: ${formatCalories(stats.avgCalories)} kcal / day`,
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Run Tracker averages', text: message });
      } else {
        await navigator.clipboard.writeText(message);
        alert('Averages copied to the clipboard.');
      }
    } catch {
      /* user cancelled */
    }
  };
  return (
    <section>
      <header className="header-row">
        <div>
          <h1>14-day stats</h1>
          <p className="sub">Daily totals and averages</p>
        </div>
        <button className="btn tiny" onClick={share}>
          Share
        </button>
      </header>
      <div className="grid">
        <Stat label="Avg steps" value={formatSteps(stats.avgSteps)} hint="Per day" />
        <Stat label="Avg distance" value={formatDistance(stats.avgDistanceMeters, units, 2)} hint="Per day" />
        <Stat
          label="Avg speed"
          value={formatSpeed(stats.avgSpeedMps, units)}
          unit={speedUnitLabel(units)}
          hint="While tracking"
        />
        <Stat label="Avg calories" value={formatCalories(stats.avgCalories)} unit="kcal" hint="Per day" />
      </div>
      <h2>Daily totals</h2>
      {stats.records
        .slice()
        .reverse()
        .map((day) => (
          <article key={day.date} className="day">
            <div className="day-head">
              <span>{formatDayLabel(day.date)}</span>
              <b>{formatDistance(day.distanceMeters, units)}</b>
            </div>
            <div className="bar">
              <i style={{ width: `${Math.max(4, (day.distanceMeters / maxDistance) * 100)}%` }} />
            </div>
            <small>
              {formatSteps(day.steps)} steps · {formatCalories(day.calories)} kcal
            </small>
          </article>
        ))}
    </section>
  );
}

function TimersView({
  mode,
  onModeChange,
  countdown,
  stopwatch,
  tabata,
}: {
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  countdown: ReturnType<typeof useCountdown>;
  stopwatch: ReturnType<typeof useStopwatch>;
  tabata: ReturnType<typeof useTabata>;
}) {
  return (
    <section>
      <header>
        <h1>Timers</h1>
        <p className="sub">Countdown, laps, and Tabata</p>
      </header>
      <div className="segment">
        {(['countdown', 'stopwatch', 'tabata'] as TimerMode[]).map((id) => (
          <button key={id} className={mode === id ? 'on' : ''} onClick={() => onModeChange(id)}>
            {id === 'countdown' ? 'Timer' : id === 'stopwatch' ? 'Stopwatch' : 'Tabata'}
          </button>
        ))}
      </div>
      {mode === 'countdown' && <Countdown timer={countdown} />}
      {mode === 'stopwatch' && <StopwatchView timer={stopwatch} />}
      {mode === 'tabata' && <TabataView timer={tabata} />}
    </section>
  );
}

function Countdown({ timer }: { timer: ReturnType<typeof useCountdown> }) {
  const minutes = Math.floor(timer.durationMs / 60000);
  const seconds = Math.floor((timer.durationMs % 60000) / 1000);
  return (
    <>
      <p className="clock">{formatClock(timer.remainingMs)}</p>
      {timer.done ? <p className="accent">Time’s up</p> : null}
      <div className="chips">
        {[5, 10, 20, 30].map((m) => (
          <button
            key={m}
            className={timer.durationMs === m * 60000 ? 'chip on' : 'chip'}
            onClick={() => timer.setDuration(m * 60000)}
          >
            {m} min
          </button>
        ))}
      </div>
      <Stepper
        label="Minutes"
        value={`${minutes}`}
        onMinus={() => timer.setDuration(Math.max(1000, timer.durationMs - 60000))}
        onPlus={() => timer.setDuration(timer.durationMs + 60000)}
      />
      <Stepper
        label="Seconds"
        value={`${seconds}`}
        onMinus={() => timer.setDuration(Math.max(1000, timer.durationMs - 10000))}
        onPlus={() => timer.setDuration(timer.durationMs + 10000)}
      />
      <div className="actions">
        {timer.running ? (
          <button className="btn ghost" onClick={timer.pause}>
            Pause
          </button>
        ) : (
          <button className="btn primary" onClick={timer.start}>
            {timer.done ? 'Restart' : 'Start timer'}
          </button>
        )}
        <button className="btn ghost" onClick={timer.reset}>
          Reset
        </button>
      </div>
    </>
  );
}

function StopwatchView({ timer }: { timer: ReturnType<typeof useStopwatch> }) {
  return (
    <>
      <p className="clock">{formatClock(timer.elapsedMs, true)}</p>
      <div className="actions">
        {timer.running ? (
          <>
            <button className="btn mint" onClick={timer.lap}>
              Lap
            </button>
            <button className="btn ghost" onClick={timer.pause}>
              Pause
            </button>
          </>
        ) : (
          <>
            <button className="btn primary" onClick={timer.start}>
              {timer.elapsedMs > 0 ? 'Resume' : 'Start stopwatch'}
            </button>
            <button className="btn ghost" onClick={timer.reset} disabled={timer.elapsedMs === 0}>
              Reset
            </button>
          </>
        )}
      </div>
      {timer.laps.length > 0 ? (
        <div className="laps">
          <div className="lap head">
            <span>Lap</span>
            <span>Split</span>
            <span>Total</span>
          </div>
          {timer.laps.map((lap: Lap) => (
            <div className="lap" key={lap.index}>
              <span>{lap.index}</span>
              <span>{formatClock(lap.splitMs, true)}</span>
              <span>{formatClock(lap.totalMs, true)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">Start the stopwatch, then tap Lap to mark splits.</p>
      )}
    </>
  );
}

function TabataView({ timer }: { timer: ReturnType<typeof useTabata> }) {
  const progress =
    timer.phaseDuration > 0 ? Math.min(100, (1 - timer.remainingMs / timer.phaseDuration) * 100) : 0;
  const phaseText = timer.paused
    ? 'Paused'
    : timer.phase === 'prepare'
      ? 'Get ready'
      : timer.phase === 'work'
        ? 'Work'
        : timer.phase === 'rest'
          ? 'Rest'
          : timer.phase === 'done'
            ? 'Complete'
            : 'Tabata';
  return (
    <>
      <article className={`tabata ${timer.phase}`}>
        <span className="label">{phaseText}</span>
        <p className="clock">{formatClock(timer.remainingMs)}</p>
        <p>
          Round {Math.min(timer.round, timer.config.rounds)} / {timer.config.rounds}
        </p>
        <div className="bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      </article>
      <Stepper
        label="Work"
        value={`${timer.config.workSec}s`}
        onMinus={() => timer.updateConfig({ workSec: Math.max(5, timer.config.workSec - 5) })}
        onPlus={() => timer.updateConfig({ workSec: timer.config.workSec + 5 })}
      />
      <Stepper
        label="Rest"
        value={`${timer.config.restSec}s`}
        onMinus={() => timer.updateConfig({ restSec: Math.max(5, timer.config.restSec - 5) })}
        onPlus={() => timer.updateConfig({ restSec: timer.config.restSec + 5 })}
      />
      <Stepper
        label="Rounds"
        value={`${timer.config.rounds}`}
        onMinus={() => timer.updateConfig({ rounds: Math.max(1, timer.config.rounds - 1) })}
        onPlus={() => timer.updateConfig({ rounds: timer.config.rounds + 1 })}
      />
      <div className="actions">
        {timer.running ? (
          <button className="btn ghost" onClick={timer.pause}>
            Pause
          </button>
        ) : (
          <button className="btn primary" onClick={timer.start}>
            {timer.paused ? 'Resume' : timer.phase === 'done' ? 'Restart' : 'Start Tabata'}
          </button>
        )}
        <button className="btn ghost" onClick={timer.reset}>
          Reset
        </button>
      </div>
    </>
  );
}

function ProfileView({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const weight =
    settings.units === 'imperial'
      ? `${Math.round(settings.weightKg * 2.20462)} lb`
      : `${Math.round(settings.weightKg)} kg`;
  const height =
    settings.units === 'imperial' ? formatFeetInches(settings.heightCm) : `${Math.round(settings.heightCm)} cm`;
  return (
    <section>
      <header>
        <h1>Profile</h1>
        <p className="sub">Used for calories and step estimates</p>
      </header>
      <h2>Units</h2>
      <div className="segment">
        <button
          className={settings.units === 'imperial' ? 'on' : ''}
          onClick={() => onChange({ units: 'imperial' })}
        >
          Miles / mph
        </button>
        <button
          className={settings.units === 'metric' ? 'on' : ''}
          onClick={() => onChange({ units: 'metric' })}
        >
          Km / km/h
        </button>
      </div>
      <h2>Body</h2>
      <Stepper
        label="Weight"
        value={weight}
        onMinus={() => onChange({ weightKg: clamp(settings.weightKg - (settings.units === 'imperial' ? 0.45 : 1), 35, 200) })}
        onPlus={() => onChange({ weightKg: clamp(settings.weightKg + (settings.units === 'imperial' ? 0.45 : 1), 35, 200) })}
      />
      <Stepper
        label="Height"
        value={height}
        onMinus={() => onChange({ heightCm: clamp(settings.heightCm - (settings.units === 'imperial' ? 2.54 : 1), 120, 220) })}
        onPlus={() => onChange({ heightCm: clamp(settings.heightCm + (settings.units === 'imperial' ? 2.54 : 1), 120, 220) })}
      />
      <article className="card">
        <h2>How to keep this on your phone</h2>
        <p className="hint">
          In Safari or Chrome, open the share/menu button and tap Add to Home Screen. No Expo
          account is needed.
        </p>
      </article>
    </section>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button onClick={onMinus}>−</button>
        <b>{value}</b>
        <button onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

function formatFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  return `${Math.floor(totalInches / 12)}'${Math.round(totalInches % 12)}"`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
