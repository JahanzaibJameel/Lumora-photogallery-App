import React from 'react';
import { renderWithProviders } from '../../test-utils';
import { lightColors } from '../../theme/tokens';
import { Text } from './Text';

describe('Text primitive', () => {
  it('renders children text', () => {
    const { getByText } = renderWithProviders(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders with default body variant', () => {
    const { getByText } = renderWithProviders(<Text>Body text</Text>);
    const text = getByText('Body text');
    expect(text.props.style).toBeDefined();
  });

  it('renders with h1 variant', () => {
    const { getByText } = renderWithProviders(<Text variant="h1">Heading</Text>);
    expect(getByText('Heading')).toBeTruthy();
  });

  it('renders with h2 variant', () => {
    const { getByText } = renderWithProviders(<Text variant="h2">Heading 2</Text>);
    expect(getByText('Heading 2')).toBeTruthy();
  });

  it('renders with h3 variant', () => {
    const { getByText } = renderWithProviders(<Text variant="h3">Heading 3</Text>);
    expect(getByText('Heading 3')).toBeTruthy();
  });

  it('renders with caption variant', () => {
    const { getByText } = renderWithProviders(<Text variant="caption">Caption</Text>);
    expect(getByText('Caption')).toBeTruthy();
  });

  it('applies primary color by default', () => {
    const { getByText } = renderWithProviders(<Text>Colored</Text>);
    const text = getByText('Colored');
    const styles = Array.isArray(text.props.style) ? text.props.style : [text.props.style];
    const colorStyle = styles.find((s: Record<string, unknown>) => s && (s as Record<string, unknown>).color);
    expect(colorStyle.color).toBe(lightColors.textPrimary);
  });

  it('renders with accent color', () => {
    const { getByText } = renderWithProviders(<Text color="accent">Accent</Text>);
    const text = getByText('Accent');
    const styles = Array.isArray(text.props.style) ? text.props.style : [text.props.style];
    const colorStyle = styles.find((s: Record<string, unknown>) => s && (s as Record<string, unknown>).color);
    expect(colorStyle.color).toBe(lightColors.accent);
  });

  it('centers text when center prop is true', () => {
    const { getByText } = renderWithProviders(<Text center>Centered</Text>);
    const text = getByText('Centered');
    const styles = Array.isArray(text.props.style) ? text.props.style : [text.props.style];
    const centerStyle = styles.find((s: Record<string, unknown>) => s && (s as Record<string, unknown>).textAlign === 'center');
    expect(centerStyle).toBeDefined();
  });

  it('applies numberOfLines', () => {
    const { getByText } = renderWithProviders(<Text numberOfLines={2}>Long text</Text>);
    const text = getByText('Long text');
    expect(text.props.numberOfLines).toBe(2);
  });

  it('passes ref to the underlying Text', () => {
    let ref: React.ComponentRef<typeof Text> | null = null;
    renderWithProviders(
      <Text ref={(r) => { ref = r; }}>Ref test</Text>
    );
    expect(ref).toBeTruthy();
  });
});
