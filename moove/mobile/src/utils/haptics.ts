import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

// Re-export types
export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

// Wrapper functions that are safe to call on web
export async function impactAsync(style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light): Promise<void> {
  if (Platform.OS !== 'web') {
    return ExpoHaptics.impactAsync(style);
  }
}

export async function notificationAsync(type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType.Success): Promise<void> {
  if (Platform.OS !== 'web') {
    return ExpoHaptics.notificationAsync(type);
  }
}

export async function selectionAsync(): Promise<void> {
  if (Platform.OS !== 'web') {
    return ExpoHaptics.selectionAsync();
  }
}
