import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { completeAssessment, DEFAULT_USER_PROFILE } from '../services/userProfileAssessment';
import { auth } from '../config/firebase';
import { Colors } from '../constants/theme';
import { getAllExercises } from '../data/exerciseDatabase';

const AICoachAssessmentScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({ ...DEFAULT_USER_PROFILE });
  const [loading, setLoading] = useState(false);

  // Helper: Check if exercises are recognized from database
  const getRecognizedExercises = (exerciseString) => {
    if (!exerciseString || typeof exerciseString !== 'string') return [];

    const allExercises = getAllExercises();
    const inputExercises = exerciseString.split(',').map(e => e.trim()).filter(e => e);

    return inputExercises.map(inputEx => {
      const match = allExercises.find(dbEx =>
        dbEx.name.toLowerCase() === inputEx.toLowerCase() ||
        dbEx.name.toLowerCase().includes(inputEx.toLowerCase()) ||
        inputEx.toLowerCase().includes(dbEx.name.toLowerCase())
      );

      return {
        text: inputEx,
        recognized: !!match,
        matchedName: match?.name || null,
      };
    });
  };

  // Total steps in the assessment
  const TOTAL_STEPS = 10;

  const updateProfile = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedProfile = (parentField, childField, value) => {
    setProfileData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }));
  };

  const toggleArrayItem = (field, item) => {
    setProfileData(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Convert disliked/favorite exercises from string to array if needed
      const finalProfileData = {
        ...profileData,
        dislikedExercises: typeof profileData.dislikedExercises === 'string'
          ? profileData.dislikedExercises.split(',').map(e => e.trim()).filter(e => e)
          : profileData.dislikedExercises || [],
        favoriteExercises: typeof profileData.favoriteExercises === 'string'
          ? profileData.favoriteExercises.split(',').map(e => e.trim()).filter(e => e)
          : profileData.favoriteExercises || [],
      };


      const result = await completeAssessment(finalProfileData);
      if (result.success) {
        // 🚀 Trigger background cache generation for instant workouts & recipes
        const userId = auth.currentUser?.uid;
        if (userId) {

          // Import cache services dynamically and INVALIDATE first (profile just changed!)
          import('../services/WorkoutCacheService').then(module => {
            const WorkoutCacheService = module.default;
            // Force regeneration with new profile data
            WorkoutCacheService.invalidateAndRegenerate(userId).then(() => {
            }).catch(err => {
              console.error('❌ Workout cache generation failed:', err);
            });
          });

          import('../services/NutritionCacheService').then(module => {
            const NutritionCacheService = module.default;
            // Force regeneration with new profile data
            NutritionCacheService.invalidateAndRegenerate(userId).then(() => {
            }).catch(err => {
              console.error('❌ Recipe cache generation failed:', err);
            });
          });
        }

        Alert.alert(
          'Assessment Complete!',
          'Your AI coach now knows you personally and can provide tailored advice.',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save assessment. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep + 1} of {TOTAL_STEPS}
      </Text>
    </View>
  );

  const OptionButton = ({ label, selected, onPress, icon }) => (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      {icon && <Ionicons name={icon} size={24} color={selected ? Colors.background : Colors.primary} style={styles.optionIcon} />}
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={20} color={Colors.background} style={styles.checkIcon} />}
    </TouchableOpacity>
  );

  const MultiSelectButton = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.multiSelectButton, selected && styles.multiSelectButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.multiSelectText, selected && styles.multiSelectTextSelected]}>
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="hand-right" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Welcome!</Text>
            </View>
            <Text style={styles.stepDescription}>
              I'm your AI coach. To give you the best personalized advice, I need to get to know you better.
              This will take about 3-5 minutes.
            </Text>
            <Text style={styles.stepSubtitle}>Let's start with the basics:</Text>

            <Text style={styles.label}>What's your experience level?</Text>
            <OptionButton
              label="Beginner (0-1 years)"
              selected={profileData.experienceLevel === 'beginner'}
              onPress={() => updateProfile('experienceLevel', 'beginner')}
              icon="fitness-outline"
            />
            <OptionButton
              label="Intermediate (1-3 years)"
              selected={profileData.experienceLevel === 'intermediate'}
              onPress={() => updateProfile('experienceLevel', 'intermediate')}
              icon="barbell-outline"
            />
            <OptionButton
              label="Advanced (3-5 years)"
              selected={profileData.experienceLevel === 'advanced'}
              onPress={() => updateProfile('experienceLevel', 'advanced')}
              icon="trophy-outline"
            />
            <OptionButton
              label="Elite (5+ years)"
              selected={profileData.experienceLevel === 'elite'}
              onPress={() => updateProfile('experienceLevel', 'elite')}
              icon="medal-outline"
            />

            <Text style={styles.label}>How long have you been training?</Text>
            <TextInput
              style={styles.input}
              placeholder="Years (e.g., 2.5)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={profileData.yearsTraining?.toString() || ''}
              onChangeText={text => updateProfile('yearsTraining', parseFloat(text) || 0)}
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="trophy" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>What's Your Goal?</Text>
            </View>
            <Text style={styles.stepDescription}>
              Select all that apply - you can have multiple goals!
            </Text>

            <MultiSelectButton
              label="Bulk (Build Muscle)"
              selected={profileData.primaryGoal?.includes('bulk')}
              onPress={() => toggleArrayItem('primaryGoal', 'bulk')}
            />
            <MultiSelectButton
              label="Cut (Lose Fat)"
              selected={profileData.primaryGoal?.includes('cut')}
              onPress={() => toggleArrayItem('primaryGoal', 'cut')}
            />
            <MultiSelectButton
              label="Get Stronger"
              selected={profileData.primaryGoal?.includes('strength')}
              onPress={() => toggleArrayItem('primaryGoal', 'strength')}
            />
            <MultiSelectButton
              label="Powerlifting"
              selected={profileData.primaryGoal?.includes('powerlifting')}
              onPress={() => toggleArrayItem('primaryGoal', 'powerlifting')}
            />
            <MultiSelectButton
              label="Athletic Performance"
              selected={profileData.primaryGoal?.includes('athletic')}
              onPress={() => toggleArrayItem('primaryGoal', 'athletic')}
            />
            <MultiSelectButton
              label="General Fitness / Health"
              selected={profileData.primaryGoal?.includes('fitness')}
              onPress={() => toggleArrayItem('primaryGoal', 'fitness')}
            />
            <MultiSelectButton
              label="Recomp (Build Muscle + Lose Fat)"
              selected={profileData.primaryGoal?.includes('recomp')}
              onPress={() => toggleArrayItem('primaryGoal', 'recomp')}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="barbell" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Training Style</Text>
            </View>
            <Text style={styles.stepDescription}>
              What training style do you prefer or want to follow?
            </Text>

            <OptionButton
              label="Powerlifting (Heavy weights, low reps)"
              selected={profileData.workoutStyle === 'powerlifting'}
              onPress={() => updateProfile('workoutStyle', 'powerlifting')}
              icon="barbell-outline"
            />
            <OptionButton
              label="Bodybuilding (Muscle focus, moderate reps)"
              selected={profileData.workoutStyle === 'bodybuilding'}
              onPress={() => updateProfile('workoutStyle', 'bodybuilding')}
              icon="body-outline"
            />
            <OptionButton
              label="CrossFit (Varied, high intensity)"
              selected={profileData.workoutStyle === 'crossfit'}
              onPress={() => updateProfile('workoutStyle', 'crossfit')}
              icon="flame-outline"
            />
            <OptionButton
              label="Athletic Training (Sports performance)"
              selected={profileData.workoutStyle === 'athletic'}
              onPress={() => updateProfile('workoutStyle', 'athletic')}
              icon="football-outline"
            />
            <OptionButton
              label="General Fitness (Balanced approach)"
              selected={profileData.workoutStyle === 'general-fitness'}
              onPress={() => updateProfile('workoutStyle', 'general-fitness')}
              icon="fitness-outline"
            />

            <Text style={styles.label}>Preferred Rep Range</Text>
            <OptionButton
              label="Low Reps (1-5) - Strength focus"
              selected={profileData.preferredRepRange === 'low'}
              onPress={() => updateProfile('preferredRepRange', 'low')}
            />
            <OptionButton
              label="Medium Reps (6-12) - Hypertrophy focus"
              selected={profileData.preferredRepRange === 'medium'}
              onPress={() => updateProfile('preferredRepRange', 'medium')}
            />
            <OptionButton
              label="High Reps (12+) - Endurance focus"
              selected={profileData.preferredRepRange === 'high'}
              onPress={() => updateProfile('preferredRepRange', 'high')}
            />
            <OptionButton
              label="Varied - Mix it up"
              selected={profileData.preferredRepRange === 'varied'}
              onPress={() => updateProfile('preferredRepRange', 'varied')}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="fitness" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Equipment Access</Text>
            </View>
            <Text style={styles.stepDescription}>
              What equipment do you have access to? (Select all that apply)
            </Text>

            <View style={styles.multiSelectContainer}>
              {['barbell', 'dumbbells', 'machines', 'cables', 'bodyweight', 'bands', 'kettlebells', 'pull-up-bar'].map(equipment => (
                <MultiSelectButton
                  key={equipment}
                  label={equipment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  selected={profileData.equipmentAccess?.includes(equipment)}
                  onPress={() => toggleArrayItem('equipmentAccess', equipment)}
                />
              ))}
            </View>

            <Text style={styles.label}>Training Environment</Text>
            <OptionButton
              label="Commercial Gym (Full equipment)"
              selected={profileData.gymEnvironment === 'commercial-gym'}
              onPress={() => updateProfile('gymEnvironment', 'commercial-gym')}
              icon="business-outline"
            />
            <OptionButton
              label="Home Gym"
              selected={profileData.gymEnvironment === 'home-gym'}
              onPress={() => updateProfile('gymEnvironment', 'home-gym')}
              icon="home-outline"
            />
            <OptionButton
              label="CrossFit Box"
              selected={profileData.gymEnvironment === 'crossfit-box'}
              onPress={() => updateProfile('gymEnvironment', 'crossfit-box')}
              icon="cube-outline"
            />
            <OptionButton
              label="Outdoor/Minimal Equipment"
              selected={profileData.gymEnvironment === 'minimal-equipment'}
              onPress={() => updateProfile('gymEnvironment', 'minimal-equipment')}
              icon="leaf-outline"
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="calendar" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Schedule</Text>
            </View>
            <Text style={styles.stepDescription}>
              When can you train?
            </Text>

            <Text style={styles.label}>Available Days (Select all that apply)</Text>
            <View style={styles.multiSelectContainer}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <MultiSelectButton
                  key={day}
                  label={day.charAt(0).toUpperCase() + day.slice(1)}
                  selected={profileData.availableDays?.includes(day)}
                  onPress={() => toggleArrayItem('availableDays', day)}
                />
              ))}
            </View>

            <Text style={styles.label}>Session Duration (minutes)</Text>
            <View style={styles.row}>
              <OptionButton
                label="30 min"
                selected={profileData.sessionDuration === 30}
                onPress={() => updateProfile('sessionDuration', 30)}
              />
              <OptionButton
                label="45 min"
                selected={profileData.sessionDuration === 45}
                onPress={() => updateProfile('sessionDuration', 45)}
              />
            </View>
            <View style={styles.row}>
              <OptionButton
                label="60 min"
                selected={profileData.sessionDuration === 60}
                onPress={() => updateProfile('sessionDuration', 60)}
              />
              <OptionButton
                label="90 min"
                selected={profileData.sessionDuration === 90}
                onPress={() => updateProfile('sessionDuration', 90)}
              />
            </View>

            <Text style={styles.label}>Preferred Time of Day</Text>
            <OptionButton
              label="Morning (6am-12pm)"
              selected={profileData.preferredWorkoutTime === 'morning'}
              onPress={() => updateProfile('preferredWorkoutTime', 'morning')}
              icon="sunny-outline"
            />
            <OptionButton
              label="Afternoon (12pm-6pm)"
              selected={profileData.preferredWorkoutTime === 'afternoon'}
              onPress={() => updateProfile('preferredWorkoutTime', 'afternoon')}
              icon="partly-sunny-outline"
            />
            <OptionButton
              label="Evening (6pm-12am)"
              selected={profileData.preferredWorkoutTime === 'evening'}
              onPress={() => updateProfile('preferredWorkoutTime', 'evening')}
              icon="moon-outline"
            />
            <OptionButton
              label="Flexible"
              selected={profileData.preferredWorkoutTime === 'flexible'}
              onPress={() => updateProfile('preferredWorkoutTime', 'flexible')}
              icon="time-outline"
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="medkit" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Injuries & Limitations</Text>
            </View>
            <Text style={styles.stepDescription}>
              Do you have any current pain, past injuries, or mobility issues I should know about?
            </Text>

            <Text style={styles.label}>Current Pain Areas (Select all that apply)</Text>
            <View style={styles.multiSelectContainer}>
              {['lower back', 'upper back', 'shoulders', 'elbows', 'wrists', 'hips', 'knees', 'ankles'].map(area => (
                <MultiSelectButton
                  key={area}
                  label={area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  selected={profileData.currentPain?.some(p => p.area === area)}
                  onPress={() => {
                    const currentPain = profileData.currentPain || [];
                    const exists = currentPain.some(p => p.area === area);
                    if (exists) {
                      updateProfile('currentPain', currentPain.filter(p => p.area !== area));
                    } else {
                      updateProfile('currentPain', [...currentPain, { area, severity: 5, notes: '' }]);
                    }
                  }}
                />
              ))}
            </View>

            <Text style={styles.label}>Mobility Issues (Select all that apply)</Text>
            <View style={styles.multiSelectContainer}>
              {['tight hips', 'tight hamstrings', 'tight shoulders', 'poor ankle mobility', 'poor thoracic mobility'].map(issue => (
                <MultiSelectButton
                  key={issue}
                  label={issue.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  selected={profileData.mobilityIssues?.includes(issue)}
                  onPress={() => toggleArrayItem('mobilityIssues', issue)}
                />
              ))}
            </View>

            <Text style={styles.infoText}>
              I'll avoid exercises that could aggravate these areas and suggest alternatives.
            </Text>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="heart" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Exercise Preferences</Text>
            </View>
            <Text style={styles.stepDescription}>
              What exercises do you love or hate? (Optional)
            </Text>

            <Text style={styles.label}>Favorite Exercises</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Bench Press, Deadlifts, Pull-ups (comma separated)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={
                Array.isArray(profileData.favoriteExercises)
                  ? profileData.favoriteExercises.join(', ')
                  : profileData.favoriteExercises || ''
              }
              onChangeText={text => {
                // Store as raw string while typing
                updateProfile('favoriteExercises', text);
              }}
            />

            <Text style={styles.label}>Disliked Exercises (I'll try to avoid these)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Squat, Leg Curl, Deadlift (will avoid ALL variations)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={
                Array.isArray(profileData.dislikedExercises)
                  ? profileData.dislikedExercises.join(', ')
                  : profileData.dislikedExercises || ''
              }
              onChangeText={text => {
                // Store as raw string while typing
                updateProfile('dislikedExercises', text);
              }}
            />

            {/* Show recognized exercises */}
            {(profileData.dislikedExercises && profileData.dislikedExercises.length > 0) && (
              <View style={styles.recognizedExercisesContainer}>
                {getRecognizedExercises(
                  Array.isArray(profileData.dislikedExercises)
                    ? profileData.dislikedExercises.join(', ')
                    : profileData.dislikedExercises
                ).map((ex, index) => (
                  <View
                    key={index}
                    style={[
                      styles.exerciseTag,
                      ex.recognized ? styles.exerciseTagRecognized : styles.exerciseTagUnrecognized
                    ]}
                  >
                    <Text
                      style={[
                        styles.exerciseTagText,
                        ex.recognized && styles.exerciseTagTextRecognized
                      ]}
                    >
                      {ex.text}
                    </Text>
                    {ex.recognized && (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.infoText}>
              ✓ Recognized exercises shown with checkmark. Type partial names (e.g., "Squat" avoids Goblet Squat, Front Squat, etc.)
            </Text>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="moon" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Lifestyle Factors</Text>
            </View>
            <Text style={styles.stepDescription}>
              These help me understand your recovery capacity.
            </Text>

            <Text style={styles.label}>Average Sleep Hours</Text>
            <View style={styles.row}>
              {[5, 6, 7, 8, 9].map(hours => (
                <OptionButton
                  key={hours}
                  label={`${hours}h`}
                  selected={profileData.averageSleepHours === hours}
                  onPress={() => updateProfile('averageSleepHours', hours)}
                />
              ))}
            </View>

            <Text style={styles.label}>Sleep Quality</Text>
            <OptionButton
              label="Poor (Often tired)"
              selected={profileData.sleepQuality === 'poor'}
              onPress={() => updateProfile('sleepQuality', 'poor')}
            />
            <OptionButton
              label="Fair (Sometimes tired)"
              selected={profileData.sleepQuality === 'fair'}
              onPress={() => updateProfile('sleepQuality', 'fair')}
            />
            <OptionButton
              label="Good (Well rested)"
              selected={profileData.sleepQuality === 'good'}
              onPress={() => updateProfile('sleepQuality', 'good')}
            />
            <OptionButton
              label="Excellent (Always energized)"
              selected={profileData.sleepQuality === 'excellent'}
              onPress={() => updateProfile('sleepQuality', 'excellent')}
            />

            <Text style={styles.label}>Stress Level</Text>
            <OptionButton
              label="Low"
              selected={profileData.stressLevel === 'low'}
              onPress={() => updateProfile('stressLevel', 'low')}
            />
            <OptionButton
              label="Moderate"
              selected={profileData.stressLevel === 'moderate'}
              onPress={() => updateProfile('stressLevel', 'moderate')}
            />
            <OptionButton
              label="High"
              selected={profileData.stressLevel === 'high'}
              onPress={() => updateProfile('stressLevel', 'high')}
            />

            <Text style={styles.label}>Occupation Type</Text>
            <OptionButton
              label="Sedentary (Desk job)"
              selected={profileData.occupation === 'sedentary'}
              onPress={() => updateProfile('occupation', 'sedentary')}
              icon="laptop-outline"
            />
            <OptionButton
              label="Active (On feet often)"
              selected={profileData.occupation === 'active'}
              onPress={() => updateProfile('occupation', 'active')}
              icon="walk-outline"
            />
            <OptionButton
              label="Physical Labor"
              selected={profileData.occupation === 'physical-labor'}
              onPress={() => updateProfile('occupation', 'physical-labor')}
              icon="hammer-outline"
            />
          </View>
        );

      case 8:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="restaurant" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Nutrition Basics</Text>
            </View>
            <Text style={styles.stepDescription}>
              Help me give better nutrition advice.
            </Text>

            <Text style={styles.label}>Dietary Restrictions & Allergies (Select all that apply)</Text>
            <Text style={styles.sublabel}>This helps me avoid suggesting foods that don't work for you</Text>
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
                <MultiSelectButton
                  key={restriction}
                  label={restriction.charAt(0).toUpperCase() + restriction.slice(1).replace(/-/g, ' ')}
                  selected={profileData.dietaryRestrictions?.includes(restriction)}
                  onPress={() => toggleArrayItem('dietaryRestrictions', restriction)}
                />
              ))}
            </View>

            <Text style={styles.label}>Meals Per Day</Text>
            <View style={styles.row}>
              {[2, 3, 4, 5, 6].map(meals => (
                <OptionButton
                  key={meals}
                  label={`${meals}`}
                  selected={profileData.mealsPerDay === meals}
                  onPress={() => updateProfile('mealsPerDay', meals)}
                />
              ))}
            </View>

            <Text style={styles.label}>Cooking Skill</Text>
            <OptionButton
              label="Beginner (Simple meals)"
              selected={profileData.cookingSkill === 'beginner'}
              onPress={() => updateProfile('cookingSkill', 'beginner')}
            />
            <OptionButton
              label="Intermediate (Can follow recipes)"
              selected={profileData.cookingSkill === 'intermediate'}
              onPress={() => updateProfile('cookingSkill', 'intermediate')}
            />
            <OptionButton
              label="Advanced (Experienced cook)"
              selected={profileData.cookingSkill === 'advanced'}
              onPress={() => updateProfile('cookingSkill', 'advanced')}
            />
          </View>
        );

      case 9:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="chatbubbles" size={32} color={Colors.primary} />
              <Text style={styles.stepTitle}>Coaching Style</Text>
            </View>
            <Text style={styles.stepDescription}>
              How do you want me to coach you?
            </Text>

            <Text style={styles.label}>Coaching Approach</Text>
            <OptionButton
              label="Motivational (Positive, encouraging)"
              selected={profileData.coachingStyle === 'motivational'}
              onPress={() => updateProfile('coachingStyle', 'motivational')}
              icon="happy-outline"
            />
            <OptionButton
              label="Analytical (Data-driven, technical)"
              selected={profileData.coachingStyle === 'analytical'}
              onPress={() => updateProfile('coachingStyle', 'analytical')}
              icon="stats-chart-outline"
            />
            <OptionButton
              label="Balanced (Mix of both)"
              selected={profileData.coachingStyle === 'balanced'}
              onPress={() => updateProfile('coachingStyle', 'balanced')}
              icon="git-merge-outline"
            />
            <OptionButton
              label="Tough Love (Direct, challenging)"
              selected={profileData.coachingStyle === 'tough-love'}
              onPress={() => updateProfile('coachingStyle', 'tough-love')}
              icon="flame-outline"
            />

            <Text style={styles.label}>Response Length</Text>
            <OptionButton
              label="Concise (1-2 sentences)"
              selected={profileData.responseVerbosity === 'concise'}
              onPress={() => updateProfile('responseVerbosity', 'concise')}
            />
            <OptionButton
              label="Moderate (2-4 sentences)"
              selected={profileData.responseVerbosity === 'moderate'}
              onPress={() => updateProfile('responseVerbosity', 'moderate')}
            />
            <OptionButton
              label="Detailed (Comprehensive explanations)"
              selected={profileData.responseVerbosity === 'detailed'}
              onPress={() => updateProfile('responseVerbosity', 'detailed')}
            />

            <Text style={styles.label}>Feedback Style</Text>
            <OptionButton
              label="Gentle (Supportive corrections)"
              selected={profileData.feedbackPreference === 'gentle'}
              onPress={() => updateProfile('feedbackPreference', 'gentle')}
            />
            <OptionButton
              label="Direct (Honest, straightforward)"
              selected={profileData.feedbackPreference === 'direct'}
              onPress={() => updateProfile('feedbackPreference', 'direct')}
            />
            <OptionButton
              label="Mixed (Adapt to situation)"
              selected={profileData.feedbackPreference === 'mixed'}
              onPress={() => updateProfile('feedbackPreference', 'mixed')}
            />

            <Text style={styles.infoText}>
              You're almost done! One more tap to complete your assessment.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Coach Assessment</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Step Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS - 1 ? (loading ? 'Saving...' : 'Complete') : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  stepSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 56,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  multiSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
  },
  multiSelectButtonSelected: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  multiSelectText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  multiSelectTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: -4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    marginRight: 8,
  },
  sublabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
});

export default AICoachAssessmentScreen;
