import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32;
const chartHeight = 200;

export default function SimpleChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  // Find min and max values for scaling
  const weights = data.map(d => d.weight);
  const volumes = data.map(d => d.volume);

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);

  // Scale volumes to fit weight range for better visualization
  const scaledVolumes = volumes.map(v => {
    if (maxVolume === minVolume) return minWeight;
    return minWeight + ((v - minVolume) / (maxVolume - minVolume)) * (maxWeight - minWeight);
  });

  // Calculate positions
  const plotWidth = chartWidth - 60; // Leave space for labels
  const plotHeight = chartHeight - 60; // Leave space for labels

  const getXPosition = (index) => {
    return 50 + (index / (data.length - 1)) * plotWidth;
  };

  const getYPosition = (value, min, max) => {
    if (max === min) return plotHeight / 2 + 30;
    return 30 + plotHeight - ((value - min) / (max - min)) * plotHeight;
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>

      <View style={styles.chart}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{Math.round(maxWeight)}</Text>
          <Text style={styles.axisLabel}>{Math.round((maxWeight + minWeight) / 2)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minWeight)}</Text>
        </View>

        {/* Chart area */}
        <View style={styles.plotArea}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { top: 30 + ratio * plotHeight }
              ]}
            />
          ))}

          {/* Weight line */}
          {data.map((point, index) => {
            if (index === 0) return null;

            const x1 = getXPosition(index - 1);
            const y1 = getYPosition(weights[index - 1], minWeight, maxWeight);
            const x2 = getXPosition(index);
            const y2 = getYPosition(weights[index], minWeight, maxWeight);

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            return (
              <View
                key={`weight-line-${index}`}
                style={[
                  styles.line,
                  styles.weightLine,
                  {
                    left: x1,
                    top: y1,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
              />
            );
          })}

          {/* Volume line (scaled) */}
          {data.map((point, index) => {
            if (index === 0) return null;

            const x1 = getXPosition(index - 1);
            const y1 = getYPosition(scaledVolumes[index - 1], minWeight, maxWeight);
            const x2 = getXPosition(index);
            const y2 = getYPosition(scaledVolumes[index], minWeight, maxWeight);

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            return (
              <View
                key={`volume-line-${index}`}
                style={[
                  styles.line,
                  styles.volumeLine,
                  {
                    left: x1,
                    top: y1,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
              />
            );
          })}

          {/* Data points */}
          {data.map((point, index) => (
            <React.Fragment key={index}>
              {/* Weight point */}
              <View
                style={[
                  styles.dataPoint,
                  styles.weightPoint,
                  {
                    left: getXPosition(index) - 4,
                    top: getYPosition(weights[index], minWeight, maxWeight) - 4,
                  }
                ]}
              />
              {/* Volume point */}
              <View
                style={[
                  styles.dataPoint,
                  styles.volumePoint,
                  {
                    left: getXPosition(index) - 4,
                    top: getYPosition(scaledVolumes[index], minWeight, maxWeight) - 4,
                  }
                ]}
              />
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {data.map((point, index) => (
          <Text
            key={index}
            style={[
              styles.xAxisLabel,
              { left: getXPosition(index) - 15 }
            ]}
          >
            {point.date}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.weightColor]} />
          <Text style={styles.legendText}>Weight (lbs)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.volumeColor]} />
          <Text style={styles.legendText}>Volume (scaled)</Text>
        </View>
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
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
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
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  axisLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
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
    height: 2,
    transformOrigin: 'left center',
  },
  weightLine: {
    backgroundColor: Colors.primary,
  },
  volumeLine: {
    backgroundColor: '#2196F3',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weightPoint: {
    backgroundColor: Colors.primary,
  },
  volumePoint: {
    backgroundColor: '#2196F3',
  },
  xAxis: {
    height: 30,
    position: 'relative',
    marginTop: Spacing.sm,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    width: 30,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weightColor: {
    backgroundColor: Colors.primary,
  },
  volumeColor: {
    backgroundColor: '#2196F3',
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});