import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography } from '../constants/theme';
import BackendService from '../services/backend/BackendService';

export default function DebugScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Backend testing state
  const [backendStatus, setBackendStatus] = useState('not-tested');
  const [backendLoading, setBackendLoading] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      // Get current user
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }

      // Get all stored users (if we were storing multiple)
      // For now, we only store the current user
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes('user'));
      const allUsers = await AsyncStorage.multiGet(userKeys);
      
      const parsedUsers = allUsers.map(([key, value]) => ({
        key,
        data: value ? JSON.parse(value) : null
      }));
      
      setUsers(parsedUsers);
    } catch (error) {
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all stored user data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setUsers([]);
            setCurrentUser(null);
            Alert.alert('Success', 'All data cleared');
          }
        }
      ]
    );
  };

  const testBackendConnection = async () => {
    setBackendLoading(true);
    setBackendStatus('testing');

    try {
      const success = await BackendService.testConnection();
      setBackendStatus(success ? 'success' : 'failed');

      if (success) {
        Alert.alert('✅ Success', 'Firebase backend connected successfully!');
      } else {
        Alert.alert('❌ Failed', 'Could not connect to Firebase. Check your .env.local file.');
      }
    } catch (error) {
      setBackendStatus('failed');
      Alert.alert('❌ Error', error.message);
    } finally {
      setBackendLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Debug: User Storage"
      subtitle="View stored user data"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <StyledCard variant="elevated" style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔥 Firebase Backend Connection</Text>
        <Text style={styles.infoText}>• Test connection to Firebase/Firestore</Text>
        <Text style={styles.infoText}>• Make sure you filled in .env.local</Text>
        <Text style={styles.infoText}>• Restart dev server after updating .env.local</Text>

        <StyledButton
          title={backendLoading ? "Testing..." : "Test Backend Connection"}
          icon={backendLoading ? "" : "🔌"}
          size="md"
          variant="primary"
          fullWidth
          onPress={testBackendConnection}
          disabled={backendLoading}
          style={styles.testButton}
        />

        {backendStatus !== 'not-tested' && (
          <View style={[
            styles.statusBox,
            backendStatus === 'success' ? styles.successBox :
            backendStatus === 'failed' ? styles.errorBox :
            styles.testingBox
          ]}>
            {backendLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.statusText}>Testing connection...</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>
                {backendStatus === 'success' ? '✅ Connected to Firebase!' :
                 backendStatus === 'failed' ? '❌ Connection Failed' :
                 '⏳ Testing...'}
              </Text>
            )}
          </View>
        )}
      </StyledCard>

      <StyledCard variant="elevated" style={styles.infoCard}>
        <Text style={styles.infoTitle}>📍 Data Storage Location</Text>
        <Text style={styles.infoText}>• Local device storage (AsyncStorage)</Text>
        <Text style={styles.infoText}>• Soon: Cloud sync with Firebase</Text>
        <Text style={styles.infoText}>• Data persists until app is uninstalled</Text>
        <Text style={styles.infoText}>• Each device has its own storage</Text>
      </StyledCard>

      {currentUser && (
        <StyledCard variant="primary" style={styles.currentUserCard}>
          <Text style={styles.sectionTitle}>Current Logged In User:</Text>
          <Text style={styles.userData}>Email: {currentUser.email}</Text>
          <Text style={styles.userData}>Name: {currentUser.name}</Text>
          <Text style={styles.userData}>Provider: {currentUser.provider}</Text>
          {currentUser.picture && (
            <Text style={styles.userData}>Picture: {currentUser.picture}</Text>
          )}
        </StyledCard>
      )}

      <StyledCard style={styles.storageCard}>
        <Text style={styles.sectionTitle}>All Stored Keys:</Text>
        {users.length > 0 ? (
          users.map((user, index) => (
            <View key={index} style={styles.userItem}>
              <Text style={styles.keyText}>Key: {user.key}</Text>
              {user.data && (
                <Text style={styles.valueText}>
                  Value: {JSON.stringify(user.data, null, 2)}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No users stored</Text>
        )}
      </StyledCard>

      <StyledButton
        title="Refresh Data"
        icon="🔄"
        size="lg"
        variant="secondary"
        fullWidth
        onPress={loadStoredData}
        style={styles.button}
      />

      <StyledButton
        title="Clear All Data"
        icon="🗑️"
        size="lg"
        variant="ghost"
        fullWidth
        onPress={clearAllData}
        style={styles.button}
      />

      <StyledCard variant="elevated" style={styles.futureCard}>
        <Text style={styles.futureTitle}>🚀 Future Database Options:</Text>
        <Text style={styles.futureText}>• Firebase (Easy setup, real-time)</Text>
        <Text style={styles.futureText}>• MongoDB + Express backend</Text>
        <Text style={styles.futureText}>• Supabase (PostgreSQL)</Text>
        <Text style={styles.futureText}>• AWS Amplify</Text>
      </StyledCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  currentUserCard: {
    marginBottom: Spacing.lg,
  },
  storageCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  userData: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  userItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  keyText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  valueText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  button: {
    marginBottom: Spacing.md,
  },
  futureCard: {
    marginTop: Spacing.lg,
  },
  futureTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  futureText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  testButton: {
    marginTop: Spacing.md,
  },
  statusBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#10B98144',
    borderColor: '#10B981',
  },
  errorBox: {
    backgroundColor: '#EF444444',
    borderColor: '#EF4444',
  },
  testingBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});