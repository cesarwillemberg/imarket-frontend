// Hook para gerenciar estado de primeira visita
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const FIRST_ACCESS_KEY = 'isFirstAccess';

export const useFirstAccess = () => {
  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFirstAccess = async () => {
      try {
        const value = await AsyncStorage.getItem(FIRST_ACCESS_KEY);
        setIsFirstAccess(value === null || value === 'true');
      } catch (error) {
        console.error('Error checking first access:', error);
        setIsFirstAccess(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstAccess();
  }, []);

  const markAsNotFirstAccess = async () => {
    try {
      await AsyncStorage.setItem(FIRST_ACCESS_KEY, 'false');
      setIsFirstAccess(false);
    } catch (error) {
      console.error('Error setting first access:', error);
    }
  };

  return {
    isFirstAccess,
    isLoading,
    markAsNotFirstAccess,
  };
};
