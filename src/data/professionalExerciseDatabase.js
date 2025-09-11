// Professional Exercise Database Structure
// Similar to professional fitness databases and apps

export const exerciseCategories = {
  muscleGroups: [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques',
    'Lower Back', 'Traps', 'Lats', 'Rhomboids', 'Hip Flexors', 'Adductors'
  ],
  
  equipment: [
    'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell',
    'Resistance Band', 'Medicine Ball', 'TRX', 'Smith Machine', 'EZ Bar',
    'Trap Bar', 'Swiss Ball', 'Bosu Ball', 'Battle Ropes', 'Sled'
  ],
  
  movementPatterns: [
    'Push', 'Pull', 'Squat', 'Hinge', 'Lunge', 'Carry', 'Core', 'Isolation'
  ],
  
  difficulty: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  
  exerciseType: ['Compound', 'Isolation', 'Olympic', 'Plyometric', 'Isometric'],
  
  force: ['Push', 'Pull', 'Static'],
  
  mechanics: ['Compound', 'Isolation']
};

export const professionalExerciseDatabase = [
  // CHEST EXERCISES
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    alternateNames: ['Bench Press', 'Flat Bench Press'],
    category: 'Chest',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Push',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Front Deltoids'],
    instructions: {
      setup: [
        'Lie flat on bench with eyes directly under the barbell',
        'Plant feet firmly on the floor',
        'Arch back slightly while keeping glutes on bench',
        'Grip bar with hands slightly wider than shoulder-width'
      ],
      execution: [
        'Unrack the bar and position it above your chest',
        'Lower the bar with control to your mid-chest',
        'Touch chest lightly without bouncing',
        'Press the bar back up to starting position',
        'Keep elbows at 45-75 degree angle from torso'
      ],
      breathing: [
        'Inhale as you lower the bar',
        'Exhale forcefully as you press up'
      ]
    },
    commonMistakes: [
      'Bouncing bar off chest',
      'Flaring elbows too wide',
      'Lifting hips off bench',
      'Not maintaining tight upper back'
    ],
    variations: [
      'Incline Barbell Press',
      'Decline Barbell Press',
      'Close-Grip Bench Press',
      'Wide-Grip Bench Press',
      'Paused Bench Press'
    ],
    progressions: {
      beginner: 'Push-Ups',
      intermediate: 'Barbell Bench Press',
      advanced: 'Bench Press with Chains/Bands',
      expert: 'Competition Bench Press'
    },
    repRanges: {
      strength: '3-5 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/bench-press.mp4',
    imageUrl: 'https://example.com/bench-press.jpg',
    animationType: 'bench-press'
  },
  
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    alternateNames: ['Incline DB Press'],
    category: 'Chest',
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Push',
    primaryMuscles: ['Upper Chest'],
    secondaryMuscles: ['Triceps', 'Front Deltoids'],
    instructions: {
      setup: [
        'Set bench to 30-45 degree incline',
        'Sit on bench with dumbbells on thighs',
        'Kick weights up to shoulder level as you lie back',
        'Position dumbbells at chest level with palms forward'
      ],
      execution: [
        'Press dumbbells up and slightly inward',
        'Stop just short of locking out elbows',
        'Lower weights with control to sides of upper chest',
        'Feel stretch in chest at bottom position'
      ],
      breathing: [
        'Inhale on the descent',
        'Exhale on the press'
      ]
    },
    commonMistakes: [
      'Setting incline too high (becomes shoulder exercise)',
      'Allowing weights to drift too far apart',
      'Not controlling the negative',
      'Hyperextending lower back'
    ],
    variations: [
      'Alternating Incline Press',
      'Neutral Grip Incline Press',
      'Single-Arm Incline Press'
    ],
    progressions: {
      beginner: 'Incline Push-Ups',
      intermediate: 'Incline Dumbbell Press',
      advanced: 'Incline Press with Pause',
      expert: 'Heavy Incline Press with Tempo'
    },
    repRanges: {
      strength: '4-6 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/incline-db-press.mp4',
    imageUrl: 'https://example.com/incline-db-press.jpg',
    animationType: 'bench-press'
  },

  {
    id: 'cable-fly',
    name: 'Cable Fly',
    alternateNames: ['Cable Crossover', 'Standing Cable Fly'],
    category: 'Chest',
    equipment: 'Cable',
    difficulty: 'Beginner',
    force: 'Push',
    mechanics: 'Isolation',
    movementPattern: 'Push',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Front Deltoids'],
    instructions: {
      setup: [
        'Set cables to chest height',
        'Grab handles and step forward',
        'Lean slightly forward at hips',
        'Keep slight bend in elbows'
      ],
      execution: [
        'Bring hands together in wide arc',
        'Squeeze chest at peak contraction',
        'Return to starting position with control',
        'Maintain constant tension on chest'
      ],
      breathing: [
        'Inhale as arms go back',
        'Exhale as you bring hands together'
      ]
    },
    commonMistakes: [
      'Using too much weight',
      'Bending elbows too much',
      'Not maintaining forward lean',
      'Rushing the movement'
    ],
    variations: [
      'High Cable Fly',
      'Low Cable Fly',
      'Single-Arm Cable Fly',
      'Decline Cable Fly'
    ],
    progressions: {
      beginner: 'Cable Fly',
      intermediate: 'Cable Fly with Pause',
      advanced: 'Cable Fly Drop Sets',
      expert: 'Cable Fly 21s'
    },
    repRanges: {
      strength: 'Not recommended for strength',
      hypertrophy: '12-15 reps',
      endurance: '20+ reps'
    },
    videoUrl: 'https://example.com/cable-fly.mp4',
    imageUrl: 'https://example.com/cable-fly.jpg',
    animationType: 'cable-fly'
  },

  // BACK EXERCISES
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    alternateNames: ['Deadlift', 'Standard Deadlift'],
    category: 'Back',
    equipment: 'Barbell',
    difficulty: 'Advanced',
    force: 'Pull',
    mechanics: 'Compound',
    movementPattern: 'Hinge',
    primaryMuscles: ['Lower Back', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Traps', 'Lats', 'Quads', 'Forearms', 'Core'],
    instructions: {
      setup: [
        'Stand with feet hip-width apart',
        'Toes under the barbell, shins close to bar',
        'Bend at hips and knees to grip bar',
        'Use overhand or mixed grip just outside legs',
        'Keep back straight, chest up, shoulders back'
      ],
      execution: [
        'Take deep breath and brace core',
        'Drive through heels to lift bar',
        'Keep bar close to body throughout',
        'Extend hips and knees simultaneously',
        'Stand tall with shoulders back at top',
        'Reverse movement with control'
      ],
      breathing: [
        'Big breath before lifting',
        'Hold breath during lift (Valsalva)',
        'Exhale at the top'
      ]
    },
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Hyperextending at top',
      'Not engaging lats',
      'Squatting instead of hinging'
    ],
    variations: [
      'Sumo Deadlift',
      'Romanian Deadlift',
      'Trap Bar Deadlift',
      'Deficit Deadlift',
      'Rack Pulls'
    ],
    progressions: {
      beginner: 'Kettlebell Deadlift',
      intermediate: 'Conventional Deadlift',
      advanced: 'Deficit Deadlift',
      expert: 'Deadlift with Bands/Chains'
    },
    repRanges: {
      strength: '1-5 reps',
      hypertrophy: '6-8 reps',
      endurance: '10+ reps (with lighter weight)'
    },
    videoUrl: 'https://example.com/deadlift.mp4',
    imageUrl: 'https://example.com/deadlift.jpg',
    animationType: 'deadlift'
  },

  {
    id: 'pull-up',
    name: 'Pull-Up',
    alternateNames: ['Overhand Pull-Up'],
    category: 'Back',
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    force: 'Pull',
    mechanics: 'Compound',
    movementPattern: 'Pull',
    primaryMuscles: ['Lats', 'Middle Back'],
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Rhomboids'],
    instructions: {
      setup: [
        'Hang from bar with overhand grip',
        'Hands slightly wider than shoulders',
        'Engage core and glutes',
        'Cross ankles behind you if desired'
      ],
      execution: [
        'Pull body up by driving elbows down',
        'Continue until chin clears the bar',
        'Squeeze shoulder blades together at top',
        'Lower with control to full arm extension',
        'Avoid swinging or kipping'
      ],
      breathing: [
        'Exhale as you pull up',
        'Inhale as you lower down'
      ]
    },
    commonMistakes: [
      'Not using full range of motion',
      'Swinging or using momentum',
      'Not engaging back muscles',
      'Pulling with arms only'
    ],
    variations: [
      'Wide-Grip Pull-Up',
      'Chin-Up',
      'Neutral Grip Pull-Up',
      'Weighted Pull-Up',
      'L-Sit Pull-Up'
    ],
    progressions: {
      beginner: 'Assisted Pull-Up',
      intermediate: 'Pull-Up',
      advanced: 'Weighted Pull-Up',
      expert: 'One-Arm Pull-Up Progression'
    },
    repRanges: {
      strength: '3-5 reps (weighted)',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/pull-up.mp4',
    imageUrl: 'https://example.com/pull-up.jpg',
    animationType: 'pull-up'
  },

  {
    id: 'barbell-row',
    name: 'Bent-Over Barbell Row',
    alternateNames: ['Barbell Row', 'Bent Row'],
    category: 'Back',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Pull',
    mechanics: 'Compound',
    movementPattern: 'Pull',
    primaryMuscles: ['Middle Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Traps'],
    instructions: {
      setup: [
        'Stand with feet hip-width apart',
        'Hinge forward at hips to 45-degree angle',
        'Keep knees slightly bent',
        'Grip bar with overhand grip, hands shoulder-width',
        'Keep back straight and core engaged'
      ],
      execution: [
        'Pull bar to lower chest/upper abdomen',
        'Drive elbows back and up',
        'Squeeze shoulder blades together at top',
        'Lower bar with control',
        'Maintain hip angle throughout'
      ],
      breathing: [
        'Exhale as you pull',
        'Inhale as you lower'
      ]
    },
    commonMistakes: [
      'Using momentum/jerking',
      'Standing too upright',
      'Rounding the back',
      'Not pulling high enough',
      'Using biceps too much'
    ],
    variations: [
      'Underhand Barbell Row',
      'Pendlay Row',
      'T-Bar Row',
      'Yates Row',
      'Seal Row'
    ],
    progressions: {
      beginner: 'Dumbbell Row',
      intermediate: 'Barbell Row',
      advanced: 'Pendlay Row',
      expert: 'Barbell Row with Pause'
    },
    repRanges: {
      strength: '5-6 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/barbell-row.mp4',
    imageUrl: 'https://example.com/barbell-row.jpg',
    animationType: 'row'
  },

  // LEG EXERCISES
  {
    id: 'back-squat',
    name: 'Back Squat',
    alternateNames: ['Barbell Back Squat', 'Squat'],
    category: 'Legs',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Squat',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Lower Back'],
    instructions: {
      setup: [
        'Position bar on upper traps (high bar) or rear delts (low bar)',
        'Stand with feet shoulder-width apart',
        'Toes slightly pointed outward',
        'Grip bar wider than shoulders',
        'Unrack and step back'
      ],
      execution: [
        'Take deep breath and brace core',
        'Initiate by pushing hips back',
        'Descend until thighs parallel or below',
        'Keep knees tracking over toes',
        'Drive through heels to stand',
        'Squeeze glutes at top'
      ],
      breathing: [
        'Deep breath before descent',
        'Hold during movement',
        'Exhale after passing sticking point'
      ]
    },
    commonMistakes: [
      'Knees caving inward',
      'Heels coming up',
      'Excessive forward lean',
      'Not hitting depth',
      'Butt wink at bottom'
    ],
    variations: [
      'Front Squat',
      'Box Squat',
      'Pause Squat',
      'Goblet Squat',
      'Bulgarian Split Squat'
    ],
    progressions: {
      beginner: 'Bodyweight Squat',
      intermediate: 'Back Squat',
      advanced: 'Pause Squat',
      expert: 'Squat with Bands/Chains'
    },
    repRanges: {
      strength: '1-5 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/back-squat.mp4',
    imageUrl: 'https://example.com/back-squat.jpg',
    animationType: 'squat'
  },

  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    alternateNames: ['RDL', 'Stiff-Leg Deadlift'],
    category: 'Legs',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Pull',
    mechanics: 'Compound',
    movementPattern: 'Hinge',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Traps'],
    instructions: {
      setup: [
        'Hold bar at hip level with overhand grip',
        'Stand with feet hip-width apart',
        'Keep slight bend in knees',
        'Shoulders back, chest up'
      ],
      execution: [
        'Push hips back while lowering bar',
        'Keep bar close to legs',
        'Lower until feel stretch in hamstrings',
        'Drive hips forward to return',
        'Squeeze glutes at top'
      ],
      breathing: [
        'Inhale as you lower',
        'Exhale as you lift'
      ]
    },
    commonMistakes: [
      'Bending knees too much',
      'Rounding the back',
      'Bar drifting away from legs',
      'Not feeling hamstring stretch',
      'Hyperextending at top'
    ],
    variations: [
      'Single-Leg RDL',
      'Dumbbell RDL',
      'Deficit RDL',
      'Snatch-Grip RDL',
      'Trap Bar RDL'
    ],
    progressions: {
      beginner: 'Dumbbell RDL',
      intermediate: 'Barbell RDL',
      advanced: 'Deficit RDL',
      expert: 'Single-Leg RDL'
    },
    repRanges: {
      strength: '5-6 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/rdl.mp4',
    imageUrl: 'https://example.com/rdl.jpg',
    animationType: 'romanian-deadlift'
  },

  {
    id: 'leg-press',
    name: 'Leg Press',
    alternateNames: ['Machine Leg Press', '45-Degree Leg Press'],
    category: 'Legs',
    equipment: 'Machine',
    difficulty: 'Beginner',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Squat',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    instructions: {
      setup: [
        'Sit on leg press with back flat against backrest',
        'Place feet shoulder-width apart on platform',
        'Position feet at mid-platform height',
        'Release safety handles'
      ],
      execution: [
        'Lower platform by bending knees',
        'Descend until knees at 90 degrees',
        'Press through heels to extend legs',
        'Stop just short of locking knees',
        'Control the negative'
      ],
      breathing: [
        'Inhale as you lower',
        'Exhale as you press'
      ]
    },
    commonMistakes: [
      'Placing feet too low',
      'Knees caving inward',
      'Not using full range of motion',
      'Locking knees at top',
      'Lower back rounding'
    ],
    variations: [
      'Single-Leg Press',
      'Wide Stance Press',
      'Close Stance Press',
      'Calf Press on Leg Press'
    ],
    progressions: {
      beginner: 'Leg Press',
      intermediate: 'Heavy Leg Press',
      advanced: 'Single-Leg Press',
      expert: 'Leg Press Drop Sets'
    },
    repRanges: {
      strength: '6-8 reps',
      hypertrophy: '10-15 reps',
      endurance: '20+ reps'
    },
    videoUrl: 'https://example.com/leg-press.mp4',
    imageUrl: 'https://example.com/leg-press.jpg',
    animationType: 'leg-press'
  },

  // SHOULDER EXERCISES
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    alternateNames: ['Military Press', 'Shoulder Press'],
    category: 'Shoulders',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Push',
    primaryMuscles: ['Front Deltoids', 'Side Deltoids'],
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    instructions: {
      setup: [
        'Stand with feet shoulder-width apart',
        'Grip bar just outside shoulders',
        'Rest bar on front delts/upper chest',
        'Keep elbows slightly forward',
        'Engage core and glutes'
      ],
      execution: [
        'Press bar straight up',
        'Move head back slightly as bar passes face',
        'Push head through once bar clears',
        'Lock out arms overhead',
        'Lower with control to starting position'
      ],
      breathing: [
        'Deep breath before press',
        'Exhale forcefully as you press'
      ]
    },
    commonMistakes: [
      'Excessive back arch',
      'Pressing forward instead of up',
      'Not engaging core',
      'Using leg drive',
      'Flaring elbows too wide'
    ],
    variations: [
      'Seated Overhead Press',
      'Dumbbell Overhead Press',
      'Push Press',
      'Behind-the-Neck Press',
      'Z Press'
    ],
    progressions: {
      beginner: 'Dumbbell Shoulder Press',
      intermediate: 'Overhead Press',
      advanced: 'Push Press',
      expert: 'Overhead Press with Chains'
    },
    repRanges: {
      strength: '3-5 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/overhead-press.mp4',
    imageUrl: 'https://example.com/overhead-press.jpg',
    animationType: 'shoulder-press'
  },

  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    alternateNames: ['Side Raise', 'Side Lateral Raise'],
    category: 'Shoulders',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    force: 'Pull',
    mechanics: 'Isolation',
    movementPattern: 'Isolation',
    primaryMuscles: ['Side Deltoids'],
    secondaryMuscles: ['Front Deltoids', 'Traps'],
    instructions: {
      setup: [
        'Stand with feet hip-width apart',
        'Hold dumbbells at sides',
        'Keep slight bend in elbows',
        'Lean forward slightly'
      ],
      execution: [
        'Raise weights out to sides',
        'Lead with elbows, not hands',
        'Lift until arms parallel to floor',
        'Pause briefly at top',
        'Lower with control'
      ],
      breathing: [
        'Exhale as you raise',
        'Inhale as you lower'
      ]
    },
    commonMistakes: [
      'Using momentum',
      'Going too heavy',
      'Shrugging shoulders',
      'Not controlling negative',
      'Arms going too high'
    ],
    variations: [
      'Cable Lateral Raise',
      'Seated Lateral Raise',
      'Bent-Over Lateral Raise',
      'Machine Lateral Raise'
    ],
    progressions: {
      beginner: 'Light Lateral Raise',
      intermediate: 'Lateral Raise',
      advanced: 'Lateral Raise Drop Sets',
      expert: 'Lateral Raise 21s'
    },
    repRanges: {
      strength: 'Not ideal for strength',
      hypertrophy: '12-15 reps',
      endurance: '20+ reps'
    },
    videoUrl: 'https://example.com/lateral-raise.mp4',
    imageUrl: 'https://example.com/lateral-raise.jpg',
    animationType: 'lateral-raise'
  },

  // ARM EXERCISES
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    alternateNames: ['Standing Barbell Curl', 'Bicep Curl'],
    category: 'Arms',
    equipment: 'Barbell',
    difficulty: 'Beginner',
    force: 'Pull',
    mechanics: 'Isolation',
    movementPattern: 'Isolation',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    instructions: {
      setup: [
        'Stand with feet hip-width apart',
        'Hold bar with underhand grip',
        'Arms fully extended',
        'Keep elbows at sides'
      ],
      execution: [
        'Curl bar toward shoulders',
        'Keep elbows stationary',
        'Squeeze biceps at top',
        'Lower with control',
        'Don\'t swing or use momentum'
      ],
      breathing: [
        'Exhale as you curl',
        'Inhale as you lower'
      ]
    },
    commonMistakes: [
      'Swinging the weight',
      'Moving elbows forward',
      'Leaning back',
      'Not using full range',
      'Going too heavy'
    ],
    variations: [
      'EZ Bar Curl',
      'Wide-Grip Curl',
      'Close-Grip Curl',
      'Preacher Curl',
      'Drag Curl'
    ],
    progressions: {
      beginner: 'Dumbbell Curl',
      intermediate: 'Barbell Curl',
      advanced: 'Barbell 21s',
      expert: 'Strict Curl'
    },
    repRanges: {
      strength: '6-8 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/barbell-curl.mp4',
    imageUrl: 'https://example.com/barbell-curl.jpg',
    animationType: 'curl'
  },

  {
    id: 'close-grip-bench',
    name: 'Close-Grip Bench Press',
    alternateNames: ['CGBP', 'Tricep Bench Press'],
    category: 'Arms',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    force: 'Push',
    mechanics: 'Compound',
    movementPattern: 'Push',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Chest', 'Front Deltoids'],
    instructions: {
      setup: [
        'Lie on bench like regular bench press',
        'Grip bar with hands shoulder-width or closer',
        'Keep elbows tucked close to body',
        'Plant feet firmly on floor'
      ],
      execution: [
        'Lower bar to lower chest',
        'Keep elbows close to torso',
        'Press bar up focusing on triceps',
        'Lock out arms at top',
        'Control the descent'
      ],
      breathing: [
        'Inhale as you lower',
        'Exhale as you press'
      ]
    },
    commonMistakes: [
      'Grip too narrow (wrist strain)',
      'Elbows flaring out',
      'Bouncing off chest',
      'Not using full range',
      'Arching back excessively'
    ],
    variations: [
      'Dumbbell Close-Grip Press',
      'Smith Machine Close-Grip',
      'Floor Press',
      'Board Press'
    ],
    progressions: {
      beginner: 'Diamond Push-Ups',
      intermediate: 'Close-Grip Bench',
      advanced: 'CGBP with Chains',
      expert: 'CGBP with Slingshot'
    },
    repRanges: {
      strength: '3-5 reps',
      hypertrophy: '8-12 reps',
      endurance: '15+ reps'
    },
    videoUrl: 'https://example.com/close-grip-bench.mp4',
    imageUrl: 'https://example.com/close-grip-bench.jpg',
    animationType: 'bench-press'
  },

  // CORE EXERCISES
  {
    id: 'plank',
    name: 'Plank',
    alternateNames: ['Front Plank', 'Forearm Plank'],
    category: 'Core',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    force: 'Static',
    mechanics: 'Isolation',
    movementPattern: 'Core',
    primaryMuscles: ['Abs', 'Core'],
    secondaryMuscles: ['Shoulders', 'Back', 'Glutes'],
    instructions: {
      setup: [
        'Start in push-up position on forearms',
        'Elbows directly under shoulders',
        'Feet hip-width apart',
        'Body in straight line from head to heels'
      ],
      execution: [
        'Engage core and glutes',
        'Keep hips level with shoulders',
        'Maintain neutral spine',
        'Breathe normally',
        'Hold for prescribed time'
      ],
      breathing: [
        'Breathe normally throughout',
        'Don\'t hold breath'
      ]
    },
    commonMistakes: [
      'Hips sagging',
      'Hips too high',
      'Not engaging core',
      'Holding breath',
      'Looking up (neck strain)'
    ],
    variations: [
      'High Plank',
      'Side Plank',
      'Plank with Leg Lift',
      'Plank Jacks',
      'RKC Plank'
    ],
    progressions: {
      beginner: 'Modified Plank (knees)',
      intermediate: 'Plank',
      advanced: 'Weighted Plank',
      expert: 'Plank Complex'
    },
    repRanges: {
      strength: '30-60 seconds',
      hypertrophy: '45-90 seconds',
      endurance: '2+ minutes'
    },
    videoUrl: 'https://example.com/plank.mp4',
    imageUrl: 'https://example.com/plank.jpg',
    animationType: 'plank'
  },

  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    alternateNames: ['HLR', 'Hanging Knee Raise'],
    category: 'Core',
    equipment: 'Bodyweight',
    difficulty: 'Advanced',
    force: 'Pull',
    mechanics: 'Isolation',
    movementPattern: 'Core',
    primaryMuscles: ['Lower Abs', 'Hip Flexors'],
    secondaryMuscles: ['Obliques', 'Grip'],
    instructions: {
      setup: [
        'Hang from pull-up bar',
        'Arms fully extended',
        'Engage core',
        'Keep body still'
      ],
      execution: [
        'Raise legs to horizontal',
        'Keep legs straight if possible',
        'Control the movement',
        'Lower legs slowly',
        'Avoid swinging'
      ],
      breathing: [
        'Exhale as you raise legs',
        'Inhale as you lower'
      ]
    },
    commonMistakes: [
      'Using momentum',
      'Swinging body',
      'Not controlling descent',
      'Limited range of motion',
      'Grip failing before abs'
    ],
    variations: [
      'Bent-Knee Raise',
      'L-Sit',
      'Toes-to-Bar',
      'Windshield Wipers',
      'Dragon Flag'
    ],
    progressions: {
      beginner: 'Knee Raise',
      intermediate: 'Straight Leg Raise',
      advanced: 'Toes-to-Bar',
      expert: 'Weighted Leg Raise'
    },
    repRanges: {
      strength: '5-8 reps',
      hypertrophy: '10-15 reps',
      endurance: '20+ reps'
    },
    videoUrl: 'https://example.com/hanging-leg-raise.mp4',
    imageUrl: 'https://example.com/hanging-leg-raise.jpg',
    animationType: 'leg-raise'
  }
];

// Helper functions for filtering and searching
export const getExercisesByMuscle = (muscle) => {
  return professionalExerciseDatabase.filter(exercise => 
    exercise.primaryMuscles.includes(muscle) || 
    exercise.secondaryMuscles.includes(muscle)
  );
};

export const getExercisesByEquipment = (equipment) => {
  return professionalExerciseDatabase.filter(exercise => 
    exercise.equipment === equipment
  );
};

export const getExercisesByDifficulty = (difficulty) => {
  return professionalExerciseDatabase.filter(exercise => 
    exercise.difficulty === difficulty
  );
};

export const getExercisesByMovementPattern = (pattern) => {
  return professionalExerciseDatabase.filter(exercise => 
    exercise.movementPattern === pattern
  );
};

export const searchExercises = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return professionalExerciseDatabase.filter(exercise => 
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.alternateNames.some(name => name.toLowerCase().includes(lowercaseQuery)) ||
    exercise.category.toLowerCase().includes(lowercaseQuery) ||
    exercise.equipment.toLowerCase().includes(lowercaseQuery) ||
    exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery))
  );
};

export const getExerciseById = (id) => {
  return professionalExerciseDatabase.find(exercise => exercise.id === id);
};

export const getRelatedExercises = (exerciseId) => {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return [];
  
  // Find exercises with similar muscle groups or movement patterns
  return professionalExerciseDatabase.filter(e => 
    e.id !== exerciseId && (
      e.primaryMuscles.some(muscle => exercise.primaryMuscles.includes(muscle)) ||
      e.movementPattern === exercise.movementPattern
    )
  ).slice(0, 5);
};

export default professionalExerciseDatabase;