import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { saveToStorage, loadFromStorage } from '../utils/storage';

// 类型定义
export interface Website {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface SubPathPreset {
  id: string;
  name: string;
  paths: string[];
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  openDelay: number;
  batchSize: number;
  newTab: boolean;
  autoSave: boolean;
}

export interface AppState {
  websites: Website[];
  subPathPresets: SubPathPreset[];
  selectedPresetId: string | null;
  settings: Settings;
  isOpening: boolean;
}

type Action =
  | { type: 'ADD_WEBSITE'; payload: Omit<Website, 'id'> }
  | { type: 'DELETE_WEBSITE'; payload: string }
  | { type: 'UPDATE_WEBSITE'; payload: Website }
  | { type: 'TOGGLE_WEBSITE'; payload: string }
  | { type: 'REORDER_WEBSITES'; payload: Website[] }
  | { type: 'ADD_SUB_PATH_PRESET'; payload: Omit<SubPathPreset, 'id'> }
  | { type: 'UPDATE_SUB_PATH_PRESET'; payload: SubPathPreset }
  | { type: 'DELETE_SUB_PATH_PRESET'; payload: string }
  | { type: 'SELECT_PRESET'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_IS_OPENING'; payload: boolean }
  | { type: 'RESET_STATE' };

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  openDelay: 1000,
  batchSize: 5,
  newTab: true,
  autoSave: true,
};

// 初始状态
const initialState: AppState = {
  websites: [],
  subPathPresets: [],
  selectedPresetId: null,
  settings: DEFAULT_SETTINGS,
  isOpening: false,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_WEBSITE':
      return {
        ...state,
        websites: [
          ...state.websites,
          {
            ...action.payload,
            id: Date.now().toString(),
          },
        ],
      };
    case 'DELETE_WEBSITE':
      return {
        ...state,
        websites: state.websites.filter((website) => website.id !== action.payload),
      };
    case 'UPDATE_WEBSITE':
      return {
        ...state,
        websites: state.websites.map((website) =>
          website.id === action.payload.id ? action.payload : website
        ),
      };
    case 'TOGGLE_WEBSITE':
      return {
        ...state,
        websites: state.websites.map((website) =>
          website.id === action.payload
            ? { ...website, enabled: !website.enabled }
            : website
        ),
      };
    case 'REORDER_WEBSITES':
      return {
        ...state,
        websites: action.payload,
      };
    case 'ADD_SUB_PATH_PRESET':
      return {
        ...state,
        subPathPresets: [
          ...state.subPathPresets,
          {
            ...action.payload,
            id: Date.now().toString(),
          },
        ],
      };
    case 'UPDATE_SUB_PATH_PRESET':
      return {
        ...state,
        subPathPresets: state.subPathPresets.map((preset) =>
          preset.id === action.payload.id ? action.payload : preset
        ),
      };
    case 'DELETE_SUB_PATH_PRESET':
      return {
        ...state,
        subPathPresets: state.subPathPresets.filter(
          (preset) => preset.id !== action.payload
        ),
        selectedPresetId:
          state.selectedPresetId === action.payload ? null : state.selectedPresetId,
      };
    case 'SELECT_PRESET':
      return {
        ...state,
        selectedPresetId: action.payload,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case 'SET_IS_OPENING':
      return {
        ...state,
        isOpening: action.payload,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
        settings: state.settings, // 保留设置
      };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // 加载保存的状态
  useEffect(() => {
    try {
      const savedState = loadFromStorage();
      if (savedState) {
        // 确保所有必需的字段都存在
        const mergedState = {
          ...initialState,
          ...savedState,
          settings: {
            ...initialState.settings,
            ...savedState.settings,
          },
          isOpening: false, // 重置isOpening状态
        };
        
        // 逐个更新状态
        if (mergedState.websites.length > 0) {
          dispatch({ type: 'RESET_STATE' });
          mergedState.websites.forEach((website: Website) => {
            dispatch({ type: 'ADD_WEBSITE', payload: {
              name: website.name,
              url: website.url,
              enabled: website.enabled
            }});
          });
        }
        
        if (mergedState.subPathPresets.length > 0) {
          mergedState.subPathPresets.forEach((preset: SubPathPreset) => {
            dispatch({ type: 'ADD_SUB_PATH_PRESET', payload: {
              name: preset.name,
              paths: preset.paths
            }});
          });
        }
        
        if (mergedState.selectedPresetId) {
          dispatch({ type: 'SELECT_PRESET', payload: mergedState.selectedPresetId });
        }
        
        if (mergedState.settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: mergedState.settings });
        }
      }
    } catch (error) {
      console.error('加载保存的状态失败:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 自动保存
  useEffect(() => {
    if (isInitialized && state.settings.autoSave) {
      try {
        saveToStorage(state);
        console.log('Auto-saving state:', state);
      } catch (error) {
        console.error('保存状态失败:', error);
      }
    }
  }, [state, isInitialized]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
