import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Platform } from 'react-native';

// Simple wrapper that can be used as a drop-in replacement for ScrollView
// It automatically scrolls to show TextInputs above the keyboard
export default function KeyboardScrollView({ children, ...props }) {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={100} // Extra space above keyboard
      extraHeight={Platform.OS === 'android' ? 120 : 100}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

// Export the original component as well for more control if needed
export { KeyboardAwareScrollView };