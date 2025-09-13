// ⚠️ PROTECTED FILE - DO NOT MODIFY ⚠️
// This database is working correctly with ExerciseListScreen
// Only modify if absolutely critical and with explicit user permission
// Last working version: 2025-09-13

// Comprehensive Exercise Database
// Total: 60+ exercises across all muscle groups and equipment types

export const exerciseDatabase = {
  chest: [
    {
      id: 'chest-1',
      name: 'Bench Press',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Adjust seat so handles align with chest, press forward without locking elbows',
      muscleGroup: 'Chest',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-2',
      name: 'Cable Bench Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Sit upright, press handles forward, return slowly',
      muscleGroup: 'Chest',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-3',
      name: 'Converging Bench Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press forward while converging arms to center',
      muscleGroup: 'Chest',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-4',
      name: 'Incline Bench Press',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Seat at incline, press forward, avoid locking elbows',
      muscleGroup: 'Chest',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-5',
      name: 'Cable Incline Bench Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press upward at 45°, one or both arms',
      muscleGroup: 'Chest',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-6',
      name: 'Converging Incline Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press upward at 45° with arms converging',
      muscleGroup: 'Chest',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-7',
      name: 'Decline Bench Press',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Lean back slightly, press forward at chest level',
      muscleGroup: 'Chest',
      primaryMuscles: ['Lower Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-8',
      name: 'Cable Decline Bench Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press forward parallel to floor, controlled return',
      muscleGroup: 'Chest',
      primaryMuscles: ['Lower Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-9',
      name: 'Converging Decline Bench Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Same as decline press, but converge arms inward',
      muscleGroup: 'Chest',
      primaryMuscles: ['Lower Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders']
    },
    {
      id: 'chest-10',
      name: 'Self-Stabilizing Chest Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Sit without back support, press forward, engage core',
      muscleGroup: 'Chest',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Triceps', 'Shoulders', 'Core']
    },
    {
      id: 'chest-11',
      name: 'Cable Pec Fly',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Bring arms together in circular motion, neutral grip',
      muscleGroup: 'Chest',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'chest-12',
      name: 'Cable Incline Fly',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Bring arms together and upward in circular motion',
      muscleGroup: 'Chest',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'chest-13',
      name: 'Cable Low Fly',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'From low position, raise arms up to chest height',
      muscleGroup: 'Chest',
      primaryMuscles: ['Upper Chest'],
      secondaryMuscles: ['Shoulders']
    }
  ],

  back: [
    {
      id: 'back-1',
      name: 'Lat Pulldown',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull bar down to chest level, squeeze shoulder blades together',
      muscleGroup: 'Back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-2',
      name: 'Cable Lat Pulldown',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Wide grip pulldown, focus on lat engagement',
      muscleGroup: 'Back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-3',
      name: 'Seated Cable Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull handles to lower chest, squeeze shoulder blades',
      muscleGroup: 'Back',
      primaryMuscles: ['Rhomboids', 'Middle Traps'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-4',
      name: 'Standing Cable Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Stand upright, pull cable to waist level',
      muscleGroup: 'Back',
      primaryMuscles: ['Rhomboids', 'Middle Traps'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-5',
      name: 'High Cable Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull high cable to upper chest/face level',
      muscleGroup: 'Back',
      primaryMuscles: ['Upper Traps', 'Rear Delts'],
      secondaryMuscles: ['Rhomboids', 'Biceps']
    },
    {
      id: 'back-6',
      name: 'Single Arm Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Single arm pulling motion, focus on lat stretch',
      muscleGroup: 'Back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-7',
      name: 'T-Bar Row',
      equipment: 'Machine',
      difficulty: 'Advanced',
      instructions: 'Pull T-bar to chest, maintain neutral spine',
      muscleGroup: 'Back',
      primaryMuscles: ['Rhomboids', 'Middle Traps'],
      secondaryMuscles: ['Latissimus Dorsi', 'Biceps']
    },
    {
      id: 'back-8',
      name: 'Pull-Ups',
      equipment: 'Bodyweight',
      difficulty: 'Advanced',
      instructions: 'Pull body up until chin clears bar, control descent',
      muscleGroup: 'Back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-9',
      name: 'Assisted Pull-Ups',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Use assistance to perform pull-up motion',
      muscleGroup: 'Back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Delts']
    },
    {
      id: 'back-10',
      name: 'Cable Reverse Fly',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull cables apart in reverse fly motion, target rear delts',
      muscleGroup: 'Back',
      primaryMuscles: ['Rear Delts'],
      secondaryMuscles: ['Rhomboids', 'Middle Traps']
    }
  ],

  shoulders: [
    {
      id: 'shoulders-1',
      name: 'Shoulder Press',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Sit upright, press handles overhead, don\'t lock elbows',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Shoulders'],
      secondaryMuscles: ['Triceps', 'Upper Chest']
    },
    {
      id: 'shoulders-2',
      name: 'Cable Shoulder Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press arms overhead, vary grip or width',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Shoulders'],
      secondaryMuscles: ['Triceps', 'Upper Chest']
    },
    {
      id: 'shoulders-3',
      name: 'Converging Shoulder Press',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Press arms overhead while converging to center',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Shoulders'],
      secondaryMuscles: ['Triceps', 'Upper Chest']
    },
    {
      id: 'shoulders-4',
      name: 'Cable Lateral Raise',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Raise arms outward and upward, straight arms',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Side Deltoids'],
      secondaryMuscles: ['Traps']
    },
    {
      id: 'shoulders-5',
      name: 'Cable Front Raise',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Raise arms forward and upward, straight arms',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Front Deltoids'],
      secondaryMuscles: ['Upper Chest']
    },
    {
      id: 'shoulders-6',
      name: 'Standing Cable Lateral Raise',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'One arm at a time, raise outward and upward',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Side Deltoids'],
      secondaryMuscles: ['Traps']
    },
    {
      id: 'shoulders-7',
      name: 'Standing Front Raise',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'With straight bar/chain, raise bar forward to chest height',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Front Deltoids'],
      secondaryMuscles: ['Upper Chest']
    },
    {
      id: 'shoulders-8',
      name: 'Upright Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull bar from low pulley to shoulders, elbows high',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Side Deltoids'],
      secondaryMuscles: ['Traps', 'Biceps']
    },
    {
      id: 'shoulders-9',
      name: 'Shrugs',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Hold bar at arms\' length, shrug shoulders upward',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Traps'],
      secondaryMuscles: ['Upper Back']
    },
    {
      id: 'shoulders-10',
      name: 'External Rotator',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Rotate arm outward from torso',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Rotator Cuff'],
      secondaryMuscles: ['Rear Deltoids']
    },
    {
      id: 'shoulders-11',
      name: 'Internal Rotator',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Rotate arm inward toward torso',
      muscleGroup: 'Shoulders',
      primaryMuscles: ['Rotator Cuff'],
      secondaryMuscles: ['Front Deltoids']
    }
  ],

  back: [
    {
      id: 'back-1',
      name: 'Lat Pulldown',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Wide grip, pull bar to chest, avoid leaning',
      muscleGroup: 'Back',
      primaryMuscles: ['Lats'],
      secondaryMuscles: ['Biceps', 'Rhomboids']
    },
    {
      id: 'back-2',
      name: 'Low Cable Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Sit facing low pulley, pull bar to midsection',
      muscleGroup: 'Back',
      primaryMuscles: ['Middle Back'],
      secondaryMuscles: ['Lats', 'Biceps']
    },
    {
      id: 'back-3',
      name: 'Mid Row',
      equipment: 'Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull handles back, squeeze shoulder blades',
      muscleGroup: 'Back',
      primaryMuscles: ['Middle Back'],
      secondaryMuscles: ['Rhomboids', 'Biceps']
    },
    {
      id: 'back-4',
      name: 'One Arm Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull handle to midsection, one arm at a time',
      muscleGroup: 'Back',
      primaryMuscles: ['Lats'],
      secondaryMuscles: ['Biceps', 'Rhomboids']
    },
    {
      id: 'back-5',
      name: 'Front Lat Pullover',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull bar downward with straight arms',
      muscleGroup: 'Back',
      primaryMuscles: ['Lats'],
      secondaryMuscles: ['Serratus']
    },
    {
      id: 'back-6',
      name: 'Converging Lat Pulldown',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull handles downward while converging',
      muscleGroup: 'Back',
      primaryMuscles: ['Lats'],
      secondaryMuscles: ['Biceps', 'Rhomboids']
    },
    {
      id: 'back-7',
      name: 'Cable Crossover Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Cross arms and row handles to sides',
      muscleGroup: 'Back',
      primaryMuscles: ['Middle Back'],
      secondaryMuscles: ['Rear Deltoids', 'Biceps']
    },
    {
      id: 'back-8',
      name: 'Rear Deltoid Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull arms backward to shoulder height',
      muscleGroup: 'Back',
      primaryMuscles: ['Rear Deltoids'],
      secondaryMuscles: ['Rhomboids', 'Traps']
    },
    {
      id: 'back-9',
      name: 'Standing Row',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull handles to midsection from standing position',
      muscleGroup: 'Back',
      primaryMuscles: ['Middle Back'],
      secondaryMuscles: ['Lats', 'Biceps']
    }
  ],

  biceps: [
    {
      id: 'biceps-1',
      name: 'Bicep Curl',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Curl handles upward, elbows tucked in',
      muscleGroup: 'Arms',
      primaryMuscles: ['Biceps'],
      secondaryMuscles: ['Forearms']
    },
    {
      id: 'biceps-2',
      name: 'One Arm Bicep Curl',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Curl one arm at a time, controlled motion',
      muscleGroup: 'Arms',
      primaryMuscles: ['Biceps'],
      secondaryMuscles: ['Forearms']
    }
  ],

  triceps: [
    {
      id: 'triceps-1',
      name: 'Tricep Pushdown',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Extend arms down with overhand grip',
      muscleGroup: 'Arms',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'triceps-2',
      name: 'One Arm Tricep Pushdown',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Isolate one arm, extend down fully',
      muscleGroup: 'Arms',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'triceps-3',
      name: 'Overhead Tricep Extension',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Pull cable overhead, extend arms upward',
      muscleGroup: 'Arms',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'triceps-4',
      name: 'One Arm Overhead Extension',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Same motion, one arm at a time',
      muscleGroup: 'Arms',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Shoulders']
    },
    {
      id: 'triceps-5',
      name: 'Wrist Curl',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Flex wrists upward, forearms on thighs',
      muscleGroup: 'Arms',
      primaryMuscles: ['Forearms'],
      secondaryMuscles: []
    },
    {
      id: 'triceps-6',
      name: 'Reverse Wrist Curl',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Extend wrists upward with underhand grip',
      muscleGroup: 'Arms',
      primaryMuscles: ['Forearms'],
      secondaryMuscles: []
    }
  ],

  abs: [
    {
      id: 'abs-1',
      name: 'Ab Crunch',
      equipment: 'Cable Machine',
      difficulty: 'Beginner',
      instructions: 'Sit upright, pull handles downward while crunching abs',
      muscleGroup: 'Core',
      primaryMuscles: ['Abs'],
      secondaryMuscles: ['Hip Flexors']
    },
    {
      id: 'abs-2',
      name: 'Oblique Crunch',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Twist torso while crunching, engage obliques',
      muscleGroup: 'Core',
      primaryMuscles: ['Obliques'],
      secondaryMuscles: ['Abs']
    },
    {
      id: 'abs-3',
      name: 'Cable Side Bend',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Stand upright, bend sideways against resistance',
      muscleGroup: 'Core',
      primaryMuscles: ['Obliques'],
      secondaryMuscles: ['Lower Back']
    },
    {
      id: 'abs-4',
      name: 'Torso Rotation',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Rotate torso side to side, keep core tight',
      muscleGroup: 'Core',
      primaryMuscles: ['Obliques'],
      secondaryMuscles: ['Abs']
    }
  ],

  legs: [
    {
      id: 'legs-1',
      name: 'Leg Extension',
      equipment: 'Machine',
      difficulty: 'Beginner',
      instructions: 'Extend knees upward, don\'t lock joints',
      muscleGroup: 'Legs',
      primaryMuscles: ['Quadriceps'],
      secondaryMuscles: []
    },
    {
      id: 'legs-2',
      name: 'Leg Curl',
      equipment: 'Machine',
      difficulty: 'Beginner',
      instructions: 'Curl legs backward, slow return',
      muscleGroup: 'Legs',
      primaryMuscles: ['Hamstrings'],
      secondaryMuscles: ['Glutes']
    },
    {
      id: 'legs-3',
      name: 'Leg Press',
      equipment: 'Machine',
      difficulty: 'Beginner',
      instructions: 'Push plate forward with feet, controlled motion',
      muscleGroup: 'Legs',
      primaryMuscles: ['Quadriceps'],
      secondaryMuscles: ['Glutes', 'Hamstrings']
    },
    {
      id: 'legs-4',
      name: 'Standing Calf Raise',
      equipment: 'Machine',
      difficulty: 'Beginner',
      instructions: 'Push upward on toes, controlled stretch',
      muscleGroup: 'Legs',
      primaryMuscles: ['Calves'],
      secondaryMuscles: []
    },
    {
      id: 'legs-5',
      name: 'Squat',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Hold handles, squat down and up',
      muscleGroup: 'Legs',
      primaryMuscles: ['Quadriceps'],
      secondaryMuscles: ['Glutes', 'Hamstrings']
    },
    {
      id: 'legs-6',
      name: 'One Leg Squat',
      equipment: 'Cable Machine',
      difficulty: 'Advanced',
      instructions: 'Perform single-leg squat with balance',
      muscleGroup: 'Legs',
      primaryMuscles: ['Quadriceps'],
      secondaryMuscles: ['Glutes', 'Hamstrings']
    },
    {
      id: 'legs-7',
      name: 'Hip Abduction',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Move leg outward against resistance',
      muscleGroup: 'Legs',
      primaryMuscles: ['Glutes'],
      secondaryMuscles: ['Hip Abductors']
    },
    {
      id: 'legs-8',
      name: 'Hip Adduction',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Move leg inward against resistance',
      muscleGroup: 'Legs',
      primaryMuscles: ['Hip Adductors'],
      secondaryMuscles: ['Inner Thighs']
    },
    {
      id: 'legs-9',
      name: 'Glute Kickback',
      equipment: 'Cable Machine',
      difficulty: 'Intermediate',
      instructions: 'Extend leg backward while keeping torso still',
      muscleGroup: 'Legs',
      primaryMuscles: ['Glutes'],
      secondaryMuscles: ['Hamstrings']
    }
  ]
};

// Helper functions for exercise filtering and retrieval
export const getExercisesByMuscleGroup = (muscleGroup) => {
  console.log('🔍 [DATABASE] getExercisesByMuscleGroup called with:', muscleGroup);
  console.log('🔍 [DATABASE] exerciseDatabase keys:', Object.keys(exerciseDatabase));
  
  const muscleGroupMap = {
    'chest': exerciseDatabase.chest,
    'shoulders': exerciseDatabase.shoulders,
    'back': exerciseDatabase.back,
    'biceps': [...(exerciseDatabase.biceps || [])],
    'triceps': [...(exerciseDatabase.triceps || [])],
    'abs': exerciseDatabase.abs,
    'legs': exerciseDatabase.legs
  };
  
  console.log('🔍 [DATABASE] muscleGroupMap keys:', Object.keys(muscleGroupMap));
  console.log('🔍 [DATABASE] Direct access test - chest:', exerciseDatabase.chest ? exerciseDatabase.chest.length : 'undefined');
  console.log('🔍 [DATABASE] Direct access test - back:', exerciseDatabase.back ? exerciseDatabase.back.length : 'undefined');
  
  // For arms, combine biceps and triceps
  if (muscleGroup === 'arms') {
    const result = [...exerciseDatabase.biceps, ...exerciseDatabase.triceps];
    console.log('🔍 [DATABASE] Arms result length:', result.length);
    return result;
  }
  
  const result = muscleGroupMap[muscleGroup] || [];
  console.log(`🔍 [DATABASE] Result for ${muscleGroup}:`, result ? result.length : 'null/undefined');
  console.log(`🔍 [DATABASE] Result type:`, typeof result);
  console.log(`🔍 [DATABASE] Is result an array:`, Array.isArray(result));
  
  return result;
};

export const getExercisesByEquipment = (equipment) => {
  const allExercises = getAllExercises();
  return allExercises.filter(exercise => exercise.equipment === equipment);
};

export const getExercisesByDifficulty = (difficulty) => {
  const allExercises = getAllExercises();
  return allExercises.filter(exercise => exercise.difficulty === difficulty);
};

export const getAllExercises = () => {
  return [
    ...exerciseDatabase.chest,
    ...exerciseDatabase.shoulders,
    ...exerciseDatabase.back,
    ...exerciseDatabase.biceps,
    ...exerciseDatabase.triceps,
    ...exerciseDatabase.abs,
    ...exerciseDatabase.legs
  ];
};

export const searchExercises = (query) => {
  const allExercises = getAllExercises();
  const lowercaseQuery = query.toLowerCase();
  
  return allExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    exercise.equipment.toLowerCase().includes(lowercaseQuery) ||
    exercise.instructions.toLowerCase().includes(lowercaseQuery) ||
    exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery))
  );
};

export const getExerciseById = (id) => {
  const allExercises = getAllExercises();
  return allExercises.find(exercise => exercise.id === id);
};