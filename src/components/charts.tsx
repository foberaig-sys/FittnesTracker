import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../theme';

export function ProgressRing({
  progress,
  size = 64,
  stroke = 7,
  label,
  sublabel,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.accent2} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface2} strokeWidth={stroke} fill="none" />
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
      <Text style={styles.ringLabel}>{label}</Text>
      {sublabel && <Text style={styles.ringSub}>{sublabel}</Text>}
    </View>
  );
}

/** Einfaches Liniendiagramm für den Kraftverlauf einer Übung. */
export function LineChart({ values, height = 140, unit = 'kg' }: { values: number[]; height?: number; unit?: string }) {
  const [width, setWidth] = useState(0);
  const pad = 12;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const span = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (values.length === 1 ? (width - 2 * pad) / 2 : (i / (values.length - 1)) * (width - 2 * pad));
    const y = pad + (1 - (v - min) / span) * (height - 2 * pad);
    return { x, y };
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = points.length
    ? `${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`
    : '';

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>
          Start {first.toLocaleString('de-DE')} {unit}
        </Text>
        <Text style={[styles.chartLabel, delta > 0 && { color: colors.accent }]}>
          Jetzt {last.toLocaleString('de-DE')} {unit}
          {delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta.toLocaleString('de-DE')})` : ''}
        </Text>
      </View>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3}
              fill={i === points.length - 1 ? colors.accent : colors.bg}
              stroke={colors.accent}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ringLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  ringSub: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  chartLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
