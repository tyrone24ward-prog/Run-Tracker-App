import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { StatCard } from '../components/StatCard';
import { colors, radius, spacing } from '../theme';
import type { Settings } from '../types';
import type { HistoryStats } from '../utils/storage';
import {
  distanceUnitLabel,
  formatCalories,
  formatDayLabel,
  formatDistance,
  formatSpeed,
  formatSteps,
  speedUnitLabel,
} from '../utils/format';

interface Props {
  stats: HistoryStats;
  settings: Settings;
}

export function StatsScreen({ stats, settings }: Props) {
  const { units } = settings;
  const maxDistance = Math.max(1, ...stats.records.map((d) => d.distanceMeters));

  const shareAverages = async () => {
    const message = [
      'My 14-day Run Tracker averages',
      '',
      `Steps: ${formatSteps(stats.avgSteps)} / day`,
      `Distance: ${formatDistance(stats.avgDistanceMeters, units)} / day`,
      `Speed: ${formatSpeed(stats.avgSpeedMps, units)} ${speedUnitLabel(units)}`,
      `Calories: ${formatCalories(stats.avgCalories)} kcal / day`,
    ].join('\n');
    await Share.share({ message, title: 'Run Tracker averages' });
  };

  return (
    <Screen
      title="14-day stats"
      subtitle="Daily totals and averages"
      right={
        <Pressable onPress={shareAverages} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      }
    >
      <View style={styles.grid}>
        <StatCard
          label="Avg steps"
          value={formatSteps(stats.avgSteps)}
          hint="Per day"
        />
        <StatCard
          label="Avg distance"
          value={formatDistance(stats.avgDistanceMeters, units, 2)}
          hint="Per day"
        />
      </View>
      <View style={styles.grid}>
        <StatCard
          label="Avg speed"
          value={formatSpeed(stats.avgSpeedMps, units)}
          unit={speedUnitLabel(units)}
          hint="While tracking"
        />
        <StatCard
          label="Avg calories"
          value={formatCalories(stats.avgCalories)}
          unit="kcal"
          hint="Per day"
        />
      </View>

      <Text style={styles.section}>Daily totals</Text>
      {stats.records
        .slice()
        .reverse()
        .map((day) => (
          <View key={day.date} style={styles.day}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{formatDayLabel(day.date)}</Text>
              <Text style={styles.dayDistance}>
                {formatDistance(day.distanceMeters, units)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(4, (day.distanceMeters / maxDistance) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.dayMeta}>
              {formatSteps(day.steps)} steps · {formatCalories(day.calories)} kcal
            </Text>
          </View>
        ))}
      <Text style={styles.footer}>
        Averages include all {stats.keys.length} days. Speed is total distance divided
        by tracked time. Units: {distanceUnitLabel(units)}.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shareBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    marginLeft: 12,
    marginTop: 6,
  },
  shareText: {
    color: '#10140A',
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  day: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  dayDistance: {
    color: colors.accent,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  dayMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    color: colors.muted2,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
});
