import { useCallback, useMemo } from 'react';
import { BUILTIN_EXERCISES, findExercise } from '../data/exercises';
import { useStore } from './store';

export function useExercises() {
  const { state } = useStore();
  const custom = state.customExercises;
  const all = useMemo(() => [...custom, ...BUILTIN_EXERCISES], [custom]);
  const get = useCallback((id: string) => findExercise(id, custom), [custom]);
  return { all, get };
}
