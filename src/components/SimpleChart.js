import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const chartHeight = 300;

export default function SimpleChart({ data, title, chartType = 'volume', debug = false, onPointPress }) {
  // Get actual screen dimensions dynamically
  const { width: screenWidth } = Dimensions.get('window');

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  // Find min and max values for scaling
  const values = data.map(d => d.weight);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);


  // Smart scaling algorithm
  const range = maxValue - minValue;
  let chartMin, chartMax;

  if (range === 0) {
    // All values are the same
    chartMin = Math.max(0, minValue - 10);
    chartMax = maxValue + 10;
  } else {
    // Use logarithmic-inspired scaling for large ranges
    if (minValue === 0 || minValue < range * 0.3) {
      chartMin = 0;
    } else {
      // Start from a value that's ~20% below minimum
      chartMin = Math.floor(minValue * 0.8 / 10) * 10;
    }

    // Add 15% padding to top
    chartMax = maxValue * 1.15;
  }

  // Round to nice numbers based on the scale
  const roundToNice = (value) => {
    if (value >= 1000) return Math.ceil(value / 100) * 100;
    if (value >= 100) return Math.ceil(value / 10) * 10;
    if (value >= 10) return Math.ceil(value / 5) * 5;
    return Math.ceil(value);
  };

  chartMax = roundToNice(chartMax);
  chartMin = Math.floor(chartMin / 10) * 10;

  // CLEAN DIMENSION CALCULATIONS
  const screenLayoutPadding = Spacing.lg; // 24px from ScreenLayout
  const yAxisWidth = screenWidth * 0.10; // 10% of screen for Y-axis
  const dotRadius = 7; // Half of dot size (14px / 2)
  const rightMargin = 35; // Safety margin to keep last dot inside visible area (increased to account for card padding)

  // Calculate plot area (the container with padding)
  const totalHorizontalPadding = screenLayoutPadding * 2;
  const chartContainerWidth = screenWidth - totalHorizontalPadding;
  const plotWidth = chartContainerWidth - yAxisWidth;

  // INNER chart dimensions - the actual visible grid where dots should stay
  // This is INSIDE the plotArea's padding
  const innerChartWidth = plotWidth - rightMargin;
  const innerChartHeight = 244; // chartHeight (300) - topPadding (28) - bottomPadding (28)

  // Calculate positioning ranges for dots
  const maxDotX = innerChartWidth - dotRadius;
  const maxDotY = innerChartHeight - dotRadius;
  const availableRangeX = maxDotX - dotRadius; // X range from first to last dot center
  const availableRangeY = innerChartHeight - (dotRadius * 2); // Y range for vertical positioning

  const getXPosition = (index) => {
    if (data.length === 1) return innerChartWidth / 2;
    // Distribute across available X range
    return dotRadius + (index / (data.length - 1)) * availableRangeX;
  };

  const getYPosition = (value) => {
    if (chartMax === chartMin) return innerChartHeight / 2;
    const normalized = (value - chartMin) / (chartMax - chartMin);
    // Position within available Y range
    return dotRadius + availableRangeY - (normalized * availableRangeY);
  };

  // Get color scheme based on chart type
  const getChartColors = () => {
    switch (chartType) {
      case 'volume':
        return { primary: '#6366F1', secondary: '#818CF8', gradient: ['#6366F1', '#818CF8'], light: 'rgba(99, 102, 241, 0.1)' };
      case 'max':
        return { primary: '#F59E0B', secondary: '#FBBF24', gradient: ['#F59E0B', '#FBBF24'], light: 'rgba(245, 158, 11, 0.1)' };
      case '1rm':
        return { primary: '#EF4444', secondary: '#F87171', gradient: ['#EF4444', '#F87171'], light: 'rgba(239, 68, 68, 0.1)' };
      case 'reps':
        return { primary: '#10B981', secondary: '#34D399', gradient: ['#10B981', '#34D399'], light: 'rgba(16, 185, 129, 0.1)' };
      default:
        return { primary: Colors.primary, secondary: Colors.primary, gradient: [Colors.primary, Colors.primary], light: 'rgba(99, 102, 241, 0.1)' };
    }
  };

  const chartColors = getChartColors();

  // Format value for display
  const formatValue = (value) => {
    if (value >= 10000) {
      return `${Math.round(value / 1000)}k`;
    } else if (value >= 1000) {
      const k = value / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return Math.round(value).toString();
  };

  // Format date for x-axis
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return '';
    if (typeof dateString === 'string' && dateString.match(/^\d{1,2}\/\d{1,2}$/)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Calculate Y-axis labels
  const getYAxisLabels = () => {
    const step = (chartMax - chartMin) / 3;
    return [
      chartMax,
      chartMin + step * 2,
      chartMin + step,
      chartMin
    ];
  };

  const yAxisLabels = getYAxisLabels();

  // Smart label selection - show max 6 labels
  const getVisibleDataPoints = () => {
    if (data.length <= 6) return data.map((_, i) => i);

    const step = Math.ceil(data.length / 5);
    const indices = [0];
    for (let i = step; i < data.length - 1; i += step) {
      indices.push(i);
    }
    indices.push(data.length - 1);
    return indices;
  };

  const visibleIndices = getVisibleDataPoints();

  // Create area fill path
  const areaPoints = data.map((point, index) => ({
    x: getXPosition(index),
    y: getYPosition(values[index])
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.chartStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={[styles.statValue, { color: chartColors.primary }]}>
                {formatValue(values.reduce((a, b) => a + b, 0) / values.length)}
              </Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Best</Text>
              <Text style={[styles.statValue, { color: chartColors.primary }]}>
                {formatValue(maxValue)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.chart}>
        {/* Y-axis labels */}
        <View style={[styles.yAxis, { width: yAxisWidth, paddingTop: 28, paddingBottom: 28, paddingRight: 4, height: chartHeight }]}>
          {yAxisLabels.map((label, index) => {
            // Position each label at the exact Y position where that value appears on the chart
            const labelYPosition = getYPosition(label);

            return (
              <Text
                key={index}
                style={[
                  styles.axisLabel,
                  {
                    position: 'absolute',
                    top: labelYPosition - 8, // Offset by half the text height to center it
                    right: 4,
                  }
                ]}
              >
                {formatValue(label)}
              </Text>
            );
          })}
        </View>

        {/* Chart area */}
        <View style={[styles.plotArea, { paddingTop: 28, paddingBottom: 28, paddingLeft: 4 }]}>
          {/* Grid lines */}
          {[0, 0.33, 0.67, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { top: ratio * innerChartHeight }
              ]}
            />
          ))}

          {/* Area fill under the line */}
          {areaPoints.length > 1 && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
              {areaPoints.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = areaPoints[index - 1];

                return (
                  <View
                    key={`fill-${index}`}
                    style={{
                      position: 'absolute',
                      left: prevPoint.x,
                      top: 0,
                      width: point.x - prevPoint.x,
                      height: innerChartHeight,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={[chartColors.light, 'transparent']}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: prevPoint.y,
                        width: point.x - prevPoint.x,
                        height: innerChartHeight - prevPoint.y,
                      }}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Trend line */}
          {data.map((point, index) => {
            if (index === 0) return null;

            const x1 = getXPosition(index - 1);
            const y1 = getYPosition(values[index - 1]);
            const x2 = getXPosition(index);
            const y2 = getYPosition(values[index]);

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.line,
                  {
                    left: x1,
                    top: y1,
                    width: length,
                    backgroundColor: chartColors.primary,
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
                pointerEvents="none"
              />
            );
          })}

          {/* Data points with labels */}
          {data.map((point, index) => {
            const xPos = getXPosition(index);
            const yPos = getYPosition(values[index]);
            const isVisible = visibleIndices.includes(index);

            return (
              <React.Fragment key={index}>
                {/* Value label above point */}
                {isVisible && (
                  <View style={{
                    position: 'absolute',
                    left: Math.max(0, Math.min(xPos - 25, innerChartWidth - 50)),
                    top: Math.max(0, yPos - 28),
                    backgroundColor: chartColors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    pointerEvents: 'none', // Allow taps to pass through to dot
                  }}>
                    <Text style={styles.dataPointLabelText}>
                      {formatValue(values[index])}
                    </Text>
                  </View>
                )}

                {/* Data point - Now clickable with larger hit area */}
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    left: xPos - 20, // Larger touch target
                    top: yPos - 20,
                    width: 40, // Larger touch target
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10, // Ensure it's above other elements
                  }}
                  onPress={() => {
                    if (onPointPress && point.workoutId) {
                      onPointPress(point.workoutId);
                    }
                  }}
                  activeOpacity={onPointPress ? 0.6 : 1}
                  disabled={!onPointPress || !point.workoutId}
                >
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        backgroundColor: Colors.surface,
                        borderColor: chartColors.primary,
                        borderWidth: 3,
                      }
                    ]}
                  />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxis, { marginLeft: yAxisWidth + 4 }]}>
        {data.map((point, index) => {
          if (!visibleIndices.includes(index)) return null;

          return (
            <Text
              key={index}
              style={[
                styles.xAxisLabel,
                { left: getXPosition(index) - 20 }
              ]}
            >
              {formatDate(point.date)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 0,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  chartStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  emptyChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
  },
  chart: {
    height: chartHeight,
    flexDirection: 'row',
  },
  yAxis: {
    position: 'relative',
    paddingRight: 2,
  },
  axisLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    fontWeight: '600',
  },
  plotArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border + '40',
  },
  line: {
    position: 'absolute',
    height: 4,
    transformOrigin: 'left center',
    borderRadius: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dataPointLabelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xAxis: {
    height: 25,
    position: 'relative',
    marginTop: 4,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
});
