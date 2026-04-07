import { useCallback } from 'react';
import { useApp } from '../stores/AppContext';
import { combineUrlWithPath, normalizeUrl } from '../utils/url';

export function useOpenWebsites() {
  const { state, dispatch } = useApp();

  const openUrl = useCallback((url: string) => {
    const normalizedUrl = normalizeUrl(url);
    if (state.settings.openInNewTab) {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = normalizedUrl;
    }
  }, [state.settings.openInNewTab]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const openAll = useCallback(async (selectedPaths?: string[]) => {
    const enabledWebsites = state.websites.filter(w => w.enabled);
    if (enabledWebsites.length === 0) return;

    dispatch({ type: 'SET_OPENING', payload: true });

    const selectedPreset = state.selectedPresetId
      ? state.subPathPresets.find(p => p.id === state.selectedPresetId)
      : null;

    const urlsToOpen: string[] = [];

    for (const website of enabledWebsites) {
      if (selectedPreset && selectedPreset.paths.length > 0) {
        const pathsToUse = selectedPaths && selectedPaths.length > 0 ? selectedPaths : selectedPreset.paths;
        for (const subPath of pathsToUse) {
          urlsToOpen.push(combineUrlWithPath(website.url, subPath));
        }
      } else {
        urlsToOpen.push(website.url);
      }
    }

    for (let i = 0; i < urlsToOpen.length; i++) {
      openUrl(urlsToOpen[i]);
      
      if (i < urlsToOpen.length - 1) {
        await delay(state.settings.openDelay);
      }
    }

    dispatch({ type: 'SET_OPENING', payload: false });
  }, [state.websites, state.subPathPresets, state.selectedPresetId, state.settings, dispatch, openUrl]);

  const openBatch = useCallback(async (selectedPaths?: string[]) => {
    const enabledWebsites = state.websites.filter(w => w.enabled);
    if (enabledWebsites.length === 0) return;

    dispatch({ type: 'SET_OPENING', payload: true });

    const selectedPreset = state.selectedPresetId
      ? state.subPathPresets.find(p => p.id === state.selectedPresetId)
      : null;

    const urlsToOpen: string[] = [];

    for (const website of enabledWebsites) {
      if (selectedPreset && selectedPreset.paths.length > 0) {
        const pathsToUse = selectedPaths && selectedPaths.length > 0 ? selectedPaths : selectedPreset.paths;
        for (const subPath of pathsToUse) {
          urlsToOpen.push(combineUrlWithPath(website.url, subPath));
        }
      } else {
        urlsToOpen.push(website.url);
      }
    }

    const batchSize = Math.min(state.settings.batchSize, urlsToOpen.length);
    
    for (let i = 0; i < batchSize; i++) {
      openUrl(urlsToOpen[i]);
      
      if (i < batchSize - 1) {
        await delay(state.settings.openDelay);
      }
    }

    dispatch({ type: 'SET_OPENING', payload: false });
  }, [state.websites, state.subPathPresets, state.selectedPresetId, state.settings, dispatch, openUrl]);

  const openSingle = useCallback((websiteId: string) => {
    const website = state.websites.find(w => w.id === websiteId);
    if (!website) return;

    const selectedPreset = state.selectedPresetId
      ? state.subPathPresets.find(p => p.id === state.selectedPresetId)
      : null;

    if (selectedPreset && selectedPreset.paths.length > 0) {
      let delayMs = 0;
      for (const subPath of selectedPreset.paths) {
        setTimeout(() => {
          openUrl(combineUrlWithPath(website.url, subPath));
        }, delayMs);
        delayMs += state.settings.openDelay;
      }
    } else {
      openUrl(website.url);
    }
  }, [state.websites, state.subPathPresets, state.selectedPresetId, state.settings.openDelay, openUrl]);

  return {
    openAll,
    openBatch,
    openSingle,
    isOpening: state.isOpening,
  };
}
