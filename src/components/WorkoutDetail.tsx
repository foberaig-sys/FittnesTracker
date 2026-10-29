import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setLabels } from '../data/exercises';
import { formatKg, isBetter, personalRecord } from '../lib/stats';
import type { Workout } from '../lib/types';
import { useStore } from '../store/store';
import { useExercises } from '../store/useExercises';
import { colors, radius } from '../theme';
import { ExerciseImage } from './ExerciseImage';
import { PRBadge } from './ui';

/** Liste aller Übungen eines Trainings mit Gewicht pro Satz. */
export function WorkoutDetail({ workout }: { workout: Workout }) {
  const { state } = useStore();
  const { get } = useExercises();

  if (workout.exercises.length === 0) {
    return <Text style={styles.muted}>Keine Sätze eingetragen.</Text>;
  }

  return (
    <View style={{ gap: 12 }}>
      {workout.exercises.map((e, i) => {
        const ex = get(e.exerciseId);
        const labels = setLabels(ex);
        const before = personalRecord(state.workouts, e.exerciseId, workout.startedAt);
        // Nur den ersten Satz markieren, der den alten Rekord übertrifft
        let prIndex = -1;
        let best = before;
        e.sets.forEach((s, j) => {
          if (before && isBetter(s, best)) {
            best = { ...s, date: workout.date, e1rm: 0 };
            prIndex = j;
          }
        });

        return (
          <Pressable
            key={`${e.exerciseId}-${i}`}
            onPress={() => ex && router.push(`/exercise/${ex.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.head}>
              <ExerciseImage exercise={ex} size={46} rounded={12} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {ex?.name ?? 'Unbekannte Übung'}
                </Text>
                {prIndex >= 0 && <PRBadge text="Neuer Rekord!" />}
              </View>
            </View>
            {e.sets.map((s, j) => (
              <View key={j} style={styles.setRow}>
                <Text style={styles.setIdx}>{j + 1}</Text>
                <Text style={[styles.setVal, j === prIndex && { color: colors.gold }]}>
                  {s.weight > 0 ? `${formatKg(s.weight)} ${labels.weight}` : labels.weight === 'kg' ? 'Körpergewicht' : '–'}
                </Text>
                <Text style={styles.setReps}>
                  × {s.reps} {labels.reps}
                </Text>
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  setIdx: { color: colors.faint, width: 28, fontWeight: '800' },
  setVal: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  setReps: { color: colors.muted, fontWeight: '600', fontSize: 15 },
});
