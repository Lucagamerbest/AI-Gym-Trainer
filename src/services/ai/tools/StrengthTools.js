/**
 * StrengthTools - Advanced strength training calculations
 *
 * Features from Ultimate Gym Excel:
 * - 1RM Calculator (from any rep range)
 * - Percentage-based training
 * - Progression prediction
 * - Warm-up set generator
 */

/**
 * 1RM CALCULATOR
 * Calculate one rep max from any rep range (1-12)
 * Uses multiple formulas and returns average for accuracy
 */
export async function calculate1RM({ weight, reps, exerciseName = 'exercise' }) {
  try {
    // Validate inputs
    if (!weight || !reps) {
      return {
        success: false,
        error: 'Weight and reps are required'
      };
    }

    const w = parseFloat(weight);
    const r = parseInt(reps);

    if (r === 1) {
      return {
        success: true,
        oneRepMax: w,
        exercise: exerciseName,
        formula: 'Direct measurement (1 rep)',
        note: 'This is your actual 1RM!'
      };
    }

    if (r < 1 || r > 12) {
      return {
        success: false,
        error: '1RM calculation only accurate for 1-12 reps. For endurance work (15+ reps), 1RM calculation is not reliable.'
      };
    }

    // Multiple 1RM formulas for accuracy
    const formulas = {
      // Epley formula (most common)
      epley: w * (1 + r / 30),

      // Brzycki formula (conservative)
      brzycki: w * (36 / (37 - r)),

      // Lander formula
      lander: (100 * w) / (101.3 - 2.67123 * r),

      // Lombardi formula
      lombardi: w * Math.pow(r, 0.10),

      // Mayhew formula
      mayhew: (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),

      // O'Conner formula
      oconner: w * (1 + r / 40),

      // Wathan formula
      wathan: (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))
    };

    // Calculate average of all formulas
    const allResults = Object.values(formulas);
    const average = allResults.reduce((sum, val) => sum + val, 0) / allResults.length;
    const oneRepMax = Math.round(average);

    // Also show most conservative and most aggressive estimates
    const conservative = Math.round(Math.min(...allResults));
    const aggressive = Math.round(Math.max(...allResults));

    return {
      success: true,
      oneRepMax,
      exercise: exerciseName,
      inputWeight: w,
      inputReps: r,
      estimates: {
        conservative,
        average: oneRepMax,
        aggressive
      },
      formulas: {
        epley: Math.round(formulas.epley),
        brzycki: Math.round(formulas.brzycki),
        lander: Math.round(formulas.lander),
        lombardi: Math.round(formulas.lombardi),
        mayhew: Math.round(formulas.mayhew),
        oconner: Math.round(formulas.oconner),
        wathan: Math.round(formulas.wathan)
      },
      note: `Estimated 1RM: ${oneRepMax} lbs (based on ${w} lbs × ${r} reps)`
    };

  } catch (error) {
    console.error('❌ calculate1RM error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * PERCENTAGE-BASED TRAINING
 * Calculate weight for X% of 1RM
 * Essential for periodization programs (5/3/1, Wendler, etc.)
 */
export async function calculatePercentage1RM({ oneRepMax, percentage, exerciseName = 'exercise' }) {
  try {
    if (!oneRepMax || !percentage) {
      return {
        success: false,
        error: '1RM and percentage are required'
      };
    }

    const max = parseFloat(oneRepMax);
    const pct = parseFloat(percentage);

    if (pct <= 0 || pct > 100) {
      return {
        success: false,
        error: 'Percentage must be between 1 and 100'
      };
    }

    const targetWeight = Math.round((max * pct) / 100);

    // Provide context for common percentages
    let context = '';
    if (pct >= 90) {
      context = 'Heavy singles/doubles for max strength';
    } else if (pct >= 85) {
      context = 'Low rep strength work (3-5 reps)';
    } else if (pct >= 75) {
      context = 'Medium rep hypertrophy (6-8 reps)';
    } else if (pct >= 65) {
      context = 'Higher rep hypertrophy (8-12 reps)';
    } else if (pct >= 50) {
      context = 'Volume/technique work (12-15 reps)';
    } else {
      context = 'Warm-up/recovery weight';
    }

    return {
      success: true,
      exercise: exerciseName,
      oneRepMax: max,
      percentage: pct,
      targetWeight,
      context,
      note: `${pct}% of ${max} lbs = ${targetWeight} lbs`
    };

  } catch (error) {
    console.error('❌ calculatePercentage1RM error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * PROGRESSION PREDICTION
 * Predict how many workouts until user hits target weight
 * Based on typical linear progression rates
 */
export async function predictProgression({
  currentWeight,
  currentReps,
  targetWeight,
  exerciseName = 'exercise',
  experienceLevel = 'intermediate'
}) {
  try {
    if (!currentWeight || !currentReps || !targetWeight) {
      return {
        success: false,
        error: 'Current weight, reps, and target weight are required'
      };
    }

    const current = parseFloat(currentWeight);
    const target = parseFloat(targetWeight);
    const reps = parseInt(currentReps);

    if (target <= current) {
      return {
        success: false,
        error: 'Target weight must be higher than current weight'
      };
    }

    // Calculate current 1RM
    const current1RM = await calculate1RM({
      weight: current,
      reps,
      exerciseName
    });

    if (!current1RM.success) {
      return current1RM; // Return error
    }

    const currentMax = current1RM.oneRepMax;
    const difference = target - currentMax;

    // Progressive overload rates (lbs per week)
    // These are research-based averages
    const progressionRates = {
      beginner: {
        'squat': 10, // 10 lbs per week
        'deadlift': 10,
        'bench press': 5,
        'bench': 5,
        'overhead press': 2.5,
        'press': 2.5,
        'row': 5,
        'default': 5
      },
      intermediate: {
        'squat': 5,
        'deadlift': 5,
        'bench press': 2.5,
        'bench': 2.5,
        'overhead press': 1.25,
        'press': 1.25,
        'row': 2.5,
        'default': 2.5
      },
      advanced: {
        'squat': 2.5,
        'deadlift': 2.5,
        'bench press': 1.25,
        'bench': 1.25,
        'overhead press': 0.625,
        'press': 0.625,
        'row': 1.25,
        'default': 1.25
      }
    };

    // Determine exercise type
    const exerciseLower = exerciseName.toLowerCase();
    let rate = progressionRates[experienceLevel]['default'];

    for (const [exercise, exerciseRate] of Object.entries(progressionRates[experienceLevel])) {
      if (exerciseLower.includes(exercise)) {
        rate = exerciseRate;
        break;
      }
    }

    // Calculate weeks needed
    const weeksNeeded = Math.ceil(difference / rate);
    const workoutsNeeded = Math.ceil(weeksNeeded * 1.5); // Assuming 1.5x per week frequency

    // Generate milestone predictions
    const milestones = [];
    const steps = 5; // Show 5 milestones
    for (let i = 1; i <= steps; i++) {
      const milestone = currentMax + (difference * i / steps);
      const weeksToMilestone = Math.ceil((milestone - currentMax) / rate);
      milestones.push({
        weight: Math.round(milestone),
        weeks: weeksToMilestone,
        percentage: Math.round((i / steps) * 100)
      });
    }

    return {
      success: true,
      exercise: exerciseName,
      current: {
        weight: current,
        reps,
        estimated1RM: currentMax
      },
      target: {
        weight: target,
        isFor1RM: true
      },
      prediction: {
        weeksNeeded,
        workoutsNeeded,
        progressionRate: `+${rate} lbs/week`,
        experienceLevel
      },
      milestones,
      note: `At ${rate} lbs/week, you'll reach ${target} lbs in approximately ${weeksNeeded} weeks (${workoutsNeeded} workouts).`
    };

  } catch (error) {
    console.error('❌ predictProgression error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WARM-UP GENERATOR
 * Generate proper warm-up sets before working weight
 * Critical for injury prevention and performance
 */
export async function generateWarmupSets({
  workingWeight,
  workingReps = 5,
  exerciseName = 'exercise',
  experienceLevel = 'intermediate'
}) {
  try {
    if (!workingWeight) {
      return {
        success: false,
        error: 'Working weight is required'
      };
    }

    const working = parseFloat(workingWeight);

    // Determine if this is a lower body exercise (needs more warm-up)
    const exerciseLower = exerciseName.toLowerCase();
    const isLowerBody = ['squat', 'deadlift', 'leg', 'lunge', 'rdl'].some(ex =>
      exerciseLower.includes(ex)
    );

    // Bar weight (standard is 45 lbs, but we'll be smart about it)
    const barWeight = working >= 95 ? 45 : 0; // If working weight is < 95, probably using DBs

    // Generate warm-up sets
    const warmupSets = [];

    if (barWeight > 0 && working > barWeight) {
      // Set 1: Empty bar (if applicable)
      if (working > 135) {
        warmupSets.push({
          set: 1,
          weight: barWeight,
          reps: 10,
          percentage: Math.round((barWeight / working) * 100),
          notes: 'Empty bar - focus on form and activation'
        });
      }

      // Calculate intermediate steps
      const difference = working - barWeight;
      let setNumber = warmupSets.length + 1;

      // Progressive warm-up: 40% → 60% → 80% → working weight
      const percentages = working > 225 ? [40, 60, 80] : [50, 75];

      percentages.forEach((pct, index) => {
        const weight = Math.round((working * pct) / 100);
        // Round to nearest 5 lbs
        const roundedWeight = Math.round(weight / 5) * 5;

        // Reps decrease as weight increases
        const reps = pct <= 50 ? 8 : pct <= 70 ? 5 : 3;

        warmupSets.push({
          set: setNumber++,
          weight: roundedWeight,
          reps,
          percentage: pct,
          notes: index === percentages.length - 1 ? 'Final warm-up - should feel moderately heavy' : 'Progressive warm-up'
        });
      });

      // Optional: Add a very light set at 90% for heavy lifts
      if (working >= 315) {
        const ninetyPercent = Math.round((working * 0.9) / 5) * 5;
        warmupSets.push({
          set: setNumber++,
          weight: ninetyPercent,
          reps: 1,
          percentage: 90,
          notes: 'Heavy single - get feel for the weight'
        });
      }
    } else {
      // For lighter weights or dumbbells
      warmupSets.push({
        set: 1,
        weight: Math.round((working * 0.5) / 5) * 5,
        reps: 10,
        percentage: 50,
        notes: 'Light warm-up'
      });
      warmupSets.push({
        set: 2,
        weight: Math.round((working * 0.75) / 5) * 5,
        reps: 5,
        percentage: 75,
        notes: 'Final warm-up'
      });
    }

    return {
      success: true,
      exercise: exerciseName,
      workingWeight: working,
      workingReps,
      warmupSets,
      totalWarmupSets: warmupSets.length,
      estimatedWarmupTime: `${warmupSets.length * 2}-${warmupSets.length * 3} minutes`,
      notes: [
        'Rest 30-60 seconds between warm-up sets',
        'Focus on perfect form and muscle activation',
        'Don\'t rush - proper warm-up prevents injury',
        isLowerBody ? 'Lower body needs more warm-up volume' : 'Upper body can warm up faster'
      ]
    };

  } catch (error) {
    console.error('❌ generateWarmupSets error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export tool schemas for Gemini function calling
export const strengthToolSchemas = [
  {
    name: 'calculate1RM',
    description: 'Calculate estimated one rep max (1RM) from any rep range (1-12 reps). Essential for strength programming. Use when user asks "What\'s my max?" or provides a weight×reps and wants to know their 1RM.',
    parameters: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          description: 'Weight lifted (in lbs or kg)'
        },
        reps: {
          type: 'number',
          description: 'Number of reps completed (1-12 for accuracy)'
        },
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise (e.g., "Bench Press", "Squat")'
        }
      },
      required: ['weight', 'reps']
    }
  },
  {
    name: 'calculatePercentage1RM',
    description: 'Calculate weight for a percentage of 1RM. Used in periodization programs (5/3/1, Wendler, etc.). Use when user asks "What\'s 70% of my max?" or "How much should I lift for 5×5?"',
    parameters: {
      type: 'object',
      properties: {
        oneRepMax: {
          type: 'number',
          description: '1 rep max (can calculate first if not known)'
        },
        percentage: {
          type: 'number',
          description: 'Percentage of 1RM (e.g., 70, 85, 90)'
        },
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise'
        }
      },
      required: ['oneRepMax', 'percentage']
    }
  },
  {
    name: 'predictProgression',
    description: 'Predict how many workouts/weeks until user reaches target weight. Motivating and helps set realistic goals. Use when user asks "How long until I can bench 225?" or "When will I hit 315 on squat?"',
    parameters: {
      type: 'object',
      properties: {
        currentWeight: {
          type: 'number',
          description: 'Current weight being lifted'
        },
        currentReps: {
          type: 'number',
          description: 'Reps at current weight'
        },
        targetWeight: {
          type: 'number',
          description: 'Goal weight to reach'
        },
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise (affects progression rate)'
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level (affects progression rate)'
        }
      },
      required: ['currentWeight', 'currentReps', 'targetWeight']
    }
  },
  {
    name: 'generateWarmupSets',
    description: 'Generate proper warm-up sets before working weight. Critical for injury prevention and performance. Use when user asks "What warm-up should I do?" or before heavy lifting.',
    parameters: {
      type: 'object',
      properties: {
        workingWeight: {
          type: 'number',
          description: 'The weight for working sets'
        },
        workingReps: {
          type: 'number',
          description: 'Reps planned for working sets (default: 5)'
        },
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise'
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level'
        }
      },
      required: ['workingWeight']
    }
  }
];
