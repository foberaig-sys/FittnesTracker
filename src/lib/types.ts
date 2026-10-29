export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Montag

export interface Exercise {
  id: string;
  name: string;
  /** primäre Muskeln (englische Schlüssel aus der Datenbank) */
  pm: string[];
  sm: string[];
  eq: string;
  cat: string;
  lvl: string;
  /** Anzahl Bilder (0 = kein Bild) */
  img: number;
  ins: string[];
  /** englischer Originalname (für die Suche) */
  en?: string;
  custom?: boolean;
}

export interface PlanItem {
  exerciseId: string;
  sets: number;
}

export interface DayPlan {
  title: string;
  items: PlanItem[];
}

export interface SetEntry {
  weight: number;
  reps: number;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  startedAt: number;
  endedAt: number;
  exercises: LoggedExercise[];
}

export interface ActiveSet {
  weight: string;
  reps: string;
  done: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  sets: ActiveSet[];
}

export interface ActiveWorkout {
  title: string;
  date: string;
  startedAt: number;
  exercises: ActiveExercise[];
  restEndsAt: number | null;
}

export interface PersistedState {
  plans: Record<Weekday, DayPlan>;
  workouts: Workout[];
  active: ActiveWorkout | null;
  customExercises: Exercise[];
  restSeconds: number;
}
