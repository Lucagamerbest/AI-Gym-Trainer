import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loadUserProfile, clearUserProfile } from '../services/userProfileAssessment';
import { Colors } from '../constants/theme';

const UserProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const data = await loadUserProfile();
    setProfile(data);
    setLoading(false);
  };

  const handleRetakeAssessment = () => {
    Alert.alert(
      'Retake Assessment',
      'This will replace your current profile. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake',
          onPress: () => navigation.navigate('AICoachAssessment'),
        },
      ]
    );
  };

  const handleClearProfile = () => {
    Alert.alert(
      'Clear Profile',
      'This will delete all your profile data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearUserProfile();
            loadProfile();
          },
        },
      ]
    );
  };

  const InfoSection = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );

  const TagList = ({ items }) => (
    <View style={styles.tagContainer}>
      {items && items.length > 0 ? (
        items.map((item, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>None</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile?.assessmentCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Profile Yet</Text>
          <Text style={styles.emptyDescription}>
            Complete the AI Coach Assessment to help me understand you better and provide personalized advice.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AICoachAssessment')}
          >
            <Text style={styles.primaryButtonText}>Take Assessment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <TouchableOpacity onPress={handleRetakeAssessment}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Experience */}
        <InfoSection title="Experience" icon="barbell-outline">
          <InfoRow label="Level" value={profile.experienceLevel?.toUpperCase()} />
          <InfoRow label="Years Training" value={profile.yearsTraining?.toString()} />
          {profile.sportsBackground?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sports Background</Text>
              <TagList items={profile.sportsBackground} />
            </View>
          )}
        </InfoSection>

        {/* Goals */}
        <InfoSection title="Goals" icon="trophy-outline">
          {profile.primaryGoal?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Primary Goals</Text>
              <TagList items={profile.primaryGoal} />
            </View>
          )}
          {profile.secondaryGoals?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Secondary Goals</Text>
              <TagList items={profile.secondaryGoals} />
            </View>
          )}
          {profile.specificGoals?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specific Goals</Text>
              <TagList items={profile.specificGoals} />
            </View>
          )}
        </InfoSection>

        {/* Training Preferences */}
        <InfoSection title="Training" icon="fitness-outline">
          <InfoRow
            label="Workout Style"
            value={profile.workoutStyle?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
          <InfoRow
            label="Rep Range"
            value={profile.preferredRepRange?.toUpperCase()}
          />
          <InfoRow
            label="Environment"
            value={profile.gymEnvironment?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
          {profile.equipmentAccess?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Equipment</Text>
              <TagList items={profile.equipmentAccess} />
            </View>
          )}
        </InfoSection>

        {/* Schedule */}
        <InfoSection title="Schedule" icon="calendar-outline">
          <InfoRow label="Session Duration" value={`${profile.sessionDuration} minutes`} />
          <InfoRow
            label="Preferred Time"
            value={profile.preferredWorkoutTime?.charAt(0).toUpperCase() + profile.preferredWorkoutTime?.slice(1)}
          />
          {profile.availableDays?.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Days</Text>
              <TagList items={profile.availableDays.map(d => d.charAt(0).toUpperCase() + d.slice(1))} />
            </View>
          )}
        </InfoSection>

        {/* Limitations */}
        {(profile.currentPain?.length > 0 || profile.mobilityIssues?.length > 0) && (
          <InfoSection title="Limitations" icon="medkit-outline">
            {profile.currentPain?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Pain</Text>
                <TagList items={profile.currentPain.map(p => p.area)} />
              </View>
            )}
            {profile.mobilityIssues?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobility Issues</Text>
                <TagList items={profile.mobilityIssues} />
              </View>
            )}
          </InfoSection>
        )}

        {/* Exercise Preferences */}
        {(profile.favoriteExercises?.length > 0 || profile.dislikedExercises?.length > 0) && (
          <InfoSection title="Exercise Preferences" icon="heart-outline">
            {profile.favoriteExercises?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Favorites</Text>
                <TagList items={profile.favoriteExercises} />
              </View>
            )}
            {profile.dislikedExercises?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dislikes</Text>
                <TagList items={profile.dislikedExercises} />
              </View>
            )}
          </InfoSection>
        )}

        {/* Lifestyle */}
        <InfoSection title="Lifestyle" icon="moon-outline">
          <InfoRow label="Sleep Hours" value={`${profile.averageSleepHours} hours`} />
          <InfoRow
            label="Sleep Quality"
            value={profile.sleepQuality?.charAt(0).toUpperCase() + profile.sleepQuality?.slice(1)}
          />
          <InfoRow
            label="Stress Level"
            value={profile.stressLevel?.charAt(0).toUpperCase() + profile.stressLevel?.slice(1)}
          />
          <InfoRow
            label="Occupation"
            value={profile.occupation?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
        </InfoSection>

        {/* Nutrition */}
        {(profile.dietaryRestrictions?.length > 0 || profile.mealsPerDay) && (
          <InfoSection title="Nutrition" icon="nutrition-outline">
            {profile.mealsPerDay && (
              <InfoRow label="Meals Per Day" value={profile.mealsPerDay.toString()} />
            )}
            {profile.cookingSkill && (
              <InfoRow
                label="Cooking Skill"
                value={profile.cookingSkill?.charAt(0).toUpperCase() + profile.cookingSkill?.slice(1)}
              />
            )}
            {profile.dietaryRestrictions?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Restrictions</Text>
                <TagList items={profile.dietaryRestrictions} />
              </View>
            )}
          </InfoSection>
        )}

        {/* Coaching Preferences */}
        <InfoSection title="Coaching Preferences" icon="chatbubble-outline">
          <InfoRow
            label="Style"
            value={profile.coachingStyle?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
          <InfoRow
            label="Response Length"
            value={profile.responseVerbosity?.charAt(0).toUpperCase() + profile.responseVerbosity?.slice(1)}
          />
          <InfoRow
            label="Feedback Type"
            value={profile.feedbackPreference?.charAt(0).toUpperCase() + profile.feedbackPreference?.slice(1)}
          />
        </InfoSection>

        {/* Assessment Info */}
        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            Assessment completed on {new Date(profile.assessmentDate).toLocaleDateString()}
          </Text>
          {profile.lastUpdated && (
            <Text style={styles.metaText}>
              Last updated {new Date(profile.lastUpdated).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetakeAssessment}>
          <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Retake Assessment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearProfile}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
          <Text style={styles.dangerButtonText}>Clear Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  sectionContent: {
    gap: 12,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  metaSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 2,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    textAlign: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 8,
  },
});

export default UserProfileScreen;
