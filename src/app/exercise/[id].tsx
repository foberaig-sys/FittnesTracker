import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from '../../components/charts';
import { ExerciseImage } from '../../components/ExerciseImage';
import { EmptyState, SectionTitle, Tag } from '../../components/ui';
import { EQUIPMENT_LABELS, LEVEL_LABELS, MUSCLE_LABELS, setLabels } from '../../data/exercises';
import { formatShort } from '../../lib/date';
import { bestSet, exerciseHistory, formatKg, personalRecord } from '../../lib/stats';
import { useStore } from '../../store/store';
import { useExercises } from '../../store/useExercises';
import { colors, font, gradients, radius } from '../../theme';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const { get } = useExercises();
  const ex = get(id);
  const [showSteps, setShowSteps] = useState(false);

  const pr = useMemo(() => personalRecord(state.workouts, id), [state.workouts, id]);
  const history = useMemo(() => exerciseHistory(state.workouts, id), [state.workouts, id]);
  const chart = useMemo(
    () =>
      history
        .slice(0, 12)
        .reverse()
        .map((h) => bestSet(h.sets)?.weight ?? 0),
    [history],
  );

  if (!ex) return <EmptyState icon="help-circle-outline" title="Übung nicht gefunden" />;
  const labels = setLabels(ex);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.imageWrap}>
          <ExerciseImage exercise={ex} animate rounded={0} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['transparent', colors.bg]} style={styles.imageShade} />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{ex.name}</Text>
          {ex.en && ex.en !== ex.name && <Text style={styles.en}>{ex.en}</Text>}

          <View style={styles.tags}>
            {ex.pm.map((m) => (
              <Tag key={m} label={MUSCLE_LABELS[m] ?? m} color={colors.accent} />
            ))}
            {ex.sm.slice(0, 3).map((m) => (
              <Tag key={m} label={MUSCLE_LABELS[m] ?? m} />
            ))}
            <Tag label={EQUIPMENT_LABELS[ex.eq] ?? ex.eq} />
            {LEVEL_LABELS[ex.lvl] && <Tag label={LEVEL_LABELS[ex.lvl]} />}
          </View>

          {/* Alltime-High */}
          {pr ? (
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.prCard}>
              <Ionicons name="trophy" size={30} color={colors.onAccent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prKicker}>ALLTIME HIGH</Text>
                <Text style={styles.prValue}>
                  {formatKg(pr.weight)} {labels.weight} × {pr.reps}
                </Text>
                <Text style={styles.prSub}>
                  am {formatShort(pr.date)}
                  {pr.e1rm > 0 && labels.weight === 'kg' ? ` · geschätztes 1RM ${formatKg(Math.round(pr.e1rm * 2) / 2)} kg` : ''}
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.noPr}>
              <Ionicons name="trophy-outline" size={22} color={colors.muted} />
              <Text style={styles.noPrText}>Noch kein Rekord – trainiere die Übung, um ihn zu setzen.</Text>
            </View>
          )}

          {chart.length > 1 && (
            <>
              <SectionTitle>Fortschritt</SectionTitle>
              <View style={styles.chartCard}>
                <LineChart values={chart} unit={labels.weight} />
                <Text style={styles.chartHint}>Bester Satz der letzten {chart.length} Trainings</Text>
              </View>
            </>
          )}

          {history.length > 0 && (
            <>
              <SectionTitle>Verlauf</SectionTitle>
              <View style={{ gap: 8 }}>
                {history.slice(0, 20).map((h) => (
                  <Pressable key={h.workoutId} onPress={() => router.push(`/log/${h.workoutId}`)} style={styles.histRow}>
                    <Text style={styles.histDate}>{formatShort(h.date)}</Text>
                    <Text style={styles.histSets}>
                      {h.sets.map((s) => `${formatKg(s.weight)}×${s.reps}`).join('  ·  ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {ex.ins.length > 0 && (
            <>
              <SectionTitle
                right={
                  <Pressable onPress={() => setShowSteps((v) => !v)}>
                    <Text style={styles.toggle}>{showSteps ? 'Weniger' : 'Anzeigen'}</Text>
                  </Pressable>
                }
              >
                Ausführung
              </SectionTitle>
              {(showSteps ? ex.ins : ex.ins.slice(0, 1)).map((step, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
              <Text style={styles.chartHint}>Anleitung auf Englisch (Quelle: free-exercise-db)</Text>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  imageWrap: { height: 300, backgroundColor: '#EDEDED' },
  imageShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  body: { paddingHorizontal: 18, marginTop: -30 },
  name: { color: colors.text, ...font.h1, fontSize: 28 },
  en: { color: colors.muted, ...font.body, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  prCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 18, marginTop: 20 },
  prKicker: { color: colors.onAccent, ...font.tiny, opacity: 0.7 },
  prValue: { color: colors.onAccent, fontSize: 26, fontWeight: '900' },
  prSub: { color: colors.onAccent, opacity: 0.7, fontSize: 13, fontWeight: '600' },
  noPr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noPrText: { color: colors.muted, flex: 1 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14 },
  chartHint: { color: colors.faint, fontSize: 12, marginTop: 8 },
  histRow: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12 },
  histDate: { color: colors.muted, width: 56, fontWeight: '700' },
  histSets: { color: colors.text, flex: 1, fontWeight: '600' },
  toggle: { color: colors.accent, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  stepNum: { color: colors.accent, fontWeight: '900', width: 18 },
  stepText: { color: colors.text, flex: 1, lineHeight: 21 },
});
