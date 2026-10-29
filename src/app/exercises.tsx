import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseImage } from '../components/ExerciseImage';
import { Chip, EmptyState, GradientButton, IconButton, tap } from '../components/ui';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, muscleSummary, POPULAR_IDS } from '../data/exercises';
import { allRecords, formatKg, type Record_ } from '../lib/stats';
import type { Exercise, Weekday } from '../lib/types';
import { useStore } from '../store/store';
import { useExercises } from '../store/useExercises';
import { colors, radius } from '../theme';

const ROW_HEIGHT = 76;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss');
}

/**
 * Übungsbibliothek. Mit `mode=plan&day=N` oder `mode=workout` dient sie als Mehrfachauswahl.
 */
export default function ExerciseLibrary() {
  const { mode, day } = useLocalSearchParams<{ mode?: 'plan' | 'workout'; day?: string }>();
  const picking = mode === 'plan' || mode === 'workout';
  const insets = useSafeAreaInsets();
  const { state, addToPlan, addToWorkout } = useStore();
  const { all } = useExercises();

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('popular');
  const [selected, setSelected] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  // Häufig trainierte Übungen zuerst, dann beliebte, dann alphabetisch
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of state.workouts) for (const e of w.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
    return counts;
  }, [state.workouts]);

  const records = useMemo(() => allRecords(state.workouts), [state.workouts]);

  const searchIndex = useMemo(
    () => new Map(all.map((e) => [e.id, normalize(`${e.name} ${e.en ?? ''} ${muscleSummary(e)} ${EQUIPMENT_LABELS[e.eq] ?? ''}`)])),
    [all],
  );

  const alreadyInPlan = useMemo(() => {
    if (mode === 'plan' && day !== undefined) return new Set(state.plans[Number(day) as Weekday].items.map((i) => i.exerciseId));
    if (mode === 'workout') return new Set(state.active?.exercises.map((e) => e.exerciseId) ?? []);
    return new Set<string>();
  }, [mode, day, state.plans, state.active]);

  const list = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    const words = q.split(/\s+/).filter(Boolean);
    const g = MUSCLE_GROUPS.find((x) => x.key === group);
    const filtered = all.filter((e) => {
      if (words.length) {
        const text = searchIndex.get(e.id) ?? '';
        if (!words.every((w) => text.includes(w))) return false;
      } else if (group === 'popular') {
        if (!POPULAR_IDS.has(e.id) && !usage.has(e.id) && !e.custom) return false;
      } else if (group === 'mine') {
        if (!usage.has(e.id) && !e.custom) return false;
      }
      return words.length || !g ? true : g.match(e);
    });
    const score = (e: Exercise) => (usage.get(e.id) ?? 0) * 100 + (e.custom ? 50 : 0) + (POPULAR_IDS.has(e.id) ? 10 : 0);
    return filtered.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'de'));
  }, [all, deferredQuery, group, searchIndex, usage]);

  const toggle = (id: string) => {
    tap();
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const confirm = () => {
    if (mode === 'plan' && day !== undefined) addToPlan(Number(day) as Weekday, selected);
    if (mode === 'workout') addToWorkout(selected);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: picking ? 'Übungen wählen' : 'Übungen',
          headerRight: () => <IconButton icon="add" size={24} color={colors.accent} onPress={() => router.push('/exercise/new')} />,
        }}
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`${all.length} Übungen durchsuchen …`}
          placeholderTextColor={colors.faint}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          <Chip label="Beliebt" icon="star" active={group === 'popular'} onPress={() => setGroup('popular')} />
          {usage.size > 0 && <Chip label="Meine" icon="person" active={group === 'mine'} onPress={() => setGroup('mine')} />}
          <Chip label="Alle" active={group === 'all'} onPress={() => setGroup('all')} />
          {MUSCLE_GROUPS.map((g) => (
            <Chip key={g.key} label={g.label} active={group === g.key} onPress={() => setGroup(g.key)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        windowSize={7}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        contentContainerStyle={{ paddingBottom: insets.bottom + (picking ? 110 : 24) }}
        ListEmptyComponent={
          <EmptyState icon="search" title="Nichts gefunden" text="Leg die Übung einfach selbst an – oben rechts auf +." />
        }
        renderItem={({ item }) => (
          <Row
            exercise={item}
            pr={records.get(item.id) ?? null}
            picking={picking}
            selected={selected.includes(item.id)}
            disabled={alreadyInPlan.has(item.id)}
            disabledLabel={mode === 'workout' ? 'im Training' : 'im Plan'}
            onPress={() => (picking ? toggle(item.id) : router.push(`/exercise/${item.id}`))}
          />
        )}
      />

      {picking && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <GradientButton
            label={selected.length ? `${selected.length} ${selected.length === 1 ? 'Übung' : 'Übungen'} hinzufügen` : 'Fertig'}
            icon={selected.length ? 'add' : 'checkmark'}
            onPress={confirm}
          />
        </View>
      )}
    </View>
  );
}

const Row = memo(function Row({
  exercise,
  pr,
  picking,
  selected,
  disabled,
  disabledLabel,
  onPress,
}: {
  exercise: Exercise;
  pr: Record_ | null;
  picking: boolean;
  selected: boolean;
  disabled: boolean;
  disabledLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }, disabled && { opacity: 0.4 }]}
    >
      <ExerciseImage exercise={exercise} size={56} rounded={12} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {muscleSummary(exercise)} · {EQUIPMENT_LABELS[exercise.eq] ?? exercise.eq}
        </Text>
        {pr && (
          <Text style={styles.pr} numberOfLines={1}>
            🏆 {formatKg(pr.weight)} kg × {pr.reps}
          </Text>
        )}
      </View>
      {picking ? (
        disabled ? (
          <Text style={styles.sub}>{disabledLabel}</Text>
        ) : (
          <View style={[styles.check, selected && styles.checkOn]}>
            {selected && <Ionicons name="checkmark" size={18} color={colors.onAccent} />}
          </View>
        )
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  row: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pr: { color: colors.gold, fontSize: 12, marginTop: 2, fontWeight: '700' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
