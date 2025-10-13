/**
 * CHEST EXERCISES - CURATED LIST
 * Based on user requirements: Equipment variants within each exercise
 */

import { Exercise, Equipment, MuscleGroup, ExerciseCategory } from './enhancedExerciseSchema';

export const chestExercises: Exercise[] = [
  // ========================================
  // 1. BENCH PRESS (Flat)
  // ========================================
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: ExerciseCategory.CHEST_HORIZONTAL_PRESS,

    muscleGroups: {
      primary: [MuscleGroup.CHEST, MuscleGroup.CHEST_MIDDLE],
      secondary: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS_FRONT],
      stabilizers: [MuscleGroup.SHOULDERS_REAR, MuscleGroup.BACK_RHOMBOIDS]
    },

    // Equipment variants - User selects during workout
    variants: [
      {
        equipment: Equipment.BARBELL,
        difficulty: 'intermediate',
        instructions: {
          setupAdjustments: [
            'Grip bar slightly wider than shoulder width',
            'Bar should be directly above eyes when lying down'
          ],
          executionAdjustments: [
            'Lower bar to mid-chest in controlled manner',
            'Bar path should be slightly diagonal (not straight up/down)'
          ]
        },
        pros: ['Most weight can be lifted', 'Builds overall strength', 'Easy to track progress'],
        cons: ['Requires spotter for safety', 'Less range of motion than dumbbells', 'Fixed bar path']
      },
      {
        equipment: Equipment.DUMBBELL,
        difficulty: 'intermediate',
        instructions: {
          setupAdjustments: [
            'Hold dumbbells with neutral or slightly pronated grip',
            'Kick dumbbells up to starting position (one leg at a time)'
          ],
          executionAdjustments: [
            'Lower dumbbells to sides of chest (deeper stretch)',
            'Press up and slightly inward (dumbbells closer at top)',
            'Keep dumbbells level throughout movement'
          ]
        },
        pros: ['Greater range of motion', 'Better chest stretch', 'Corrects strength imbalances', 'No spotter needed'],
        cons: ['Less total weight', 'Harder to get into position', 'Requires more stabilization']
      },
      {
        equipment: Equipment.SMITH_MACHINE,
        difficulty: 'beginner',
        instructions: {
          setupAdjustments: [
            'Position bench so bar path crosses mid-chest',
            'Twist bar to unhook from safety catches'
          ],
          executionAdjustments: [
            'Bar follows fixed vertical path',
            'Can safely go to failure without spotter',
            'Twist bar to re-hook at any point'
          ]
        },
        pros: ['Very safe (can rack anywhere)', 'No spotter needed', 'Easier to learn', 'Good for drop sets'],
        cons: ['Unnatural fixed bar path', 'Less core/stabilizer activation', 'May cause shoulder strain']
      },
      {
        equipment: Equipment.CABLE,
        difficulty: 'intermediate',
        instructions: {
          setupAdjustments: [
            'Set cables at low position',
            'Lie on bench between two cable stacks',
            'Grab handles with pronated grip'
          ],
          executionAdjustments: [
            'Press handles up and together',
            'Squeeze chest at top of movement',
            'Constant tension throughout rep'
          ]
        },
        pros: ['Constant tension on chest', 'Great muscle activation', 'Unique stimulus'],
        cons: ['Requires specific equipment setup', 'Less weight than barbell', 'Setup is awkward']
      },
      {
        equipment: Equipment.MACHINE,
        difficulty: 'beginner',
        instructions: {
          setupAdjustments: [
            'Adjust seat height so handles align with mid-chest',
            'Back should be flat against pad'
          ],
          executionAdjustments: [
            'Push handles forward until arms extended',
            'Squeeze chest at top',
            'Return with control'
          ]
        },
        pros: ['Very beginner-friendly', 'No balance required', 'Safe to failure', 'Easy to use'],
        cons: ['Fixed movement path', 'Less functional strength', 'Limited range of motion']
      }
    ],
    defaultVariant: Equipment.BARBELL,

    // Base instructions (apply to all variants)
    instructions: {
      setup: [
        'Lie flat on bench with feet firmly planted on floor',
        'Squeeze shoulder blades together and down (retracted)',
        'Maintain natural arch in lower back',
        'Grip width should allow forearms vertical at bottom position'
      ],
      execution: [
        'Unrack weight and position over chest',
        'Lower weight under control to chest (2-3 seconds)',
        'Touch chest lightly (don\'t bounce)',
        'Press weight back up explosively',
        'Keep shoulder blades retracted throughout',
        'Lock out arms at top without losing shoulder position'
      ],
      breathing: 'Inhale during descent, hold briefly at bottom, exhale forcefully during press',
      commonMistakes: [
        'Bouncing weight off chest (injury risk)',
        'Flaring elbows out 90 degrees (shoulder impingement)',
        'Lifting butt off bench (invalidates lift)',
        'Not full range of motion (ego lifting)',
        'Losing shoulder blade retraction (shoulder injury risk)',
        'Bar path too vertical instead of slight arc'
      ],
      safetyTips: [
        'Always use spotter for barbell near failure',
        'Use safety bars/pins when training alone',
        'Keep wrists straight, not bent back',
        'Warm up thoroughly with lighter sets',
        'Stop immediately if you feel shoulder pain',
        'Don\'t lift more than you can control'
      ]
    },

    nsca: {
      sets: { strength: '4-6 sets', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: '1-5 reps', hypertrophy: '6-12 reps', endurance: '12-20 reps' },
      rest: { strength: 300, hypertrophy: 120, endurance: 60 }
    },

    media: {
      demonstrationVideo: '',
      demonstrationGif: '',
      formImages: []
    },

    progressionPath: {
      easier: ['push-ups', 'machine-chest-press'],
      harder: ['pause-bench-press', 'close-grip-bench-press'],
      alternatives: ['incline-bench-press', 'dumbbell-bench-press']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 2. INCLINE BENCH PRESS
  // ========================================
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: ExerciseCategory.CHEST_INCLINE_PRESS,

    muscleGroups: {
      primary: [MuscleGroup.CHEST_UPPER, MuscleGroup.CHEST],
      secondary: [MuscleGroup.SHOULDERS_FRONT, MuscleGroup.TRICEPS],
      stabilizers: [MuscleGroup.BACK_RHOMBOIDS]
    },

    variants: [
      {
        equipment: Equipment.BARBELL,
        difficulty: 'intermediate',
        pros: ['Best for upper chest mass', 'Heavy loading possible'],
        cons: ['Requires spotter', 'More shoulder involvement']
      },
      {
        equipment: Equipment.DUMBBELL,
        difficulty: 'intermediate',
        pros: ['Greater ROM', 'Better stretch', 'No spotter needed'],
        cons: ['Less weight', 'Harder to position']
      },
      {
        equipment: Equipment.SMITH_MACHINE,
        difficulty: 'beginner',
        pros: ['Safe', 'No spotter needed'],
        cons: ['Fixed path may strain shoulders']
      },
      {
        equipment: Equipment.CABLE,
        difficulty: 'intermediate',
        pros: ['Constant tension', 'Unique angle'],
        cons: ['Complex setup']
      },
      {
        equipment: Equipment.MACHINE,
        difficulty: 'beginner',
        pros: ['Easy to use', 'Safe'],
        cons: ['Fixed path']
      }
    ],
    defaultVariant: Equipment.DUMBBELL,

    instructions: {
      setup: [
        'Set bench to 30-45 degree angle (optimal for upper chest)',
        'Lie back with feet flat on floor',
        'Retract shoulder blades',
        'Position weight above upper chest'
      ],
      execution: [
        'Lower weight to upper chest (near collarbone)',
        'Keep elbows at 45-degree angle',
        'Press up and slightly back',
        'Don\'t lock out completely at top'
      ],
      breathing: 'Inhale on descent, exhale on press',
      commonMistakes: [
        'Bench angle too steep (>45°) - becomes shoulder press',
        'Bouncing weight off chest',
        'Flaring elbows too wide',
        'Not touching chest (partial reps)'
      ],
      safetyTips: [
        'Use spotter for heavy barbell sets',
        'Don\'t go above 45° incline',
        'Warm up shoulders thoroughly',
        'Keep lower back on bench'
      ]
    },

    nsca: {
      sets: { strength: '4-6 sets', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: '3-6 reps', hypertrophy: '6-12 reps', endurance: '12-20 reps' },
      rest: { strength: 300, hypertrophy: 120, endurance: 60 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['incline-push-ups', 'machine-incline-press'],
      harder: ['close-grip-incline-press'],
      alternatives: ['bench-press', 'landmine-press']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 3. DECLINE BENCH PRESS
  // ========================================
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    category: ExerciseCategory.CHEST_DECLINE_PRESS,

    muscleGroups: {
      primary: [MuscleGroup.CHEST_LOWER, MuscleGroup.CHEST],
      secondary: [MuscleGroup.TRICEPS],
      stabilizers: []
    },

    variants: [
      {
        equipment: Equipment.BARBELL,
        difficulty: 'intermediate',
        pros: ['Heaviest decline variation', 'Lower chest focus'],
        cons: ['Needs spotter', 'Awkward setup']
      },
      {
        equipment: Equipment.DUMBBELL,
        difficulty: 'intermediate',
        pros: ['Better ROM', 'Safer alone'],
        cons: ['Hard to get into position']
      }
    ],
    defaultVariant: Equipment.BARBELL,

    instructions: {
      setup: [
        'Set bench to 15-30 degree decline',
        'Hook feet under pads for stability',
        'Lie back carefully (blood rushes to head)',
        'Have spotter help unrack'
      ],
      execution: [
        'Lower bar to lower chest',
        'Press up toward face/eyes (not straight up)',
        'Keep elbows tucked',
        'Full lockout at top'
      ],
      breathing: 'Breathe normally, avoid holding breath (blood pressure)',
      commonMistakes: [
        'Too steep decline angle',
        'Bar drifting toward neck (dangerous)',
        'Lifting without spotter'
      ],
      safetyTips: [
        'Always use spotter',
        'Don\'t go too steep (injury risk)',
        'Be careful getting in/out of position',
        'Avoid if you have high blood pressure'
      ]
    },

    nsca: {
      sets: { strength: '3-5 sets', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: '4-6 reps', hypertrophy: '6-12 reps', endurance: '12-20 reps' },
      rest: { strength: 240, hypertrophy: 90, endurance: 60 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['bench-press', 'dips'],
      harder: ['weighted-dips'],
      alternatives: ['dips', 'cable-crossover-low-to-high']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 4. PEC FLY
  // ========================================
  {
    id: 'pec-fly',
    name: 'Pec Fly',
    category: ExerciseCategory.CHEST_FLY,

    muscleGroups: {
      primary: [MuscleGroup.CHEST],
      secondary: [MuscleGroup.SHOULDERS_FRONT],
      stabilizers: [MuscleGroup.BICEPS]
    },

    variants: [
      {
        equipment: Equipment.DUMBBELL,
        difficulty: 'intermediate',
        instructions: {
          setupAdjustments: ['Lie flat on bench', 'Hold dumbbells above chest with slight bend in elbows'],
          executionAdjustments: ['Lower dumbbells in wide arc', 'Feel stretch in chest', 'Bring back up in same arc']
        },
        pros: ['Great chest stretch', 'Good muscle activation'],
        cons: ['Heavy weight can strain shoulders', 'Requires good form']
      },
      {
        equipment: Equipment.CABLE,
        difficulty: 'beginner',
        instructions: {
          setupAdjustments: ['Set cables at shoulder height', 'Stand in center with handles'],
          executionAdjustments: ['Bring handles together in front of chest', 'Squeeze at peak contraction']
        },
        pros: ['Constant tension', 'Very safe', 'Great for beginners'],
        cons: ['Less stretch than dumbbells']
      },
      {
        equipment: Equipment.MACHINE,
        difficulty: 'beginner',
        instructions: {
          setupAdjustments: ['Adjust seat so handles at chest height', 'Back flat against pad'],
          executionAdjustments: ['Bring handles together', 'Squeeze chest', 'Control the return']
        },
        pros: ['Very safe', 'Easy to learn', 'Good for drop sets'],
        cons: ['Fixed movement path']
      }
    ],
    defaultVariant: Equipment.CABLE,

    instructions: {
      setup: [
        'Position yourself for selected equipment',
        'Maintain slight bend in elbows throughout',
        'Chest up, shoulders back'
      ],
      execution: [
        'Open arms wide in arc motion (like hugging tree)',
        'Feel deep stretch in chest',
        'Bring hands together, squeeze chest hard',
        'Control the negative'
      ],
      breathing: 'Inhale as arms open, exhale as you squeeze together',
      commonMistakes: [
        'Bending elbows too much (becomes a press)',
        'Using too much weight (shoulder injury)',
        'Not getting full stretch',
        'Bouncing at bottom'
      ],
      safetyTips: [
        'Keep elbows slightly bent (not locked)',
        'Don\'t go too heavy',
        'Stop if shoulders hurt',
        'Control the stretch (don\'t force it)'
      ]
    },

    nsca: {
      sets: { strength: 'N/A', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: 'N/A', hypertrophy: '8-15 reps', endurance: '15-25 reps' },
      rest: { strength: 0, hypertrophy: 90, endurance: 45 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['machine-pec-fly'],
      harder: ['cable-fly-various-angles'],
      alternatives: ['cable-crossover', 'push-ups']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 5. CABLE CROSSOVER
  // ========================================
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    category: ExerciseCategory.CHEST_CROSSOVER,

    muscleGroups: {
      primary: [MuscleGroup.CHEST],
      secondary: [MuscleGroup.SHOULDERS_FRONT],
      stabilizers: [MuscleGroup.ABS, MuscleGroup.SHOULDERS_REAR]
    },

    variants: [
      {
        equipment: Equipment.CABLE,
        difficulty: 'beginner',
        instructions: {
          setupAdjustments: [
            'Set cables at high position for HIGH-TO-LOW (lower chest)',
            'OR middle position for MIDDLE (overall chest)',
            'OR low position for LOW-TO-HIGH (upper chest)'
          ]
        },
        pros: ['Constant tension', 'Hit different chest angles', 'Great pump'],
        cons: ['Requires cable machine']
      }
    ],
    defaultVariant: Equipment.CABLE,

    // Style variants for different angles
    styleVariants: [
      {
        name: 'High to Low',
        description: 'Cables start high, cross down to hips',
        muscleEmphasis: 'Lower chest emphasis',
        difficulty: 'same'
      },
      {
        name: 'Middle (Straight Across)',
        description: 'Cables at shoulder height, cross at chest level',
        muscleEmphasis: 'Overall chest, most common',
        difficulty: 'same'
      },
      {
        name: 'Low to High',
        description: 'Cables start low, cross up toward face',
        muscleEmphasis: 'Upper chest emphasis',
        difficulty: 'same'
      }
    ],

    instructions: {
      setup: [
        'Set cable pulleys to desired height',
        'Grab handles with palms facing forward',
        'Step forward with staggered stance',
        'Lean slightly forward from hips',
        'Arms extended but elbows slightly bent'
      ],
      execution: [
        'Pull handles together in arc motion',
        'Cross hands past each other at midline',
        'Squeeze chest hard at peak contraction (1-2 sec hold)',
        'Slowly return to starting position',
        'Feel stretch in chest at end range'
      ],
      breathing: 'Exhale as hands come together, inhale as arms open',
      commonMistakes: [
        'Using too much weight (poor form)',
        'Bending elbows too much',
        'Not crossing past midline',
        'Rushing the negative',
        'Standing too upright (use forward lean)'
      ],
      safetyTips: [
        'Start light to master form',
        'Keep core tight for stability',
        'Don\'t let arms go behind plane of body',
        'Control the weight (don\'t let it pull you)'
      ]
    },

    nsca: {
      sets: { strength: 'N/A', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: 'N/A', hypertrophy: '10-15 reps', endurance: '15-25 reps' },
      rest: { strength: 0, hypertrophy: 90, endurance: 45 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['machine-pec-fly'],
      harder: ['single-arm-cable-crossover'],
      alternatives: ['pec-fly', 'push-ups']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 6. PUSH-UPS
  // ========================================
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: ExerciseCategory.CHEST_HORIZONTAL_PRESS,

    muscleGroups: {
      primary: [MuscleGroup.CHEST],
      secondary: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS_FRONT],
      stabilizers: [MuscleGroup.ABS, MuscleGroup.BACK_LOWER]
    },

    variants: [
      {
        equipment: Equipment.BODYWEIGHT,
        difficulty: 'beginner',
        pros: ['No equipment needed', 'Functional strength', 'Core activation'],
        cons: ['Limited progressive overload', 'Can become too easy']
      }
    ],
    defaultVariant: Equipment.BODYWEIGHT,

    // Different push-up variations
    styleVariants: [
      {
        name: 'Standard',
        description: 'Hands shoulder-width, body straight',
        muscleEmphasis: 'Overall chest and triceps',
        difficulty: 'same'
      },
      {
        name: 'Wide Grip',
        description: 'Hands wider than shoulders',
        muscleEmphasis: 'More chest, less triceps',
        difficulty: 'easier'
      },
      {
        name: 'Close Grip / Diamond',
        description: 'Hands close together forming diamond',
        muscleEmphasis: 'Heavy triceps emphasis',
        difficulty: 'harder'
      },
      {
        name: 'Decline (Feet Elevated)',
        description: 'Feet on bench, hands on floor',
        muscleEmphasis: 'Upper chest emphasis',
        difficulty: 'harder'
      },
      {
        name: 'Incline (Hands Elevated)',
        description: 'Hands on bench, feet on floor',
        muscleEmphasis: 'Lower chest, easier variation',
        difficulty: 'easier'
      },
      {
        name: 'Archer Push-Up',
        description: 'One arm does most work, other assists',
        muscleEmphasis: 'Unilateral strength',
        difficulty: 'harder'
      },
      {
        name: 'Plyometric / Clap',
        description: 'Explosive push, clap at top',
        muscleEmphasis: 'Power and explosiveness',
        difficulty: 'harder'
      }
    ],

    instructions: {
      setup: [
        'Start in plank position',
        'Hands slightly wider than shoulders',
        'Body forms straight line from head to heels',
        'Core engaged, glutes tight',
        'Feet together or slightly apart'
      ],
      execution: [
        'Lower body as one unit toward floor',
        'Keep elbows at 45-degree angle (not flared)',
        'Chest should nearly touch floor',
        'Push back up explosively',
        'Maintain straight body line throughout',
        'Don\'t let hips sag or pike up'
      ],
      breathing: 'Inhale on the way down, exhale on the way up',
      commonMistakes: [
        'Hips sagging (weak core)',
        'Butt in air (not engaging properly)',
        'Partial range of motion',
        'Flaring elbows out 90 degrees',
        'Head dropping or looking up',
        'Hands too far forward'
      ],
      safetyTips: [
        'Keep core tight entire time',
        'If form breaks down, stop or do easier variation',
        'Start on knees if full push-ups too hard',
        'Gradually increase range of motion',
        'Don\'t push through shoulder pain'
      ]
    },

    nsca: {
      sets: { strength: '3-5 sets', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: '5-10 reps', hypertrophy: '10-20 reps', endurance: '20-50 reps' },
      rest: { strength: 180, hypertrophy: 90, endurance: 30 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['incline-push-ups', 'knee-push-ups'],
      harder: ['decline-push-ups', 'weighted-push-ups', 'one-arm-push-ups'],
      alternatives: ['bench-press', 'dips']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ========================================
  // 7. DIPS
  // ========================================
  {
    id: 'dips',
    name: 'Dips',
    category: ExerciseCategory.CHEST_DECLINE_PRESS,

    muscleGroups: {
      primary: [MuscleGroup.CHEST_LOWER, MuscleGroup.TRICEPS],
      secondary: [MuscleGroup.SHOULDERS_FRONT],
      stabilizers: [MuscleGroup.ABS, MuscleGroup.BACK]
    },

    variants: [
      {
        equipment: Equipment.BODYWEIGHT,
        difficulty: 'intermediate',
        pros: ['Builds serious strength', 'Functional movement', 'Hits chest and triceps'],
        cons: ['Difficult for beginners', 'Can strain shoulders']
      }
    ],
    defaultVariant: Equipment.BODYWEIGHT,

    styleVariants: [
      {
        name: 'Chest Dips',
        description: 'Lean forward, wider grip, elbows flared',
        muscleEmphasis: 'More chest activation',
        difficulty: 'same'
      },
      {
        name: 'Tricep Dips',
        description: 'Upright torso, narrow grip, elbows tucked',
        muscleEmphasis: 'More tricep activation',
        difficulty: 'same'
      }
    ],

    instructions: {
      setup: [
        'Grab parallel bars with straight arms',
        'For CHEST version: Lean forward 20-30 degrees',
        'For TRICEP version: Stay more upright',
        'Cross legs behind you',
        'Engage core and shoulders'
      ],
      execution: [
        'Lower body by bending elbows',
        'Go down until upper arms parallel to floor (or slightly below)',
        'For chest: let elbows flare out, lean forward more',
        'For triceps: keep elbows tucked, stay upright',
        'Push back up to starting position',
        'Don\'t lock out completely at top'
      ],
      breathing: 'Inhale going down, exhale pressing up',
      commonMistakes: [
        'Going too deep (shoulder injury risk)',
        'Shrugging shoulders up to ears',
        'Bouncing at bottom',
        'Incomplete range of motion',
        'Swinging legs for momentum'
      ],
      safetyTips: [
        'Warm up shoulders thoroughly',
        'Use assisted dip machine if too hard',
        'Don\'t go below 90-degree elbow angle if shoulders hurt',
        'Add weight only when you can do 15+ clean reps',
        'Stop if you feel shoulder pain'
      ]
    },

    nsca: {
      sets: { strength: '3-5 sets', hypertrophy: '3-4 sets', endurance: '2-3 sets' },
      reps: { strength: '4-8 reps', hypertrophy: '8-15 reps', endurance: '15-25 reps' },
      rest: { strength: 240, hypertrophy: 120, endurance: 60 }
    },

    media: { formImages: [] },

    progressionPath: {
      easier: ['assisted-dips', 'bench-dips'],
      harder: ['weighted-dips'],
      alternatives: ['decline-bench-press', 'close-grip-bench']
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to get exercise by ID
export function getChestExerciseById(id: string): Exercise | undefined {
  return chestExercises.find(ex => ex.id === id);
}

// Helper function to get exercises by equipment
export function getChestExercisesByEquipment(equipment: Equipment): Exercise[] {
  return chestExercises.filter(ex =>
    ex.variants.some(v => v.equipment === equipment)
  );
}
