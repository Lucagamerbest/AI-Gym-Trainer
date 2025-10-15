import { useEffect } from 'react';
import ContextManager from '../services/ai/ContextManager';

/**
 * Hook-based screen tracking for AI context
 *
 * Usage in any screen component:
 * ```
 * useAITracking('WorkoutDetailScreen', { currentWorkout: workout });
 * ```
 */
export const useAITracking = (screenName, data = {}) => {
  useEffect(() => {
    // Set context when component mounts or data changes
    ContextManager.setScreen(screenName, data);

    // Clear context when component unmounts
    return () => {
      if (ContextManager.currentScreen === screenName) {
        ContextManager.setScreen(null);
      }
    };
  }, [screenName, JSON.stringify(data)]); // Re-run when data changes
};

/**
 * Higher-Order Component to track screen context for AI
 *
 * Usage:
 * ```
 * export default withAITracking(MyScreen, 'MyScreenName');
 * ```
 */
export const withAITracking = (WrappedComponent, screenName) => {
  return (props) => {
    useAITracking(screenName, props);
    return <WrappedComponent {...props} />;
  };
};

export default useAITracking;
