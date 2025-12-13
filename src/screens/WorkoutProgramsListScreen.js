import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const STORAGE_KEY = '@workout_programs';

export default function WorkoutProgramsListScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const loadPrograms = async () => {
    try {
      const storedPrograms = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedPrograms) {
        setPrograms(JSON.parse(storedPrograms));
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadPrograms();
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  };

  const handleDeleteProgram = (programId) => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this workout program?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPrograms = programs.filter(p => p.id !== programId);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrograms));
              setPrograms(updatedPrograms);
              Alert.alert('Success', 'Program deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
  };

  const handleStartProgram = (program) => {
    // Navigate to day selection screen for the program
    navigation.navigate('ProgramDaySelection', {
      program: program
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTotalExercises = (program) => {
    return program.days.reduce((total, day) => total + day.exercises.length, 0);
  };

  return (
    <ScreenLayout
      title="My Programs"
      subtitle="Your custom workout programs"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('WorkoutProgram')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary, '#059669']}
            style={styles.createGradient}
          >
            <Text style={styles.createIcon}>+</Text>
            <Text style={styles.createText}>Create New Program</Text>
          </LinearGradient>
        </TouchableOpacity>

        {programs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No Programs Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first workout program to get started
            </Text>
          </View>
        ) : (
          programs.map((program, index) => (
            <TouchableOpacity
              key={`program-${program.id}-${index}`}
              style={styles.programCard}
              onPress={() => handleStartProgram(program)}
              activeOpacity={0.9}
            >
              <View style={styles.programHeader}>
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description && (
                    <Text style={styles.programDescription} numberOfLines={2}>
                      {program.description}
                    </Text>
                  )}
                  <View style={styles.programStats}>
                    <Text style={styles.statItem}>
                      📅 {program.days.length} {program.days.length === 1 ? 'Day' : 'Days'}
                    </Text>
                    <Text style={styles.statItem}>
                      💪 {getTotalExercises(program)} Exercises
                    </Text>
                  </View>
                  <Text style={styles.programDate}>
                    Created {formatDate(program.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteProgram(program.id);
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daysPreview}
              >
                {program.days.map((day, index) => (
                  <View key={day.id} style={styles.dayPreviewCard}>
                    <Text style={styles.dayPreviewTitle}>
                      Day {index + 1}
                    </Text>
                    <Text style={styles.dayPreviewName} numberOfLines={1}>
                      {day.name}
                    </Text>
                    <Text style={styles.dayPreviewExercises}>
                      {day.exercises.length} exercises
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.startButtonContainer}>
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.primary + '05']}
                  style={styles.startButton}
                >
                  <Text style={styles.startButtonText}>START PROGRAM →</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  createButton: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  createIcon: {
    fontSize: 20,
    color: Colors.background,
    marginRight: Spacing.sm,
  },
  createText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  programCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  programDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  programStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  statItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  programDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  daysPreview: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  dayPreviewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayPreviewTitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayPreviewName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayPreviewExercises: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  startButtonContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  startButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  startButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
});