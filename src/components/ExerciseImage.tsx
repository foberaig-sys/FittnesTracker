import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { exerciseImage } from '../data/exercises';
import type { Exercise } from '../lib/types';
import { colors, radius } from '../theme';

/**
 * Foto der Übung. Mit `animate` wird zwischen Start- und Endposition gewechselt,
 * sodass die Bewegung sichtbar wird.
 */
export function ExerciseImage({
  exercise,
  size,
  style,
  animate = false,
  rounded = radius.sm,
}: {
  exercise: Exercise | undefined;
  size?: number;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  rounded?: number;
}) {
  const [frame, setFrame] = useState(0);
  const canAnimate = animate && (exercise?.img ?? 0) > 1;

  useEffect(() => {
    if (!canAnimate) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % 2), 1100);
    return () => clearInterval(t);
  }, [canAnimate]);

  const uri = exerciseImage(exercise, frame);
  const box = [styles.box, { borderRadius: rounded }, size ? { width: size, height: size } : null, style];

  if (!uri) {
    return (
      <View style={[box, styles.placeholder]}>
        <MaterialCommunityIcons
          name={exercise?.cat === 'cardio' ? 'run-fast' : 'dumbbell'}
          size={size ? size * 0.45 : 40}
          color={colors.accent}
        />
      </View>
    );
  }

  return (
    <View style={box}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={canAnimate ? 250 : 150}
        cachePolicy="memory-disk"
        recyclingKey={exercise?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#EDEDED' },
  placeholder: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
});
