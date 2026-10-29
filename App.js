// GymTracker – komplette App in einer Datei (zum Einfügen in https://snack.expo.dev)
// Übungsdaten & Bilder: free-exercise-db (Public Domain) – https://github.com/yuhonas/free-exercise-db
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { createContext, memo, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

// ============================================================================
// Design
// ============================================================================

const C = {
  bg: '#0C0A0A',
  surface: '#151212',
  surface2: '#1F1A1A',
  border: 'rgba(255,255,255,0.08)',
  text: '#F3EDE7',
  muted: '#9B928B',
  faint: '#5F5854',
  accent: '#A8233A', // Bordeaux für Flächen
  red: '#D04A5D', // gut lesbares Rot für Text & Icons
  onAccent: '#F7F1EA',
  ink: '#161011',
  gold: '#C9A66B', // Champagner für Rekorde
  danger: '#D04A5D',
  doneBg: 'rgba(168,35,58,0.16)',
};
const GRADIENT = ['#B42B42', '#741322'];
const GOLD = ['#DFC490', '#A6824C'];
const HERO_SHADE = ['rgba(12,10,10,0.1)', 'rgba(12,10,10,0.72)', '#0C0A0A'];
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
const R = { sm: 8, md: 14, lg: 20, pill: 999 };

// ============================================================================
// Übungsdaten
// ============================================================================

const DB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';
const EXERCISE_CACHE_KEY = 'gymtracker.exercises.v1';

// Deutsche Namen für die gängigsten Übungen (alle anderen behalten den englischen Namen)
const GERMAN_NAMES = {
  // Brust
  'Barbell_Bench_Press_-_Medium_Grip': 'Bankdrücken (Langhantel)',
  'Bench_Press_-_Powerlifting': 'Bankdrücken (Powerlifting)',
  'Wide-Grip_Barbell_Bench_Press': 'Bankdrücken weiter Griff',
  'Close-Grip_Barbell_Bench_Press': 'Enges Bankdrücken',
  'Barbell_Incline_Bench_Press_-_Medium_Grip': 'Schrägbankdrücken (Langhantel)',
  'Decline_Barbell_Bench_Press': 'Negativ-Bankdrücken (Langhantel)',
  'Dumbbell_Bench_Press': 'Bankdrücken (Kurzhantel)',
  'Incline_Dumbbell_Press': 'Schrägbankdrücken (Kurzhantel)',
  'Decline_Dumbbell_Bench_Press': 'Negativ-Bankdrücken (Kurzhantel)',
  'Dumbbell_Flyes': 'Fliegende (Kurzhantel)',
  'Incline_Dumbbell_Flyes': 'Schrägbank-Fliegende',
  'Decline_Dumbbell_Flyes': 'Negativ-Fliegende',
  'Butterfly': 'Butterfly (Maschine)',
  'Cable_Crossover': 'Kabelziehen über Kreuz',
  'Low_Cable_Crossover': 'Kabel-Crossover von unten',
  'Flat_Bench_Cable_Flyes': 'Kabel-Fliegende Flachbank',
  'Incline_Cable_Flye': 'Kabel-Fliegende Schrägbank',
  'Machine_Bench_Press': 'Brustpresse (Maschine)',
  'Leverage_Chest_Press': 'Brustpresse (Hebel)',
  'Leverage_Incline_Chest_Press': 'Schräge Brustpresse (Hebel)',
  'Smith_Machine_Bench_Press': 'Bankdrücken (Multipresse)',
  'Smith_Machine_Incline_Bench_Press': 'Schrägbankdrücken (Multipresse)',
  'Pushups': 'Liegestütze',
  'Push-Up_Wide': 'Liegestütze weit',
  'Push-Ups_With_Feet_Elevated': 'Liegestütze Füße erhöht',
  'Incline_Push-Up': 'Schräge Liegestütze',
  'Dips_-_Chest_Version': 'Dips (Brust)',
  'Bent-Arm_Dumbbell_Pullover': 'Überzüge (Kurzhantel)',
  'Straight-Arm_Dumbbell_Pullover': 'Überzüge gestreckte Arme',
  'Floor_Press': 'Floor Press (Langhantel)',
  'Dumbbell_Floor_Press': 'Floor Press (Kurzhantel)',

  // Rücken
  'Barbell_Deadlift': 'Kreuzheben',
  'Sumo_Deadlift': 'Sumo-Kreuzheben',
  'Romanian_Deadlift': 'Rumänisches Kreuzheben',
  'Stiff-Legged_Barbell_Deadlift': 'Kreuzheben gestreckte Beine',
  'Stiff-Legged_Dumbbell_Deadlift': 'Kreuzheben gestreckte Beine (Kurzhantel)',
  'Deficit_Deadlift': 'Defizit-Kreuzheben',
  'Rack_Pulls': 'Rack Pulls',
  'Pullups': 'Klimmzüge',
  'Chin-Up': 'Klimmzüge Untergriff (Chin-Ups)',
  'Wide-Grip_Rear_Pull-Up': 'Klimmzüge weiter Griff',
  'V-Bar_Pullup': 'Klimmzüge V-Griff',
  'Wide-Grip_Lat_Pulldown': 'Latziehen breit',
  'Close-Grip_Front_Lat_Pulldown': 'Latziehen eng',
  'V-Bar_Pulldown': 'Latziehen V-Griff',
  'Underhand_Cable_Pulldowns': 'Latziehen Untergriff',
  'One_Arm_Lat_Pulldown': 'Latziehen einarmig',
  'Full_Range-Of-Motion_Lat_Pulldown': 'Latziehen volle Bewegung',
  'Straight-Arm_Pulldown': 'Überzug am Kabel',
  'Rope_Straight-Arm_Pulldown': 'Überzug am Kabel (Seil)',
  'Bent_Over_Barbell_Row': 'Langhantelrudern vorgebeugt',
  'Reverse_Grip_Bent-Over_Rows': 'Langhantelrudern Untergriff',
  'Bent_Over_Two-Dumbbell_Row': 'Kurzhantelrudern vorgebeugt',
  'One-Arm_Dumbbell_Row': 'Einarmiges Kurzhantelrudern',
  'Seated_Cable_Rows': 'Rudern am Kabel sitzend',
  'Seated_One-arm_Cable_Pulley_Rows': 'Einarmiges Kabelrudern',
  'T-Bar_Row_with_Handle': 'T-Bar-Rudern',
  'Lying_T-Bar_Row': 'T-Bar-Rudern liegend',
  'Leverage_Iso_Row': 'Rudermaschine (Hebel)',
  'Leverage_High_Row': 'Hohes Rudern (Hebel)',
  'Dumbbell_Incline_Row': 'Schrägbank-Rudern (Kurzhantel)',
  'Smith_Machine_Bent_Over_Row': 'Rudern (Multipresse)',
  'Inverted_Row': 'Umgekehrtes Rudern',
  'Hyperextensions_Back_Extensions': 'Hyperextensions (Rückenstrecker)',
  'Good_Morning': 'Good Mornings',
  'Barbell_Shrug': 'Shrugs (Langhantel)',
  'Dumbbell_Shrug': 'Shrugs (Kurzhantel)',
  'Cable_Shrugs': 'Shrugs (Kabel)',
  'Face_Pull': 'Face Pulls',

  // Schultern
  'Standing_Military_Press': 'Schulterdrücken stehend (Military Press)',
  'Seated_Barbell_Military_Press': 'Schulterdrücken sitzend (Langhantel)',
  'Dumbbell_Shoulder_Press': 'Schulterdrücken (Kurzhantel)',
  'Seated_Dumbbell_Press': 'Schulterdrücken sitzend (Kurzhantel)',
  'Arnold_Dumbbell_Press': 'Arnold Press',
  'Machine_Shoulder_Military_Press': 'Schulterpresse (Maschine)',
  'Leverage_Shoulder_Press': 'Schulterpresse (Hebel)',
  'Smith_Machine_Overhead_Shoulder_Press': 'Schulterdrücken (Multipresse)',
  'Push_Press': 'Push Press',
  'Side_Lateral_Raise': 'Seitheben',
  'Seated_Side_Lateral_Raise': 'Seitheben sitzend',
  'Cable_Seated_Lateral_Raise': 'Seitheben am Kabel',
  'Front_Dumbbell_Raise': 'Frontheben (Kurzhantel)',
  'Front_Cable_Raise': 'Frontheben am Kabel',
  'Front_Plate_Raise': 'Frontheben mit Hantelscheibe',
  'Reverse_Flyes': 'Reverse Flys',
  'Reverse_Machine_Flyes': 'Reverse Butterfly (Maschine)',
  'Cable_Rear_Delt_Fly': 'Reverse Flys am Kabel',
  'Seated_Bent-Over_Rear_Delt_Raise': 'Vorgebeugtes Seitheben sitzend',
  'Upright_Barbell_Row': 'Aufrechtes Rudern (Langhantel)',
  'Upright_Cable_Row': 'Aufrechtes Rudern (Kabel)',
  'Standing_Dumbbell_Upright_Row': 'Aufrechtes Rudern (Kurzhantel)',

  // Bizeps
  'Barbell_Curl': 'Langhantelcurls',
  'EZ-Bar_Curl': 'SZ-Curls',
  'Close-Grip_EZ_Bar_Curl': 'SZ-Curls eng',
  'Dumbbell_Bicep_Curl': 'Kurzhantelcurls',
  'Dumbbell_Alternate_Bicep_Curl': 'Kurzhantelcurls abwechselnd',
  'Hammer_Curls': 'Hammercurls',
  'Alternate_Hammer_Curl': 'Hammercurls abwechselnd',
  'Cable_Hammer_Curls_-_Rope_Attachment': 'Hammercurls am Kabel (Seil)',
  'Incline_Dumbbell_Curl': 'Schrägbankcurls',
  'Concentration_Curls': 'Konzentrationscurls',
  'Preacher_Curl': 'Scottcurls (Langhantel)',
  'Machine_Preacher_Curls': 'Scottcurls (Maschine)',
  'One_Arm_Dumbbell_Preacher_Curl': 'Scottcurls einarmig',
  'Standing_Biceps_Cable_Curl': 'Bizepscurls am Kabel',
  'Overhead_Cable_Curl': 'Bizepscurls am Kabel über Kopf',
  'Spider_Curl': 'Spider Curls',
  'Reverse_Barbell_Curl': 'Reverse Curls',
  'Zottman_Curl': 'Zottman Curls',
  'Machine_Bicep_Curl': 'Bizepsmaschine',
  'Drag_Curl': 'Drag Curls',

  // Trizeps
  'Triceps_Pushdown': 'Trizepsdrücken am Kabel',
  'Triceps_Pushdown_-_Rope_Attachment': 'Trizepsdrücken am Seil',
  'Triceps_Pushdown_-_V-Bar_Attachment': 'Trizepsdrücken V-Griff',
  'Reverse_Grip_Triceps_Pushdown': 'Trizepsdrücken Untergriff',
  'Triceps_Overhead_Extension_with_Rope': 'Trizepsstrecken über Kopf (Seil)',
  'EZ-Bar_Skullcrusher': 'French Press / Skullcrusher (SZ)',
  'Lying_Triceps_Press': 'French Press liegend',
  'Lying_Dumbbell_Tricep_Extension': 'French Press (Kurzhantel)',
  'Standing_Dumbbell_Triceps_Extension': 'Trizepsstrecken über Kopf (Kurzhantel)',
  'Tricep_Dumbbell_Kickback': 'Trizeps-Kickbacks',
  'Dips_-_Triceps_Version': 'Dips (Trizeps)',
  'Bench_Dips': 'Bankdips',
  'Dip_Machine': 'Dip-Maschine',
  'Machine_Triceps_Extension': 'Trizepsmaschine',
  'Push-Ups_-_Close_Triceps_Position': 'Enge Liegestütze',
  'JM_Press': 'JM Press',
  'Tate_Press': 'Tate Press',

  // Beine
  'Barbell_Squat': 'Kniebeugen (Langhantel)',
  'Barbell_Full_Squat': 'Tiefe Kniebeugen',
  'Front_Barbell_Squat': 'Frontkniebeugen',
  'Goblet_Squat': 'Goblet Squats',
  'Dumbbell_Squat': 'Kniebeugen (Kurzhantel)',
  'Bodyweight_Squat': 'Kniebeugen (Körpergewicht)',
  'Box_Squat': 'Box Squats',
  'Smith_Machine_Squat': 'Kniebeugen (Multipresse)',
  'Hack_Squat': 'Hackenschmidt-Kniebeugen',
  'Barbell_Hack_Squat': 'Hackenschmidt (Langhantel)',
  'Zercher_Squats': 'Zercher Squats',
  'Overhead_Squat': 'Overhead Squats',
  'Leg_Press': 'Beinpresse',
  'Narrow_Stance_Leg_Press': 'Beinpresse enger Stand',
  'Leg_Extensions': 'Beinstrecker',
  'Single-Leg_Leg_Extension': 'Beinstrecker einbeinig',
  'Lying_Leg_Curls': 'Beinbeuger liegend',
  'Seated_Leg_Curl': 'Beinbeuger sitzend',
  'Standing_Leg_Curl': 'Beinbeuger stehend',
  'Glute_Ham_Raise': 'Glute Ham Raise',
  'Barbell_Lunge': 'Ausfallschritte (Langhantel)',
  'Dumbbell_Lunges': 'Ausfallschritte (Kurzhantel)',
  'Barbell_Walking_Lunge': 'Gehende Ausfallschritte',
  'Dumbbell_Rear_Lunge': 'Ausfallschritte rückwärts',
  'Split_Squat_with_Dumbbells': 'Split Squats (Kurzhantel)',
  'Smith_Single-Leg_Split_Squat': 'Bulgarian Split Squats (Multipresse)',
  'Dumbbell_Step_Ups': 'Step-Ups (Kurzhantel)',
  'Barbell_Step_Ups': 'Step-Ups (Langhantel)',
  'Barbell_Hip_Thrust': 'Hip Thrusts',
  'Barbell_Glute_Bridge': 'Glute Bridge (Langhantel)',
  'Butt_Lift_Bridge': 'Glute Bridge',
  'Single_Leg_Glute_Bridge': 'Glute Bridge einbeinig',
  'Glute_Kickback': 'Glute Kickbacks',
  'One-Legged_Cable_Kickback': 'Kickbacks am Kabel',
  'Thigh_Abductor': 'Abduktoren-Maschine',
  'Thigh_Adductor': 'Adduktoren-Maschine',
  'Cable_Hip_Adduction': 'Adduktion am Kabel',
  'Standing_Calf_Raises': 'Wadenheben stehend',
  'Seated_Calf_Raise': 'Wadenheben sitzend',
  'Standing_Barbell_Calf_Raise': 'Wadenheben (Langhantel)',
  'Standing_Dumbbell_Calf_Raise': 'Wadenheben (Kurzhantel)',
  'Calf_Press_On_The_Leg_Press_Machine': 'Wadendrücken an der Beinpresse',
  'Smith_Machine_Calf_Raise': 'Wadenheben (Multipresse)',

  // Bauch
  'Crunches': 'Crunches',
  'Cable_Crunch': 'Kabel-Crunches',
  'Ab_Crunch_Machine': 'Bauchmaschine',
  'Decline_Crunch': 'Negativ-Crunches',
  'Reverse_Crunch': 'Reverse Crunches',
  'Oblique_Crunches': 'Seitliche Crunches',
  'Plank': 'Unterarmstütz (Plank)',
  'Side_Bridge': 'Seitstütz',
  'Hanging_Leg_Raise': 'Beinheben hängend',
  'Flat_Bench_Lying_Leg_Raise': 'Beinheben liegend',
  'Russian_Twist': 'Russian Twists',
  'Cable_Russian_Twists': 'Russian Twists am Kabel',
  'Ab_Roller': 'Bauchroller',
  'Barbell_Ab_Rollout_-_On_Knees': 'Rollouts (Langhantel, kniend)',
  'Mountain_Climbers': 'Mountain Climbers',
  'Dead_Bug': 'Dead Bug',
  'Superman': 'Superman',
  'Pallof_Press': 'Pallof Press',
  'Sit-Up': 'Sit-Ups',

  // Ganzkörper / Olympisch / Kettlebell
  'Power_Clean': 'Umsetzen (Power Clean)',
  'Clean_and_Jerk': 'Stoßen (Clean & Jerk)',
  'Snatch': 'Reißen (Snatch)',
  'Clean_and_Press': 'Umsetzen und Drücken',
  'Farmers_Walk': 'Farmer’s Walk',
  'One-Arm_Kettlebell_Swings': 'Kettlebell Swings einarmig',
  'Kettlebell_Thruster': 'Kettlebell Thruster',
  'Kettlebell_Turkish_Get-Up_Squat_style': 'Turkish Get-Up',
  'Sled_Push': 'Schlitten schieben',
  'Muscle_Up': 'Muscle-Ups',

  // Cardio
  'Running_Treadmill': 'Laufband (Laufen)',
  'Walking_Treadmill': 'Laufband (Gehen)',
  'Jogging_Treadmill': 'Laufband (Joggen)',
  'Bicycling_Stationary': 'Fahrradergometer',
  'Bicycling': 'Radfahren',
  'Elliptical_Trainer': 'Crosstrainer',
  'Rowing_Stationary': 'Rudergerät',
  'Stairmaster': 'Stepper / Treppensteiger',
  'Rope_Jumping': 'Seilspringen',
};
const POPULAR_IDS = new Set(Object.keys(GERMAN_NAMES));

const MUSCLE_LABELS = {
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

const EQUIPMENT_LABELS = {
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

const LEVEL_LABELS = { beginner: 'Einsteiger', intermediate: 'Fortgeschritten', expert: 'Profi' };

const hasMuscle = (e, ...m) => e.pm.some((x) => m.includes(x));
const isTraining = (e) => e.cat !== 'stretching' && e.cat !== 'cardio';

const MUSCLE_GROUPS = [
  { key: 'chest', label: 'Brust', match: (e) => isTraining(e) && hasMuscle(e, 'chest') },
  { key: 'back', label: 'Rücken', match: (e) => isTraining(e) && hasMuscle(e, 'lats', 'middle back', 'lower back', 'traps') },
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

function exerciseImage(ex, frame = 0) {
  if (!ex || !ex.img) return null;
  return `${DB_BASE}/exercises/${ex.id}/${Math.min(frame, ex.img - 1)}.jpg`;
}

const muscleSummary = (e) => e.pm.map((m) => MUSCLE_LABELS[m] || m).join(', ');
const isCardio = (e) => e?.cat === 'cardio';
/** Für Cardio werden "Gewicht" und "Wdh." als km und Minuten verwendet. */
const setLabels = (e) => (isCardio(e) ? { weight: 'km', reps: 'min' } : { weight: 'kg', reps: 'Wdh.' });

function toExercise(x) {
  return {
    id: x.id,
    name: GERMAN_NAMES[x.id] || x.name,
    en: x.name,
    pm: x.primaryMuscles || [],
    sm: x.secondaryMuscles || [],
    eq: x.equipment || 'other',
    cat: x.category,
    lvl: x.level,
    img: (x.images || []).length,
    ins: x.instructions || [],
  };
}

/** Platzhalter, solange die Datenbank noch nicht geladen ist (z. B. erster Start offline). */
function fallbackExercise(id) {
  return { id, name: GERMAN_NAMES[id] || id.replace(/_/g, ' '), en: id, pm: [], sm: [], eq: 'other', cat: 'strength', lvl: '', img: 2, ins: [] };
}

/** Lädt die Übungsdatenbank einmalig aus dem Internet und speichert sie auf dem Gerät. */
function useExerciseDb() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const cached = await AsyncStorage.getItem(EXERCISE_CACHE_KEY);
      if (cached) {
        setList(JSON.parse(cached));
        return;
      }
    } catch {}
    try {
      const res = await fetch(`${DB_BASE}/dist/exercises.json`);
      const data = await res.json();
      const mapped = data.map(toExercise).sort((a, b) => a.name.localeCompare(b.name, 'de'));
      setList(mapped);
      AsyncStorage.setItem(EXERCISE_CACHE_KEY, JSON.stringify(mapped)).catch(() => {});
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { list, error, reload: load };
}

// ============================================================================
// Vorlagen & Motivation
// ============================================================================

const DEFAULT_SETS = 3;

const PRESETS = [
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
    exercises: ['Pullups', 'Bent_Over_Barbell_Row', 'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'Face_Pull', 'Barbell_Curl', 'Hammer_Curls'],
  },
  {
    title: 'Leg Day',
    icon: 'walk-outline',
    exercises: ['Barbell_Squat', 'Leg_Press', 'Romanian_Deadlift', 'Leg_Extensions', 'Lying_Leg_Curls', 'Standing_Calf_Raises'],
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

function presetPlan(title) {
  const p = PRESETS.find((x) => x.title === title);
  return { title: p.title, items: p.exercises.map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS })) };
}

/** Startplan: klassischer Push/Pull/Legs-Split, jederzeit änderbar. Index 0 = Montag. */
function defaultPlans() {
  const rest = () => ({ title: '', items: [] });
  return {
    0: presetPlan('Push Day'),
    1: presetPlan('Pull Day'),
    2: presetPlan('Leg Day'),
    3: rest(),
    4: presetPlan('Oberkörper'),
    5: presetPlan('Unterkörper'),
    6: rest(),
  };
}

const QUOTES = [
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
const quoteOfDay = () => QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

// ============================================================================
// Datum
// ============================================================================

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
const weekdayOf = (d) => (d.getDay() + 6) % 7;
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d = new Date(), offsetWeeks = 0) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(r, -weekdayOf(r) + offsetWeeks * 7);
}
function formatLong(key) {
  const d = parseKey(key);
  return `${WEEKDAYS[weekdayOf(d)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatShort(key) {
  const d = parseKey(key);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
function formatWeekRange(start) {
  const end = addDays(start, 6);
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}.–${end.getDate()}. ${MONTHS[end.getMonth()]}`
    : `${start.getDate()}. ${MONTHS[start.getMonth()]} – ${end.getDate()}. ${MONTHS[end.getMonth()]}`;
}
function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
/** Kurzform, z. B. "2h 04m" oder "45m". */
function formatMinutes(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Späte Session?';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hey Champion';
  if (h < 22) return 'Guten Abend';
  return 'Noch fit?';
}

// ============================================================================
// Statistik
// ============================================================================

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const formatKg = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
const formatVolume = (kg) =>
  kg >= 1000 ? `${(kg / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} t` : `${formatKg(Math.round(kg))} kg`;

function estimate1RM(weight, reps) {
  if (weight <= 0 || reps <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/** Besserer Satz: mehr Gewicht, bei Gleichstand mehr Wiederholungen. */
function isBetter(a, b) {
  if (!b) return a.weight > 0 || a.reps > 0;
  return a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps);
}

/** Alltime-High einer Übung, optional nur aus Trainings vor einem Zeitpunkt. */
function personalRecord(workouts, exerciseId, before) {
  let best = null;
  for (const w of workouts) {
    if (before !== undefined && w.startedAt >= before) continue;
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      for (const s of e.sets) if (isBetter(s, best)) best = { ...s, date: w.date, e1rm: estimate1RM(s.weight, s.reps) };
    }
  }
  return best;
}

function allRecords(workouts) {
  const map = new Map();
  for (const w of workouts)
    for (const e of w.exercises)
      for (const s of e.sets) if (isBetter(s, map.get(e.exerciseId))) map.set(e.exerciseId, { ...s, date: w.date });
  return map;
}

function exerciseHistory(workouts, exerciseId) {
  return [...workouts]
    .sort((a, b) => b.startedAt - a.startedAt)
    .flatMap((w) =>
      w.exercises
        .filter((e) => e.exerciseId === exerciseId && e.sets.length > 0)
        .map((e) => ({ workoutId: w.id, date: w.date, sets: e.sets })),
    );
}

const previousSets = (workouts, exerciseId) => exerciseHistory(workouts, exerciseId)[0]?.sets || null;
const bestSet = (sets) => sets.reduce((best, s) => (isBetter(s, best) ? s : best), null);
const workoutVolume = (w) => w.exercises.reduce((sum, e) => sum + e.sets.reduce((s, x) => s + x.weight * x.reps, 0), 0);
const workoutSetCount = (w) => w.exercises.reduce((sum, e) => sum + e.sets.length, 0);

function recordsInWorkout(workouts, w) {
  const result = new Set();
  for (const e of w.exercises) {
    const before = personalRecord(workouts, e.exerciseId, w.startedAt);
    const best = bestSet(e.sets);
    if (best && before && isBetter(best, before)) result.add(e.exerciseId);
  }
  return result;
}

function workoutsByDate(workouts) {
  const map = new Map();
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) map.set(w.date, [...(map.get(w.date) || []), w]);
  return map;
}

/** Wochen in Folge mit mindestens einem Training. */
function weekStreak(workouts) {
  const dates = new Set(workouts.map((w) => w.date));
  const trained = (start) => Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i))).some((d) => dates.has(d));
  let offset = trained(startOfWeek()) ? 0 : -1;
  let streak = 0;
  while (trained(startOfWeek(new Date(), offset))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

/** Re-rendert regelmäßig, solange `active` true ist (für Stoppuhr und Pausentimer). */
function useNow(active = true, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [active, intervalMs]);
  return now;
}

// ============================================================================
// App-Zustand (wird auf dem Gerät gespeichert)
// ============================================================================

const STORAGE_KEY = 'gymtracker.state.v1';

const initialState = () => ({
  plans: defaultPlans(),
  workouts: [],
  active: null,
  customExercises: [],
  restSeconds: 90,
});

const emptySets = (n) => Array.from({ length: n }, () => ({ weight: '', reps: '', done: false }));

function makeActiveExercise(exerciseId, sets, workouts) {
  // Satzanzahl wie geplant; ohne Plan so viele wie beim letzten Mal
  const prev = previousSets(workouts, exerciseId);
  return { exerciseId, sets: emptySets(sets || prev?.length || DEFAULT_SETS) };
}

function useStoreValue() {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => json && setState({ ...initialState(), ...JSON.parse(json) }))
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state, hydrated]);

  const actions = useMemo(() => {
    const updateActive = (fn) => setState((s) => (s.active ? { ...s, active: { ...s.active, exercises: fn(s.active.exercises) } } : s));
    const updateSets = (exIndex, fn) => updateActive((ex) => ex.map((e, i) => (i === exIndex ? { ...e, sets: fn(e.sets) } : e)));

    return {
      setPlan: (day, plan) => setState((s) => ({ ...s, plans: { ...s.plans, [day]: plan } })),
      updatePlan: (day, fn) => setState((s) => ({ ...s, plans: { ...s.plans, [day]: fn(s.plans[day]) } })),
      addToPlan: (day, ids) =>
        setState((s) => {
          const plan = s.plans[day];
          const existing = new Set(plan.items.map((i) => i.exerciseId));
          const items = [...plan.items, ...ids.filter((id) => !existing.has(id)).map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS }))];
          return { ...s, plans: { ...s.plans, [day]: { ...plan, items } } };
        }),

      startWorkout: () =>
        setState((s) => {
          if (s.active) return s;
          const plan = s.plans[weekdayOf(new Date())];
          return {
            ...s,
            active: {
              title: plan.title || 'Freies Training',
              date: dateKey(),
              startedAt: Date.now(),
              restEndsAt: null,
              exercises: plan.items.map((i) => makeActiveExercise(i.exerciseId, i.sets, s.workouts)),
            },
          };
        }),
      addToWorkout: (ids) =>
        setState((s) =>
          s.active
            ? { ...s, active: { ...s.active, exercises: [...s.active.exercises, ...ids.map((id) => makeActiveExercise(id, 0, s.workouts))] } }
            : s,
        ),
      removeFromWorkout: (index) => updateActive((ex) => ex.filter((_, i) => i !== index)),
      moveInWorkout: (index, dir) =>
        updateActive((ex) => {
          const j = index + dir;
          if (j < 0 || j >= ex.length) return ex;
          const copy = [...ex];
          [copy[index], copy[j]] = [copy[j], copy[index]];
          return copy;
        }),
      updateSet: (exIndex, setIndex, patch) => updateSets(exIndex, (sets) => sets.map((st, j) => (j === setIndex ? { ...st, ...patch } : st))),
      addSet: (exIndex) =>
        updateSets(exIndex, (sets) => {
          const last = sets[sets.length - 1];
          return [...sets, { weight: last?.weight || '', reps: last?.reps || '', done: false }];
        }),
      removeSet: (exIndex, setIndex) => updateSets(exIndex, (sets) => sets.filter((_, j) => j !== setIndex)),
      startRest: () =>
        setState((s) => (s.active ? { ...s, active: { ...s.active, restEndsAt: Date.now() + s.restSeconds * 1000 } } : s)),
      stopRest: () => setState((s) => (s.active ? { ...s, active: { ...s.active, restEndsAt: null } } : s)),
      /** Verlängert/verkürzt die laufende Pause und merkt sich die neue Pausenlänge. */
      adjustRest: (sec) =>
        setState((s) => {
          const restSeconds = Math.max(15, Math.min(600, s.restSeconds + sec));
          const active = s.active?.restEndsAt ? { ...s.active, restEndsAt: s.active.restEndsAt + sec * 1000 } : s.active;
          return { ...s, restSeconds, active };
        }),
      discardWorkout: () => setState((s) => ({ ...s, active: null })),
      /** Beendet das Training und gibt die ID des gespeicherten Workouts zurück. */
      finishWorkout: () => {
        const id = `w${Date.now()}`;
        setState((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises
            .map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets.filter((st) => st.done || num(st.reps) > 0).map((st) => ({ weight: num(st.weight), reps: num(st.reps) })),
            }))
            .filter((e) => e.sets.length > 0);
          const workout = { id, date: s.active.date, title: s.active.title, startedAt: s.active.startedAt, endedAt: Date.now(), exercises };
          return { ...s, active: null, workouts: [...s.workouts, workout] };
        });
        return id;
      },
      deleteWorkout: (id) => setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) })),
      addCustomExercise: (ex) =>
        setState((s) => ({ ...s, customExercises: [...s.customExercises, { ...ex, id: `custom_${Date.now()}`, custom: true }] })),
    };
  }, []);

  return { state, hydrated, ...actions };
}

const StoreContext = createContext(null);
const useStore = () => useContext(StoreContext);

const ExerciseContext = createContext(null);
/** Alle Übungen (Datenbank + eigene) und Suche nach ID. */
function useExercises() {
  const { state } = useStore();
  const db = useContext(ExerciseContext);
  const custom = state.customExercises;
  const all = useMemo(() => [...custom, ...(db.list || [])], [custom, db.list]);
  const byId = useMemo(() => new Map(all.map((e) => [e.id, e])), [all]);
  const get = useCallback((id) => byId.get(id) || (id.startsWith('custom_') ? undefined : fallbackExercise(id)), [byId]);
  return { all, get, loading: !db.list, error: db.error, reload: db.reload };
}

// ============================================================================
// Navigation (einfacher Stapel ohne zusätzliche Bibliotheken)
// ============================================================================

const NavContext = createContext(null);
const useNav = () => useContext(NavContext);

function useNavigator() {
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);
  const nav = useMemo(
    () => ({
      push: (name, params = {}) => setStack((s) => [...s, { name, params }]),
      replace: (name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params }]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      home: () => setStack((s) => [s[0]]),
    }),
    [],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1 || stack[stack.length - 1].name === 'workout') return false;
      nav.back();
      return true;
    });
    return () => sub.remove();
  }, [stack, nav]);

  return { stack, nav };
}

// ============================================================================
// UI-Bausteine
// ============================================================================

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

function GradientButton({ label, icon, onPress, style, gold }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      <LinearGradient colors={gold ? GOLD : GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.gradientButton}>
        {icon && <Ionicons name={icon} size={18} color={gold ? C.ink : C.onAccent} />}
        <Text style={[s.gradientButtonText, gold && { color: C.ink }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function GhostButton({ label, icon, onPress, color = C.text, style }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.ghostButton, pressed && { opacity: 0.6 }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text style={[s.ghostButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ icon, onPress, color = C.text, size = 20, style, label }) {
  return (
    <Pressable
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.6 }, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

function Chip({ label, active, onPress, icon }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[s.chip, active && s.chipActive]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? C.ink : C.muted} />}
      <Text style={[s.chipText, active && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

function Tag({ label, color = C.muted }) {
  return (
    <View style={[s.tag, { borderColor: color + '55' }]}>
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function PRBadge({ text }) {
  return (
    <View style={s.prBadge}>
      <Ionicons name="trophy" size={12} color={C.gold} />
      <Text style={s.prBadgeText}>{text}</Text>
    </View>
  );
}

function SectionTitle({ children, right }) {
  return (
    <View style={s.sectionTitleRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

function StatTile({ label, value }) {
  return (
    <View style={s.statTile}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Stepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <View style={s.stepper}>
      <IconButton icon="remove" size={16} onPress={() => onChange(Math.max(min, value - 1))} style={{ padding: 8 }} />
      <Text style={s.stepperValue}>{value}</Text>
      <IconButton icon="add" size={16} onPress={() => onChange(Math.min(max, value + 1))} style={{ padding: 8 }} />
    </View>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={36} color={C.faint} />
      <Text style={s.emptyTitle}>{title}</Text>
      {text ? <Text style={s.emptyText}>{text}</Text> : null}
    </View>
  );
}

/** Kopfzeile mit Zurück-Pfeil für Unterseiten. */
function Header({ title, right }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 4 }]}>
      <IconButton icon="chevron-back" size={26} onPress={nav.back} label="Zurück" />
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ minWidth: 38, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/** Foto der Übung; mit `animate` wechseln Start- und Endposition. */
function ExerciseImage({ exercise, size, style, animate = false, rounded = R.sm }) {
  const [frame, setFrame] = useState(0);
  const canAnimate = animate && (exercise?.img || 0) > 1;

  useEffect(() => {
    if (!canAnimate) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % 2), 1100);
    return () => clearInterval(t);
  }, [canAnimate]);

  const uri = exerciseImage(exercise, frame);
  const box = [{ overflow: 'hidden', backgroundColor: '#EDEDED', borderRadius: rounded }, size ? { width: size, height: size } : null, style];

  if (!uri) {
    return (
      <View style={[box, { backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name={isCardio(exercise) ? 'run-fast' : 'dumbbell'} size={size ? size * 0.45 : 40} color={C.red} />
      </View>
    );
  }
  return (
    <View style={box}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    </View>
  );
}

function ProgressRing({ progress, size = 84, stroke = 3, label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.red} />
            <Stop offset="1" stopColor={C.accent} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.surface2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ color: C.text, fontSize: 22, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{label}</Text>
      {sublabel ? <Text style={{ color: C.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }}>{sublabel}</Text> : null}
    </View>
  );
}

/** Liniendiagramm für den Kraftverlauf einer Übung. */
function LineChart({ values, height = 140, unit = 'kg' }) {
  const [width, setWidth] = useState(0);
  const pad = 12;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - 2 * pad),
    y: pad + (1 - (v - min) / span) * (height - 2 * pad),
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={s.chartLabel}>
          Start {formatKg(first)} {unit}
        </Text>
        <Text style={[s.chartLabel, delta > 0 && { color: C.red }]}>
          Jetzt {formatKg(last)} {unit}
          {delta !== 0 ? ` (${delta > 0 ? '+' : ''}${formatKg(delta)})` : ''}
        </Text>
      </View>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.accent} stopOpacity={0.45} />
              <Stop offset="1" stopColor={C.accent} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke={C.red} strokeWidth={2} fill="none" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3}
              fill={i === points.length - 1 ? C.red : C.bg}
              stroke={C.red}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

function WeekStrip({ offset, onChangeOffset, plans, byDate, onPressDay }) {
  const start = startOfWeek(new Date(), offset);
  const today = dateKey();
  const label = offset === 0 ? 'Diese Woche' : offset === -1 ? 'Letzte Woche' : offset === 1 ? 'Nächste Woche' : formatWeekRange(start);
  const shortTitle = (t) => {
    const x = t.replace(/\s*day$/i, '').trim();
    return x.length > 6 ? x.slice(0, 5) + '.' : x || 'Plan';
  };

  return (
    <View style={s.week}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Pressable onPress={() => offset !== 0 && onChangeOffset(0)}>
          <Text style={s.kickerMuted}>{label}</Text>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: '500', marginTop: 3 }}>{formatWeekRange(start)}</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton icon="chevron-back" size={18} onPress={() => onChangeOffset(offset - 1)} color={C.muted} label="Vorherige Woche" style={s.weekArrow} />
          <IconButton icon="chevron-forward" size={18} onPress={() => onChangeOffset(offset + 1)} color={C.muted} label="Nächste Woche" style={s.weekArrow} />
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(start, i);
          const key = dateKey(d);
          const plan = plans[i];
          const done = byDate.has(key);
          const isToday = key === today;
          const planned = plan.items.length > 0;
          return (
            <Pressable
              key={key}
              onPress={() => {
                tap();
                onPressDay(key);
              }}
              style={({ pressed }) => [{ flex: 1, alignItems: 'center', gap: 6 }, pressed && { opacity: 0.6 }]}
            >
              <Text style={[s.dayName, isToday && { color: C.text }]}>{WEEKDAYS_SHORT[i]}</Text>
              <View style={[s.dayCircle, isToday && s.dayToday, done && s.dayDone]}>
                <Text style={[s.dayNum, done && { color: C.onAccent }, !done && !isToday && key < today && { color: C.muted }]}>{d.getDate()}</Text>
              </View>
              <Text numberOfLines={1} style={[s.dayPlan, done && { color: C.red }, !planned && { color: C.faint }]}>
                {planned ? shortTitle(plan.title) : '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Liste aller Übungen eines Trainings mit Gewicht pro Satz. */
function WorkoutDetail({ workout }) {
  const { state } = useStore();
  const { get } = useExercises();
  const nav = useNav();

  if (workout.exercises.length === 0) return <Text style={{ color: C.muted }}>Keine Sätze eingetragen.</Text>;

  return (
    <View style={{ gap: 12 }}>
      {workout.exercises.map((e, i) => {
        const ex = get(e.exerciseId);
        const labels = setLabels(ex);
        const before = personalRecord(state.workouts, e.exerciseId, workout.startedAt);
        // Nur den ersten Satz markieren, der den alten Rekord übertrifft
        let prIndex = -1;
        let best = before;
        e.sets.forEach((st, j) => {
          if (before && isBetter(st, best)) {
            best = st;
            if (prIndex < 0) prIndex = j;
          }
        });
        return (
          <Pressable
            key={`${e.exerciseId}-${i}`}
            onPress={() => ex && nav.push('exercise', { id: ex.id })}
            style={({ pressed }) => [s.card, { gap: 6 }, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <ExerciseImage exercise={ex} size={46} rounded={12} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.cardTitle} numberOfLines={2}>
                  {ex?.name || 'Unbekannte Übung'}
                </Text>
                {prIndex >= 0 && <PRBadge text="Neuer Rekord!" />}
              </View>
            </View>
            {e.sets.map((st, j) => (
              <View key={j} style={s.logSetRow}>
                <Text style={{ color: C.faint, width: 28, fontWeight: '800' }}>{j + 1}</Text>
                <Text style={[s.logSetVal, j === prIndex && { color: C.gold }]}>
                  {st.weight > 0 ? `${formatKg(st.weight)} ${labels.weight}` : labels.weight === 'kg' ? 'Körpergewicht' : '–'}
                </Text>
                <Text style={{ color: C.muted, fontWeight: '600', fontSize: 15 }}>
                  × {st.reps} {labels.reps}
                </Text>
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================================
// Startseite: Woche oben, heutiges Training in der Mitte
// ============================================================================

function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const byDate = useMemo(() => workoutsByDate(state.workouts), [state.workouts]);
  const streak = useMemo(() => weekStreak(state.workouts), [state.workouts]);

  const week = useMemo(() => {
    const start = startOfWeek();
    const workouts = Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i))).flatMap((k) => byDate.get(k) || []);
    return {
      done: new Set(workouts.map((w) => w.date)).size,
      planned: Object.values(state.plans).filter((p) => p.items.length > 0).length,
      time: workouts.reduce((sum, w) => sum + (w.endedAt - w.startedAt), 0),
      volume: workouts.reduce((sum, w) => sum + workoutVolume(w), 0),
    };
  }, [byDate, state.plans]);

  const recent = useMemo(() => [...state.workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, 3), [state.workouts]);
  const todayIndex = weekdayOf(new Date());

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.kickerMuted}>{greeting()}</Text>
          <Text style={[s.h1, { marginTop: 4 }]}>Dein Training</Text>
        </View>
        {streak > 0 && (
          <View style={s.streak}>
            <Ionicons name="flame-outline" size={15} color={C.gold} />
            <Text style={{ color: C.gold, fontWeight: '600', fontSize: 13 }}>{streak} {streak === 1 ? 'Woche' : 'Wochen'}</Text>
          </View>
        )}
        <IconButton icon="barbell-outline" size={22} onPress={() => nav.push('exercises')} style={s.roundIcon} />
      </View>

      <WeekStrip offset={weekOffset} onChangeOffset={setWeekOffset} plans={state.plans} byDate={byDate} onPressDay={(d) => nav.push('day', { date: d })} />

      <TodayHero />

      <Text style={s.quote}>„{quoteOfDay()}“</Text>

      <SectionTitle>Diese Woche</SectionTitle>
      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 18 }]}>
        <ProgressRing progress={week.planned ? week.done / week.planned : 0} label={`${week.done}/${week.planned}`} sublabel="Trainings" />
        <View style={{ flex: 1, gap: 14 }}>
          <View>
            <Text style={s.statLabel}>Trainingszeit</Text>
            <Text style={s.statValueSmall}>{formatMinutes(week.time)}</Text>
          </View>
          <View style={s.hairline} />
          <View>
            <Text style={s.statLabel}>Bewegtes Gewicht</Text>
            <Text style={s.statValueSmall}>{formatVolume(week.volume)}</Text>
          </View>
        </View>
      </View>

      <SectionTitle>Wochenplan</SectionTitle>
      <View style={[s.card, { padding: 0 }]}>
        {WEEKDAYS.map((name, i) => {
          const plan = state.plans[i];
          return (
            <Pressable
              key={name}
              onPress={() => {
                tap();
                nav.push('plan', { day: i });
              }}
              style={({ pressed }) => [s.planRow, i < 6 && s.rowBorder, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ color: i === todayIndex ? C.red : C.muted, fontWeight: '600', width: 24, letterSpacing: 1, fontSize: 12, textTransform: 'uppercase' }}>{name.slice(0, 2)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowTitle, !plan.items.length && { color: C.faint }]}>
                  {plan.items.length ? plan.title || 'Training' : 'Ruhetag'}
                </Text>
                {plan.items.length > 0 && <Text style={s.rowSub}>{plan.items.length} Übungen</Text>}
              </View>
              <Ionicons name="create-outline" size={18} color={C.faint} />
            </Pressable>
          );
        })}
      </View>

      {recent.length > 0 && (
        <>
          <SectionTitle>Letzte Trainings</SectionTitle>
          <View style={{ gap: 10 }}>
            {recent.map((w) => (
              <Pressable key={w.id} onPress={() => nav.push('log', { id: w.id })} style={({ pressed }) => [s.listCard, pressed && { opacity: 0.7 }]}>
                <View style={s.doneIcon}>
                  <Ionicons name="checkmark" size={18} color={C.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{w.title}</Text>
                  <Text style={s.rowSub}>
                    {formatShort(w.date)} · {formatMinutes(w.endedAt - w.startedAt)} · {formatVolume(workoutVolume(w))}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.faint} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function TodayHero() {
  const nav = useNav();
  const { state, startWorkout } = useStore();
  const { get } = useExercises();
  const todayIndex = weekdayOf(new Date());
  const plan = state.plans[todayIndex];
  const active = state.active;
  const doneToday = state.workouts.filter((w) => w.date === dateKey());
  const now = useNow(!!active);

  const exercises = plan.items.map((i) => get(i.exerciseId)).filter(Boolean);
  const totalSets = plan.items.reduce((sum, i) => sum + i.sets, 0);
  const muscles = [...new Set(exercises.flatMap((e) => e.pm))].slice(0, 4);
  const cover = (active && active.exercises[0] ? get(active.exercises[0].exerciseId) : null) || exercises[0];

  const start = () => {
    startWorkout();
    nav.push('workout');
  };

  let body;
  if (active) {
    body = (
      <>
        <Text style={s.heroKicker}>TRAINING LÄUFT</Text>
        <Text style={s.heroTitle}>{active.title}</Text>
        <Text style={s.heroTimer}>{formatDuration(now - active.startedAt)}</Text>
        <GradientButton label="Fortsetzen" icon="play" onPress={() => nav.push('workout')} />
      </>
    );
  } else if (doneToday.length > 0) {
    const last = doneToday[doneToday.length - 1];
    body = (
      <>
        <Text style={s.heroKicker}>HEUTE ERLEDIGT</Text>
        <Text style={s.heroTitle}>{last.title}</Text>
        <Text style={s.heroMeta}>
          {formatMinutes(last.endedAt - last.startedAt)} · {formatVolume(workoutVolume(last))} bewegt
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <GradientButton label="Ansehen" icon="stats-chart" onPress={() => nav.push('log', { id: last.id })} style={{ flex: 1 }} />
          <GhostButton label="Noch eins" icon="add" onPress={start} />
        </View>
      </>
    );
  } else if (plan.items.length > 0) {
    body = (
      <>
        <Text style={s.heroKicker}>HEUTE · {WEEKDAYS[todayIndex].toUpperCase()}</Text>
        <Text style={s.heroTitle}>{plan.title || 'Training'}</Text>
        <Text style={s.heroMeta}>
          {plan.items.length} Übungen  ·  {totalSets} Sätze  ·  ca. {Math.round((totalSets * 2.5) / 5) * 5} Min
        </Text>
        {muscles.length > 0 && <Text style={s.heroMuscles}>{muscles.map((m) => MUSCLE_LABELS[m] || m).join('  ·  ')}</Text>}
        <View style={{ flexDirection: 'row', marginVertical: 6 }}>
          {exercises.slice(0, 5).map((e) => (
            <ExerciseImage key={e.id} exercise={e} size={44} rounded={12} style={s.thumb} />
          ))}
          {exercises.length > 5 && (
            <View style={[s.thumb, s.more]}>
              <Text style={{ color: C.text, fontWeight: '800' }}>+{exercises.length - 5}</Text>
            </View>
          )}
        </View>
        <GradientButton label="Training starten" icon="play" onPress={start} />
      </>
    );
  } else {
    body = (
      <>
        <Text style={s.heroKicker}>HEUTE · RUHETAG</Text>
        <Text style={s.heroTitle}>Regeneration</Text>
        <Text style={s.heroMeta}>Muskeln wachsen in der Pause. Lust auf eine Extra-Session?</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <GhostButton label="Freies Training" icon="flash-outline" onPress={start} style={{ flex: 1 }} />
          <GhostButton label="Plan" icon="create-outline" onPress={() => nav.push('plan', { day: todayIndex })} />
        </View>
      </>
    );
  }

  return (
    <View style={s.hero}>
      {cover ? (
        <ExerciseImage exercise={cover} style={StyleSheet.absoluteFill} rounded={0} />
      ) : (
        <Ionicons name="moon" size={160} color={C.surface2} style={{ position: 'absolute', top: 24, right: 24 }} />
      )}
      <LinearGradient colors={HERO_SHADE} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, gap: 10 }}>{body}</View>
    </View>
  );
}

// ============================================================================
// Laufendes Training
// ============================================================================

function WorkoutScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state, finishWorkout, discardWorkout } = useStore();
  const { get } = useExercises();
  const active = state.active;
  const now = useNow(!!active);

  // Rekorde und letzte Werte zum Start des Trainings
  const ids = active ? active.exercises.map((e) => e.exerciseId).join('|') : '';
  const reference = useMemo(() => {
    const map = new Map();
    for (const id of ids.split('|').filter(Boolean)) {
      map.set(id, { pr: personalRecord(state.workouts, id), prev: previousSets(state.workouts, id) });
    }
    return map;
  }, [ids, state.workouts]);

  if (!active) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
        <Text style={{ color: C.muted }}>Kein aktives Training.</Text>
        <GhostButton label="Zurück" onPress={nav.back} />
      </View>
    );
  }

  const totalSets = active.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const doneSets = active.exercises.reduce((sum, e) => sum + e.sets.filter((x) => x.done).length, 0);

  const finish = () =>
    Alert.alert(
      'Training beenden?',
      doneSets === 0 ? 'Du hast noch keinen Satz abgehakt.' : `${doneSets} von ${totalSets} Sätzen erledigt – stark!`,
      [
        { text: 'Weiter trainieren', style: 'cancel' },
        {
          text: 'Beenden',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            const id = finishWorkout();
            nav.replace('log', { id, fresh: true });
          },
        },
      ],
    );

  const discard = () =>
    Alert.alert('Training verwerfen?', 'Alle Einträge dieses Trainings gehen verloren.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Verwerfen',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          nav.back();
        },
      },
    ]);

  return (
    <View style={s.screen}>
      <View style={[s.workoutTop, { paddingTop: insets.top + 6 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon="chevron-down" size={26} onPress={nav.back} />
          <Text style={s.headerTitle} numberOfLines={1}>
            {active.title}
          </Text>
          <Pressable onPress={finish} style={({ pressed }) => [s.finishBtn, pressed && { opacity: 0.7 }]}>
            <Text style={{ color: C.onAccent, fontWeight: '800' }}>Beenden</Text>
          </Pressable>
        </View>
        <Text style={s.timer}>{formatDuration(now - active.startedAt)}</Text>
        <View style={s.progressTrack}>
          <View style={{ height: 3, borderRadius: 2, backgroundColor: C.red, width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </View>
        <Text style={s.progressText}>
          {doneSets}/{totalSets} Sätze
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: insets.bottom + 140 }}
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
            pr={reference.get(ae.exerciseId)?.pr || null}
            prev={reference.get(ae.exerciseId)?.prev || null}
          />
        ))}
        <GhostButton label="Übung hinzufügen" icon="add-circle-outline" color={C.red} onPress={() => nav.push('exercises', { mode: 'workout' })} />
        <GhostButton label="Training verwerfen" icon="trash-outline" color={C.danger} onPress={discard} />
      </ScrollView>

      <RestTimer bottomInset={insets.bottom} />
    </View>
  );
}

const ExerciseCard = memo(function ExerciseCard({ index, count, data, exercise, pr, prev }) {
  const nav = useNav();
  const { updateSet, addSet, removeSet, removeFromWorkout, moveInWorkout, startRest } = useStore();
  const labels = setLabels(exercise);
  const allDone = data.sets.length > 0 && data.sets.every((x) => x.done);

  // Vorschlag: Werte aus dem vorherigen Satz, sonst vom letzten Training
  const placeholder = (j) => {
    const before = data.sets[j - 1];
    const fromPrev = prev ? prev[j] || prev[prev.length - 1] : null;
    return {
      weight: before?.weight || (fromPrev ? formatKg(fromPrev.weight) : ''),
      reps: before?.reps || (fromPrev ? String(fromPrev.reps) : ''),
    };
  };

  const toggle = (j, set) => {
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
    if (pr && isBetter({ weight: num(weight), reps: num(reps) }, pr)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    startRest();
  };

  const menu = () =>
    Alert.alert(exercise?.name || 'Übung', undefined, [
      ...(index > 0 ? [{ text: 'Nach oben', onPress: () => moveInWorkout(index, -1) }] : []),
      ...(index < count - 1 ? [{ text: 'Nach unten', onPress: () => moveInWorkout(index, 1) }] : []),
      { text: 'Entfernen', style: 'destructive', onPress: () => removeFromWorkout(index) },
      { text: 'Abbrechen', style: 'cancel' },
    ]);

  return (
    <View style={[s.card, { borderRadius: R.lg, padding: 14 }, allDone && { borderColor: C.accent + '66' }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <Pressable onPress={() => exercise && nav.push('exercise', { id: exercise.id })}>
          <ExerciseImage exercise={exercise} size={58} rounded={14} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[s.cardTitle, { fontSize: 17 }]} numberOfLines={2}>
            {exercise?.name || 'Unbekannte Übung'}
          </Text>
          {exercise?.pm.length ? <Text style={s.rowSub}>{muscleSummary(exercise)}</Text> : null}
          {pr ? (
            <PRBadge text={`Rekord ${formatKg(pr.weight)} ${labels.weight} × ${pr.reps}`} />
          ) : (
            <Text style={s.rowSub}>Noch kein Rekord – setz ihn heute!</Text>
          )}
        </View>
        <IconButton icon="ellipsis-horizontal" onPress={menu} color={C.muted} />
      </View>

      <View style={[s.setRow, { paddingVertical: 0, marginBottom: 4 }]}>
        <Text style={[s.setHead, { width: 34 }]}>SATZ</Text>
        <Text style={[s.setHead, { flex: 1 }]}>VORHER</Text>
        <Text style={[s.setHead, s.inputCol]}>{labels.weight.toUpperCase()}</Text>
        <Text style={[s.setHead, s.inputCol]}>{labels.reps.toUpperCase()}</Text>
        <View style={{ width: 44 }} />
      </View>

      {data.sets.map((set, j) => {
        const ph = placeholder(j);
        const prevSet = prev ? prev[j] : null;
        const isPR = set.done && pr && isBetter({ weight: num(set.weight), reps: num(set.reps) }, pr);
        return (
          <View key={j} style={[s.setRow, set.done && { backgroundColor: C.doneBg }]}>
            <Pressable
              onLongPress={() =>
                Alert.alert(`Satz ${j + 1} löschen?`, undefined, [
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Löschen', style: 'destructive', onPress: () => removeSet(index, j) },
                ])
              }
              style={{ width: 34, alignItems: 'center' }}
            >
              {isPR ? (
                <Ionicons name="trophy" size={16} color={C.gold} />
              ) : (
                <Text style={{ color: set.done ? C.red : C.text, fontWeight: '800', fontSize: 15 }}>{j + 1}</Text>
              )}
            </Pressable>
            <Text style={{ flex: 1, color: C.muted, fontSize: 13 }} numberOfLines={1}>
              {prevSet ? `${formatKg(prevSet.weight)} × ${prevSet.reps}` : '–'}
            </Text>
            <TextInput
              value={set.weight}
              onChangeText={(t) => updateSet(index, j, { weight: t })}
              placeholder={ph.weight || '0'}
              placeholderTextColor={C.faint}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={[s.setInput, s.inputCol, set.done && { backgroundColor: 'transparent' }]}
            />
            <TextInput
              value={set.reps}
              onChangeText={(t) => updateSet(index, j, { reps: t })}
              placeholder={ph.reps || '0'}
              placeholderTextColor={C.faint}
              keyboardType="number-pad"
              selectTextOnFocus
              style={[s.setInput, s.inputCol, set.done && { backgroundColor: 'transparent' }]}
            />
            <Pressable
              onPress={() => toggle(j, set)}
              hitSlop={6}
              accessibilityRole="checkbox"
              accessibilityLabel={`Satz ${j + 1} abhaken`}
              accessibilityState={{ checked: set.done }}
              style={[s.check, set.done && { backgroundColor: C.accent }]}
            >
              <Ionicons name="checkmark" size={20} color={set.done ? C.onAccent : C.muted} />
            </Pressable>
          </View>
        );
      })}

      <Pressable
        onPress={() => {
          tap();
          addSet(index);
        }}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 12 }, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add" size={16} color={C.red} />
        <Text style={{ color: C.red, fontWeight: '700' }}>Satz hinzufügen</Text>
      </Pressable>
    </View>
  );
});

function RestTimer({ bottomInset }) {
  const { state, stopRest, adjustRest } = useStore();
  const endsAt = state.active ? state.active.restEndsAt : null;
  const now = useNow(endsAt !== null, 250);
  const remaining = endsAt ? endsAt - now : 0;
  const fired = useRef(null);

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
    <View style={[s.rest, { bottom: bottomInset + 14 }]}>
      <View style={[s.restFill, { width: `${progress * 100}%` }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
        <View>
          <Text style={s.kicker}>PAUSE</Text>
          <Text style={s.restTime}>{formatDuration(remaining + 999)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => adjustRest(-15)} style={s.restBtn}>
            <Text style={s.restBtnText}>−15</Text>
          </Pressable>
          <Pressable onPress={() => adjustRest(15)} style={s.restBtn}>
            <Text style={s.restBtnText}>+15</Text>
          </Pressable>
          <Pressable onPress={stopRest} style={[s.restBtn, { backgroundColor: C.accent }]}>
            <Text style={[s.restBtnText, { color: C.onAccent }]}>Weiter</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Zusammenfassung eines Trainings
// ============================================================================

function LogScreen({ id, fresh }) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state, deleteWorkout } = useStore();
  const workout = state.workouts.find((w) => w.id === id);
  const records = useMemo(() => (workout ? recordsInWorkout(state.workouts, workout) : new Set()), [state.workouts, workout]);

  if (!workout) {
    return (
      <View style={s.screen}>
        <Header title="" />
        <EmptyState icon="alert-circle-outline" title="Training nicht gefunden" />
      </View>
    );
  }

  const remove = () =>
    Alert.alert('Training löschen?', 'Das kann nicht rückgängig gemacht werden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          nav.back();
          deleteWorkout(workout.id);
        },
      },
    ]);

  return (
    <View style={s.screen}>
      <Header title={fresh ? '' : workout.title} right={<IconButton icon="trash-outline" color={C.muted} onPress={remove} />} />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: insets.bottom + 32 }}>
        {fresh ? (
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.celebrate}>
            <Ionicons name={records.size ? 'trophy-outline' : 'checkmark-circle-outline'} size={40} color={C.onAccent} />
            <Text style={s.celebrateTitle}>
              {records.size === 1 ? 'Neuer Rekord!' : records.size > 1 ? `${records.size} neue Rekorde!` : 'Training geschafft!'}
            </Text>
            <Text style={{ color: C.onAccent, opacity: 0.75, fontWeight: '600', textAlign: 'center' }}>{quoteOfDay()}</Text>
          </LinearGradient>
        ) : (
          <Text style={{ color: C.muted, fontSize: 15, marginBottom: 6 }}>{formatLong(workout.date)}</Text>
        )}
        {fresh && <Text style={[s.h2, { marginTop: 6 }]}>{workout.title}</Text>}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="time-outline" label="Dauer" value={formatMinutes(workout.endedAt - workout.startedAt)} />
          <StatTile icon="barbell-outline" label="Volumen" value={formatVolume(workoutVolume(workout))} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile icon="layers-outline" label="Sätze" value={String(workoutSetCount(workout))} />
          <StatTile icon="trophy-outline" label="Rekorde" value={String(records.size)} />
        </View>

        <Text style={[s.sectionTitle, { marginTop: 18, marginBottom: 2 }]}>Übungen</Text>
        <WorkoutDetail workout={workout} />

        {fresh ? (
          <GradientButton label="Fertig" icon="checkmark" onPress={nav.home} style={{ marginTop: 24 }} />
        ) : (
          <GhostButton label="Zurück" onPress={nav.back} style={{ marginTop: 24 }} />
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Rückblick auf einen Tag
// ============================================================================

function DayScreen({ date }) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state, startWorkout } = useStore();
  const { get } = useExercises();

  const weekday = weekdayOf(parseKey(date));
  const plan = state.plans[weekday];
  const workouts = state.workouts.filter((w) => w.date === date).sort((a, b) => a.startedAt - b.startedAt);
  const today = dateKey();
  const isToday = date === today;
  const isFuture = date > today;

  return (
    <View style={s.screen}>
      <Header title="" />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 4, paddingBottom: insets.bottom + 32 }}>
        <Text style={s.kicker}>{isToday ? 'HEUTE' : isFuture ? 'GEPLANT' : 'RÜCKBLICK'}</Text>
        <Text style={[s.h2, { marginTop: 4 }]}>{formatLong(date)}</Text>

        {workouts.map((w) => (
          <View key={w.id} style={{ gap: 12, marginTop: 18 }}>
            <Pressable onPress={() => nav.push('log', { id: w.id })} style={[s.listCard, { backgroundColor: C.surface2, borderWidth: 0 }]}>
              <View style={s.doneIcon}>
                <Ionicons name="checkmark" size={18} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowTitle, { fontSize: 18, fontWeight: '600' }]}>{w.title}</Text>
                <Text style={s.rowSub}>
                  {formatMinutes(w.endedAt - w.startedAt)} · {formatVolume(workoutVolume(w))} ·{' '}
                  {new Date(w.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </Pressable>
            <WorkoutDetail workout={w} />
          </View>
        ))}

        {workouts.length === 0 && !isFuture && (
          <EmptyState
            icon={plan.items.length ? 'bed-outline' : 'moon-outline'}
            title={isToday ? 'Noch kein Training heute' : 'Kein Training eingetragen'}
            text={plan.items.length ? `Geplant war: ${plan.title || 'Training'}` : 'Das war ein Ruhetag.'}
          />
        )}

        {isToday && !state.active && workouts.length === 0 && plan.items.length > 0 && (
          <GradientButton
            label="Training starten"
            icon="play"
            onPress={() => {
              startWorkout();
              nav.replace('workout');
            }}
          />
        )}

        <Text style={[s.sectionTitle, { marginTop: 28, marginBottom: 10 }]}>Plan für jeden {WEEKDAYS[weekday]}</Text>
        <View style={[s.card, { gap: 10 }]}>
          <Text style={s.cardTitle}>{plan.items.length ? plan.title || 'Training' : 'Ruhetag'}</Text>
          {plan.items.map((item) => {
            const ex = get(item.exerciseId);
            return (
              <View key={item.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ExerciseImage exercise={ex} size={36} rounded={9} />
                <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                  {ex?.name || item.exerciseId}
                </Text>
                <Text style={{ color: C.muted, fontSize: 13, fontWeight: '600' }}>{item.sets} Sätze</Text>
              </View>
            );
          })}
        </View>
        <GhostButton label={`${WEEKDAYS[weekday]}-Plan bearbeiten`} icon="create-outline" onPress={() => nav.push('plan', { day: weekday })} style={{ marginTop: 12 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Plan für einen Wochentag
// ============================================================================

function PlanScreen({ day }) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state, setPlan, updatePlan } = useStore();
  const { get } = useExercises();
  const plan = state.plans[day];

  const confirmReplace = (title, message, button, apply, destructive) => {
    if (plan.items.length === 0) return apply();
    Alert.alert(title, message, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: button, style: destructive ? 'destructive' : 'default', onPress: apply },
    ]);
  };

  const applyPreset = (p) =>
    confirmReplace(`Vorlage „${p.title}“ laden?`, 'Die aktuellen Übungen werden ersetzt.', 'Ersetzen', () => setPlan(day, presetPlan(p.title)));
  const setRestDay = () =>
    confirmReplace('Zum Ruhetag machen?', 'Alle Übungen dieses Tages werden entfernt.', 'Ruhetag', () => setPlan(day, { title: '', items: [] }), true);
  const copyTo = (target) =>
    Alert.alert(`Nach ${WEEKDAYS[target]} kopieren?`, `Der Plan für ${WEEKDAYS[target]} wird überschrieben.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Kopieren', onPress: () => setPlan(target, { title: plan.title, items: plan.items.map((i) => ({ ...i })) }) },
    ]);
  const move = (index, dir) =>
    updatePlan(day, (p) => {
      const j = index + dir;
      if (j < 0 || j >= p.items.length) return p;
      const items = [...p.items];
      [items[index], items[j]] = [items[j], items[index]];
      return { ...p, items };
    });

  return (
    <View style={s.screen}>
      <Header title={WEEKDAYS[day]} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 110 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={s.label}>Name des Trainings</Text>
        <TextInput
          value={plan.title}
          onChangeText={(title) => updatePlan(day, (p) => ({ ...p, title }))}
          placeholder="z. B. Leg Day"
          placeholderTextColor={C.faint}
          style={[s.input, { fontSize: 22, fontWeight: '800' }]}
        />
        <Text style={{ color: C.faint, fontSize: 12, marginTop: 6 }}>Dieser Plan gilt jede Woche für {WEEKDAYS[day]}.</Text>

        <Text style={s.label}>Vorlagen</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 18 }}>
          {PRESETS.map((p) => (
            <Chip key={p.title} label={p.title} icon={p.icon} active={plan.title === p.title} onPress={() => applyPreset(p)} />
          ))}
          <Chip label="Ruhetag" icon="bed-outline" active={plan.items.length === 0} onPress={setRestDay} />
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 10 }}>
          <Text style={s.sectionTitle}>Übungen ({plan.items.length})</Text>
          <Text style={{ color: C.faint, fontSize: 12, marginRight: 24 }}>Sätze</Text>
        </View>

        {plan.items.length === 0 && <EmptyState icon="bed-outline" title="Ruhetag" text="Füge Übungen hinzu oder wähle eine Vorlage." />}

        {plan.items.map((item, i) => {
          const ex = get(item.exerciseId);
          return (
            <View key={item.exerciseId} style={[s.listCard, { padding: 10, marginBottom: 8, gap: 10 }]}>
              <View>
                <IconButton icon="chevron-up" size={16} color={i === 0 ? C.border : C.muted} onPress={() => move(i, -1)} style={{ padding: 2 }} />
                <IconButton
                  icon="chevron-down"
                  size={16}
                  color={i === plan.items.length - 1 ? C.border : C.muted}
                  onPress={() => move(i, 1)}
                  style={{ padding: 2 }}
                />
              </View>
              <Pressable onPress={() => ex && nav.push('exercise', { id: ex.id })}>
                <ExerciseImage exercise={ex} size={50} rounded={12} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowTitle, { fontSize: 15 }]} numberOfLines={2}>
                  {ex?.name || item.exerciseId}
                </Text>
                {ex?.pm.length ? <Text style={s.rowSub}>{muscleSummary(ex)}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Stepper
                  value={item.sets}
                  onChange={(sets) => updatePlan(day, (p) => ({ ...p, items: p.items.map((x, j) => (j === i ? { ...x, sets } : x)) }))}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    updatePlan(day, (p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }));
                  }}
                >
                  <Text style={{ color: C.danger, fontSize: 12, fontWeight: '700' }}>Entfernen</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {plan.items.length > 0 && (
          <>
            <Text style={[s.label, { marginTop: 28 }]}>Plan kopieren nach …</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {WEEKDAYS_SHORT.map((d, i) => (i === day ? null : <Chip key={d} label={d} onPress={() => copyTo(i)} />))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <GradientButton label="Übungen hinzufügen" icon="add" onPress={() => nav.push('exercises', { mode: 'plan', day })} />
      </View>
    </View>
  );
}

// ============================================================================
// Übungsbibliothek (auch als Auswahl für Plan und Training)
// ============================================================================

const ROW_HEIGHT = 76;
const normalize = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss');

function ExercisesScreen({ mode, day }) {
  const picking = mode === 'plan' || mode === 'workout';
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { state, addToPlan, addToWorkout } = useStore();
  const { all, loading, error, reload } = useExercises();

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('popular');
  const [selected, setSelected] = useState([]);
  const deferredQuery = useDeferredValue(query);

  const usage = useMemo(() => {
    const counts = new Map();
    for (const w of state.workouts) for (const e of w.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) || 0) + 1);
    return counts;
  }, [state.workouts]);
  const records = useMemo(() => allRecords(state.workouts), [state.workouts]);
  const searchIndex = useMemo(
    () => new Map(all.map((e) => [e.id, normalize(`${e.name} ${e.en || ''} ${muscleSummary(e)} ${EQUIPMENT_LABELS[e.eq] || ''}`)])),
    [all],
  );
  const already = useMemo(() => {
    if (mode === 'plan') return new Set(state.plans[day].items.map((i) => i.exerciseId));
    if (mode === 'workout') return new Set(state.active ? state.active.exercises.map((e) => e.exerciseId) : []);
    return new Set();
  }, [mode, day, state.plans, state.active]);

  const list = useMemo(() => {
    const words = normalize(deferredQuery.trim()).split(/\s+/).filter(Boolean);
    const g = MUSCLE_GROUPS.find((x) => x.key === group);
    const filtered = all.filter((e) => {
      if (words.length) {
        const text = searchIndex.get(e.id) || '';
        return words.every((w) => text.includes(w));
      }
      if (group === 'popular') return POPULAR_IDS.has(e.id) || usage.has(e.id) || e.custom;
      if (group === 'mine') return usage.has(e.id) || e.custom;
      return g ? g.match(e) : true;
    });
    const score = (e) => (usage.get(e.id) || 0) * 100 + (e.custom ? 50 : 0) + (POPULAR_IDS.has(e.id) ? 10 : 0);
    return filtered.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'de'));
  }, [all, deferredQuery, group, searchIndex, usage]);

  const toggle = (id) => {
    tap();
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  };
  const confirm = () => {
    if (mode === 'plan') addToPlan(day, selected);
    if (mode === 'workout') addToWorkout(selected);
    nav.back();
  };

  return (
    <View style={s.screen}>
      <Header
        title={picking ? 'Übungen wählen' : 'Übungen'}
        right={<IconButton icon="add" size={26} color={C.red} onPress={() => nav.push('newExercise')} />}
      />
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={loading ? 'Übungen werden geladen …' : `${all.length} Übungen durchsuchen …`}
          placeholderTextColor={C.faint}
          style={{ flex: 1, color: C.text, fontSize: 16, paddingVertical: 12 }}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          <Chip label="Beliebt" icon="star" active={group === 'popular'} onPress={() => setGroup('popular')} />
          {usage.size > 0 && <Chip label="Meine" icon="person" active={group === 'mine'} onPress={() => setGroup('mine')} />}
          <Chip label="Alle" active={group === 'all'} onPress={() => setGroup('all')} />
          {MUSCLE_GROUPS.map((g) => (
            <Chip key={g.key} label={g.label} active={group === g.key} onPress={() => setGroup(g.key)} />
          ))}
        </ScrollView>
      </View>

      {loading && error ? (
        <View style={{ padding: 24, gap: 12 }}>
          <EmptyState icon="cloud-offline-outline" title="Übungen konnten nicht geladen werden" text="Prüfe deine Internetverbindung." />
          <GhostButton label="Erneut versuchen" icon="refresh" onPress={reload} />
        </View>
      ) : loading ? (
        <ActivityIndicator color={C.red} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={12}
          windowSize={7}
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
          contentContainerStyle={{ paddingBottom: insets.bottom + (picking ? 110 : 24) }}
          ListEmptyComponent={<EmptyState icon="search" title="Nichts gefunden" text="Leg die Übung einfach selbst an – oben rechts auf +." />}
          renderItem={({ item }) => (
            <ExerciseRow
              exercise={item}
              pr={records.get(item.id)}
              picking={picking}
              selected={selected.includes(item.id)}
              disabled={already.has(item.id)}
              disabledLabel={mode === 'workout' ? 'im Training' : 'im Plan'}
              onPress={() => (picking ? toggle(item.id) : nav.push('exercise', { id: item.id }))}
            />
          )}
        />
      )}

      {picking && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
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

const ExerciseRow = memo(function ExerciseRow({ exercise, pr, picking, selected, disabled, disabledLabel, onPress }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [s.exRow, pressed && { backgroundColor: C.surface }, disabled && { opacity: 0.4 }]}
    >
      <ExerciseImage exercise={exercise} size={56} rounded={12} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {muscleSummary(exercise)} · {EQUIPMENT_LABELS[exercise.eq] || exercise.eq}
        </Text>
        {pr && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Ionicons name="trophy-outline" size={11} color={C.gold} />
            <Text style={{ color: C.gold, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
              {formatKg(pr.weight)} kg × {pr.reps}
            </Text>
          </View>
        )}
      </View>
      {picking ? (
        disabled ? (
          <Text style={s.rowSub}>{disabledLabel}</Text>
        ) : (
          <View style={[s.pickCircle, selected && { backgroundColor: C.accent, borderColor: C.accent }]}>
            {selected && <Ionicons name="checkmark" size={18} color={C.onAccent} />}
          </View>
        )
      ) : (
        <Ionicons name="chevron-forward" size={18} color={C.faint} />
      )}
    </Pressable>
  );
});

// ============================================================================
// Übungsdetails
// ============================================================================

function ExerciseScreen({ id }) {
  const insets = useSafeAreaInsets();
  const nav = useNav();
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
        .map((h) => bestSet(h.sets)?.weight || 0),
    [history],
  );

  if (!ex) {
    return (
      <View style={s.screen}>
        <Header title="" />
        <EmptyState icon="help-circle-outline" title="Übung nicht gefunden" />
      </View>
    );
  }
  const labels = setLabels(ex);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ height: 300 + insets.top, backgroundColor: '#EDEDED' }}>
          <ExerciseImage exercise={ex} animate rounded={0} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['transparent', C.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }} />
          <IconButton icon="chevron-back" size={24} onPress={nav.back} label="Zurück" style={[s.floatingBack, { top: insets.top + 8 }]} />
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: -30 }}>
          <Text style={[s.h1, { fontSize: 28 }]}>{ex.name}</Text>
          {ex.en && ex.en !== ex.name ? <Text style={{ color: C.muted, fontSize: 15, marginTop: 2 }}>{ex.en}</Text> : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {ex.pm.map((m) => (
              <Tag key={m} label={MUSCLE_LABELS[m] || m} color={C.red} />
            ))}
            {ex.sm.slice(0, 3).map((m) => (
              <Tag key={m} label={MUSCLE_LABELS[m] || m} />
            ))}
            <Tag label={EQUIPMENT_LABELS[ex.eq] || ex.eq} />
            {LEVEL_LABELS[ex.lvl] ? <Tag label={LEVEL_LABELS[ex.lvl]} /> : null}
          </View>

          {pr ? (
            <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.prCard}>
              <Ionicons name="trophy-outline" size={28} color={C.ink} />
              <View style={{ flex: 1 }}>
                <Text style={[s.kicker, { color: C.ink, opacity: 0.6 }]}>ALLTIME HIGH</Text>
                <Text style={{ color: C.ink, fontSize: 30, fontWeight: '300', fontVariant: ['tabular-nums'] }}>
                  {formatKg(pr.weight)} {labels.weight} × {pr.reps}
                </Text>
                <Text style={{ color: C.ink, opacity: 0.65, fontSize: 13, fontWeight: '500' }}>
                  am {formatShort(pr.date)}
                  {pr.e1rm > 0 && labels.weight === 'kg' ? ` · geschätztes 1RM ${formatKg(Math.round(pr.e1rm * 2) / 2)} kg` : ''}
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={[s.listCard, { marginTop: 20 }]}>
              <Ionicons name="trophy-outline" size={22} color={C.muted} />
              <Text style={{ color: C.muted, flex: 1 }}>Noch kein Rekord – trainiere die Übung, um ihn zu setzen.</Text>
            </View>
          )}

          {chart.length > 1 && (
            <>
              <SectionTitle>Fortschritt</SectionTitle>
              <View style={s.card}>
                <LineChart values={chart} unit={labels.weight} />
                <Text style={s.hint}>Bester Satz der letzten {chart.length} Trainings</Text>
              </View>
            </>
          )}

          {history.length > 0 && (
            <>
              <SectionTitle>Verlauf</SectionTitle>
              <View style={{ gap: 8 }}>
                {history.slice(0, 20).map((h) => (
                  <Pressable key={h.workoutId} onPress={() => nav.push('log', { id: h.workoutId })} style={s.histRow}>
                    <Text style={{ color: C.muted, width: 56, fontWeight: '700' }}>{formatShort(h.date)}</Text>
                    <Text style={{ color: C.text, flex: 1, fontWeight: '600' }}>{h.sets.map((x) => `${formatKg(x.weight)}×${x.reps}`).join('  ·  ')}</Text>
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
                    <Text style={{ color: C.red, fontWeight: '700' }}>{showSteps ? 'Weniger' : 'Anzeigen'}</Text>
                  </Pressable>
                }
              >
                Ausführung
              </SectionTitle>
              {(showSteps ? ex.ins : ex.ins.slice(0, 1)).map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                  <Text style={{ color: C.red, fontWeight: '900', width: 18 }}>{i + 1}</Text>
                  <Text style={{ color: C.text, flex: 1, lineHeight: 21 }}>{step}</Text>
                </View>
              ))}
              <Text style={s.hint}>Anleitung auf Englisch (Quelle: free-exercise-db)</Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Eigene Übung anlegen
// ============================================================================

const CUSTOM_MUSCLES = ['chest', 'lats', 'middle back', 'lower back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'forearms'];
const CUSTOM_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'bands', 'other'];

function NewExerciseScreen() {
  const nav = useNav();
  const { addCustomExercise } = useStore();
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState([]);
  const [equipment, setEquipment] = useState('machine');
  const [cardio, setCardio] = useState(false);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Bitte gib einen Namen ein');
      return;
    }
    addCustomExercise({ name: name.trim(), pm: muscles, sm: [], eq: equipment, cat: cardio ? 'cardio' : 'strength', lvl: '', img: 0, ins: [] });
    nav.back();
  };
  const toggleMuscle = (m) => setMuscles((sel) => (sel.includes(m) ? sel.filter((x) => x !== m) : [...sel, m]));

  return (
    <View style={s.screen}>
      <Header title="Eigene Übung" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="z. B. Bulgarian Split Squats" placeholderTextColor={C.faint} style={s.input} autoFocus />
        <Text style={s.label}>Art</Text>
        <View style={s.wrap}>
          <Chip label="Kraft" icon="barbell-outline" active={!cardio} onPress={() => setCardio(false)} />
          <Chip label="Cardio (km / min)" icon="heart-outline" active={cardio} onPress={() => setCardio(true)} />
        </View>
        <Text style={s.label}>Muskelgruppen</Text>
        <View style={s.wrap}>
          {CUSTOM_MUSCLES.map((m) => (
            <Chip key={m} label={MUSCLE_LABELS[m]} active={muscles.includes(m)} onPress={() => toggleMuscle(m)} />
          ))}
        </View>
        <Text style={s.label}>Gerät</Text>
        <View style={s.wrap}>
          {CUSTOM_EQUIPMENT.map((e) => (
            <Chip key={e} label={EQUIPMENT_LABELS[e]} active={equipment === e} onPress={() => setEquipment(e)} />
          ))}
        </View>
        <GradientButton label="Übung speichern" icon="checkmark" onPress={save} style={{ marginTop: 28 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// App
// ============================================================================

const SCREENS = {
  home: HomeScreen,
  workout: WorkoutScreen,
  log: LogScreen,
  day: DayScreen,
  plan: PlanScreen,
  exercises: ExercisesScreen,
  exercise: ExerciseScreen,
  newExercise: NewExerciseScreen,
};

function Root() {
  const store = useStoreValue();
  const db = useExerciseDb();
  const { stack, nav } = useNavigator();
  const top = stack[stack.length - 1];
  const Screen = SCREENS[top.name];

  return (
    <StoreContext.Provider value={store}>
      <ExerciseContext.Provider value={db}>
        <NavContext.Provider value={nav}>
          <StatusBar style="light" />
          {store.hydrated ? (
            <Screen key={stack.length + top.name} {...top.params} />
          ) : (
            <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator color={C.red} />
            </View>
          )}
        </NavContext.Provider>
      </ExerciseContext.Provider>
    </StoreContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  h1: { color: C.text, fontFamily: SERIF, fontSize: 34, fontWeight: '400', letterSpacing: -0.5 },
  h2: { color: C.text, fontFamily: SERIF, fontSize: 26, fontWeight: '400', letterSpacing: -0.3 },
  kicker: { color: C.red, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  kickerMuted: { color: C.muted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  label: { color: C.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  hint: { color: C.faint, fontSize: 12, marginTop: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  input: {
    backgroundColor: C.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    borderRadius: R.md,
    color: C.text,
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8, gap: 6, backgroundColor: C.bg },
  headerTitle: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
  floatingBack: { position: 'absolute', left: 14, backgroundColor: 'rgba(12,10,10,0.55)', borderRadius: R.pill, padding: 8 },

  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, paddingHorizontal: 22, borderRadius: R.md },
  gradientButtonText: { color: C.onAccent, fontSize: 14, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: R.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ghostButtonText: { fontSize: 13, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  iconButton: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  roundIcon: { borderRadius: R.pill, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipActive: { backgroundColor: C.text, borderColor: C.text },
  chipText: { color: C.text, fontSize: 13, fontWeight: '500', letterSpacing: 0.2 },
  tag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  prBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  prBadgeText: { color: C.gold, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, marginBottom: 14 },
  sectionTitle: { color: C.muted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 16 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: 14,
  },
  rowTitle: { color: C.text, fontSize: 16, fontWeight: '500' },
  rowSub: { color: C.muted, fontSize: 12, marginTop: 3 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18, gap: 16 },
  doneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(208,74,93,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statTile: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 16, gap: 6 },
  statValue: { color: C.text, fontSize: 30, fontWeight: '200', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  statValueSmall: { color: C.text, fontSize: 24, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: 2 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: R.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 2 },
  stepperValue: { color: C.text, fontSize: 16, fontWeight: '500', minWidth: 22, textAlign: 'center', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { color: C.text, fontFamily: SERIF, fontSize: 20, textAlign: 'center' },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  chartLabel: { color: C.muted, fontSize: 12, fontWeight: '500' },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,166,107,0.45)',
  },
  week: { paddingVertical: 4 },
  weekArrow: { borderRadius: R.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)', padding: 7 },
  dayName: { color: C.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1, borderColor: C.red },
  dayDone: { backgroundColor: C.accent, borderWidth: 0 },
  dayNum: { color: C.text, fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  dayPlan: { color: C.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', maxWidth: '94%' },

  hero: { marginTop: 26, borderRadius: R.lg, overflow: 'hidden', minHeight: 360, backgroundColor: C.surface },
  heroTitle: { color: C.text, fontSize: 36, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroMeta: { color: '#D3CBC4', fontSize: 13, fontWeight: '500', letterSpacing: 0.4 },
  heroKicker: { color: 'rgba(243,237,231,0.8)', fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  heroMuscles: { color: C.gold, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  heroTimer: { color: C.text, fontSize: 56, fontWeight: '200', fontVariant: ['tabular-nums'], marginBottom: 6, letterSpacing: -1 },
  thumb: { marginRight: -6, borderWidth: 2, borderColor: C.bg },
  more: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  quote: { color: C.muted, fontFamily: SERIF, fontStyle: 'italic', textAlign: 'center', marginTop: 22, fontSize: 16, lineHeight: 22, paddingHorizontal: 12 },

  workoutTop: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  finishBtn: { backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.pill },
  timer: { color: C.text, fontSize: 68, fontWeight: '200', textAlign: 'center', fontVariant: ['tabular-nums'], letterSpacing: -2, marginTop: 6 },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: C.surface2, overflow: 'hidden', marginTop: 8 },
  progressText: { color: C.muted, fontSize: 10, textAlign: 'center', marginTop: 8, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },
  setHead: { color: C.faint, fontSize: 9, fontWeight: '600', letterSpacing: 1.4 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 10 },
  inputCol: { width: 64, textAlign: 'center' },
  setInput: { backgroundColor: C.surface2, color: C.text, borderRadius: 8, paddingVertical: 9, fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  check: { width: 44, height: 38, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  rest: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#1A1515',
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  restFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(168,35,58,0.22)' },
  restTime: { color: C.text, fontSize: 32, fontWeight: '200', fontVariant: ['tabular-nums'] },
  restBtn: { borderRadius: R.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 13, paddingVertical: 9 },
  restBtnText: { color: C.text, fontWeight: '600', fontSize: 13 },

  celebrate: { borderRadius: R.lg, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 10, marginBottom: 6 },
  celebrateTitle: { color: C.onAccent, fontFamily: SERIF, fontSize: 30, textAlign: 'center' },
  logSetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  logSetVal: { color: C.text, fontWeight: '500', fontSize: 15, flex: 1, fontVariant: ['tabular-nums'] },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  exRow: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  pickCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  prCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: R.lg, padding: 20, marginTop: 22 },
  histRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
});
