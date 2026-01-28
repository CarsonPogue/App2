import { create } from 'zustand';
import * as Location from 'expo-location';
import type { GeoLocation } from '@moove/shared/types';

// Default location (New York) for users without location set
const DEFAULT_LOCATION: GeoLocation = { latitude: 40.7128, longitude: -74.0060 };

interface LocationState {
  location: GeoLocation | null;
  radiusMiles: number;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  hasRealLocation: boolean; // Whether we have user's actual location vs default

  // Actions
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<GeoLocation | null>;
  setRadius: (miles: number) => void;
  setLocation: (location: GeoLocation) => void;
  initializeWithDefault: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: DEFAULT_LOCATION, // Start with default so events load immediately
  radiusMiles: 25,
  isLoading: false,
  error: null,
  permissionStatus: null,
  hasRealLocation: false,

  requestPermission: async () => {
    set({ isLoading: true, error: null });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      set({ permissionStatus: status });

      if (status === 'granted') {
        await get().getCurrentLocation();
        return true;
      }

      set({
        isLoading: false,
        error: 'Location permission denied',
      });
      return false;
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to request location permission',
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    set({ isLoading: true, error: null });

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geoLocation: GeoLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      set({
        location: geoLocation,
        isLoading: false,
        hasRealLocation: true,
      });

      return geoLocation;
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to get current location',
      });
      return null;
    }
  },

  setRadius: (miles) => {
    set({ radiusMiles: miles });
  },

  setLocation: (location) => {
    set({ location, error: null, hasRealLocation: true });
  },

  initializeWithDefault: () => {
    // Ensure we have at least a default location
    if (!get().location) {
      set({ location: DEFAULT_LOCATION });
    }
  },
}));
