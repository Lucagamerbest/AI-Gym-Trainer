/**
 * AIDebugViewer - In-app debug console for AI interactions
 *
 * Shows logged interactions, errors, and statistics
 * Allows exporting bug reports directly from the app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import AIDebugger from '../services/ai/AIDebugger';

export default function AIDebugViewer() {
  const [debugLog, setDebugLog] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'failed', 'success'
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    const log = await AIDebugger.getAIDebugLog();
    const statistics = await AIDebugger.getErrorStatistics();
    setDebugLog(log);
    setStats(statistics);
  };

  const getFilteredLog = () => {
    if (filter === 'failed') {
      return debugLog.filter(e => !e.success);
    } else if (filter === 'success') {
      return debugLog.filter(e => e.success);
    }
    return debugLog;
  };

  const exportBugReport = async (entry) => {
    try {
      const report = AIDebugger.createBugReport(entry);

      await Share.share({
        message: report.description,
        title: report.title,
      });
    } catch (error) {
      console.error('Failed to export bug report:', error);
    }
  };

  const exportAllLogs = async () => {
    try {
      const exportText = await AIDebugger.exportDebugLog(filter === 'all');

      await Share.share({
        message: exportText,
        title: 'AI Debug Log Export',
      });
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const clearLogs = async () => {
    Alert.alert(
      'Clear Debug Logs',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AIDebugger.clearDebugLog();
            await loadDebugData();
          },
        },
      ]
    );
  };

  const filteredLog = getFilteredLog();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>AI Performance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalInteractions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {stats.successRate}%
              </Text>
              <Text style={styles.statLabel}>Success</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {stats.failedInteractions}
              </Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.avgToolsUsed}</Text>
              <Text style={styles.statLabel}>Avg Tools</Text>
            </View>
          </View>

          {/* Top Error Categories */}
          {Object.keys(stats.errorsByCategory).length > 0 && (
            <View style={styles.errorCategoriesContainer}>
              <Text style={styles.errorCategoriesTitle}>Top Errors:</Text>
              {Object.entries(stats.errorsByCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([category, count]) => (
                  <Text key={category} style={styles.errorCategory}>
                    {category}: {count}
                  </Text>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All ({debugLog.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'failed' && styles.filterButtonActive]}
          onPress={() => setFilter('failed')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'failed' && styles.filterButtonTextActive,
            ]}
          >
            Failed ({debugLog.filter(e => !e.success).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'success' && styles.filterButtonActive]}
          onPress={() => setFilter('success')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'success' && styles.filterButtonTextActive,
            ]}
          >
            Success ({debugLog.filter(e => e.success).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={exportAllLogs}>
          <Text style={styles.actionButtonText}>📤 Export Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={loadDebugData}>
          <Text style={styles.actionButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={clearLogs}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            🗑️ Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log Entries */}
      <ScrollView style={styles.logContainer}>
        {filteredLog.length === 0 ? (
          <Text style={styles.emptyText}>No log entries found</Text>
        ) : (
          filteredLog.map((entry, index) => (
            <View key={entry.id} style={styles.logEntry}>
              <TouchableOpacity
                onPress={() =>
                  setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
                }
              >
                <View style={styles.logEntryHeader}>
                  <Text
                    style={[
                      styles.logEntryStatus,
                      entry.success ? styles.success : styles.failed,
                    ]}
                  >
                    {entry.success ? '✅' : '❌'}
                  </Text>
                  <View style={styles.logEntryInfo}>
                    <Text style={styles.logEntryMessage} numberOfLines={1}>
                      {entry.userMessage}
                    </Text>
                    <Text style={styles.logEntryTimestamp}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.logEntryToolCount}>
                    {entry.toolCount} tools
                  </Text>
                </View>

                {expandedEntry === entry.id && (
                  <View style={styles.logEntryDetails}>
                    <Text style={styles.detailLabel}>User Message:</Text>
                    <Text style={styles.detailText}>{entry.userMessage}</Text>

                    <Text style={styles.detailLabel}>AI Response:</Text>
                    <Text style={styles.detailText}>
                      {entry.aiResponse || 'No response'}
                    </Text>

                    {entry.toolsUsed.length > 0 && (
                      <>
                        <Text style={styles.detailLabel}>Tools Used:</Text>
                        {entry.toolsUsed.map((tool, idx) => (
                          <View key={idx} style={styles.toolDetail}>
                            <Text style={styles.toolName}>
                              {tool.success ? '✓' : '✗'} {tool.name}
                            </Text>
                            <Text style={styles.toolTime}>
                              {tool.executionTime}ms
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    {entry.error && (
                      <>
                        <Text style={[styles.detailLabel, styles.errorLabel]}>
                          Error:
                        </Text>
                        <Text style={styles.errorText}>
                          {entry.error.category}: {entry.error.message}
                        </Text>
                      </>
                    )}

                    <Text style={styles.detailLabel}>Context:</Text>
                    <Text style={styles.detailText}>
                      Screen: {entry.context.screen || 'Unknown'}
                      {'\n'}Profile: {entry.context.hasUserProfile ? 'Yes' : 'No'}
                      {'\n'}Response Time: {entry.metadata.responseTime}ms
                    </Text>

                    {!entry.success && (
                      <TouchableOpacity
                        style={styles.bugReportButton}
                        onPress={() => exportBugReport(entry)}
                      >
                        <Text style={styles.bugReportButtonText}>
                          📋 Export Bug Report
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorCategoriesContainer: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  errorCategoriesTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 4,
  },
  errorCategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  dangerButtonText: {
    color: '#fff',
  },
  logContainer: {
    flex: 1,
  },
  emptyText: {
    padding: Spacing.lg,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  logEntry: {
    backgroundColor: Colors.surface,
    marginVertical: 4,
    marginHorizontal: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  logEntryStatus: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  logEntryInfo: {
    flex: 1,
  },
  logEntryMessage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  logEntryTimestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  logEntryToolCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  logEntryDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  toolDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginVertical: 2,
  },
  toolName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  toolTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  errorLabel: {
    color: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    backgroundColor: `${Colors.error}10`,
    padding: Spacing.sm,
    borderRadius: 4,
  },
  bugReportButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  bugReportButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  success: {
    color: Colors.success,
  },
  failed: {
    color: Colors.error,
  },
});
