/**
 * Automated Test Runner UI
 *
 * Visual interface to run automated AI stress tests
 * Shows real-time progress and results
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import AutomatedAITester, { TEST_QUESTIONS } from '../services/ai/AutomatedAITester';

export default function AutomatedTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  const runFullTest = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: 0, successRate: 0 });
    setResults(null);

    try {
      const { result, report } = await AutomatedAITester.runAutomatedStressTest(
        AutomatedAITester.TEST_CONFIG,
        (progressData) => {
          setProgress(progressData);
          setCurrentCategory(progressData.category);
        }
      );

      setResults(report);
      Alert.alert(
        'Test Complete!',
        `Success Rate: ${report.summary.successRate}\n` +
        `Total: ${report.summary.total}\n` +
        `Passed: ${report.summary.successful}\n` +
        `Failed: ${report.summary.failed}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: 20, successRate: 0 });
    setResults(null);

    try {
      const { result, report } = await AutomatedAITester.runQuickTest((progressData) => {
        setProgress(progressData);
        setCurrentCategory(progressData.category);
      });

      setResults(report);
      Alert.alert(
        'Quick Test Complete!',
        `Success Rate: ${report.summary.successRate}\n` +
        `Passed: ${report.summary.successful}/20`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runCategoryTest = async (category) => {
    setIsRunning(true);
    setProgress({ current: 0, total: TEST_QUESTIONS[category].length, successRate: 0 });
    setResults(null);
    setCurrentCategory(category);

    try {
      const { result, report } = await AutomatedAITester.testCategory(
        category,
        (progressData) => {
          setProgress(progressData);
        }
      );

      setResults(report);
      Alert.alert(
        `${category} Test Complete!`,
        `Success Rate: ${report.summary.successRate}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = async () => {
    if (!results) return;

    try {
      const markdown = AutomatedAITester.exportTestResults(results);
      await Share.share({
        message: markdown,
        title: 'AI Stress Test Results',
      });
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    }
  };

  const totalQuestions = Object.values(TEST_QUESTIONS).reduce(
    (sum, questions) => sum + questions.length,
    0
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Automated AI Tester</Text>
        <Text style={styles.subtitle}>
          Test AI with {totalQuestions} realistic questions
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isRunning && styles.buttonDisabled]}
          onPress={runFullTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            🚀 Run Full Test ({totalQuestions} questions)
          </Text>
          <Text style={styles.buttonSubtext}>
            ~{Math.round((totalQuestions * 2) / 60)} minutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, isRunning && styles.buttonDisabled]}
          onPress={runQuickTest}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            ⚡ Quick Test (20 questions)
          </Text>
          <Text style={[styles.buttonSubtext, styles.secondaryButtonText]}>
            ~1 minute
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test by Category</Text>

        <View style={styles.categoryGrid}>
          {Object.entries(TEST_QUESTIONS).map(([category, questions]) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                isRunning && styles.buttonDisabled,
                currentCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => runCategoryTest(category)}
              disabled={isRunning}
            >
              <Text style={styles.categoryButtonTitle}>
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </Text>
              <Text style={styles.categoryButtonCount}>{questions.length} tests</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Progress */}
      {isRunning && progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Running Tests...</Text>
            <Text style={styles.progressStats}>
              {progress.current}/{progress.total}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(progress.current / progress.total) * 100}%` },
              ]}
            />
          </View>

          <View style={styles.progressDetails}>
            <Text style={styles.progressDetail}>
              Success Rate: {progress.successRate}%
            </Text>
            <Text style={styles.progressDetail}>
              Category: {currentCategory}
            </Text>
          </View>

          {progress.question && (
            <Text style={styles.currentQuestion} numberOfLines={2}>
              "{progress.question}"
            </Text>
          )}

          <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        </View>
      )}

      {/* Results */}
      {results && !isRunning && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>📊 Test Results</Text>
            <TouchableOpacity style={styles.exportButton} onPress={exportResults}>
              <Text style={styles.exportButtonText}>📤 Export</Text>
            </TouchableOpacity>
          </View>

          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{results.summary.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {results.summary.successful}
              </Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {results.summary.failed}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      parseFloat(results.summary.successRate) > 90
                        ? Colors.success
                        : parseFloat(results.summary.successRate) > 80
                        ? Colors.warning
                        : Colors.error,
                  },
                ]}
              >
                {results.summary.successRate}
              </Text>
              <Text style={styles.statLabel}>Success</Text>
            </View>
          </View>

          {/* Performance */}
          <View style={styles.performanceContainer}>
            <Text style={styles.performanceTitle}>Performance</Text>
            <Text style={styles.performanceDetail}>
              Duration: {results.summary.duration}
            </Text>
            <Text style={styles.performanceDetail}>
              Avg Response: {results.summary.avgResponseTime}
            </Text>
            <Text style={styles.performanceDetail}>
              Warnings: {results.summary.warnings}
            </Text>
          </View>

          {/* Errors by Category */}
          {Object.keys(results.errorsByCategory).length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>🔍 Errors by Category</Text>
              {Object.entries(results.errorsByCategory).map(([category, errors]) => (
                <View key={category} style={styles.errorCategory}>
                  <Text style={styles.errorCategoryTitle}>
                    {category}: {errors.length} errors
                  </Text>
                  {errors.slice(0, 3).map((err, idx) => (
                    <Text key={idx} style={styles.errorDetail} numberOfLines={1}>
                      • {err.question}
                    </Text>
                  ))}
                  {errors.length > 3 && (
                    <Text style={styles.errorMore}>
                      ... and {errors.length - 3} more
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Slowest Queries */}
          {results.slowestQueries.length > 0 && (
            <View style={styles.queriesContainer}>
              <Text style={styles.queriesTitle}>🐌 Slowest Queries</Text>
              {results.slowestQueries.slice(0, 5).map((q, idx) => (
                <View key={idx} style={styles.queryItem}>
                  <Text style={styles.queryText} numberOfLines={1}>
                    {q.question}
                  </Text>
                  <Text style={styles.queryTime}>{q.responseTime}ms</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      {!isRunning && !results && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionsText}>
            1. <Text style={styles.bold}>Quick Test</Text> - Run 20 questions (~1 min) to
            get a fast overview
          </Text>
          <Text style={styles.instructionsText}>
            2. <Text style={styles.bold}>Full Test</Text> - Run all {totalQuestions}{' '}
            questions to find all issues
          </Text>
          <Text style={styles.instructionsText}>
            3. <Text style={styles.bold}>Category Test</Text> - Test specific features
            (workouts, nutrition, etc.)
          </Text>
          <Text style={styles.instructionsText}>
            4. <Text style={styles.bold}>Export Results</Text> - Share test report when
            done
          </Text>

          <Text style={styles.instructionsTip}>
            💡 Tip: Run tests regularly to catch regressions and track improvements
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  button: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  buttonSubtext: {
    fontSize: Typography.fontSize.xs,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    width: '48%',
    margin: '1%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  categoryButtonTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  categoryButtonCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  progressContainer: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  progressStats: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  currentQuestion: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  spinner: {
    marginTop: Spacing.md,
  },
  resultsContainer: {
    margin: Spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  exportButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    minWidth: 70,
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  performanceContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  performanceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  performanceDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  errorsContainer: {
    padding: Spacing.md,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorCategory: {
    marginVertical: Spacing.sm,
  },
  errorCategoryTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  errorMore: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: Spacing.sm,
  },
  queriesContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  queriesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  queryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  queryText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  queryTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  instructionsContainer: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  instructionsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  instructionsTip: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
