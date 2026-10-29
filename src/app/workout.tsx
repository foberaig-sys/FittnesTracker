import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseImage } from '../components/ExerciseImage';
import { GhostButton, IconButton, PRBadge, tap } from '../components/ui';
import { muscleSummary, setLabels } from '../data/exercises';
import { formatDuration } from '../lib/date';
import { formatKg, isBetter, personalRecord, previousSets, type Record_ } from '../lib/stats';
import type { ActiveExercise, ActiveSet, Exercise, SetEntry } from '../lib/types';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/store';
import { useExercises } from '../store/useExercises';
import { colors, font, gradients, radius } from '../theme';

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function WorkoutScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { state, finishWorkout, discardWorkout } = store;
  const { get } = useExercises();
  const active = state.active;
  const now = useNow(!!active);

  // Rekorde und letzte Werte zum Start des Trainings (ändern sich während des Trainings nicht)
  const ids = active?.exercises.map((e) => e.exerciseId).join('|') ?? '';
  const reference = useMemo(() => {
    const map = new Map<string, { pr: Record_ | null; prev: SetEntry[] | null }>();
    for (const id of ids.split('|').filter(Boolean)) {
      map.set(id, { pr: personalRecord(state.workouts, id), prev: previousSets(state.workouts, id) });
    }
    return map;
  }, [ids, state.workouts]);

  if (!active) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Kein aktives Training.</Text>
        <GhostButton label="Zurück" onPress={() => router.back()} />
      </View>
    );
  }

  const totalSets = active.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = active.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0);

  const finish = () => {
    const noneDone = doneSets === 0;
    Alert.alert(
      'Training beenden?',
      noneDone ? 'Du hast noch keinen Satz abgehakt.' : `${doneSets} von ${totalSets} Sätzen erledigt – stark!`,
      [
        { text: 'Weiter trainieren', style: 'cancel' },
        {
          text: 'Beenden',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            const id = finishWorkout();
            router.replace(`/log/${id}?fresh=1`);
          },
        },
      ],
    );
  };

  const discard = () => {
    Alert.alert('Training verwerfen?', 'Alle Einträge dieses Trainings gehen verloren.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Verwerfen',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Kopf mit Timer */}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <View style={styles.topRow}>
          <IconButton icon="chevron-down" size={26} onPress={() => router.back()} />
          <Text style={styles.topTitle} numberOfLines={1}>
            {active.title}
          </Text>
          <Pressable onPress={finish} style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.finishText}>Beenden</Text>
          </Pressable>
        </View>
        <Text style={styles.timer}>{formatDuration(now - active.startedAt)}</Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {doneSets}/{totalSets} Sätze
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 140 }]}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {active.exercises.map((ae, i) => (
          <ExerciseCard
            key={`${ae.exerciseId}-${i}`}
            index={i}
            count={active.exercises.length}
            data={ae}
            exercise={get(ae.exerciseId)}
            pr={reference.get(ae.exerciseId)?.pr ?? null}
            prev={reference.get(ae.exerciseId)?.prev ?? null}
          />
        ))}

        <GhostButton
          label="Übung hinzufügen"
          icon="add-circle-outline"
          color={colors.accent}
          onPress={() => router.push('/exercises?mode=workout')}
          style={{ marginTop: 8 }}
        />
        <GhostButton label="Training verwerfen" icon="trash-outline" color={colors.danger} onPress={discard} style={{ marginTop: 10 }} />
      </ScrollView>

      <RestTimer bottomInset={insets.bottom} />
    </View>
  );
}

const ExerciseCard = memo(function ExerciseCard({
  index,
  count,
  data,
  exercise,
  pr,
  prev,
}: {
  index: number;
  count: number;
  data: ActiveExercise;
  exercise: Exercise | undefined;
  pr: Record_ | null;
  prev: SetEntry[] | null;
}) {
  const { updateSet, addSet, removeSet, removeFromWorkout, moveInWorkout, startRest } = useStore();
  const labels = setLabels(exercise);
  const allDone = data.sets.length > 0 && data.sets.every((s) => s.done);

  // Vorschlag: Werte aus dem vorherigen Satz, sonst vom letzten Training
  const placeholder = (j: number): { weight: string; reps: string } => {
    const before = data.sets[j - 1];
    const fromPrev = prev?.[j] ?? prev?.[prev.length - 1];
    return {
      weight: before?.weight || (fromPrev ? formatKg(fromPrev.weight) : ''),
      reps: before?.reps || (fromPrev ? String(fromPrev.reps) : ''),
    };
  };

  const toggle = (j: number, set: ActiveSet) => {
    if (set.done) {
      updateSet(index, j, { done: false });
      return;
    }
    const ph = placeholder(j);
    const weight = set.weight || ph.weight;
    const reps = set.reps || ph.reps;
    if (!num(reps)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert(`Bitte ${labels.reps} eintragen`);
      return;
    }
    updateSet(index, j, { weight, reps, done: true });
    const entry = { weight: num(weight), reps: num(reps) };
    if (pr && isBetter(entry, pr)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    startRest();
  };

  const menu = () => {
    Alert.alert(exercise?.name ?? 'Übung', undefined, [
      ...(index > 0 ? [{ text: 'Nach oben', onPress: () => moveInWorkout(index, -1) }] : []),
      ...(index < count - 1 ? [{ text: 'Nach unten', onPress: () => moveInWorkout(index, 1) }] : []),
      { text: 'Entfernen', style: 'destructive' as const, onPress: () => removeFromWorkout(index) },
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={[styles.card, allDone && { borderColor: colors.accent + '66' }]}>
      <View style={styles.cardHead}>
        <Pressable onPress={() => exercise && router.push(`/exercise/${exercise.id}`)}>
          <ExerciseImage exercise={exercise} size={58} rounded={14} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.exName} numberOfLines={2}>
            {exercise?.name ?? 'Unbekannte Übung'}
          </Text>
          {exercise && <Text style={styles.exSub}>{muscleSummary(exercise)}</Text>}
          {pr ? (
            <PRBadge text={`Rekord ${formatKg(pr.weight)} ${labels.weight} × ${pr.reps}`} />
          ) : (
            <Text style={styles.exSub}>Noch kein Rekord – setz ihn heute!</Text>
          )}
        </View>
        <IconButton icon="ellipsis-horizontal" onPress={menu} color={colors.muted} />
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.setHeadText, { width: 34 }]}>SATZ</Text>
        <Text style={[styles.setHeadText, { flex: 1 }]}>VORHER</Text>
        <Text style={[styles.setHeadText, styles.inputCol]}>{labels.weight.toUpperCase()}</Text>
        <Text style={[styles.setHeadText, styles.inputCol]}>{labels.reps.toUpperCase()}</Text>
        <View style={{ width: 44 }} />
      </View>

      {data.sets.map((set, j) => {
        const ph = placeholder(j);
        const prevSet = prev?.[j];
        const isPR = set.done && pr && isBetter({ weight: num(set.weight), reps: num(set.reps) }, pr);
        return (
          <View key={j} style={[styles.setRow, set.done && styles.setRowDone]}>
            <Pressable
              onLongPress={() =>
                Alert.alert(`Satz ${j + 1} löschen?`, undefined, [
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Löschen', style: 'destructive', onPress: () => removeSet(index, j) },
                ])
              }
              style={styles.setIndex}
            >
              {isPR ? (
                <Ionicons name="trophy" size={16} color={colors.gold} />
              ) : (
                <Text style={[styles.setIndexText, set.done && { color: colors.accent }]}>{j + 1}</Text>
              )}
            </Pressable>
            <Text style={styles.prevText} numberOfLines={1}>
              {prevSet ? `${formatKg(prevSet.weight)} × ${prevSet.reps}` : '–'}
            </Text>
            <TextInput
              value={set.weight}
              onChangeText={(t) => updateSet(index, j, { weight: t })}
              placeholder={ph.weight || '0'}
              placeholderTextColor={colors.faint}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={[styles.input, styles.inputCol, set.done && styles.inputDone]}
            />
            <TextInput
              value={set.reps}
              onChangeText={(t) => updateSet(index, j, { reps: t })}
              placeholder={ph.reps || '0'}
              placeholderTextColor={colors.faint}
              keyboardType="number-pad"
              selectTextOnFocus
              style={[styles.input, styles.inputCol, set.done && styles.inputDone]}
            />
            <Pressable
              onPress={() => toggle(j, set)}
              hitSlop={6}
              accessibilityRole="checkbox"
              accessibilityLabel={`Satz ${j + 1} abhaken`}
              accessibilityState={{ checked: set.done }}
              style={[styles.check, set.done && styles.checkDone]}
            >
              <Ionicons name="checkmark" size={20} color={set.done ? colors.onAccent : colors.muted} />
            </Pressable>
          </View>
        );
      })}

      <Pressable
        onPress={() => {
          tap();
          addSet(index);
        }}
        style={({ pressed }) => [styles.addSet, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={styles.addSetText}>Satz hinzufügen</Text>
      </Pressable>
    </View>
  );
});

function RestTimer({ bottomInset }: { bottomInset: number }) {
  const { state, stopRest, adjustRest } = useStore();
  const endsAt = state.active?.restEndsAt ?? null;
  const now = useNow(endsAt !== null, 250);
  const remaining = endsAt ? endsAt - now : 0;
  const fired = useRef<number | null>(null);

  useEffect(() => {
    if (endsAt && remaining <= 0 && fired.current !== endsAt) {
      fired.current = endsAt;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      stopRest();
    }
  }, [endsAt, remaining, stopRest]);

  if (!endsAt || remaining <= 0) return null;

  const progress = Math.min(1, remaining / (state.restSeconds * 1000));

  return (
    <View style={[styles.rest, { bottom: bottomInset + 14 }]}>
      <View style={[styles.restFill, { width: `${progress * 100}%` }]} />
      <View style={styles.restRow}>
        <View>
          <Text style={styles.restLabel}>PAUSE</Text>
          <Text style={styles.restTime}>{formatDuration(remaining + 999)}</Text>
        </View>
        <View style={styles.restButtons}>
          <Pressable onPress={() => adjustRest(-15)} style={styles.restBtn}>
            <Text style={styles.restBtnText}>−15</Text>
          </Pressable>
          <Pressable onPress={() => adjustRest(15)} style={styles.restBtn}>
            <Text style={styles.restBtnText}>+15</Text>
          </Pressable>
          <Pressable onPress={stopRest} style={[styles.restBtn, { backgroundColor: colors.accent }]}>
            <Text style={[styles.restBtnText, { color: colors.onAccent }]}>Weiter</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: colors.muted, ...font.body },
  top: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { flex: 1, color: colors.text, ...font.h3, textAlign: 'center' },
  finishBtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  finishText: { color: colors.onAccent, fontWeight: '800' },
  timer: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginTop: 4,
  },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 6, fontWeight: '600' },

  list: { padding: 14, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  exName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  exSub: { color: colors.muted, fontSize: 12 },

  setHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 4, gap: 8 },
  setHeadText: { color: colors.faint, ...font.tiny, fontSize: 10 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 12 },
  setRowDone: { backgroundColor: colors.doneBg },
  setIndex: { width: 34, alignItems: 'center' },
  setIndexText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  prevText: { flex: 1, color: colors.muted, fontSize: 13 },
  inputCol: { width: 64, textAlign: 'center' },
  input: {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderRadius: 10,
    paddingVertical: 9,
    fontSize: 16,
    fontWeight: '700',
  },
  inputDone: { backgroundColor: 'transparent' },
  check: {
    width: 44,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.accent },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 12 },
  addSetText: { color: colors.accent, fontWeight: '700' },

  rest: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  restFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(200,255,77,0.10)' },
  restRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  restLabel: { color: colors.accent, ...font.tiny },
  restTime: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  restButtons: { flexDirection: 'row', gap: 8 },
  restBtn: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 9 },
  restBtnText: { color: colors.text, fontWeight: '800' },
});
