import type { DayPlan, Weekday } from '../lib/types';

export interface Preset {
  title: string;
  icon: string;
  exercises: string[];
}

export const PRESETS: Preset[] = [
  {
    title: 'Push Day',
    icon: 'arrow-up-circle-outline',
    exercises: [
      'Barbell_Bench_Press_-_Medium_Grip',
      'Incline_Dumbbell_Press',
      'Dumbbell_Shoulder_Press',
      'Side_Lateral_Raise',
      'Cable_Crossover',
      'Triceps_Pushdown_-_Rope_Attachment',
    ],
  },
  {
    title: 'Pull Day',
    icon: 'arrow-down-circle-outline',
    exercises: [
      'Pullups',
      'Bent_Over_Barbell_Row',
      'Wide-Grip_Lat_Pulldown',
      'Seated_Cable_Rows',
      'Face_Pull',
      'Barbell_Curl',
      'Hammer_Curls',
    ],
  },
  {
    title: 'Leg Day',
    icon: 'walk-outline',
    exercises: [
      'Barbell_Squat',
      'Leg_Press',
      'Romanian_Deadlift',
      'Leg_Extensions',
      'Lying_Leg_Curls',
      'Standing_Calf_Raises',
    ],
  },
  {
    title: 'Oberkörper',
    icon: 'body-outline',
    exercises: [
      'Barbell_Bench_Press_-_Medium_Grip',
      'Bent_Over_Barbell_Row',
      'Dumbbell_Shoulder_Press',
      'Wide-Grip_Lat_Pulldown',
      'Dumbbell_Bicep_Curl',
      'Triceps_Pushdown',
    ],
  },
  {
    title: 'Unterkörper',
    icon: 'footsteps-outline',
    exercises: ['Barbell_Deadlift', 'Barbell_Squat', 'Barbell_Hip_Thrust', 'Dumbbell_Lunges', 'Seated_Leg_Curl', 'Seated_Calf_Raise'],
  },
  {
    title: 'Ganzkörper',
    icon: 'flash-outline',
    exercises: ['Barbell_Squat', 'Barbell_Bench_Press_-_Medium_Grip', 'Bent_Over_Barbell_Row', 'Standing_Military_Press', 'Romanian_Deadlift', 'Plank'],
  },
  {
    title: 'Brust & Bizeps',
    icon: 'heart-outline',
    exercises: ['Barbell_Bench_Press_-_Medium_Grip', 'Incline_Dumbbell_Press', 'Butterfly', 'Barbell_Curl', 'Incline_Dumbbell_Curl', 'Hammer_Curls'],
  },
  {
    title: 'Rücken & Trizeps',
    icon: 'shield-outline',
    exercises: ['Barbell_Deadlift', 'Pullups', 'Seated_Cable_Rows', 'EZ-Bar_Skullcrusher', 'Triceps_Pushdown_-_Rope_Attachment', 'Dips_-_Triceps_Version'],
  },
  {
    title: 'Core & Cardio',
    icon: 'pulse-outline',
    exercises: ['Running_Treadmill', 'Hanging_Leg_Raise', 'Cable_Crunch', 'Russian_Twist', 'Plank', 'Ab_Roller'],
  },
];

export const DEFAULT_SETS = 3;

const emptyDay = (): DayPlan => ({ title: '', items: [] });

function fromPreset(title: string): DayPlan {
  const p = PRESETS.find((x) => x.title === title)!;
  return { title: p.title, items: p.exercises.map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS })) };
}

/** Startplan für neue Nutzer: klassischer Push/Pull/Legs-Split, jederzeit änderbar. */
export function defaultPlans(): Record<Weekday, DayPlan> {
  return {
    0: fromPreset('Push Day'),
    1: fromPreset('Pull Day'),
    2: fromPreset('Leg Day'),
    3: emptyDay(),
    4: fromPreset('Oberkörper'),
    5: fromPreset('Unterkörper'),
    6: emptyDay(),
  };
}

export const QUOTES = [
  'Disziplin schlägt Motivation.',
  'Jede Wiederholung zählt.',
  'Stärker als gestern.',
  'Der schwerste Satz ist der erste Schritt ins Gym.',
  'Kein Shortcut – nur Arbeit.',
  'Dein Körper kann es. Überzeug deinen Kopf.',
  'Fortschritt, nicht Perfektion.',
  'Heute investieren, morgen ernten.',
  'Schweiß ist nur Schwäche, die den Körper verlässt.',
  'Du bereust kein Training – nur das ausgelassene.',
];

export function quoteOfDay(d: Date = new Date()): string {
  const dayNumber = Math.floor(d.getTime() / 86_400_000);
  return QUOTES[dayNumber % QUOTES.length];
}
