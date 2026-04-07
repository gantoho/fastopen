import { useEffect } from 'react';
import { useApp } from '../stores/AppContext';

export function useTheme() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const applyTheme = () => {
      let theme = state.settings.theme;
      
      if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (theme === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (state.settings.theme === 'auto') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.settings.theme]);

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme } });
  };

  return {
    currentTheme: state.settings.theme,
    setTheme,
  };
}
