export const exerciseDatabase = {
  chest: [
    {
      id: 'bench-press',
      name: 'Barbell Bench Press',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
      primaryMuscle: 'Chest',
      animationType: 'bench-press',
      instructions: [
        'Lie flat on a bench with eyes under the bar',
        'Grip the bar with hands slightly wider than shoulder-width',
        'Keep feet flat on the floor and maintain natural arch in lower back',
        'Lower the bar to chest level with control',
        'Press the bar back up to starting position',
        'Keep elbows at 45-degree angle from body'
      ],
      tips: 'Keep shoulder blades pulled back and down. Maintain tight core throughout.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'push-ups',
      name: 'Push-Ups',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      targetMuscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
      primaryMuscle: 'Chest',
      animationType: 'push-up',
      instructions: [
        'Start in plank position with hands shoulder-width apart',
        'Keep body in straight line from head to heels',
        'Lower body until chest nearly touches the floor',
        'Push back up to starting position',
        'Keep core engaged throughout movement'
      ],
      tips: 'Keep elbows close to body for more tricep engagement, wider for chest.',
      sets: '3-4',
      reps: '10-20'
    },
    {
      id: 'dumbbell-flyes',
      name: 'Dumbbell Flyes',
      equipment: 'Dumbbells',
      difficulty: 'Intermediate',
      targetMuscles: ['Chest'],
      primaryMuscle: 'Chest',
      animationType: 'fly',
      instructions: [
        'Lie on bench holding dumbbells above chest',
        'Lower weights out to sides with slight bend in elbows',
        'Feel stretch in chest at bottom position',
        'Bring dumbbells back together in arc motion',
        'Squeeze chest at top of movement'
      ],
      tips: 'Keep slight bend in elbows throughout. Don\'t let weights go too low.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'incline-press',
      name: 'Incline Dumbbell Press',
      equipment: 'Dumbbells',
      difficulty: 'Intermediate',
      targetMuscles: ['Upper Chest', 'Shoulders', 'Triceps'],
      primaryMuscle: 'Upper Chest',
      animationType: 'bench-press',
      instructions: [
        'Set bench to 30-45 degree incline',
        'Hold dumbbells at chest level with palms forward',
        'Press weights up and together over upper chest',
        'Lower with control back to starting position',
        'Keep natural arch in lower back'
      ],
      tips: 'Don\'t set incline too high or shoulders take over.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'cable-crossover',
      name: 'Cable Crossover',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      targetMuscles: ['Chest', 'Front Delts'],
      primaryMuscle: 'Chest',
      animationType: 'cable-fly',
      instructions: [
        'Set cables at chest height or slightly above',
        'Step forward with staggered stance',
        'Bring handles together in front with slight elbow bend',
        'Squeeze chest at peak contraction',
        'Return to starting position with control'
      ],
      tips: 'Focus on the squeeze at the center. Keep core tight.',
      sets: '3-4',
      reps: '12-15'
    },
    {
      id: 'decline-press',
      name: 'Decline Bench Press',
      equipment: 'Barbell',
      difficulty: 'Advanced',
      targetMuscles: ['Lower Chest', 'Triceps'],
      primaryMuscle: 'Lower Chest',
      animationType: 'bench-press',
      instructions: [
        'Secure feet and lie on decline bench',
        'Grip bar slightly wider than shoulder-width',
        'Lower bar to lower chest with control',
        'Press back up to starting position',
        'Keep shoulder blades retracted'
      ],
      tips: 'Great for targeting lower chest. Use spotter for safety.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'chest-dips',
      name: 'Chest Dips',
      equipment: 'Dip Bars',
      difficulty: 'Intermediate',
      targetMuscles: ['Lower Chest', 'Triceps', 'Front Delts'],
      primaryMuscle: 'Lower Chest',
      animationType: 'dip',
      instructions: [
        'Support body on dip bars with arms extended',
        'Lean forward slightly to target chest',
        'Lower body until shoulders are below elbows',
        'Push back up focusing on chest squeeze',
        'Control the movement throughout'
      ],
      tips: 'More forward lean = more chest. Stay upright for triceps.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'chest-press-machine',
      name: 'Chest Press Machine',
      equipment: 'Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Chest', 'Triceps'],
      primaryMuscle: 'Chest',
      animationType: 'bench-press',
      instructions: [
        'Sit on machine with back flat against pad',
        'Grip handles at chest level',
        'Press handles forward until arms are extended',
        'Control the weight back to starting position',
        'Keep shoulders back and down'
      ],
      tips: 'Great for beginners to learn the movement pattern safely.',
      sets: '3-4',
      reps: '10-15'
    }
  ],
  
  back: [
    {
      id: 'pull-ups',
      name: 'Pull-Ups',
      equipment: 'Pull-up Bar',
      difficulty: 'Advanced',
      targetMuscles: ['Lats', 'Biceps', 'Middle Back', 'Shoulders'],
      primaryMuscle: 'Lats',
      animationType: 'pull-up',
      instructions: [
        'Hang from bar with overhand grip, hands shoulder-width apart',
        'Pull body up until chin clears the bar',
        'Focus on pulling with back muscles, not just arms',
        'Lower with control to full arm extension',
        'Keep core engaged to prevent swinging'
      ],
      tips: 'Use assisted pull-up machine or bands if needed. Full range of motion is key.',
      sets: '3-4',
      reps: '5-12'
    },
    {
      id: 'bent-row',
      name: 'Bent-Over Barbell Row',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Middle Back', 'Lats', 'Biceps', 'Rear Delts'],
      primaryMuscle: 'Middle Back',
      animationType: 'row',
      instructions: [
        'Stand with feet hip-width apart, knees slightly bent',
        'Hinge at hips to 45-degree angle, keeping back straight',
        'Hold bar with overhand grip, arms extended',
        'Pull bar to lower chest/upper abdomen',
        'Squeeze shoulder blades together at top',
        'Lower with control'
      ],
      tips: 'Keep core tight and don\'t round your back. Pull elbows back, not out.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'lat-pulldown',
      name: 'Lat Pulldown',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Lats', 'Biceps', 'Middle Back'],
      primaryMuscle: 'Lats',
      animationType: 'lat-pulldown',
      instructions: [
        'Sit at lat pulldown machine with thighs secured',
        'Grab bar with wide overhand grip',
        'Pull bar down to upper chest while leaning slightly back',
        'Focus on pulling with lats, not arms',
        'Control the weight back up to starting position'
      ],
      tips: 'Don\'t pull bar behind neck. Think about pulling elbows down and back.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      equipment: 'Barbell',
      difficulty: 'Advanced',
      targetMuscles: ['Lower Back', 'Glutes', 'Hamstrings', 'Traps'],
      primaryMuscle: 'Lower Back',
      animationType: 'deadlift',
      instructions: [
        'Stand with feet hip-width apart, bar over mid-foot',
        'Bend at hips and knees to grip bar',
        'Keep back straight, chest up, shoulders back',
        'Drive through heels to lift bar, extending hips and knees',
        'Stand tall with shoulders back at top',
        'Lower bar with control by pushing hips back first'
      ],
      tips: 'Keep bar close to body throughout. Never round your back.',
      sets: '3-5',
      reps: '5-8'
    },
    {
      id: 'cable-row',
      name: 'Seated Cable Row',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Middle Back', 'Lats', 'Biceps'],
      primaryMuscle: 'Middle Back',
      animationType: 'cable-row',
      instructions: [
        'Sit at cable row station with feet on footplates',
        'Grab handle with both hands, arms extended',
        'Pull handle to lower chest/upper abdomen',
        'Squeeze shoulder blades together at peak',
        'Return to start with control, getting full stretch'
      ],
      tips: 'Keep back straight, don\'t lean too far back. Focus on back muscles.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 't-bar-row',
      name: 'T-Bar Row',
      equipment: 'T-Bar',
      difficulty: 'Intermediate',
      targetMuscles: ['Middle Back', 'Lats', 'Rhomboids'],
      primaryMuscle: 'Middle Back',
      animationType: 'row',
      instructions: [
        'Stand over T-bar with feet hip-width apart',
        'Bend knees slightly and hinge at hips',
        'Grip handles and keep chest up',
        'Pull bar toward chest, squeezing shoulder blades',
        'Lower with control to full arm extension'
      ],
      tips: 'Keep core tight and back neutral. Don\'t use momentum.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'chin-ups',
      name: 'Chin-Ups',
      equipment: 'Pull-up Bar',
      difficulty: 'Intermediate',
      targetMuscles: ['Lats', 'Biceps', 'Middle Back'],
      primaryMuscle: 'Lats',
      animationType: 'pull-up',
      instructions: [
        'Hang from bar with underhand grip, hands shoulder-width',
        'Pull body up until chin clears the bar',
        'Focus on using back and biceps together',
        'Lower with control to full extension',
        'Keep core engaged to prevent swinging'
      ],
      tips: 'Easier than pull-ups due to bicep involvement. Great for beginners.',
      sets: '3-4',
      reps: '5-12'
    },
    {
      id: 'single-arm-row',
      name: 'Single Arm Dumbbell Row',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Lats', 'Middle Back', 'Biceps'],
      primaryMuscle: 'Lats',
      animationType: 'row',
      instructions: [
        'Place one knee and hand on bench for support',
        'Hold dumbbell in free hand',
        'Pull dumbbell to hip, squeezing shoulder blade',
        'Lower weight with control',
        'Complete reps then switch sides'
      ],
      tips: 'Keep back straight and avoid rotating torso.',
      sets: '3-4',
      reps: '10-12 each arm'
    }
  ],
  
  legs: [
    {
      id: 'squat',
      name: 'Barbell Back Squat',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
      primaryMuscle: 'Quadriceps',
      animationType: 'squat',
      instructions: [
        'Position bar on upper back, not neck',
        'Stand with feet shoulder-width apart, toes slightly out',
        'Initiate movement by pushing hips back',
        'Lower until thighs are parallel to floor',
        'Drive through heels to return to standing',
        'Keep knees tracking over toes'
      ],
      tips: 'Keep chest up and core braced. Don\'t let knees cave inward.',
      sets: '3-5',
      reps: '8-12'
    },
    {
      id: 'lunges',
      name: 'Walking Lunges',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
      primaryMuscle: 'Quadriceps',
      animationType: 'squat',
      instructions: [
        'Hold dumbbells at sides or barbell on back',
        'Step forward with one leg into lunge position',
        'Lower back knee toward ground',
        'Both knees should form 90-degree angles',
        'Push off front foot to step forward with other leg',
        'Continue alternating legs'
      ],
      tips: 'Keep torso upright. Don\'t let front knee go past toes.',
      sets: '3-4',
      reps: '10-12 each leg'
    },
    {
      id: 'leg-press',
      name: 'Leg Press',
      equipment: 'Leg Press Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
      primaryMuscle: 'Quadriceps',
      animationType: 'leg-press',
      instructions: [
        'Sit in leg press machine with back flat against backrest',
        'Place feet on platform shoulder-width apart',
        'Press weight up to release safety handles',
        'Lower platform by bending knees to 90 degrees',
        'Press through heels to return to starting position',
        'Don\'t lock knees at top'
      ],
      tips: 'Foot position changes emphasis: higher targets glutes, lower targets quads.',
      sets: '3-4',
      reps: '12-15'
    },
    {
      id: 'calf-raises',
      name: 'Standing Calf Raises',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Calves'],
      primaryMuscle: 'Calves',
      instructions: [
        'Stand with balls of feet on edge of platform',
        'Hold dumbbells at sides or use calf raise machine',
        'Rise up onto toes as high as possible',
        'Hold briefly at top, squeezing calves',
        'Lower heels below platform level for stretch',
        'Repeat with controlled motion'
      ],
      tips: 'Full range of motion is crucial. Pause at top and bottom.',
      sets: '3-4',
      reps: '15-20'
    },
    {
      id: 'leg-curl',
      name: 'Lying Leg Curl',
      equipment: 'Leg Curl Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Hamstrings'],
      primaryMuscle: 'Hamstrings',
      animationType: 'leg-curl',
      instructions: [
        'Lie face down on leg curl machine',
        'Position ankles under pads',
        'Curl heels toward glutes',
        'Squeeze hamstrings at top',
        'Lower with control to starting position',
        'Keep hips pressed to bench'
      ],
      tips: 'Don\'t let hips rise off bench. Control the negative.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'romanian-deadlift',
      name: 'Romanian Deadlift',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
      primaryMuscle: 'Hamstrings',
      animationType: 'romanian-deadlift',
      instructions: [
        'Hold bar at hip level with overhand grip',
        'Keep knees slightly bent throughout',
        'Push hips back while lowering bar',
        'Feel stretch in hamstrings',
        'Drive hips forward to return to start',
        'Keep bar close to legs throughout'
      ],
      tips: 'This is a hip hinge movement. Feel the stretch in hamstrings.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'bulgarian-split-squat',
      name: 'Bulgarian Split Squat',
      equipment: 'Dumbbells',
      difficulty: 'Intermediate',
      targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
      primaryMuscle: 'Quadriceps',
      instructions: [
        'Place rear foot on bench behind you',
        'Hold dumbbells at sides',
        'Lower into lunge position',
        'Front knee tracks over toes',
        'Push through front heel to stand',
        'Keep torso upright'
      ],
      tips: 'Great for addressing imbalances. Focus on front leg.',
      sets: '3-4',
      reps: '10-12 each leg'
    },
    {
      id: 'leg-extension',
      name: 'Leg Extension',
      equipment: 'Leg Extension Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Quadriceps'],
      primaryMuscle: 'Quadriceps',
      animationType: 'leg-extension',
      instructions: [
        'Sit on machine with back against backrest',
        'Position ankles behind lower pads',
        'Extend legs to full extension',
        'Squeeze quads at top',
        'Lower with control',
        'Don\'t lock knees hard at top'
      ],
      tips: 'Great isolation for quads. Control the negative portion.',
      sets: '3-4',
      reps: '12-15'
    }
  ],
  
  shoulders: [
    {
      id: 'overhead-press',
      name: 'Overhead Press',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Shoulders', 'Triceps', 'Core'],
      primaryMuscle: 'Shoulders',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Hold bar at shoulder level with overhand grip',
        'Press bar straight up overhead',
        'Lock arms at top without leaning back',
        'Lower bar with control to starting position',
        'Keep core engaged throughout'
      ],
      tips: 'Don\'t arch back excessively. Keep bar path straight.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'lateral-raises',
      name: 'Lateral Raises',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Side Delts'],
      primaryMuscle: 'Side Delts',
      animationType: 'lateral-raise',
      instructions: [
        'Stand with dumbbells at sides, palms facing body',
        'Keep slight bend in elbows',
        'Raise weights out to sides until arms are parallel to floor',
        'Pause briefly at top',
        'Lower with control',
        'Don\'t use momentum'
      ],
      tips: 'Lead with elbows, not hands. Keep weights in line with body.',
      sets: '3-4',
      reps: '12-15'
    },
    {
      id: 'face-pulls',
      name: 'Face Pulls',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Rear Delts', 'Upper Back', 'Rotator Cuff'],
      primaryMuscle: 'Rear Delts',
      instructions: [
        'Set cable at face height with rope attachment',
        'Step back with arms extended',
        'Pull rope to face, separating hands at end',
        'Focus on squeezing shoulder blades together',
        'Return to start with control'
      ],
      tips: 'Keep elbows high. This is great for shoulder health.',
      sets: '3-4',
      reps: '15-20'
    },
    {
      id: 'arnold-press',
      name: 'Arnold Press',
      equipment: 'Dumbbells',
      difficulty: 'Intermediate',
      targetMuscles: ['Front Delts', 'Side Delts', 'Triceps'],
      primaryMuscle: 'Shoulders',
      instructions: [
        'Start with dumbbells at shoulder level, palms facing you',
        'As you press up, rotate palms to face forward',
        'Press weights overhead',
        'Reverse the motion on the way down',
        'Get full rotation at bottom'
      ],
      tips: 'Named after Arnold Schwarzenegger. Great for overall shoulder development.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'upright-row',
      name: 'Upright Row',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Side Delts', 'Traps'],
      primaryMuscle: 'Side Delts',
      instructions: [
        'Hold bar with overhand grip, hands shoulder-width',
        'Pull bar straight up along body',
        'Lead with elbows, keeping them higher than hands',
        'Bring bar to chest level',
        'Lower with control'
      ],
      tips: 'Don\'t go too heavy. Can be hard on shoulders for some.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'rear-delt-fly',
      name: 'Rear Delt Fly',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Rear Delts'],
      primaryMuscle: 'Rear Delts',
      instructions: [
        'Bend forward at hips with slight knee bend',
        'Hold dumbbells hanging below chest',
        'Raise arms out to sides with slight elbow bend',
        'Squeeze shoulder blades at top',
        'Lower with control'
      ],
      tips: 'Keep core tight. Don\'t use momentum.',
      sets: '3-4',
      reps: '12-15'
    },
    {
      id: 'shrugs',
      name: 'Barbell Shrugs',
      equipment: 'Barbell',
      difficulty: 'Beginner',
      targetMuscles: ['Traps', 'Upper Back'],
      primaryMuscle: 'Traps',
      instructions: [
        'Hold barbell with overhand grip at thigh level',
        'Keep arms straight throughout movement',
        'Shrug shoulders up toward ears',
        'Hold briefly at top',
        'Lower shoulders slowly'
      ],
      tips: 'Don\'t roll shoulders - straight up and down motion.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'front-raises',
      name: 'Front Raises',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Front Delts', 'Core'],
      primaryMuscle: 'Front Delts',
      instructions: [
        'Hold dumbbells at sides with palms facing back',
        'Keep slight bend in elbows',
        'Raise one or both arms forward to shoulder height',
        'Pause briefly at top',
        'Lower with control'
      ],
      tips: 'Avoid using momentum - controlled movement is key.',
      sets: '3-4',
      reps: '10-12'
    }
  ],
  
  arms: [
    {
      id: 'bicep-curl',
      name: 'Dumbbell Bicep Curl',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Biceps'],
      primaryMuscle: 'Biceps',
      animationType: 'bicep-curl',
      instructions: [
        'Stand with dumbbells at sides, palms facing forward',
        'Keep elbows close to torso and stationary',
        'Curl weights toward shoulders',
        'Squeeze biceps at top of movement',
        'Lower with control to starting position',
        'Don\'t swing or use momentum'
      ],
      tips: 'Keep shoulders back and down. Full range of motion is key.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'hammer-curl',
      name: 'Hammer Curls',
      equipment: 'Dumbbells',
      difficulty: 'Beginner',
      targetMuscles: ['Biceps', 'Forearms'],
      primaryMuscle: 'Biceps',
      animationType: 'curl',
      instructions: [
        'Hold dumbbells with neutral grip (palms facing each other)',
        'Keep elbows stationary at sides',
        'Curl weights toward shoulders maintaining neutral grip',
        'Squeeze at top',
        'Lower with control'
      ],
      tips: 'Great for building bicep thickness and forearm strength.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'tricep-dips',
      name: 'Tricep Dips',
      equipment: 'Dip Bars',
      difficulty: 'Intermediate',
      targetMuscles: ['Triceps', 'Chest', 'Shoulders'],
      primaryMuscle: 'Triceps',
      animationType: 'dip',
      instructions: [
        'Support body on dip bars with arms extended',
        'Keep body upright to target triceps more',
        'Lower body by bending elbows to 90 degrees',
        'Push back up to starting position',
        'Keep elbows close to body'
      ],
      tips: 'Lean forward slightly to engage chest more. Use assistance if needed.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'overhead-extension',
      name: 'Overhead Tricep Extension',
      equipment: 'Dumbbell',
      difficulty: 'Beginner',
      targetMuscles: ['Triceps'],
      primaryMuscle: 'Triceps',
      instructions: [
        'Hold one dumbbell with both hands overhead',
        'Keep elbows close to head and pointing forward',
        'Lower weight behind head by bending elbows',
        'Extend arms back to starting position',
        'Keep upper arms stationary'
      ],
      tips: 'Don\'t let elbows flare out. Keep core engaged.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'barbell-curl',
      name: 'Barbell Curl',
      equipment: 'Barbell',
      difficulty: 'Beginner',
      targetMuscles: ['Biceps'],
      primaryMuscle: 'Biceps',
      animationType: 'curl',
      instructions: [
        'Stand with feet hip-width apart',
        'Hold bar with underhand grip, arms extended',
        'Curl bar toward chest',
        'Squeeze biceps at top',
        'Lower with control',
        'Keep elbows at sides'
      ],
      tips: 'Don\'t swing or lean back. Strict form builds bigger biceps.',
      sets: '3-4',
      reps: '8-12'
    },
    {
      id: 'cable-pushdown',
      name: 'Cable Tricep Pushdown',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      targetMuscles: ['Triceps'],
      primaryMuscle: 'Triceps',
      instructions: [
        'Stand at cable machine with rope or bar attachment',
        'Keep elbows tucked at sides',
        'Push weight down by extending forearms',
        'Squeeze triceps at bottom',
        'Return to start with control'
      ],
      tips: 'Keep elbows stationary. Focus on tricep contraction.',
      sets: '3-4',
      reps: '12-15'
    },
    {
      id: 'preacher-curl',
      name: 'Preacher Curl',
      equipment: 'EZ Bar',
      difficulty: 'Intermediate',
      targetMuscles: ['Biceps'],
      primaryMuscle: 'Biceps',
      animationType: 'curl',
      instructions: [
        'Sit at preacher bench with armpits at top of pad',
        'Hold EZ bar with underhand grip',
        'Lower bar with control until arms nearly straight',
        'Curl weight back up',
        'Squeeze at top'
      ],
      tips: 'Great for isolating biceps. Don\'t hyperextend at bottom.',
      sets: '3-4',
      reps: '10-12'
    },
    {
      id: 'close-grip-bench',
      name: 'Close-Grip Bench Press',
      equipment: 'Barbell',
      difficulty: 'Intermediate',
      targetMuscles: ['Triceps', 'Chest'],
      primaryMuscle: 'Triceps',
      instructions: [
        'Lie on bench with hands closer than shoulder-width',
        'Keep elbows tucked close to body',
        'Lower bar to lower chest',
        'Press back up focusing on triceps',
        'Don\'t let elbows flare out'
      ],
      tips: 'Great mass builder for triceps. Keep grip comfortable, not too close.',
      sets: '3-4',
      reps: '8-12'
    }
  ],
  
  core: [
    {
      id: 'plank',
      name: 'Plank',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      targetMuscles: ['Core', 'Shoulders', 'Back'],
      primaryMuscle: 'Core',
      animationType: 'plank',
      instructions: [
        'Start in push-up position on forearms',
        'Keep body in straight line from head to heels',
        'Engage core and glutes',
        'Hold position without letting hips sag or rise',
        'Breathe normally throughout hold'
      ],
      tips: 'Quality over duration. Stop when form breaks down.',
      sets: '3-4',
      reps: '30-60 seconds'
    },
    {
      id: 'crunches',
      name: 'Crunches',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      targetMuscles: ['Abs'],
      primaryMuscle: 'Abs',
      animationType: 'crunch',
      instructions: [
        'Lie on back with knees bent, feet flat on floor',
        'Place hands behind head or across chest',
        'Curl upper body toward knees using abs',
        'Don\'t pull on neck',
        'Lower with control',
        'Keep lower back pressed to floor'
      ],
      tips: 'Focus on using abs, not momentum. Small controlled movement.',
      sets: '3-4',
      reps: '15-25'
    },
    {
      id: 'russian-twists',
      name: 'Russian Twists',
      equipment: 'Medicine Ball',
      difficulty: 'Intermediate',
      targetMuscles: ['Obliques', 'Core'],
      primaryMuscle: 'Obliques',
      instructions: [
        'Sit with knees bent, feet slightly off ground',
        'Lean back to create V-shape with torso and thighs',
        'Hold weight with both hands',
        'Rotate torso side to side',
        'Keep chest up and core engaged'
      ],
      tips: 'Move from core, not arms. Keep back straight.',
      sets: '3-4',
      reps: '20-30 total'
    },
    {
      id: 'leg-raises',
      name: 'Hanging Leg Raises',
      equipment: 'Pull-up Bar',
      difficulty: 'Advanced',
      targetMuscles: ['Lower Abs', 'Hip Flexors'],
      primaryMuscle: 'Lower Abs',
      instructions: [
        'Hang from pull-up bar with arms extended',
        'Keep legs straight or slightly bent',
        'Raise legs until parallel to floor or higher',
        'Lower with control',
        'Don\'t swing or use momentum'
      ],
      tips: 'Start with knee raises if too difficult. Control is key.',
      sets: '3-4',
      reps: '10-15'
    },
    {
      id: 'bicycle-crunches',
      name: 'Bicycle Crunches',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      targetMuscles: ['Abs', 'Obliques'],
      primaryMuscle: 'Abs',
      instructions: [
        'Lie on back with hands behind head',
        'Bring knees to 90-degree angle',
        'Bring right elbow to left knee while extending right leg',
        'Switch sides in pedaling motion',
        'Keep continuous motion'
      ],
      tips: 'Don\'t pull on neck. Focus on rotation from core.',
      sets: '3-4',
      reps: '20-30 total'
    },
    {
      id: 'mountain-climbers',
      name: 'Mountain Climbers',
      equipment: 'Bodyweight',
      difficulty: 'Intermediate',
      targetMuscles: ['Core', 'Shoulders', 'Hip Flexors'],
      primaryMuscle: 'Core',
      instructions: [
        'Start in push-up position',
        'Drive one knee toward chest',
        'Quickly switch legs in running motion',
        'Keep hips low and core tight',
        'Maintain steady rhythm'
      ],
      tips: 'Great cardio and core exercise. Keep back flat.',
      sets: '3-4',
      reps: '30-45 seconds'
    },
    {
      id: 'dead-bug',
      name: 'Dead Bug',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      targetMuscles: ['Core', 'Deep Abs'],
      primaryMuscle: 'Core',
      instructions: [
        'Lie on back with arms extended toward ceiling',
        'Bring knees to 90-degree angle',
        'Lower opposite arm and leg toward floor',
        'Return to start and switch sides',
        'Keep lower back pressed to floor'
      ],
      tips: 'Great for core stability. Go slow and controlled.',
      sets: '3-4',
      reps: '10-12 each side'
    },
    {
      id: 'side-plank',
      name: 'Side Plank',
      equipment: 'Bodyweight',
      difficulty: 'Intermediate',
      targetMuscles: ['Obliques', 'Core'],
      primaryMuscle: 'Obliques',
      instructions: [
        'Lie on side with elbow under shoulder',
        'Lift hips off ground creating straight line',
        'Hold position keeping hips high',
        'Don\'t let hips sag',
        'Switch sides after time'
      ],
      tips: 'Modify on knees if needed. Keep breathing steady.',
      sets: '3-4',
      reps: '30-60 seconds each side'
    }
  ]
};

export const getExercisesByMuscleGroup = (muscleGroup) => {
  return exerciseDatabase[muscleGroup.toLowerCase()] || [];
};

export const getAllExercises = () => {
  return Object.values(exerciseDatabase).flat();
};

export const searchExercises = (query) => {
  const allExercises = getAllExercises();
  const lowercaseQuery = query.toLowerCase();
  
  return allExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.equipment.toLowerCase().includes(lowercaseQuery) ||
    exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery))
  );
};