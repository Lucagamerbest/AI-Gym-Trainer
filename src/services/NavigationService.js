/**
 * Navigation Service
 *
 * Provides a global navigation reference that can be accessed from anywhere in the app,
 * including AI tools that need to navigate programmatically.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen programmatically
 * @param {string} name - Screen name
 * @param {object} params - Navigation parameters
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation not ready yet');
  }
}

/**
 * Go back to previous screen
 */
export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

/**
 * Reset navigation to a specific screen
 * @param {string} name - Screen name
 */
export function reset(name) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name }],
    });
  }
}

/**
 * Get current route name
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return null;
}

/**
 * Check if navigation is ready
 */
export function isReady() {
  return navigationRef.isReady();
}

export default {
  navigationRef,
  navigate,
  goBack,
  reset,
  getCurrentRoute,
  isReady,
};
