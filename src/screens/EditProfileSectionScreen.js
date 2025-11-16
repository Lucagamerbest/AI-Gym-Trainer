import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updateProfileSection } from '../services/userProfileAssessment';
import WorkoutCacheService from '../services/WorkoutCacheService';
import { getAuth } from 'firebase/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const EditProfileSectionScreen = ({ navigation, route }) => {
  const { section, profile } = route.params;
  const [editedData, setEditedData] = useState(getInitialData(section, profile));
  const [saving, setSaving] = useState(false);

  function getInitialData(sectionKey, userProfile) {
    switch (sectionKey) {
      case 'experience':
        return {
          experienceLevel: userProfile.experienceLevel || 'beginner',
          yearsTraining: userProfile.yearsTraining?.toString() || '0',
        };
      case 'goals':
        return {
          primaryGoal: userProfile.primaryGoal || [],
        };
      case 'training':
        return {
          workoutStyle: userProfile.workoutStyle || 'strength-training',
          preferredRepRange: userProfile.preferredRepRange || 'moderate',
        };
      case 'schedule':
        return {
          sessionDuration: userProfile.sessionDuration?.toString() || '60',
          preferredWorkoutTime: userProfile.preferredWorkoutTime || 'morning',
        };
      case 'lifestyle':
        return {
          averageSleepHours: userProfile.averageSleepHours?.toString() || '7',
          sleepQuality: userProfile.sleepQuality || 'good',
          stressLevel: userProfile.stressLevel || 'moderate',
        };
      case 'coaching':
        return {
          coachingStyle: userProfile.coachingStyle || 'motivational',
          responseVerbosity: userProfile.responseVerbosity || 'concise',
        };
      case 'limitations':
        return {
          currentPain: userProfile.currentPain || [],
          mobilityIssues: userProfile.mobilityIssues || [],
        };
      case 'exercises':
        return {
          favoriteExercises: Array.isArray(userProfile.favoriteExercises)
            ? userProfile.favoriteExercises.join(', ')
            : userProfile.favoriteExercises || '',
          dislikedExercises: Array.isArray(userProfile.dislikedExercises)
            ? userProfile.dislikedExercises.join(', ')
            : userProfile.dislikedExercises || '',
        };
      case 'nutrition':
        return {
          dietaryRestrictions: userProfile.dietaryRestrictions || [],
          mealsPerDay: userProfile.mealsPerDay?.toString() || '3',
          cookingSkill: userProfile.cookingSkill || 'intermediate',
        };
      default:
        return {};
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert string numbers back to integers
      const processedData = { ...editedData };
      if (processedData.yearsTraining) {
        processedData.yearsTraining = parseInt(processedData.yearsTraining) || 0;
      }
      if (processedData.sessionDuration) {
        processedData.sessionDuration = parseInt(processedData.sessionDuration) || 60;
      }
      if (processedData.averageSleepHours) {
        processedData.averageSleepHours = parseInt(processedData.averageSleepHours) || 7;
      }
      if (processedData.mealsPerDay) {
        processedData.mealsPerDay = parseInt(processedData.mealsPerDay) || 3;
      }

      // Convert exercise strings to arrays
      if (section === 'exercises') {
        processedData.favoriteExercises = typeof processedData.favoriteExercises === 'string'
          ? processedData.favoriteExercises.split(',').map(e => e.trim()).filter(e => e)
          : processedData.favoriteExercises || [];
        processedData.dislikedExercises = typeof processedData.dislikedExercises === 'string'
          ? processedData.dislikedExercises.split(',').map(e => e.trim()).filter(e => e)
          : processedData.dislikedExercises || [];
      }

      const result = await updateProfileSection(section, processedData);
      if (result.success) {
        // Invalidate and regenerate cache for sections that affect workouts
        const workoutAffectingSections = ['limitations', 'exercises', 'training', 'goals', 'experience'];
        if (workoutAffectingSections.includes(section)) {
          const auth = getAuth();
          const userId = auth.currentUser?.uid;

          if (userId && userId !== 'guest') {
            console.log(`🔄 [EditProfile] ${section} updated, invalidating workout cache...`);
            WorkoutCacheService.invalidateAndRegenerate(userId).catch(err => {
              console.error('❌ [EditProfile] Failed to invalidate cache:', err);
            });
          }
        }

        Alert.alert('Success', 'Profile section updated!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setEditedData(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  const renderSectionFields = () => {
    switch (section) {
      case 'experience':
        return (
          <>
            <Text style={styles.label}>Experience Level</Text>
            <View style={styles.optionsRow}>
              {['beginner', 'intermediate', 'advanced', 'elite'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    editedData.experienceLevel === level && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('experienceLevel', level)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.experienceLevel === level && styles.optionTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Years Training</Text>
            <TextInput
              style={styles.input}
              value={editedData.yearsTraining}
              onChangeText={(val) => updateField('yearsTraining', val)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </>
        );

      case 'goals':
        return (
          <>
            <Text style={styles.label}>Primary Goals (select all that apply)</Text>
            <View style={styles.optionsColumn}>
              {['build-muscle', 'lose-fat', 'increase-strength', 'improve-endurance', 'general-fitness'].map(goal => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.checkboxOption,
                    editedData.primaryGoal?.includes(goal) && styles.checkboxOptionActive
                  ]}
                  onPress={() => toggleArrayItem('primaryGoal', goal)}
                >
                  <View style={styles.checkbox}>
                    {editedData.primaryGoal?.includes(goal) && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>
                    {goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'training':
        return (
          <>
            <Text style={styles.label}>Workout Style</Text>
            <View style={styles.optionsRow}>
              {['strength-training', 'bodybuilding', 'powerlifting', 'crossfit'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    editedData.workoutStyle === style && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('workoutStyle', style)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.workoutStyle === style && styles.optionTextActive
                  ]}>
                    {style.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Preferred Rep Range</Text>
            <View style={styles.optionsRow}>
              {['low', 'moderate', 'high'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.optionButton,
                    editedData.preferredRepRange === range && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('preferredRepRange', range)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.preferredRepRange === range && styles.optionTextActive
                  ]}>
                    {range === 'low' ? '1-6 reps' : range === 'moderate' ? '8-12 reps' : '15+ reps'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'schedule':
        return (
          <>
            <Text style={styles.label}>Session Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={editedData.sessionDuration}
              onChangeText={(val) => updateField('sessionDuration', val)}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Preferred Workout Time</Text>
            <View style={styles.optionsRow}>
              {['morning', 'afternoon', 'evening'].map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionButton,
                    editedData.preferredWorkoutTime === time && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('preferredWorkoutTime', time)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.preferredWorkoutTime === time && styles.optionTextActive
                  ]}>
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'lifestyle':
        return (
          <>
            <Text style={styles.label}>Average Sleep Hours</Text>
            <TextInput
              style={styles.input}
              value={editedData.averageSleepHours}
              onChangeText={(val) => updateField('averageSleepHours', val)}
              keyboardType="numeric"
              placeholder="7"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Sleep Quality</Text>
            <View style={styles.optionsRow}>
              {['poor', 'fair', 'good', 'excellent'].map(quality => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.optionButton,
                    editedData.sleepQuality === quality && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('sleepQuality', quality)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.sleepQuality === quality && styles.optionTextActive
                  ]}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Stress Level</Text>
            <View style={styles.optionsRow}>
              {['low', 'moderate', 'high'].map(stress => (
                <TouchableOpacity
                  key={stress}
                  style={[
                    styles.optionButton,
                    editedData.stressLevel === stress && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('stressLevel', stress)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.stressLevel === stress && styles.optionTextActive
                  ]}>
                    {stress.charAt(0).toUpperCase() + stress.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'coaching':
        return (
          <>
            <Text style={styles.label}>Coaching Style</Text>
            <View style={styles.optionsRow}>
              {['motivational', 'technical', 'balanced'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    editedData.coachingStyle === style && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('coachingStyle', style)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.coachingStyle === style && styles.optionTextActive
                  ]}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Response Length</Text>
            <View style={styles.optionsRow}>
              {['concise', 'detailed'].map(verbosity => (
                <TouchableOpacity
                  key={verbosity}
                  style={[
                    styles.optionButton,
                    editedData.responseVerbosity === verbosity && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('responseVerbosity', verbosity)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.responseVerbosity === verbosity && styles.optionTextActive
                  ]}>
                    {verbosity.charAt(0).toUpperCase() + verbosity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'limitations':
        return (
          <>
            <Text style={styles.label}>Current Pain Areas</Text>
            <View style={styles.multiSelectContainer}>
              {['lower back', 'upper back', 'shoulders', 'elbows', 'wrists', 'hips', 'knees', 'ankles'].map(area => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.multiSelectButton,
                    editedData.currentPain?.some(p => p.area === area) && styles.multiSelectButtonActive
                  ]}
                  onPress={() => {
                    const currentPain = editedData.currentPain || [];
                    const exists = currentPain.some(p => p.area === area);
                    if (exists) {
                      updateField('currentPain', currentPain.filter(p => p.area !== area));
                    } else {
                      updateField('currentPain', [...currentPain, { area, severity: 5, notes: '' }]);
                    }
                  }}
                >
                  <Text style={[
                    styles.multiSelectText,
                    editedData.currentPain?.some(p => p.area === area) && styles.multiSelectTextActive
                  ]}>
                    {area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Mobility Issues</Text>
            <View style={styles.multiSelectContainer}>
              {['tight hips', 'tight hamstrings', 'tight shoulders', 'poor ankle mobility', 'poor thoracic mobility'].map(issue => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.multiSelectButton,
                    editedData.mobilityIssues?.includes(issue) && styles.multiSelectButtonActive
                  ]}
                  onPress={() => toggleArrayItem('mobilityIssues', issue)}
                >
                  <Text style={[
                    styles.multiSelectText,
                    editedData.mobilityIssues?.includes(issue) && styles.multiSelectTextActive
                  ]}>
                    {issue.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'exercises':
        return (
          <>
            <Text style={styles.label}>Favorite Exercises</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Bench Press, Deadlifts, Pull-ups (comma separated)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={editedData.favoriteExercises || ''}
              onChangeText={(text) => updateField('favoriteExercises', text)}
            />

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Disliked Exercises</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Squat, Leg Curl, Deadlift (will avoid ALL variations)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={editedData.dislikedExercises || ''}
              onChangeText={(text) => updateField('dislikedExercises', text)}
            />
            <Text style={styles.helpText}>
              Type partial names (e.g., "Squat" avoids Goblet Squat, Front Squat, etc.)
            </Text>
          </>
        );

      case 'nutrition':
        return (
          <>
            <Text style={styles.label}>Dietary Restrictions & Allergies</Text>
            <View style={styles.multiSelectContainer}>
              {[
                'vegetarian',
                'vegan',
                'pescatarian',
                'low-carb',
                'keto',
                'paleo',
                'halal',
                'kosher',
                'peanut-allergy',
                'tree-nut-allergy',
                'milk-allergy',
                'egg-allergy',
                'wheat-allergy',
                'soy-allergy',
                'fish-allergy',
                'shellfish-allergy',
                'sesame-allergy',
                'gluten-free',
                'dairy-free',
                'lactose-intolerant',
                'nut-free',
                'sugar-free',
                'low-sodium',
                'no-red-meat',
                'no-pork',
                'none'
              ].map(restriction => (
                <TouchableOpacity
                  key={restriction}
                  style={[
                    styles.multiSelectButton,
                    editedData.dietaryRestrictions?.includes(restriction) && styles.multiSelectButtonActive
                  ]}
                  onPress={() => toggleArrayItem('dietaryRestrictions', restriction)}
                >
                  <Text style={[
                    styles.multiSelectText,
                    editedData.dietaryRestrictions?.includes(restriction) && styles.multiSelectTextActive
                  ]}>
                    {restriction.charAt(0).toUpperCase() + restriction.slice(1).replace(/-/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Meals Per Day</Text>
            <View style={styles.optionsRow}>
              {[2, 3, 4, 5, 6].map(meals => (
                <TouchableOpacity
                  key={meals}
                  style={[
                    styles.optionButton,
                    editedData.mealsPerDay === meals.toString() && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('mealsPerDay', meals.toString())}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.mealsPerDay === meals.toString() && styles.optionTextActive
                  ]}>
                    {meals}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>Cooking Skill</Text>
            <View style={styles.optionsRow}>
              {['beginner', 'intermediate', 'advanced'].map(skill => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.optionButton,
                    editedData.cookingSkill === skill && styles.optionButtonActive
                  ]}
                  onPress={() => updateField('cookingSkill', skill)}
                >
                  <Text style={[
                    styles.optionText,
                    editedData.cookingSkill === skill && styles.optionTextActive
                  ]}>
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      default:
        return <Text style={styles.emptyText}>This section cannot be edited yet.</Text>;
    }
  };

  const getSectionTitle = () => {
    const titles = {
      experience: 'Experience',
      goals: 'Goals',
      training: 'Training Preferences',
      schedule: 'Schedule',
      lifestyle: 'Lifestyle',
      coaching: 'Coaching Preferences',
      limitations: 'Limitations & Injuries',
      exercises: 'Exercise Preferences',
      nutrition: 'Nutrition Preferences',
    };
    return titles[section] || 'Edit Section';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit {getSectionTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderSectionFields()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionsColumn: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.background,
    fontWeight: Typography.weights.semibold,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.background,
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  multiSelectButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiSelectButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  multiSelectText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
  },
  multiSelectTextActive: {
    color: Colors.background,
    fontWeight: Typography.weights.semibold,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  helpText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
});

export default EditProfileSectionScreen;
