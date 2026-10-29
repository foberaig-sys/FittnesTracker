import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressRing } from '../components/charts';
import { ExerciseImage } from '../components/ExerciseImage';
import { GhostButton, GradientButton, IconButton, SectionTitle, StatTile, Tag, tap } from '../components/ui';
import { WeekStrip } from '../components/WeekStrip';
import { MUSCLE_LABELS } from '../data/exercises';
import { quoteOfDay } from '../data/presets';
import { addDays, dateKey, formatDuration, formatDurationCompact, formatShort, greeting, startOfWeek, WEEKDAYS, weekdayOf } from '../lib/date';
import { formatVolume, weekStreak, workoutsByDate, workoutVolume } from '../lib/stats';
import type { Weekday } from '../lib/types';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/store';
import { useExercises } from '../store/useExercises';
import { colors, font, gradients, radius } from '../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const byDate = useMemo(() => workoutsByDate(state.workouts), [state.workouts]);
  const streak = useMemo(() => weekStreak(state.workouts), [state.workouts]);

  // Statistik der aktuellen Woche
  const week = useMemo(() => {
    const start = startOfWeek();
    const keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
    const workouts = keys.flatMap((k) => byDate.get(k) ?? []);
    const planned = Object.values(state.plans).filter((p) => p.items.length > 0).length;
    return {
      done: new Set(workouts.map((w) => w.date)).size,
      planned,
      time: workouts.reduce((s, w) => s + (w.endedAt - w.startedAt), 0),
      volume: workouts.reduce((s, w) => s + workoutVolume(w), 0),
    };
  }, [byDate, state.plans]);

  const recent = useMemo(() => [...state.workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, 3), [state.workouts]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
    >
      {/* Kopfzeile */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.h1}>Dein Training</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streak}>
            <Ionicons name="flame" size={16} color={colors.gold} />
            <Text style={styles.streakText}>{streak} Wo.</Text>
          </View>
        )}
        <IconButton icon="barbell-outline" size={22} onPress={() => router.push('/exercises')} style={styles.headerIcon} />
      </View>

      {/* Wochenansicht */}
      <WeekStrip
        offset={weekOffset}
        onChangeOffset={setWeekOffset}
        plans={state.plans}
        byDate={byDate}
        onPressDay={(d) => router.push(`/day/${d}`)}
      />

      {/* Heutiges Training */}
      <TodayHero />

      <Text style={styles.quote}>„{quoteOfDay()}“</Text>

      {/* Diese Woche */}
      <SectionTitle>Diese Woche</SectionTitle>
      <View style={styles.weekRow}>
        <View style={styles.ringCard}>
          <ProgressRing
            progress={week.planned ? week.done / week.planned : 0}
            label={`${week.done}/${week.planned}`}
            sublabel="Trainings"
            size={78}
          />
        </View>
        <StatTile icon="time-outline" label="Trainingszeit" value={formatDurationCompact(week.time)} />
        <StatTile icon="barbell-outline" label="Volumen" value={formatVolume(week.volume)} />
      </View>

      {/* Wochenplan */}
      <SectionTitle>Wochenplan</SectionTitle>
      <View style={styles.planList}>
        {WEEKDAYS.map((name, i) => {
          const plan = state.plans[i as Weekday];
          const isToday = weekdayOf(new Date()) === i;
          return (
            <Pressable
              key={name}
              onPress={() => {
                tap();
                router.push(`/plan/${i}`);
              }}
              style={({ pressed }) => [styles.planRow, i < 6 && styles.planRowBorder, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.planDay, isToday && { color: colors.accent }]}>{name.slice(0, 2)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, !plan.items.length && { color: colors.faint }]}>
                  {plan.items.length ? plan.title || 'Training' : 'Ruhetag'}
                </Text>
                {plan.items.length > 0 && <Text style={styles.planSub}>{plan.items.length} Übungen</Text>}
              </View>
              <Ionicons name="create-outline" size={18} color={colors.faint} />
            </Pressable>
          );
        })}
      </View>

      {/* Letzte Trainings */}
      {recent.length > 0 && (
        <>
          <SectionTitle>Letzte Trainings</SectionTitle>
          <View style={{ gap: 10 }}>
            {recent.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => router.push(`/log/${w.id}`)}
                style={({ pressed }) => [styles.recent, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="checkmark-done" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{w.title}</Text>
                  <Text style={styles.recentSub}>
                    {formatShort(w.date)} · {formatDuration(w.endedAt - w.startedAt, false)} · {formatVolume(workoutVolume(w))}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function TodayHero() {
  const { state, startWorkout } = useStore();
  const { get } = useExercises();
  const today = dateKey();
  const plan = state.plans[weekdayOf(new Date())];
  const active = state.active;
  const doneToday = state.workouts.filter((w) => w.date === today);
  const now = useNow(!!active);

  const exercises = plan.items.map((i) => get(i.exerciseId)).filter((e) => !!e);
  const totalSets = plan.items.reduce((s, i) => s + i.sets, 0);
  const muscles = [...new Set(exercises.flatMap((e) => e.pm))].slice(0, 4);
  const cover = (active ? get(active.exercises[0]?.exerciseId ?? '') : undefined) ?? exercises[0];

  const start = () => {
    startWorkout();
    router.push('/workout');
  };

  let body;
  if (active) {
    body = (
      <>
        <Text style={styles.heroKicker}>TRAINING LÄUFT</Text>
        <Text style={styles.heroTitle}>{active.title}</Text>
        <Text style={styles.heroTimer}>{formatDuration(now - active.startedAt)}</Text>
        <GradientButton label="Fortsetzen" icon="play" onPress={() => router.push('/workout')} />
      </>
    );
  } else if (doneToday.length > 0) {
    const last = doneToday[doneToday.length - 1];
    body = (
      <>
        <Text style={styles.heroKicker}>HEUTE ERLEDIGT 💪</Text>
        <Text style={styles.heroTitle}>{last.title}</Text>
        <Text style={styles.heroMeta}>
          {formatDuration(last.endedAt - last.startedAt, false)} · {formatVolume(workoutVolume(last))} bewegt
        </Text>
        <View style={styles.heroButtons}>
          <GradientButton label="Ansehen" icon="stats-chart" onPress={() => router.push(`/log/${last.id}`)} style={{ flex: 1 }} />
          <GhostButton label="Noch eins" icon="add" onPress={start} />
        </View>
      </>
    );
  } else if (plan.items.length > 0) {
    body = (
      <>
        <Text style={styles.heroKicker}>HEUTE · {WEEKDAYS[weekdayOf(new Date())].toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{plan.title || 'Training'}</Text>
        <Text style={styles.heroMeta}>
          {plan.items.length} Übungen · {totalSets} Sätze · ca. {Math.round((totalSets * 2.5) / 5) * 5} min
        </Text>
        <View style={styles.tags}>
          {muscles.map((m) => (
            <Tag key={m} label={MUSCLE_LABELS[m] ?? m} color={colors.accent} />
          ))}
        </View>
        <View style={styles.thumbs}>
          {exercises.slice(0, 5).map((e) => (
            <ExerciseImage key={e.id} exercise={e} size={44} rounded={12} style={styles.thumb} />
          ))}
          {exercises.length > 5 && (
            <View style={[styles.thumb, styles.more]}>
              <Text style={styles.moreText}>+{exercises.length - 5}</Text>
            </View>
          )}
        </View>
        <GradientButton label="Training starten" icon="play" onPress={start} />
      </>
    );
  } else {
    body = (
      <>
        <Text style={styles.heroKicker}>HEUTE · RUHETAG</Text>
        <Text style={styles.heroTitle}>Regeneration 😴</Text>
        <Text style={styles.heroMeta}>Muskeln wachsen in der Pause. Lust auf eine Extra-Session?</Text>
        <View style={styles.heroButtons}>
          <GhostButton label="Freies Training" icon="flash-outline" onPress={start} style={{ flex: 1 }} />
          <GhostButton label="Plan" icon="create-outline" onPress={() => router.push(`/plan/${weekdayOf(new Date())}`)} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.hero}>
      {cover ? (
        <ExerciseImage exercise={cover} style={StyleSheet.absoluteFill} rounded={0} />
      ) : (
        <Ionicons name="moon" size={160} color={colors.surface2} style={styles.heroDeco} />
      )}
      <LinearGradient colors={gradients.heroShade} style={StyleSheet.absoluteFill} />
      <View style={styles.heroBody}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  greeting: { color: colors.muted, ...font.body },
  h1: { color: colors.text, ...font.h1 },
  headerIcon: { backgroundColor: colors.surface, borderRadius: radius.pill, padding: 10, borderWidth: 1, borderColor: colors.border },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  streakText: { color: colors.gold, fontWeight: '800', fontSize: 13 },

  hero: {
    marginTop: 22,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 330,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroDeco: { position: 'absolute', top: 24, right: 24 },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: 20, gap: 10 },
  heroKicker: { color: colors.accent, ...font.tiny },
  heroTitle: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  heroMeta: { color: '#C9C9D6', ...font.body },
  heroTimer: { color: colors.text, fontSize: 46, fontWeight: '900', fontVariant: ['tabular-nums'], marginBottom: 6 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  thumbs: { flexDirection: 'row', marginVertical: 6 },
  thumb: { marginRight: -8, borderWidth: 2, borderColor: colors.bg },
  more: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { color: colors.text, fontWeight: '800' },

  quote: { color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 16, fontSize: 14 },

  weekRow: { flexDirection: 'row', gap: 10 },
  ringCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  planList: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 14 },
  planRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  planDay: { color: colors.muted, fontWeight: '800', width: 24 },
  planTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  planSub: { color: colors.muted, fontSize: 12, marginTop: 1 },

  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.doneBg, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  recentSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
