import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, dateKey, formatWeekRange, startOfWeek, WEEKDAYS_SHORT } from '../lib/date';
import type { DayPlan, Weekday, Workout } from '../lib/types';
import { colors, radius } from '../theme';
import { IconButton, tap } from './ui';

export function WeekStrip({
  offset,
  onChangeOffset,
  plans,
  byDate,
  onPressDay,
}: {
  offset: number;
  onChangeOffset: (n: number) => void;
  plans: Record<Weekday, DayPlan>;
  byDate: Map<string, Workout[]>;
  onPressDay: (date: string) => void;
}) {
  const start = startOfWeek(new Date(), offset);
  const today = dateKey();
  const label = offset === 0 ? 'Diese Woche' : offset === -1 ? 'Letzte Woche' : offset === 1 ? 'Nächste Woche' : formatWeekRange(start);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" onPress={() => onChangeOffset(offset - 1)} color={colors.muted} />
        <Pressable onPress={() => offset !== 0 && onChangeOffset(0)} style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.range}>{formatWeekRange(start)}</Text>
        </Pressable>
        <IconButton icon="chevron-forward" onPress={() => onChangeOffset(offset + 1)} color={colors.muted} />
      </View>

      <View style={styles.row}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(start, i);
          const key = dateKey(d);
          const plan = plans[i as Weekday];
          const done = byDate.has(key);
          const isToday = key === today;
          const isPast = key < today;
          const planned = plan.items.length > 0;
          const missed = isPast && planned && !done;

          return (
            <Pressable
              key={key}
              onPress={() => {
                tap();
                onPressDay(key);
              }}
              style={({ pressed }) => [
                styles.day,
                isToday && styles.dayToday,
                done && styles.dayDone,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.dayName, isToday && styles.textToday, done && styles.textDone]}>{WEEKDAYS_SHORT[i]}</Text>
              <Text style={[styles.dayNum, isToday && styles.textToday, done && styles.textDone]}>{d.getDate()}</Text>
              <Text
                numberOfLines={1}
                style={[styles.planLabel, done && styles.textDone, !planned && { color: colors.faint }]}
              >
                {planned ? shortTitle(plan.title) : 'Ruhe'}
              </Text>
              <View style={styles.statusSlot}>
                {done ? (
                  <Ionicons name="checkmark-circle" size={14} color={colors.onAccent} />
                ) : missed ? (
                  <View style={[styles.dot, { backgroundColor: colors.faint }]} />
                ) : planned ? (
                  <View style={[styles.dot, { backgroundColor: isToday ? colors.accent : colors.border }]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function shortTitle(title: string): string {
  const t = title.replace(/\s*day$/i, '').trim();
  return t.length > 6 ? t.slice(0, 5) + '.' : t || 'Plan';
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  range: { color: colors.muted, fontSize: 12, marginTop: 1 },
  row: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  dayToday: { borderColor: colors.accent, borderWidth: 1.5 },
  dayDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayName: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dayNum: { color: colors.text, fontSize: 18, fontWeight: '800' },
  planLabel: { color: colors.muted, fontSize: 9.5, fontWeight: '700', maxWidth: '92%' },
  textToday: { color: colors.accent },
  textDone: { color: colors.onAccent },
  statusSlot: { height: 14, justifyContent: 'center', marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
