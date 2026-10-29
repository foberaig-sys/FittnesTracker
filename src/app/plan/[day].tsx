import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseImage } from '../../components/ExerciseImage';
import { Chip, EmptyState, GradientButton, IconButton, Stepper, tap, type IconName } from '../../components/ui';
import { muscleSummary } from '../../data/exercises';
import { DEFAULT_SETS, PRESETS } from '../../data/presets';
import { WEEKDAYS, WEEKDAYS_SHORT } from '../../lib/date';
import type { Weekday } from '../../lib/types';
import { useStore } from '../../store/store';
import { useExercises } from '../../store/useExercises';
import { colors, font, radius } from '../../theme';

export default function PlanEditor() {
  const params = useLocalSearchParams<{ day: string }>();
  const day = Number(params.day) as Weekday;
  const insets = useSafeAreaInsets();
  const { state, setPlan, updatePlan } = useStore();
  const { get } = useExercises();
  const plan = state.plans[day];

  const applyPreset = (title: string, ids: string[]) => {
    const apply = () => setPlan(day, { title, items: ids.map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS })) });
    if (plan.items.length === 0) return apply();
    Alert.alert(`Vorlage „${title}“ laden?`, 'Die aktuellen Übungen werden ersetzt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ersetzen', onPress: apply },
    ]);
  };

  const setRestDay = () => {
    const apply = () => setPlan(day, { title: '', items: [] });
    if (plan.items.length === 0) return apply();
    Alert.alert('Zum Ruhetag machen?', 'Alle Übungen dieses Tages werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ruhetag', style: 'destructive', onPress: apply },
    ]);
  };

  const copyTo = (target: Weekday) => {
    Alert.alert(`Nach ${WEEKDAYS[target]} kopieren?`, `Der Plan für ${WEEKDAYS[target]} wird überschrieben.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Kopieren', onPress: () => setPlan(target, { title: plan.title, items: plan.items.map((i) => ({ ...i })) }) },
    ]);
  };

  const move = (index: number, dir: -1 | 1) =>
    updatePlan(day, (p) => {
      const j = index + dir;
      if (j < 0 || j >= p.items.length) return p;
      const items = [...p.items];
      [items[index], items[j]] = [items[j], items[index]];
      return { ...p, items };
    });

  return (
    <>
      <Stack.Screen options={{ title: WEEKDAYS[day] }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.label}>Name des Trainings</Text>
        <TextInput
          value={plan.title}
          onChangeText={(title) => updatePlan(day, (p) => ({ ...p, title }))}
          placeholder="z. B. Leg Day"
          placeholderTextColor={colors.faint}
          style={styles.titleInput}
        />
        <Text style={styles.hint}>Dieser Plan gilt jede Woche für {WEEKDAYS[day]}.</Text>

        <Text style={styles.label}>Vorlagen</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PRESETS.map((p) => (
            <Chip
              key={p.title}
              label={p.title}
              icon={p.icon as IconName}
              active={plan.title === p.title}
              onPress={() => applyPreset(p.title, p.exercises)}
            />
          ))}
          <Chip label="Ruhetag" icon="bed-outline" active={plan.items.length === 0} onPress={setRestDay} />
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.section}>Übungen ({plan.items.length})</Text>
          <Text style={styles.hintSmall}>Sätze</Text>
        </View>

        {plan.items.length === 0 && (
          <EmptyState icon="bed-outline" title="Ruhetag" text="Füge Übungen hinzu oder wähle eine Vorlage." />
        )}

        {plan.items.map((item, i) => {
          const ex = get(item.exerciseId);
          return (
            <View key={item.exerciseId} style={styles.row}>
              <View style={styles.reorder}>
                <IconButton icon="chevron-up" size={16} color={i === 0 ? colors.border : colors.muted} onPress={() => move(i, -1)} style={styles.reorderBtn} />
                <IconButton
                  icon="chevron-down"
                  size={16}
                  color={i === plan.items.length - 1 ? colors.border : colors.muted}
                  onPress={() => move(i, 1)}
                  style={styles.reorderBtn}
                />
              </View>
              <Pressable onPress={() => ex && router.push(`/exercise/${ex.id}`)}>
                <ExerciseImage exercise={ex} size={50} rounded={12} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName} numberOfLines={2}>
                  {ex?.name ?? item.exerciseId}
                </Text>
                {ex && <Text style={styles.exSub}>{muscleSummary(ex)}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Stepper
                  value={item.sets}
                  onChange={(sets) =>
                    updatePlan(day, (p) => ({ ...p, items: p.items.map((x, j) => (j === i ? { ...x, sets } : x)) }))
                  }
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    updatePlan(day, (p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }));
                  }}
                >
                  <Text style={styles.remove}>Entfernen</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {plan.items.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 28 }]}>Plan kopieren nach …</Text>
            <View style={styles.copyRow}>
              {WEEKDAYS_SHORT.map((d, i) =>
                i === day ? null : <Chip key={d} label={d} onPress={() => copyTo(i as Weekday)} />,
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <GradientButton label="Übungen hinzufügen" icon="add" onPress={() => router.push(`/exercises?mode=plan&day=${day}`)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18 },
  label: { color: colors.muted, ...font.small, marginBottom: 8, marginTop: 18 },
  titleInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hint: { color: colors.faint, fontSize: 12, marginTop: 6 },
  hintSmall: { color: colors.faint, fontSize: 12, marginRight: 24 },
  chips: { gap: 8, paddingRight: 18 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 10 },
  section: { color: colors.text, ...font.h3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  reorder: { gap: 0 },
  reorderBtn: { padding: 2 },
  exName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  exSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  copyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
