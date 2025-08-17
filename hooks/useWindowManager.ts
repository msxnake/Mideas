import { useContext } from 'react';
import { WindowManagerContext, WindowManagerContextType } from '@/components/WindowManager/WindowManagerProvider';

export const useWindowManager = (): WindowManagerContextType => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
