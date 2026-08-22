export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40, letterSpacing: 0, textTransform: 'none' as const },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: 0, textTransform: 'none' as const },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: 0, textTransform: 'none' as const },
  title: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0, textTransform: 'none' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0, textTransform: 'none' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0, textTransform: 'none' as const },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0, textTransform: 'none' as const },
  overline: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;

export type TypographyScale = typeof typography;
