import type { Exercise } from '../lib/types';
import { GERMAN_NAMES } from './germanNames';
import raw from './exercises.json';

// Bilder & Daten: free-exercise-db (Public Domain / Unlicense) – https://github.com/yuhonas/free-exercise-db
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const BUILTIN_EXERCISES: Exercise[] = (raw as Exercise[]).map((e) => ({
  ...e,
  name: GERMAN_NAMES[e.id] ?? e.name,
  en: e.name,
}));

const builtinById = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]));

/** Gängige Übungen (mit deutschem Namen) werden in Listen zuerst angezeigt. */
export const POPULAR_IDS = new Set(Object.keys(GERMAN_NAMES));

export function exerciseImage(ex: Exercise | undefined, frame = 0): string | null {
  if (!ex || ex.img === 0) return null;
  return `${IMAGE_BASE}/${ex.id}/${Math.min(frame, ex.img - 1)}.jpg`;
}

export function findExercise(id: string, custom: Exercise[] = []): Exercise | undefined {
  return builtinById.get(id) ?? custom.find((e) => e.id === id);
}

export const MUSCLE_LABELS: Record<string, string> = {
  abdominals: 'Bauch',
  abductors: 'Abduktoren',
  adductors: 'Adduktoren',
  biceps: 'Bizeps',
  calves: 'Waden',
  chest: 'Brust',
  forearms: 'Unterarme',
  glutes: 'Po',
  hamstrings: 'Beinbeuger',
  lats: 'Latissimus',
  'lower back': 'Unterer Rücken',
  'middle back': 'Oberer Rücken',
  neck: 'Nacken',
  quadriceps: 'Oberschenkel',
  shoulders: 'Schultern',
  traps: 'Trapez',
  triceps: 'Trizeps',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabelzug',
  machine: 'Maschine',
  'body only': 'Körpergewicht',
  kettlebells: 'Kettlebell',
  bands: 'Widerstandsband',
  'medicine ball': 'Medizinball',
  'exercise ball': 'Gymnastikball',
  'foam roll': 'Faszienrolle',
  'e-z curl bar': 'SZ-Stange',
  other: 'Sonstiges',
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Einsteiger',
  intermediate: 'Fortgeschritten',
  expert: 'Profi',
};

export interface MuscleGroup {
  key: string;
  label: string;
  match: (e: Exercise) => boolean;
}

const hasMuscle = (e: Exercise, ...m: string[]) => e.pm.some((x) => m.includes(x));
const isTraining = (e: Exercise) => e.cat !== 'stretching' && e.cat !== 'cardio';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { key: 'chest', label: 'Brust', match: (e) => isTraining(e) && hasMuscle(e, 'chest') },
  {
    key: 'back',
    label: 'Rücken',
    match: (e) => isTraining(e) && hasMuscle(e, 'lats', 'middle back', 'lower back', 'traps'),
  },
  { key: 'shoulders', label: 'Schultern', match: (e) => isTraining(e) && hasMuscle(e, 'shoulders') },
  { key: 'biceps', label: 'Bizeps', match: (e) => isTraining(e) && hasMuscle(e, 'biceps') },
  { key: 'triceps', label: 'Trizeps', match: (e) => isTraining(e) && hasMuscle(e, 'triceps') },
  {
    key: 'legs',
    label: 'Beine',
    match: (e) => isTraining(e) && hasMuscle(e, 'quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'),
  },
  { key: 'glutes', label: 'Po', match: (e) => isTraining(e) && hasMuscle(e, 'glutes') },
  { key: 'abs', label: 'Bauch', match: (e) => isTraining(e) && hasMuscle(e, 'abdominals') },
  { key: 'forearms', label: 'Unterarme', match: (e) => isTraining(e) && hasMuscle(e, 'forearms') },
  { key: 'cardio', label: 'Cardio', match: (e) => e.cat === 'cardio' },
  { key: 'stretching', label: 'Dehnen', match: (e) => e.cat === 'stretching' },
];

export function muscleSummary(e: Exercise): string {
  return e.pm.map((m) => MUSCLE_LABELS[m] ?? m).join(', ');
}

export function isCardio(e: Exercise | undefined): boolean {
  return e?.cat === 'cardio';
}

/** Für Cardio werden "Gewicht" und "Wdh." als km und Minuten verwendet. */
export function setLabels(e: Exercise | undefined): { weight: string; reps: string } {
  return isCardio(e) ? { weight: 'km', reps: 'min' } : { weight: 'kg', reps: 'Wdh.' };
}
