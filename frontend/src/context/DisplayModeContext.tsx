import React, { createContext, useContext, useState, useEffect } from 'react';

export type DisplayMode = 'PRO' | 'SIMPLE' | 'DARK';

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  isSimpleMode: boolean;
  isDarkMode: boolean;
  isProMode: boolean;
  toggleNextMode: () => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

export const DisplayModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<DisplayMode>(() => {
    return (localStorage.getItem('yugandhar_ui_mode') as DisplayMode) || 'PRO';
  });

  const setMode = (newMode: DisplayMode) => {
    setModeState(newMode);
    localStorage.setItem('yugandhar_ui_mode', newMode);
  };

  const toggleNextMode = () => {
    if (mode === 'PRO') setMode('SIMPLE');
    else if (mode === 'SIMPLE') setMode('DARK');
    else setMode('PRO');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'DARK') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return (
    <DisplayModeContext.Provider
      value={{
        mode,
        setMode,
        isSimpleMode: mode === 'SIMPLE',
        isDarkMode: mode === 'DARK',
        isProMode: mode === 'PRO',
        toggleNextMode
      }}
    >
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = () => {
  const context = useContext(DisplayModeContext);
  if (!context) throw new Error('useDisplayMode must be used within DisplayModeProvider');
  return context;
};
