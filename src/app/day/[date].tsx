import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseImage } from '../../components/ExerciseImage';
import { EmptyState, GhostButton, GradientButton } from '../../components/ui';
import { WorkoutDetail } from '../../components/WorkoutDetail';
import { dateKey, formatDuration, formatLong, parseKey, WEEKDAYS, weekdayOf } from '../../lib/date';
import { formatVolume, workoutVolume } from '../../lib/stats';
import { useStore } from '../../store/store';
import { useExercises } from '../../store/useExercises';
import { colors, font, radius } from '../../theme';

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const { state, startWorkout } = useStore();
  const { get } = useExercises();

  const weekday = weekdayOf(parseKey(date));
  const plan = state.plans[weekday];
  const workouts = state.workouts.filter((w) => w.date === date).sort((a, b) => a.startedAt - b.startedAt);
  const today = dateKey();
  const isToday = date === today;
  const isFuture = date > today;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.kicker}>{isToday ? 'HEUTE' : isFuture ? 'GEPLANT' : 'RÜCKBLICK'}</Text>
        <Text style={styles.title}>{formatLong(date)}</Text>

        {/* Was wurde an diesem Tag trainiert? */}
        {workouts.map((w) => (
          <View key={w.id} style={{ gap: 12, marginTop: 18 }}>
            <Pressable onPress={() => router.push(`/log/${w.id}`)} style={styles.summary}>
              <View style={styles.summaryIcon}>
                <Ionicons name="checkmark-done" size={20} color={colors.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>{w.title}</Text>
                <Text style={styles.summarySub}>
                  {formatDuration(w.endedAt - w.startedAt, false)} · {formatVolume(workoutVolume(w))} ·{' '}
                  {new Date(w.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Pressable>
            <WorkoutDetail workout={w} />
          </View>
        ))}

        {workouts.length === 0 && !isFuture && (
          <EmptyState
            icon={plan.items.length ? 'bed-outline' : 'moon-outline'}
            title={isToday ? 'Noch kein Training heute' : 'Kein Training eingetragen'}
            text={plan.items.length ? `Geplant war: ${plan.title || 'Training'}` : 'Das war ein Ruhetag.'}
          />
        )}

        {isToday && !state.active && workouts.length === 0 && plan.items.length > 0 && (
          <GradientButton
            label="Training starten"
            icon="play"
            onPress={() => {
              startWorkout();
              router.replace('/workout');
            }}
          />
        )}

        {/* Wöchentlicher Plan für diesen Wochentag */}
        <View style={styles.planHeader}>
          <Text style={styles.section}>Plan für jeden {WEEKDAYS[weekday]}</Text>
        </View>
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.items.length ? plan.title || 'Training' : 'Ruhetag'}</Text>
          {plan.items.map((item) => {
            const ex = get(item.exerciseId);
            return (
              <View key={item.exerciseId} style={styles.planRow}>
                <ExerciseImage exercise={ex} size={36} rounded={9} />
                <Text style={styles.planEx} numberOfLines={1}>
                  {ex?.name ?? item.exerciseId}
                </Text>
                <Text style={styles.planSets}>{item.sets} Sätze</Text>
              </View>
            );
          })}
        </View>
        <GhostButton
          label={`${WEEKDAYS[weekday]}-Plan bearbeiten`}
          icon="create-outline"
          onPress={() => router.push(`/plan/${weekday}`)}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 4 },
  kicker: { color: colors.accent, ...font.tiny },
  title: { color: colors.text, ...font.h2, marginTop: 4 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 14,
  },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  summarySub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  planHeader: { marginTop: 28, marginBottom: 10 },
  section: { color: colors.text, ...font.h3 },
  planCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  planTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planEx: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  planSets: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
