import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, gradients, radius } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function GradientButton({
  label,
  icon,
  onPress,
  style,
  variant = 'accent',
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'accent' | 'gold';
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      <LinearGradient
        colors={variant === 'gold' ? gradients.gold : gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        {icon && <Ionicons name={icon} size={20} color={colors.onAccent} />}
        <Text style={styles.gradientButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  label,
  icon,
  onPress,
  color = colors.text,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.6 }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text style={[styles.ghostButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  size = 20,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? colors.onAccent : colors.text} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Tag({ label, color = colors.muted }: { label: string; color?: string }) {
  return (
    <View style={[styles.tag, { borderColor: color + '55' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function PRBadge({ text }: { text: string }) {
  return (
    <View style={styles.prBadge}>
      <Ionicons name="trophy" size={12} color={colors.gold} />
      <Text style={styles.prBadgeText}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatTile({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="remove" size={16} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepperBtn} />
      <Text style={styles.stepperValue}>{value}</Text>
      <IconButton icon="add" size={16} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperBtn} />
    </View>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.faint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {text && <Text style={styles.emptyText}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
  },
  gradientButtonText: { color: colors.onAccent, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostButtonText: { fontSize: 15, fontWeight: '700' },
  iconButton: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '700' },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,201,77,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, ...font.h3, fontSize: 19 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { color: colors.muted, ...font.small },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
  },
  stepperBtn: { padding: 8 },
  stepperValue: { color: colors.text, fontSize: 16, fontWeight: '800', minWidth: 22, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { color: colors.text, ...font.h3 },
  emptyText: { color: colors.muted, ...font.body, textAlign: 'center' },
});
