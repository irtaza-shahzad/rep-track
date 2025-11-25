/**
 * Local Storage Adapter
 * Abstraction over localStorage for type-safe storage operations
 * Following Adapter Pattern and Single Responsibility Principle
 */

import { STORAGE_KEYS } from '../../core/constants/AppConstants';

/**
 * Generic storage interface
 */
export interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

/**
 * LocalStorage implementation of IStorage
 * Provides type-safe access to browser localStorage
 */
export class LocalStorageAdapter implements IStorage {
  private static instance: LocalStorageAdapter;

  private constructor() {}

  public static getInstance(): LocalStorageAdapter {
    if (!LocalStorageAdapter.instance) {
      LocalStorageAdapter.instance = new LocalStorageAdapter();
    }
    return LocalStorageAdapter.instance;
  }

  /**
   * Get item from storage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key: ${key}`, error);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key: ${key}`, error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}

/**
 * Export singleton instance
 */
export const storageAdapter = LocalStorageAdapter.getInstance();

/**
 * Typed storage helpers for specific data types
 * Following Single Responsibility - each handles one type of data
 */

export class AuthStorage {
  private storage: IStorage;

  constructor(storage: IStorage = storageAdapter) {
    this.storage = storage;
  }

  getToken(): string | null {
    return this.storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  setToken(token: string): void {
    this.storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  removeToken(): void {
    this.storage.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  getUser(): any | null {
    return this.storage.get<any>(STORAGE_KEYS.USER_DATA);
  }

  setUser(user: any): void {
    this.storage.set(STORAGE_KEYS.USER_DATA, user);
  }

  removeUser(): void {
    this.storage.remove(STORAGE_KEYS.USER_DATA);
  }

  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return this.storage.has(STORAGE_KEYS.AUTH_TOKEN);
  }
}

export class PreferencesStorage {
  private storage: IStorage;

  constructor(storage: IStorage = storageAdapter) {
    this.storage = storage;
  }

  getPreferences(): any | null {
    return this.storage.get<any>(STORAGE_KEYS.PREFERENCES);
  }

  setPreferences(prefs: any): void {
    this.storage.set(STORAGE_KEYS.PREFERENCES, prefs);
  }

  clearPreferences(): void {
    this.storage.remove(STORAGE_KEYS.PREFERENCES);
  }
}

export class WorkoutDraftStorage {
  private storage: IStorage;

  constructor(storage: IStorage = storageAdapter) {
    this.storage = storage;
  }

  getDraft(): any | null {
    return this.storage.get<any>(STORAGE_KEYS.WORKOUT_DRAFT);
  }

  saveDraft(draft: any): void {
    this.storage.set(STORAGE_KEYS.WORKOUT_DRAFT, draft);
  }

  clearDraft(): void {
    this.storage.remove(STORAGE_KEYS.WORKOUT_DRAFT);
  }
}

export class StreakStorage {
  private storage: IStorage;

  constructor(storage: IStorage = storageAdapter) {
    this.storage = storage;
  }

  getStreakConfig(): any | null {
    return this.storage.get<any>(STORAGE_KEYS.STREAK_CONFIG);
  }

  setStreakConfig(config: any): void {
    this.storage.set(STORAGE_KEYS.STREAK_CONFIG, config);
  }

  clearStreakConfig(): void {
    this.storage.remove(STORAGE_KEYS.STREAK_CONFIG);
  }
}

/**
 * Export typed storage instances
 */
export const authStorage = new AuthStorage();
export const preferencesStorage = new PreferencesStorage();
export const workoutDraftStorage = new WorkoutDraftStorage();
export const streakStorage = new StreakStorage();
