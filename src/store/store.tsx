import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETS, defaultPlans } from '../data/presets';
import { dateKey, weekdayOf } from '../lib/date';
import { previousSets } from '../lib/stats';
import type {
  ActiveExercise,
  ActiveSet,
  DayPlan,
  Exercise,
  PersistedState,
  SetEntry,
  Weekday,
  Workout,
} from '../lib/types';

const STORAGE_KEY = 'gymtracker.state.v1';

const initialState = (): PersistedState => ({
  plans: defaultPlans(),
  workouts: [],
  active: null,
  customExercises: [],
  restSeconds: 90,
});

function num(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function emptySets(n: number): ActiveSet[] {
  return Array.from({ length: n }, () => ({ weight: '', reps: '', done: false }));
}

function makeActiveExercise(exerciseId: string, sets: number, workouts: Workout[]): ActiveExercise {
  // Satzanzahl wie geplant; ohne Plan so viele wie beim letzten Mal
  const prev = previousSets(workouts, exerciseId);
  return { exerciseId, sets: emptySets(sets || prev?.length || DEFAULT_SETS) };
}

function useStoreValue() {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setState({ ...initialState(), ...JSON.parse(json) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state, hydrated]);

  const actions = useMemo(() => {
    const updateActive = (fn: (exercises: ActiveExercise[]) => ActiveExercise[]) =>
      setState((s) => (s.active ? { ...s, active: { ...s.active, exercises: fn(s.active.exercises) } } : s));

    return {
      // ---------- Wochenplan ----------
      setPlan(day: Weekday, plan: DayPlan) {
        setState((s) => ({ ...s, plans: { ...s.plans, [day]: plan } }));
      },
      updatePlan(day: Weekday, fn: (p: DayPlan) => DayPlan) {
        setState((s) => ({ ...s, plans: { ...s.plans, [day]: fn(s.plans[day]) } }));
      },
      addToPlan(day: Weekday, ids: string[]) {
        setState((s) => {
          const plan = s.plans[day];
          const existing = new Set(plan.items.map((i) => i.exerciseId));
          const items = [
            ...plan.items,
            ...ids.filter((id) => !existing.has(id)).map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS })),
          ];
          return { ...s, plans: { ...s.plans, [day]: { ...plan, items } } };
        });
      },

      // ---------- Training ----------
      startWorkout(dateStr: string = dateKey()) {
        setState((s) => {
          if (s.active) return s;
          const plan = s.plans[weekdayOf(new Date())];
          return {
            ...s,
            active: {
              title: plan.title || 'Freies Training',
              date: dateStr,
              startedAt: Date.now(),
              restEndsAt: null,
              exercises: plan.items.map((i) => makeActiveExercise(i.exerciseId, i.sets, s.workouts)),
            },
          };
        });
      },
      addToWorkout(ids: string[]) {
        setState((s) => {
          if (!s.active) return s;
          const added = ids.map((id) => makeActiveExercise(id, 0, s.workouts));
          return { ...s, active: { ...s.active, exercises: [...s.active.exercises, ...added] } };
        });
      },
      removeFromWorkout(index: number) {
        updateActive((ex) => ex.filter((_, i) => i !== index));
      },
      moveInWorkout(index: number, dir: -1 | 1) {
        updateActive((ex) => {
          const j = index + dir;
          if (j < 0 || j >= ex.length) return ex;
          const copy = [...ex];
          [copy[index], copy[j]] = [copy[j], copy[index]];
          return copy;
        });
      },
      updateSet(exIndex: number, setIndex: number, patch: Partial<ActiveSet>) {
        updateActive((ex) =>
          ex.map((e, i) =>
            i === exIndex ? { ...e, sets: e.sets.map((st, j) => (j === setIndex ? { ...st, ...patch } : st)) } : e,
          ),
        );
      },
      addSet(exIndex: number) {
        updateActive((ex) =>
          ex.map((e, i) => {
            if (i !== exIndex) return e;
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { weight: last?.weight ?? '', reps: last?.reps ?? '', done: false }] };
          }),
        );
      },
      removeSet(exIndex: number, setIndex: number) {
        updateActive((ex) =>
          ex.map((e, i) => (i === exIndex ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) } : e)),
        );
      },
      startRest() {
        setState((s) => (s.active ? { ...s, active: { ...s.active, restEndsAt: Date.now() + s.restSeconds * 1000 } } : s));
      },
      stopRest() {
        setState((s) => (s.active ? { ...s, active: { ...s.active, restEndsAt: null } } : s));
      },
      /** Verlängert/verkürzt die laufende Pause und merkt sich die neue Pausenlänge. */
      adjustRest(sec: number) {
        setState((s) => {
          const restSeconds = Math.max(15, Math.min(600, s.restSeconds + sec));
          const active = s.active?.restEndsAt ? { ...s.active, restEndsAt: s.active.restEndsAt + sec * 1000 } : s.active;
          return { ...s, restSeconds, active };
        });
      },
      renameWorkout(title: string) {
        setState((s) => (s.active ? { ...s, active: { ...s.active, title } } : s));
      },
      discardWorkout() {
        setState((s) => ({ ...s, active: null }));
      },
      /** Beendet das Training und gibt die ID des gespeicherten Workouts zurück. */
      finishWorkout(): string {
        const id = `w${Date.now()}`;
        setState((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises
            .map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets
                .filter((st) => st.done || num(st.reps) > 0)
                .map<SetEntry>((st) => ({ weight: num(st.weight), reps: num(st.reps) })),
            }))
            .filter((e) => e.sets.length > 0);
          const workout: Workout = {
            id,
            date: s.active.date,
            title: s.active.title,
            startedAt: s.active.startedAt,
            endedAt: Date.now(),
            exercises,
          };
          return { ...s, active: null, workouts: [...s.workouts, workout] };
        });
        return id;
      },
      deleteWorkout(id: string) {
        setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
      },

      // ---------- Eigene Übungen ----------
      addCustomExercise(ex: Omit<Exercise, 'id' | 'custom'>): string {
        const id = `custom_${Date.now()}`;
        setState((s) => ({ ...s, customExercises: [...s.customExercises, { ...ex, id, custom: true }] }));
        return id;
      },
    };
  }, []);

  return { state, hydrated, ...actions };
}

type StoreValue = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
