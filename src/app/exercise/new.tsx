import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip, GradientButton } from '../../components/ui';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../../data/exercises';
import { useStore } from '../../store/store';
import { colors, font, radius } from '../../theme';

const MUSCLES = ['chest', 'lats', 'middle back', 'lower back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'forearms'];
const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'bands', 'other'];

export default function NewExercise() {
  const { addCustomExercise } = useStore();
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState('machine');
  const [cardio, setCardio] = useState(false);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Bitte gib einen Namen ein');
      return;
    }
    addCustomExercise({
      name: name.trim(),
      pm: muscles,
      sm: [],
      eq: equipment,
      cat: cardio ? 'cardio' : 'strength',
      lvl: '',
      img: 0,
      ins: [],
    });
    router.back();
  };

  const toggleMuscle = (m: string) => setMuscles((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="z. B. Bulgarian Split Squats"
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoFocus
      />

      <Text style={styles.label}>Art</Text>
      <View style={styles.wrap}>
        <Chip label="Kraft" icon="barbell-outline" active={!cardio} onPress={() => setCardio(false)} />
        <Chip label="Cardio (km / min)" icon="heart-outline" active={cardio} onPress={() => setCardio(true)} />
      </View>

      <Text style={styles.label}>Muskelgruppen</Text>
      <View style={styles.wrap}>
        {MUSCLES.map((m) => (
          <Chip key={m} label={MUSCLE_LABELS[m]} active={muscles.includes(m)} onPress={() => toggleMuscle(m)} />
        ))}
      </View>

      <Text style={styles.label}>Gerät</Text>
      <View style={styles.wrap}>
        {EQUIPMENT.map((e) => (
          <Chip key={e} label={EQUIPMENT_LABELS[e]} active={equipment === e} onPress={() => setEquipment(e)} />
        ))}
      </View>

      <GradientButton label="Übung speichern" icon="checkmark" onPress={save} style={{ marginTop: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 48 },
  label: { color: colors.muted, ...font.small, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
