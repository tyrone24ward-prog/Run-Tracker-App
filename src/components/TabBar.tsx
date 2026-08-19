import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'run', label: 'Run', icon: '▶' },
  { id: 'stats', label: 'Stats', icon: '▦' },
  { id: 'timers', label: 'Timers', icon: '⏱' },
  { id: 'profile', label: 'Me', icon: '●' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.item, selected && styles.itemActive]}
          >
            <Text style={[styles.icon, selected && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: colors.surface2,
  },
  icon: {
    color: colors.muted2,
    fontSize: 16,
    marginBottom: 2,
  },
  iconActive: {
    color: colors.accent,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.text,
  },
});
