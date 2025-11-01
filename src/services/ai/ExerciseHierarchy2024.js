/**
 * Exercise Hierarchy 2024 - Based on Latest Research
 *
 * Updated based on:
 * - Jeff Nippard's 2024 training transformation & peer-reviewed research
 * - 2024 EMG studies and hypertrophy research
 * - Meta-analyses on exercise effectiveness
 *
 * Key Updates from 2024 Research:
 * 1. Incline Press (45°) > Flat Bench for overall chest development
 * 2. Overhead Extensions > Pushdowns for triceps (+50% long head, +40% overall)
 * 3. Bayesian Curls > Preacher Curls for biceps hypertrophy
 * 4. Pull-ups upgraded to S-tier (more full-body tension, harder to cheat than pulldowns)
 * 5. Freeweights prioritized over machines (Jeff Nippard 2024 protocol)
 */

export const EXERCISE_HIERARCHY_2024 = {
  CHEST: {
    tierS: [
      {
        name: 'Incline Barbell Press',
        aliases: ['Incline Bench Press', 'Incline Press'],
        angle: '45°',
        equipment: 'barbell',
        reason: '2024 study: Superior upper chest development + equal mid/lower chest activation vs flat bench',
        research: 'Optimizing Resistance Training Technique (Nippard et al., 2024)',
        priority: 1
      },
      {
        name: 'Flat Barbell Bench Press',
        aliases: ['Bench Press', 'Barbell Bench Press'],
        equipment: 'barbell',
        reason: 'Classic compound, 95% MVC in pectoralis major',
        research: 'EMG analysis shows highest overall chest activation',
        priority: 2
      },
      {
        name: 'Dips',
        aliases: ['Chest Dips', 'Parallel Bar Dips'],
        equipment: 'bodyweight',
        reason: 'Compound pressing movement, high chest + tricep activation',
        research: 'Bodyweight compound with progressive overload via weight belt',
        priority: 3
      }
    ],
    tierA: [
      {
        name: 'Incline Dumbbell Press',
        aliases: ['DB Incline Press'],
        equipment: 'dumbbell',
        reason: 'Greater ROM than barbell, unilateral stability',
        priority: 4
      },
      {
        name: 'Flat Dumbbell Press',
        aliases: ['Dumbbell Bench Press', 'DB Press'],
        equipment: 'dumbbell',
        reason: 'Unilateral work, natural movement path',
        priority: 5
      },
      {
        name: 'Decline Barbell Press',
        aliases: ['Decline Bench Press'],
        equipment: 'barbell',
        reason: 'Lower chest emphasis (use sparingly)',
        priority: 6
      }
    ],
    tierB: [
      {
        name: 'Cable Flyes',
        aliases: ['Cable Fly', 'Cable Chest Fly'],
        equipment: 'cable',
        reason: 'Isolation with constant tension throughout ROM',
        priority: 7
      },
      {
        name: 'Dumbbell Flyes',
        aliases: ['DB Flyes', 'Chest Flyes'],
        equipment: 'dumbbell',
        reason: 'Isolation stretch exercise',
        priority: 8
      },
      {
        name: 'Pec Deck',
        aliases: ['Machine Fly', 'Chest Fly Machine'],
        equipment: 'machine',
        reason: 'Machine isolation (inferior to cables/freeweights)',
        priority: 9
      }
    ]
  },

  TRICEPS: {
    tierS: [
      {
        name: 'Overhead Tricep Extension',
        aliases: ['Overhead Extension', 'Tricep Overhead Extension', 'Dumbbell Overhead Extension', 'Cable Overhead Extension'],
        equipment: 'dumbbell/cable',
        reason: '2024 study: 50% more long head growth, 40% more overall tricep growth vs pushdowns',
        research: 'Overhead position stretches long head maximally (Nippard 2024 research)',
        priority: 1
      },
      {
        name: 'Close Grip Bench Press',
        aliases: ['CGBP', 'Close Grip Bench'],
        equipment: 'barbell',
        reason: 'Heavy compound pressing, allows progressive overload',
        priority: 2
      },
      {
        name: 'Dips',
        aliases: ['Tricep Dips', 'Parallel Bar Dips'],
        equipment: 'bodyweight',
        reason: '85-90% tricep activation (EMG data)',
        priority: 3
      }
    ],
    tierA: [
      {
        name: 'Skull Crushers',
        aliases: ['Lying Tricep Extension', 'EZ Bar Skull Crusher'],
        equipment: 'barbell',
        reason: 'Direct long head work with stretch',
        priority: 4
      },
      {
        name: 'Tricep Dips',
        aliases: ['Dips', 'Bench Dips'],
        equipment: 'bodyweight',
        reason: 'Bodyweight compound',
        priority: 5
      }
    ],
    tierB: [
      {
        name: 'Tricep Pushdown',
        aliases: ['Cable Pushdown', 'Tricep Cable Pushdown'],
        equipment: 'cable',
        reason: 'Isolation (2024 research shows inferior to overhead extensions)',
        research: 'Still valid for finishing work, but not primary tricep builder',
        priority: 6
      },
      {
        name: 'Tricep Kickback',
        aliases: ['Dumbbell Kickback'],
        equipment: 'dumbbell',
        reason: 'Isolation finishing exercise',
        priority: 7
      }
    ]
  },

  BICEPS: {
    tierS: [
      {
        name: 'Bayesian Curl',
        aliases: ['Cable Bayesian Curl', 'Behind Body Cable Curl'],
        equipment: 'cable',
        reason: '2024 study: Trends for more growth vs preacher curls due to constant tension + stretch',
        research: 'Comparison study (Nippard 2024): Bayesian > Preacher for hypertrophy',
        priority: 1
      },
      {
        name: 'Barbell Curl',
        aliases: ['Standing Barbell Curl', 'EZ Bar Curl'],
        equipment: 'barbell',
        reason: 'Heavy compound curl, allows progressive overload',
        priority: 2
      }
    ],
    tierA: [
      {
        name: 'Incline Dumbbell Curl',
        aliases: ['Incline Curl', 'Incline DB Curl'],
        equipment: 'dumbbell',
        reason: 'Long head emphasis due to shoulder extension',
        priority: 3
      },
      {
        name: 'Hammer Curl',
        aliases: ['Dumbbell Hammer Curl', 'Neutral Grip Curl'],
        equipment: 'dumbbell',
        reason: 'Brachialis and brachioradialis development',
        priority: 4
      },
      {
        name: 'Cable Curl',
        aliases: ['Cable Bicep Curl'],
        equipment: 'cable',
        reason: 'Constant tension throughout ROM',
        priority: 5
      }
    ],
    tierB: [
      {
        name: 'Preacher Curl',
        aliases: ['EZ Bar Preacher Curl', 'Machine Preacher Curl'],
        equipment: 'barbell/machine',
        reason: '2024 research: Inferior to Bayesian curls for hypertrophy',
        research: 'Still valid for peak contraction work',
        priority: 6
      },
      {
        name: 'Concentration Curl',
        aliases: ['Dumbbell Concentration Curl'],
        equipment: 'dumbbell',
        reason: 'Peak contraction isolation',
        research: 'EMG studies show high activation but limited by low load capacity',
        priority: 7
      }
    ]
  },

  BACK: {
    tierS: [
      {
        name: 'Pull-up',
        aliases: ['Pull-Up', 'Wide Grip Pull-Up', 'Pullup'],
        equipment: 'bodyweight',
        type: 'vertical',
        reason: 'Jeff Nippard 2024: UPGRADED TO S-TIER. More full-body tension, harder to cheat than pulldowns',
        research: 'Nippard experiment 2024: Pull-ups > Lat Pulldowns for overall back development',
        priority: 1
      },
      {
        name: 'Barbell Row',
        aliases: ['Bent Over Row', 'Barbell Bent Over Row', 'BB Row'],
        equipment: 'barbell',
        type: 'horizontal',
        reason: 'Heavy horizontal pull, targets mid-back, traps, lats',
        priority: 2
      },
      {
        name: 'Deadlift',
        aliases: ['Conventional Deadlift', 'Barbell Deadlift'],
        equipment: 'barbell',
        type: 'hinge',
        reason: 'Full posterior chain development',
        priority: 3
      }
    ],
    tierA: [
      {
        name: 'Cable Row',
        aliases: ['Seated Cable Row', 'Cable Seated Row'],
        equipment: 'cable',
        type: 'horizontal',
        reason: 'Constant tension horizontal pull',
        priority: 4
      },
      {
        name: 'T-Bar Row',
        aliases: ['T Bar Row', 'Landmine Row'],
        equipment: 'barbell',
        type: 'horizontal',
        reason: 'Heavy horizontal pull variant, mid-back emphasis',
        priority: 5
      },
      {
        name: 'Dumbbell Row',
        aliases: ['One Arm Dumbbell Row', 'Single Arm DB Row', 'DB Row'],
        equipment: 'dumbbell',
        type: 'horizontal',
        reason: 'Unilateral horizontal pull',
        priority: 6
      },
      {
        name: 'Face Pull',
        aliases: ['Cable Face Pull', 'Rope Face Pull'],
        equipment: 'cable',
        type: 'horizontal',
        reason: 'Rear delt + shoulder health exercise (essential for push/pull balance)',
        priority: 7
      }
    ],
    tierB: [
      {
        name: 'Lat Pulldown',
        aliases: ['Lat Pull Down', 'Wide Grip Lat Pulldown'],
        equipment: 'cable/machine',
        type: 'vertical',
        reason: '2024 research: Inferior to pull-ups but good for progression/volume',
        research: 'Use as assistance or for beginners working toward pull-ups',
        priority: 8
      },
      {
        name: 'Shrugs',
        aliases: ['Barbell Shrug', 'Dumbbell Shrug'],
        equipment: 'barbell/dumbbell',
        type: 'isolation',
        reason: 'Trap isolation',
        priority: 9
      },
      {
        name: 'Reverse Flyes',
        aliases: ['Rear Delt Flyes', 'Reverse Fly'],
        equipment: 'dumbbell/cable',
        type: 'isolation',
        reason: 'Rear delt isolation',
        priority: 10
      }
    ]
  },

  SHOULDERS: {
    tierS: [
      {
        name: 'Overhead Press',
        aliases: ['Military Press', 'Barbell Overhead Press', 'OHP', 'Standing Press'],
        equipment: 'barbell',
        reason: 'Primary shoulder compound, full deltoid activation',
        priority: 1
      },
      {
        name: 'Dumbbell Shoulder Press',
        aliases: ['DB Shoulder Press', 'Seated Dumbbell Press', 'Arnold Press'],
        equipment: 'dumbbell',
        reason: 'Natural movement path, unilateral stability',
        priority: 2
      }
    ],
    tierA: [
      {
        name: 'Lateral Raise',
        aliases: ['Dumbbell Lateral Raise', 'Side Raise', 'DB Lateral Raise'],
        equipment: 'dumbbell',
        reason: 'Medial deltoid isolation (essential for shoulder width)',
        priority: 3
      },
      {
        name: 'Face Pull',
        aliases: ['Cable Face Pull', 'Rope Face Pull'],
        equipment: 'cable',
        reason: 'Rear delt + rotator cuff health',
        priority: 4
      },
      {
        name: 'Upright Row',
        aliases: ['Barbell Upright Row', 'Cable Upright Row'],
        equipment: 'barbell/cable',
        reason: 'Trap + medial delt compound (use with caution for shoulder health)',
        priority: 5
      }
    ],
    tierB: [
      {
        name: 'Front Raise',
        aliases: ['Dumbbell Front Raise', 'Barbell Front Raise'],
        equipment: 'dumbbell/barbell',
        reason: 'Anterior deltoid isolation (often unnecessary if pressing volume is high)',
        priority: 6
      },
      {
        name: 'Reverse Flyes',
        aliases: ['Rear Delt Fly', 'Pec Deck Reverse'],
        equipment: 'dumbbell/machine',
        reason: 'Rear delt isolation',
        priority: 7
      }
    ]
  },

  LEGS_QUADS: {
    tierS: [
      {
        name: 'Barbell Squat',
        aliases: ['Back Squat', 'Squat', 'High Bar Squat', 'Low Bar Squat'],
        equipment: 'barbell',
        reason: 'King of leg exercises - 74% MVC quads, 52% glutes, 43% hamstrings',
        research: 'EMG studies show highest overall leg activation',
        priority: 1
      },
      {
        name: 'Front Squat',
        aliases: ['Barbell Front Squat'],
        equipment: 'barbell',
        reason: 'Quad emphasis, upright torso',
        priority: 2
      },
      {
        name: 'Bulgarian Split Squat',
        aliases: ['Split Squat', 'Rear Foot Elevated Split Squat'],
        equipment: 'dumbbell/barbell',
        reason: 'Unilateral quad + glute development, addresses imbalances',
        priority: 3
      }
    ],
    tierA: [
      {
        name: 'Leg Press',
        aliases: ['Machine Leg Press', '45 Degree Leg Press'],
        equipment: 'machine',
        reason: 'High quad volume without CNS fatigue',
        priority: 4
      },
      {
        name: 'Hack Squat',
        aliases: ['Machine Hack Squat'],
        equipment: 'machine',
        reason: 'Quad-focused squat variant',
        priority: 5
      },
      {
        name: 'Lunges',
        aliases: ['Walking Lunge', 'Dumbbell Lunge', 'Barbell Lunge'],
        equipment: 'dumbbell/barbell',
        reason: 'Unilateral leg development',
        priority: 6
      }
    ],
    tierB: [
      {
        name: 'Leg Extension',
        aliases: ['Machine Leg Extension'],
        equipment: 'machine',
        reason: 'Quad isolation finishing exercise',
        priority: 7
      }
    ]
  },

  LEGS_HAMSTRINGS: {
    tierS: [
      {
        name: 'Romanian Deadlift',
        aliases: ['RDL', 'Barbell RDL', 'Dumbbell RDL'],
        equipment: 'barbell/dumbbell',
        reason: 'Primary hamstring + glute hip-hinge movement',
        priority: 1
      },
      {
        name: 'Conventional Deadlift',
        aliases: ['Deadlift', 'Barbell Deadlift'],
        equipment: 'barbell',
        reason: 'Full posterior chain (hamstrings, glutes, back)',
        priority: 2
      }
    ],
    tierA: [
      {
        name: 'Leg Curl',
        aliases: ['Lying Leg Curl', 'Seated Leg Curl', 'Machine Leg Curl'],
        equipment: 'machine',
        reason: 'Hamstring isolation',
        priority: 3
      },
      {
        name: 'Good Morning',
        aliases: ['Barbell Good Morning'],
        equipment: 'barbell',
        reason: 'Hip-hinge hamstring + lower back',
        priority: 4
      }
    ],
    tierB: [
      {
        name: 'Glute Ham Raise',
        aliases: ['GHR', 'Nordic Curl'],
        equipment: 'bodyweight',
        reason: 'Advanced hamstring eccentric exercise',
        priority: 5
      }
    ]
  },

  LEGS_GLUTES: {
    tierS: [
      {
        name: 'Hip Thrust',
        aliases: ['Barbell Hip Thrust', 'Glute Bridge'],
        equipment: 'barbell',
        reason: '106% MVIC gluteus maximus activation',
        research: '2024 EMG study: Highest glute activation of all exercises',
        priority: 1
      },
      {
        name: 'Romanian Deadlift',
        aliases: ['RDL', 'Barbell RDL'],
        equipment: 'barbell',
        reason: 'Glute + hamstring hip-hinge',
        priority: 2
      }
    ],
    tierA: [
      {
        name: 'Bulgarian Split Squat',
        aliases: ['Split Squat', 'Rear Foot Elevated Split Squat'],
        equipment: 'dumbbell',
        reason: 'High glute activation in unilateral pattern',
        priority: 3
      },
      {
        name: 'Step Up',
        aliases: ['Dumbbell Step Up', 'Barbell Step Up'],
        equipment: 'dumbbell/barbell',
        reason: '60%+ MVIC glute activation',
        priority: 4
      }
    ],
    tierB: [
      {
        name: 'Cable Pull Through',
        aliases: ['Cable Pull-Through'],
        equipment: 'cable',
        reason: 'Hip-hinge pattern teaching tool',
        priority: 5
      }
    ]
  },

  CALVES: {
    tierA: [
      {
        name: 'Standing Calf Raise',
        aliases: ['Machine Calf Raise', 'Barbell Calf Raise'],
        equipment: 'machine/barbell',
        reason: 'Gastrocnemius emphasis (straight leg)',
        priority: 1
      },
      {
        name: 'Seated Calf Raise',
        aliases: ['Machine Seated Calf Raise'],
        equipment: 'machine',
        reason: 'Soleus emphasis (bent knee)',
        priority: 2
      }
    ]
  }
};

/**
 * Equipment Priority (Jeff Nippard 2024)
 * Freeweights > Cables > Machines
 */
export const EQUIPMENT_PRIORITY_2024 = {
  barbell: 1,      // Highest priority - allows heaviest loads
  dumbbell: 2,     // Second - unilateral work, natural movement
  bodyweight: 3,   // Third - fundamental movements
  cable: 4,        // Fourth - constant tension, good for isolation
  machine: 5       // Lowest priority - use sparingly (Jeff Nippard avoided machines in 2024)
};

/**
 * Get exercise tier (S/A/B) based on 2024 research
 */
export function getExerciseTier2024(exerciseName, muscleGroup) {
  const muscleGroupUpper = muscleGroup.toUpperCase().replace(/\s+/g, '_');
  const hierarchy = EXERCISE_HIERARCHY_2024[muscleGroupUpper];

  if (!hierarchy) return 'B'; // Default to tier B if not found

  // Check each tier
  for (const tier of ['tierS', 'tierA', 'tierB']) {
    const exercises = hierarchy[tier] || [];
    const found = exercises.find(ex =>
      ex.name.toLowerCase() === exerciseName.toLowerCase() ||
      ex.aliases?.some(alias => alias.toLowerCase() === exerciseName.toLowerCase())
    );

    if (found) {
      return tier.replace('tier', ''); // Return 'S', 'A', or 'B'
    }
  }

  return 'B'; // Default to tier B if not found
}

/**
 * Get equipment priority score (lower is better)
 */
export function getEquipmentPriority(equipment) {
  const equipmentLower = equipment?.toLowerCase() || '';

  // Check for equipment type in string
  if (equipmentLower.includes('barbell')) return EQUIPMENT_PRIORITY_2024.barbell;
  if (equipmentLower.includes('dumbbell')) return EQUIPMENT_PRIORITY_2024.dumbbell;
  if (equipmentLower.includes('bodyweight') || equipmentLower.includes('body weight')) return EQUIPMENT_PRIORITY_2024.bodyweight;
  if (equipmentLower.includes('cable')) return EQUIPMENT_PRIORITY_2024.cable;
  if (equipmentLower.includes('machine')) return EQUIPMENT_PRIORITY_2024.machine;

  return 99; // Unknown equipment gets lowest priority
}

/**
 * Get all exercises for a muscle group sorted by 2024 research priority
 */
export function getExercisesByPriority(muscleGroup, allExercises) {
  const muscleGroupUpper = muscleGroup.toUpperCase().replace(/\s+/g, '_');
  const hierarchy = EXERCISE_HIERARCHY_2024[muscleGroupUpper];

  if (!hierarchy) return allExercises;

  // Create priority map
  const priorityMap = new Map();

  ['tierS', 'tierA', 'tierB'].forEach(tier => {
    const exercises = hierarchy[tier] || [];
    exercises.forEach(ex => {
      priorityMap.set(ex.name.toLowerCase(), ex.priority);
      ex.aliases?.forEach(alias => {
        priorityMap.set(alias.toLowerCase(), ex.priority);
      });
    });
  });

  // Sort exercises by priority, then by equipment priority
  return allExercises.sort((a, b) => {
    const aPriority = priorityMap.get(a.name.toLowerCase()) || 999;
    const bPriority = priorityMap.get(b.name.toLowerCase()) || 999;

    if (aPriority !== bPriority) {
      return aPriority - bPriority; // Lower priority number = higher ranking
    }

    // If same research priority, sort by equipment priority
    return getEquipmentPriority(a.equipment) - getEquipmentPriority(b.equipment);
  });
}

export default EXERCISE_HIERARCHY_2024;
