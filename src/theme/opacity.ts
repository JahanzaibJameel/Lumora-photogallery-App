export const opacity = {
  disabled: 0.4,
  overlay: 0.6,
  pressed: 0.7,
  skeleton: 0.5,
} as const;

export type OpacityScale = typeof opacity;
