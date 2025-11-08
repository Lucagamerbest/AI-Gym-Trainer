import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import SmartInputLearning from '../services/SmartInputLearning';

/**
 * SmartInputSettings
 *
 * Settings and analytics panel for Smart Input System
 * - View usage statistics
 * - Clear learning data
 * - Toggle features
 */
export default function SmartInputSettings({ visible, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      console.log('⚙️ SmartInputSettings modal opened');
      loadStats();
    }
  }, [visible]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const usageStats = await SmartInputLearning.getUsageStats();
      console.log('📊 Smart Input Stats:', usageStats);
      setStats(usageStats);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Learning Data?',
      'This will reset all your personalized suggestions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SmartInputLearning.clearAllData();
              await loadStats();
              Alert.alert('Success', 'Learning data cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="analytics" size={24} color={Colors.primary} />
              <Text style={styles.headerTitle}>Smart Input Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Statistics Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Usage Statistics</Text>

              {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : stats ? (
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Terms Learned</Text>
                    <Text style={styles.statValue}>{stats.totalTerms}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Suggestions Used</Text>
                    <Text style={styles.statValue}>{stats.totalUsages}</Text>
                  </View>

                  {/* Most Used Terms */}
                  {stats.mostUsed && stats.mostUsed.length > 0 && (
                    <View style={styles.subsection}>
                      <Text style={styles.subsectionTitle}>🔥 Most Used Terms</Text>
                      {stats.mostUsed.slice(0, 5).map((item, index) => (
                        <View key={index} style={styles.termRow}>
                          <Text style={styles.termRank}>#{index + 1}</Text>
                          <Text style={styles.termName}>{item.term}</Text>
                          <Text style={styles.termCount}>{item.count}x</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recently Used Terms */}
                  {stats.recentlyUsed && stats.recentlyUsed.length > 0 && (
                    <View style={styles.subsection}>
                      <Text style={styles.subsectionTitle}>⏱️ Recently Used</Text>
                      {stats.recentlyUsed.slice(0, 5).map((item, index) => (
                        <View key={index} style={styles.termRow}>
                          <Text style={styles.termName}>{item.term}</Text>
                          <Text style={styles.termDate}>{formatDate(item.lastUsed)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>No usage data yet. Start using suggestions to see stats!</Text>
              )}
            </View>

            {/* Features Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Features</Text>

              <View style={styles.featureRow}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureLabel}>Learning Enabled</Text>
                  <Text style={styles.featureDesc}>Track and personalize suggestions</Text>
                </View>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={Colors.primary}
                />
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureLabel}>Fuzzy Matching</Text>
                  <Text style={styles.featureDesc}>Tolerates typos and variations</Text>
                </View>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={Colors.primary}
                />
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureLabel}>Abbreviations</Text>
                  <Text style={styles.featureDesc}>Auto-expand common shortcuts</Text>
                </View>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={Colors.primary}
                />
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ℹ️ About</Text>
              <Text style={styles.infoText}>
                The Smart Input System learns from your usage patterns to provide personalized suggestions.
                {'\n\n'}
                All data is stored locally on your device and never shared externally.
                {'\n\n'}
                <Text style={styles.infoHighlight}>Vocabulary:</Text> 200+ terms
                {'\n'}
                <Text style={styles.infoHighlight}>Abbreviations:</Text> 20+ shortcuts
                {'\n'}
                <Text style={styles.infoHighlight}>Response Time:</Text> {'<'}20ms
              </Text>
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Actions</Text>

              <TouchableOpacity style={styles.actionButton} onPress={loadStats}>
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Refresh Statistics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearData}
              >
                <Ionicons name="trash" size={20} color={Colors.error} />
                <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                  Clear All Learning Data
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    height: '90%',
    minHeight: 400,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  statLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  subsection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  termRank: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    width: 24,
  },
  termName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  termCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  termDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  infoHighlight: {
    fontWeight: '600',
    color: Colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  dangerButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  dangerButtonText: {
    color: Colors.error,
  },
});
