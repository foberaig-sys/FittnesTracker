export const colors = {
  bg: '#0A0A0E',
  surface: '#14141B',
  surface2: '#1C1C26',
  border: '#272733',
  text: '#F5F5F7',
  muted: '#8E8EA0',
  faint: '#5A5A6B',
  accent: '#C8FF4D',
  accent2: '#4DFFB0',
  onAccent: '#0A0A0E',
  gold: '#FFC94D',
  danger: '#FF5C6C',
  doneBg: 'rgba(200,255,77,0.10)',
};

export const gradients = {
  accent: ['#C8FF4D', '#4DFFB0'] as const,
  gold: ['#FFE07A', '#FFB23F'] as const,
  heroShade: ['rgba(10,10,14,0.15)', 'rgba(10,10,14,0.75)', '#0A0A0E'] as const,
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const font = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 },
};
