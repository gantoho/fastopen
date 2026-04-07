export interface Website {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SubPathPreset {
  id: string;
  name: string;
  paths: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  openDelay: number;
  batchSize: number;
  openInNewTab: boolean;
  autoSave: boolean;
}

export interface AppState {
  websites: Website[];
  subPathPresets: SubPathPreset[];
  settings: AppSettings;
  selectedPresetId: string | null;
  isOpening: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  openDelay: 1000,
  batchSize: 5,
  openInNewTab: true,
  autoSave: true,
};

export const DEFAULT_SUBPATH_PRESETS: SubPathPreset[] = [
  {
    id: 'preset-1',
    name: '常用子路径',
    paths: ['/', '/about', '/contact', '/blog'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-2',
    name: '开发环境',
    paths: ['/', '/admin', '/api/docs', '/dev'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
