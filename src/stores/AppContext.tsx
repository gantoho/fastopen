import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppSettings, Website, SubPathPreset, DEFAULT_SETTINGS, DEFAULT_SUBPATH_PRESETS } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Action =
  | { type: 'ADD_WEBSITE'; payload: Omit<Website, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_WEBSITE'; payload: Website }
  | { type: 'DELETE_WEBSITE'; payload: string }
  | { type: 'TOGGLE_WEBSITE'; payload: string }
  | { type: 'ADD_SUBPATH_PRESET'; payload: Omit<SubPathPreset, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SUBPATH_PRESET'; payload: SubPathPreset }
  | { type: 'DELETE_SUBPATH_PRESET'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SELECT_PRESET'; payload: string | null }
  | { type: 'SET_OPENING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  websites: [],
  subPathPresets: DEFAULT_SUBPATH_PRESETS,
  settings: DEFAULT_SETTINGS,
  selectedPresetId: null,
  isOpening: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_WEBSITE': {
      const newWebsite: Website = {
        ...action.payload,
        id: `website-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        websites: [...state.websites, newWebsite],
      };
    }
    case 'UPDATE_WEBSITE': {
      return {
        ...state,
        websites: state.websites.map(website =>
          website.id === action.payload.id
            ? { ...action.payload, updatedAt: Date.now() }
            : website
        ),
      };
    }
    case 'DELETE_WEBSITE': {
      return {
        ...state,
        websites: state.websites.filter(website => website.id !== action.payload),
      };
    }
    case 'TOGGLE_WEBSITE': {
      return {
        ...state,
        websites: state.websites.map(website =>
          website.id === action.payload
            ? { ...website, enabled: !website.enabled, updatedAt: Date.now() }
            : website
        ),
      };
    }
    case 'ADD_SUBPATH_PRESET': {
      const newPreset: SubPathPreset = {
        ...action.payload,
        id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        subPathPresets: [...state.subPathPresets, newPreset],
      };
    }
    case 'UPDATE_SUBPATH_PRESET': {
      return {
        ...state,
        subPathPresets: state.subPathPresets.map(preset =>
          preset.id === action.payload.id
            ? { ...action.payload, updatedAt: Date.now() }
            : preset
        ),
      };
    }
    case 'DELETE_SUBPATH_PRESET': {
      return {
        ...state,
        subPathPresets: state.subPathPresets.filter(preset => preset.id !== action.payload),
        selectedPresetId: state.selectedPresetId === action.payload ? null : state.selectedPresetId,
      };
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }
    case 'SELECT_PRESET': {
      return {
        ...state,
        selectedPresetId: action.payload,
      };
    }
    case 'SET_OPENING': {
      return {
        ...state,
        isOpening: action.payload,
      };
    }
    case 'LOAD_STATE': {
      return action.payload;
    }
    case 'RESET_STATE': {
      return initialState;
    }
    default: {
      return state;
    }
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedState = loadFromStorage();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
  }, []);

  useEffect(() => {
    if (state.settings.autoSave) {
      saveToStorage(state);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
