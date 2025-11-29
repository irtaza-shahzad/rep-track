import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { preferencesStorage } from '../infrastructure/storage/LocalStorageAdapter';

// @refresh reset
// This file exports both a Provider component and a custom hook,
// which is a valid pattern for React Context

export type WeightUnit = 'lbs' | 'kg';
export type DistanceUnit = 'miles' | 'km';
export type TimeFormat = '12h' | '24h';

interface Preferences {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  timeFormat: TimeFormat;
}

interface PreferencesContextType {
  preferences: Preferences;
  updateWeightUnit: (unit: WeightUnit) => void;
  updateDistanceUnit: (unit: DistanceUnit) => void;
  updateTimeFormat: (format: TimeFormat) => void;
  convertWeight: (weight: number, from: WeightUnit) => number;
  convertDistance: (distance: number, from: DistanceUnit) => number;
  formatTime: (time24: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences: Preferences = {
  weightUnit: 'lbs',
  distanceUnit: 'miles',
  timeFormat: '12h',
};

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    // Load from localStorage on mount
    const stored = preferencesStorage.getPreferences();
    return stored || defaultPreferences;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    preferencesStorage.setPreferences(preferences);
    // TODO: Also sync with backend API
    // POST /api/users/preferences
  }, [preferences]);

  const updateWeightUnit = (unit: WeightUnit) => {
    setPreferences(prev => ({ ...prev, weightUnit: unit }));
  };

  const updateDistanceUnit = (unit: DistanceUnit) => {
    setPreferences(prev => ({ ...prev, distanceUnit: unit }));
  };

  const updateTimeFormat = (format: TimeFormat) => {
    setPreferences(prev => ({ ...prev, timeFormat: format }));
  };

  // Convert weight from one unit to user's preferred unit
  const convertWeight = (weight: number, from: WeightUnit): number => {
    if (from === preferences.weightUnit) return weight;
    
    if (from === 'lbs' && preferences.weightUnit === 'kg') {
      return Math.round(weight * 0.453592 * 10) / 10; // lbs to kg
    }
    if (from === 'kg' && preferences.weightUnit === 'lbs') {
      return Math.round(weight * 2.20462 * 10) / 10; // kg to lbs
    }
    return weight;
  };

  // Convert distance from one unit to user's preferred unit
  const convertDistance = (distance: number, from: DistanceUnit): number => {
    if (from === preferences.distanceUnit) return distance;
    
    if (from === 'miles' && preferences.distanceUnit === 'km') {
      return Math.round(distance * 1.60934 * 10) / 10; // miles to km
    }
    if (from === 'km' && preferences.distanceUnit === 'miles') {
      return Math.round(distance * 0.621371 * 10) / 10; // km to miles
    }
    return distance;
  };

  // Format time string according to user preference
  const formatTime = (time24: string): string => {
    if (preferences.timeFormat === '24h') return time24;
    
    // Convert 24h format (HH:MM) to 12h format (HH:MM AM/PM)
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updateWeightUnit,
        updateDistanceUnit,
        updateTimeFormat,
        convertWeight,
        convertDistance,
        formatTime,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

// Export hook separately for Fast Refresh compatibility
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
