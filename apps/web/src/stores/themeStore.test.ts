import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      spotColor: 'pink',
      colorMode: 'light',
      effectiveDarkMode: false,
    });
  });

  it('initializes with default spot color pink', () => {
    const state = useThemeStore.getState();
    expect(state.spotColor).toBe('pink');
  });

  it('toggles spot color between pink and blue', () => {
    const { toggleSpotColor } = useThemeStore.getState();
    toggleSpotColor();
    expect(useThemeStore.getState().spotColor).toBe('blue');

    toggleSpotColor();
    expect(useThemeStore.getState().spotColor).toBe('pink');
  });

  it('sets dark mode correctly', () => {
    const { setColorMode } = useThemeStore.getState();
    setColorMode('dark');
    expect(useThemeStore.getState().effectiveDarkMode).toBe(true);

    setColorMode('light');
    expect(useThemeStore.getState().effectiveDarkMode).toBe(false);
  });
});
