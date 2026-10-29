import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, GhostButton, GradientButton, IconButton, StatTile } from '../../components/ui';
import { WorkoutDetail } from '../../components/WorkoutDetail';
import { quoteOfDay } from '../../data/presets';
import { formatDurationCompact, formatLong } from '../../lib/date';
import { formatVolume, recordsInWorkout, workoutSetCount, workoutVolume } from '../../lib/stats';
import { useStore } from '../../store/store';
import { colors, font, gradients, radius } from '../../theme';

export default function WorkoutLog() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const insets = useSafeAreaInsets();
  const { state, deleteWorkout } = useStore();
  const workout = state.workouts.find((w) => w.id === id);
  const records = useMemo(() => (workout ? recordsInWorkout(state.workouts, workout) : new Set<string>()), [state.workouts, workout]);

  if (!workout) {
    return <EmptyState icon="alert-circle-outline" title="Training nicht gefunden" />;
  }

  const isFresh = fresh === '1';
  const remove = () =>
    Alert.alert('Training löschen?', 'Das kann nicht rückgängig gemacht werden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteWorkout(workout.id);
        },
      },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: isFresh ? '' : workout.title,
          headerBackVisible: !isFresh,
          headerRight: () => <IconButton icon="trash-outline" color={colors.muted} onPress={remove} />,
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {isFresh ? (
          <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.celebrate}>
            <Ionicons name={records.size ? 'trophy' : 'flash'} size={44} color={colors.onAccent} />
            <Text style={styles.celebrateTitle}>{records.size === 1 ? 'Neuer Rekord!' : records.size > 1 ? `${records.size} neue Rekorde!` : 'Training geschafft!'}</Text>
            <Text style={styles.celebrateText}>{quoteOfDay()}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.date}>{formatLong(workout.date)}</Text>
        )}

        {isFresh && <Text style={styles.title}>{workout.title}</Text>}

        <View style={styles.stats}>
          <StatTile icon="time-outline" label="Dauer" value={formatDurationCompact(workout.endedAt - workout.startedAt)} />
          <StatTile icon="barbell-outline" label="Volumen" value={formatVolume(workoutVolume(workout))} />
        </View>
        <View style={styles.stats}>
          <StatTile icon="layers-outline" label="Sätze" value={String(workoutSetCount(workout))} />
          <StatTile icon="trophy-outline" label="Rekorde" value={String(records.size)} />
        </View>

        <Text style={styles.section}>Übungen</Text>
        <WorkoutDetail workout={workout} />

        {isFresh && <GradientButton label="Fertig" icon="checkmark" onPress={() => router.dismissTo('/')} style={{ marginTop: 24 }} />}
        {!isFresh && <GhostButton label="Zurück" onPress={() => router.back()} style={{ marginTop: 24 }} />}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 10 },
  celebrate: { borderRadius: radius.lg, padding: 24, alignItems: 'center', gap: 8, marginBottom: 6 },
  celebrateTitle: { color: colors.onAccent, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  celebrateText: { color: colors.onAccent, opacity: 0.75, fontWeight: '600', textAlign: 'center' },
  title: { color: colors.text, ...font.h2, marginTop: 6 },
  date: { color: colors.muted, ...font.body, marginBottom: 6 },
  stats: { flexDirection: 'row', gap: 10 },
  section: { color: colors.text, ...font.h3, marginTop: 18, marginBottom: 2 },
});
