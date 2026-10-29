import { addDays, dateKey, startOfWeek } from './date';
import type { SetEntry, Workout } from './types';

export interface Record_ {
  weight: number;
  reps: number;
  date: string;
  /** geschätztes 1-Wiederholungs-Maximum (Epley) */
  e1rm: number;
}

export interface HistoryEntry {
  workoutId: string;
  date: string;
  sets: SetEntry[];
}

const byTime = (a: Workout, b: Workout) => a.startedAt - b.startedAt;

export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/** Besserer Satz: mehr Gewicht, bei Gleichstand mehr Wiederholungen. */
export function isBetter(a: SetEntry, b: SetEntry | null | undefined): boolean {
  if (!b) return a.weight > 0 || a.reps > 0;
  return a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps);
}

/** Alltime-High einer Übung, optional nur aus Trainings vor einem Zeitpunkt. */
export function personalRecord(workouts: Workout[], exerciseId: string, before?: number): Record_ | null {
  let best: Record_ | null = null;
  for (const w of workouts) {
    if (before !== undefined && w.startedAt >= before) continue;
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      for (const s of e.sets) {
        if (isBetter(s, best)) best = { ...s, date: w.date, e1rm: estimate1RM(s.weight, s.reps) };
      }
    }
  }
  return best;
}

/** Rekorde aller Übungen auf einmal (für Listen). */
export function allRecords(workouts: Workout[]): Map<string, Record_> {
  const map = new Map<string, Record_>();
  for (const w of workouts) {
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (isBetter(s, map.get(e.exerciseId))) {
          map.set(e.exerciseId, { ...s, date: w.date, e1rm: estimate1RM(s.weight, s.reps) });
        }
      }
    }
  }
  return map;
}

export function exerciseHistory(workouts: Workout[], exerciseId: string): HistoryEntry[] {
  return [...workouts]
    .sort(byTime)
    .reverse()
    .flatMap((w) =>
      w.exercises
        .filter((e) => e.exerciseId === exerciseId && e.sets.length > 0)
        .map((e) => ({ workoutId: w.id, date: w.date, sets: e.sets })),
    );
}

/** Sätze vom letzten Mal (für "Vorher"-Spalte und Platzhalter). */
export function previousSets(workouts: Workout[], exerciseId: string): SetEntry[] | null {
  return exerciseHistory(workouts, exerciseId)[0]?.sets ?? null;
}

export function bestSet(sets: SetEntry[]): SetEntry | null {
  return sets.reduce<SetEntry | null>((best, s) => (isBetter(s, best) ? s : best), null);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((sum, e) => sum + e.sets.reduce((s, x) => s + x.weight * x.reps, 0), 0);
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((sum, e) => sum + e.sets.length, 0);
}

/** Anzahl neuer Rekorde, die in diesem Training aufgestellt wurden. */
export function recordsInWorkout(workouts: Workout[], w: Workout): Set<string> {
  const result = new Set<string>();
  for (const e of w.exercises) {
    const before = personalRecord(workouts, e.exerciseId, w.startedAt);
    const best = bestSet(e.sets);
    if (best && before && isBetter(best, before)) result.add(e.exerciseId);
  }
  return result;
}

export function workoutsByDate(workouts: Workout[]): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of [...workouts].sort(byTime)) {
    map.set(w.date, [...(map.get(w.date) ?? []), w]);
  }
  return map;
}

/** Wochen in Folge (inkl. aktueller Woche, falls schon trainiert) mit mindestens einem Training. */
export function weekStreak(workouts: Workout[]): number {
  const dates = new Set(workouts.map((w) => w.date));
  const hasWorkoutInWeek = (start: Date) =>
    Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i))).some((d) => dates.has(d));

  let offset = hasWorkoutInWeek(startOfWeek()) ? 0 : -1;
  let streak = 0;
  while (hasWorkoutInWeek(startOfWeek(new Date(), offset))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

export function formatKg(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
}

export function formatVolume(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} t` : `${formatKg(Math.round(kg))} kg`;
}
