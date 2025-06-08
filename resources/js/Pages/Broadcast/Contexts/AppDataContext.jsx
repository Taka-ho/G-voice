import React, { createContext, useContext } from 'react';

// Contextを作成
export const AppDataContext = createContext();

// useAppData カスタムフックを作成
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataContext.Provider');
  }
  return context;
};
