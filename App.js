import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fittnestracker.entries.v1';

const COLORS = {
  bg: '#0F1115',
  card: '#1A1D24',
  border: '#2A2E37',
  text: '#F2F3F5',
  muted: '#8A8F98',
  accent: '#4ADE80',
  danger: '#F87171',
};

const QUICK_EXERCISES = ['Bankdrücken', 'Kniebeugen', 'Kreuzheben', 'Klimmzüge', 'Schulterdrücken', 'Laufen'];

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

function parseNumber(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setEntries(JSON.parse(raw)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
  }, [entries, loaded]);

  const add = (entry) =>
    setEntries((prev) => [{ ...entry, id: `${Date.now()}`, day: todayKey() }, ...prev]);
  const remove = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return { entries, add, remove, loaded };
}

function EntryRow({ entry, onDelete }) {
  const detail = entry.distance
    ? `${entry.distance} km`
    : `${entry.sets} × ${entry.reps}${entry.weight ? ` @ ${entry.weight} kg` : ''}`;
  return (
    <Pressable
      onLongPress={() =>
        Alert.alert('Eintrag löschen?', entry.exercise, [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: () => onDelete(entry.id) },
        ])
      }
      style={styles.row}
    >
      <Text style={styles.rowTitle}>{entry.exercise}</Text>
      <Text style={styles.rowDetail}>{detail}</Text>
    </Pressable>
  );
}

function TodayScreen({ entries, onAdd, onDelete }) {
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [distance, setDistance] = useState('');

  const isCardio = exercise.trim().toLowerCase() === 'laufen';
  const todays = entries.filter((e) => e.day === todayKey());

  const submit = () => {
    if (!exercise.trim()) {
      Alert.alert('Bitte eine Übung eingeben');
      return;
    }
    if (isCardio) {
      onAdd({ exercise: exercise.trim(), distance: parseNumber(distance) });
    } else {
      onAdd({
        exercise: exercise.trim(),
        sets: parseNumber(sets),
        reps: parseNumber(reps),
        weight: parseNumber(weight),
      });
    }
    setWeight('');
    setDistance('');
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Heute</Text>
      <Text style={styles.subtitle}>{formatDay(todayKey())}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Übung</Text>
        <TextInput
          value={exercise}
          onChangeText={setExercise}
          placeholder="z. B. Bankdrücken"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
        <View style={styles.chips}>
          {QUICK_EXERCISES.map((name) => (
            <Pressable
              key={name}
              onPress={() => setExercise(name)}
              style={[styles.chip, exercise === name && styles.chipActive]}
            >
              <Text style={[styles.chipText, exercise === name && styles.chipTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </View>

        {isCardio ? (
          <>
            <Text style={styles.label}>Distanz (km)</Text>
            <TextInput
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              placeholder="5"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
            />
          </>
        ) : (
          <View style={styles.inputRow}>
            <NumberField label="Sätze" value={sets} onChange={setSets} />
            <NumberField label="Wdh." value={reps} onChange={setReps} />
            <NumberField label="kg" value={weight} onChange={setWeight} />
          </View>
        )}

        <Pressable onPress={submit} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>Hinzufügen</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>Heutige Einträge</Text>
      {todays.length === 0 ? (
        <Text style={styles.empty}>Noch nichts eingetragen – los geht's!</Text>
      ) : (
        todays.map((e) => <EntryRow key={e.id} entry={e} onDelete={onDelete} />)
      )}
      <Text style={styles.hint}>Tipp: Eintrag lange drücken zum Löschen.</Text>
    </ScrollView>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />
    </View>
  );
}

function HistoryScreen({ entries, onDelete }) {
  const sections = useMemo(() => {
    const byDay = {};
    entries.forEach((e) => {
      (byDay[e.day] = byDay[e.day] || []).push(e);
    });
    return Object.keys(byDay)
      .sort()
      .reverse()
      .map((day) => ({ day, items: byDay[day] }));
  }, [entries]);

  return (
    <FlatList
      contentContainerStyle={styles.screen}
      data={sections}
      keyExtractor={(s) => s.day}
      ListHeaderComponent={<Text style={styles.h1}>Verlauf</Text>}
      ListEmptyComponent={<Text style={styles.empty}>Noch keine Trainings gespeichert.</Text>}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.h2}>{formatDay(item.day)}</Text>
          {item.items.map((e) => (
            <EntryRow key={e.id} entry={e} onDelete={onDelete} />
          ))}
        </View>
      )}
    />
  );
}

function StatsScreen({ entries }) {
  const stats = useMemo(() => {
    const days = new Set(entries.map((e) => e.day));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStart = todayKey(weekAgo);
    const daysThisWeek = [...days].filter((d) => d >= weekStart).length;

    const volume = entries.reduce((sum, e) => sum + (e.sets || 0) * (e.reps || 0) * (e.weight || 0), 0);
    const km = entries.reduce((sum, e) => sum + (e.distance || 0), 0);

    // Streak: consecutive days with at least one entry, ending today or yesterday
    let streak = 0;
    const cursor = new Date();
    if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(todayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const counts = {};
    entries.forEach((e) => {
      counts[e.exercise] = (counts[e.exercise] || 0) + 1;
    });
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { trainingDays: days.size, daysThisWeek, volume, km, streak, top };
  }, [entries]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Statistik</Text>
      <View style={styles.statGrid}>
        <Stat label="Serie (Tage)" value={stats.streak} />
        <Stat label="Diese Woche" value={`${stats.daysThisWeek}/7`} />
        <Stat label="Trainingstage" value={stats.trainingDays} />
        <Stat label="Volumen (kg)" value={Math.round(stats.volume).toLocaleString('de-DE')} />
        <Stat label="Gelaufen (km)" value={stats.km.toLocaleString('de-DE')} />
        <Stat label="Einträge" value={entries.length} />
      </View>

      <Text style={styles.h2}>Häufigste Übungen</Text>
      {stats.top.length === 0 ? (
        <Text style={styles.empty}>Noch keine Daten.</Text>
      ) : (
        stats.top.map(([name, count]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.rowTitle}>{name}</Text>
            <Text style={styles.rowDetail}>{count}×</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const TABS = [
  { key: 'today', label: 'Heute' },
  { key: 'history', label: 'Verlauf' },
  { key: 'stats', label: 'Statistik' },
];

export default function App() {
  const [tab, setTab] = useState('today');
  const { entries, add, remove, loaded } = useEntries();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {!loaded ? (
            <Text style={[styles.empty, { padding: 20 }]}>Lade…</Text>
          ) : tab === 'today' ? (
            <TodayScreen entries={entries} onAdd={add} onDelete={remove} />
          ) : tab === 'history' ? (
            <HistoryScreen entries={entries} onDelete={remove} />
          ) : (
            <StatsScreen entries={entries} />
          )}
        </KeyboardAvoidingView>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screen: { padding: 20, paddingBottom: 40 },
  h1: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
  h2: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  subtitle: { color: COLORS.muted, fontSize: 15, marginBottom: 16, textTransform: 'capitalize' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { color: COLORS.muted, fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.text, fontSize: 13 },
  chipTextActive: { color: COLORS.bg, fontWeight: '700' },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: COLORS.bg, fontWeight: '800', fontSize: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  rowDetail: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
  empty: { color: COLORS.muted, fontSize: 15, marginTop: 4 },
  hint: { color: COLORS.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  stat: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.accent, fontSize: 26, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: COLORS.accent },
});
