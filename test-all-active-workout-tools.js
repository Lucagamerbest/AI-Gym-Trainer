/**
 * COMPREHENSIVE TEST SUITE - ALL 6 ACTIVE WORKOUT TOOLS
 *
 * Tests all enhanced and new active workout AI tools
 * Total: 18 tests (3 per tool)
 */

// Mock AsyncStorage
const mockStorage = new Map();
const AsyncStorage = {
  getItem: async (key) => mockStorage.get(key) || null,
  setItem: async (key, value) => mockStorage.set(key, value),
  removeItem: async (key) => mockStorage.delete(key),
};

// Mock WorkoutStorageService
const WorkoutStorageService = {
  saveWorkout: async (workoutData, exerciseSets, userId) => {
    return { success: true, workoutId: `workout_${Date.now()}` };
  }
};

// Import all 6 tool implementations (inline for testing)

// TOOL 1: Enhanced logWorkoutSet
async function logWorkoutSet({ exerciseName, weight, reps, setNumber, rpe, setType, notes, userId }) {
  try {
    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);
    if (!activeWorkoutStr) {
      return { success: false, message: "No active workout. Start a workout first to log sets." };
    }
    const activeWorkout = JSON.parse(activeWorkoutStr);
    const exercise = activeWorkout.exercises?.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
    if (!exercise) {
      return { success: false, message: `${exerciseName} not found in current workout.` };
    }
    const setIndex = setNumber ? setNumber - 1 : exercise.sets.findIndex(s => !s.completed);
    if (setIndex === -1 || setIndex >= exercise.sets.length) {
      return { success: false, message: `All sets already logged for ${exerciseName}` };
    }
    const setData = { weight: weight.toString(), reps: reps.toString(), completed: true };
    if (rpe !== undefined && rpe !== null) setData.rpe = rpe.toString();
    if (setType && setType !== 'normal') setData.setType = setType;
    if (notes) setData.notes = notes;
    exercise.sets[setIndex] = setData;
    await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));
    let message = `Logged set ${setIndex + 1}: ${weight} lbs × ${reps} reps`;
    if (rpe) message += ` @ RPE ${rpe}`;
    if (setType && setType !== 'normal') message += ` (${setType})`;
    message += ` on ${exerciseName}`;
    return {
      success: true,
      message,
      data: { exerciseName, weight, reps, rpe, setType, notes, setNumber: setIndex + 1 }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TOOL 2: modifyActiveWorkout
async function modifyActiveWorkout({ action, exerciseName, position, userId }) {
  try {
    const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
    if (!activeWorkoutStr) return { success: false, message: "No active workout found." };
    const activeWorkout = JSON.parse(activeWorkoutStr);

    if (action === 'remove_exercise') {
      const exerciseIndex = activeWorkout.exercises.findIndex(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
      if (exerciseIndex === -1) return { success: false, message: `${exerciseName} not found.` };
      const removed = activeWorkout.exercises.splice(exerciseIndex, 1)[0];
      await AsyncStorage.setItem('@active_workout', JSON.stringify(activeWorkout));
      return { success: true, message: `Removed ${removed.name}.` };
    }

    if (action === 'reorder_exercise') {
      const exerciseIndex = activeWorkout.exercises.findIndex(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
      if (exerciseIndex === -1) return { success: false, message: `${exerciseName} not found.` };
      const [exercise] = activeWorkout.exercises.splice(exerciseIndex, 1);
      activeWorkout.exercises.splice(position - 1, 0, exercise);
      await AsyncStorage.setItem('@active_workout', JSON.stringify(activeWorkout));
      return { success: true, message: `Moved ${exerciseName} to position ${position}.` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TOOL 3: finishWorkout
async function finishWorkout({ workoutTitle, notes, rating, userId }) {
  try {
    const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
    if (!activeWorkoutStr) return { success: false, message: "No active workout to finish." };
    const activeWorkout = JSON.parse(activeWorkoutStr);

    const startTime = new Date(activeWorkout.startTime || activeWorkout.date);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime - startTime) / 60000);

    let totalVolume = 0, totalSets = 0;
    activeWorkout.exercises?.forEach(exercise => {
      exercise.sets?.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          totalVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
          totalSets++;
        }
      });
    });

    const workoutData = {
      duration: durationMinutes,
      totalSets,
      totalVolume,
      workoutTitle: workoutTitle || 'Workout',
      notes: notes || '',
      rating: rating || null,
    };

    const saveResult = await WorkoutStorageService.saveWorkout(workoutData, {}, userId);
    if (!saveResult.success) return { success: false, message: "Failed to save workout." };

    await AsyncStorage.removeItem('@active_workout');

    let message = `✅ Workout completed! ${durationMinutes} min, ${totalSets} sets, ${Math.round(totalVolume)} lbs total volume.`;
    if (rating) message += ` Rating: ${rating}/5`;

    return { success: true, message, data: { duration: durationMinutes, totalSets, totalVolume, rating } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TOOL 4: startRestTimer
async function startRestTimer({ duration, userId }) {
  try {
    if (!duration || duration <= 0) return { success: false, message: "Invalid duration." };
    if (duration > 600) return { success: false, message: "Rest timer cannot exceed 10 minutes." };

    const endTime = Date.now() + (duration * 1000);
    await AsyncStorage.setItem('@rest_timer_end', endTime.toString());

    let durationText;
    if (duration >= 60) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      durationText = seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
    } else {
      durationText = `${duration} sec`;
    }

    return {
      success: true,
      message: `⏱️ Rest timer started for ${durationText}.`,
      data: { duration, durationText }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TOOL 5: getActiveWorkoutStatus
async function getActiveWorkoutStatus({ userId }) {
  try {
    const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
    if (!activeWorkoutStr) return { success: false, message: "No active workout found." };
    const activeWorkout = JSON.parse(activeWorkoutStr);

    const durationMinutes = Math.floor((Date.now() - new Date(activeWorkout.startTime)) / 60000);
    let totalSets = 0, completedSets = 0, totalVolume = 0;

    activeWorkout.exercises?.forEach(exercise => {
      const sets = exercise.sets || [];
      totalSets += sets.length;
      sets.forEach(set => {
        if (set.completed) {
          completedSets++;
          if (set.weight && set.reps) {
            totalVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
          }
        }
      });
    });

    let message = `📊 Workout Status:\n⏱️ Duration: ${durationMinutes} min\n✅ Sets: ${completedSets}/${totalSets} complete\n🏋️ Volume: ${Math.round(totalVolume)} lbs`;

    return {
      success: true,
      message,
      data: { duration: durationMinutes, totalSets, completedSets, totalVolume: Math.round(totalVolume) }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TOOL 6: skipToNextExercise
async function skipToNextExercise({ userId }) {
  try {
    const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
    if (!activeWorkoutStr) return { success: false, message: "No active workout found." };
    const activeWorkout = JSON.parse(activeWorkoutStr);

    let currentIndex = -1;
    for (let i = 0; i < activeWorkout.exercises.length; i++) {
      const sets = activeWorkout.exercises[i].sets || [];
      const completed = sets.filter(s => s.completed).length;
      if (completed < sets.length) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex === -1) return { success: false, message: "All exercises complete!" };
    const nextIndex = currentIndex + 1;
    if (nextIndex >= activeWorkout.exercises.length) {
      return { success: false, message: `You're on the last exercise.` };
    }

    const nextExercise = activeWorkout.exercises[nextIndex];
    await AsyncStorage.setItem('@ai_current_exercise_index', nextIndex.toString());

    return {
      success: true,
      message: `⏭️ Skipped to ${nextExercise.name}!`,
      data: { skippedTo: nextExercise.name, nextExerciseIndex: nextIndex }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// TEST RUNNER
async function runAllTests() {
  console.log('🧪 COMPREHENSIVE TEST SUITE - ALL 6 ACTIVE WORKOUT TOOLS');
  console.log('='.repeat(70));
  console.log('Total: 18 tests (3 per tool)\n');

  let passed = 0;
  let failed = 0;

  // Setup mock workout for all tests
  const setupWorkout = () => ({
    id: 'test_workout',
    workoutTitle: 'Test Workout',
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weight: '', reps: '', completed: false },
          { weight: '', reps: '', completed: false },
          { weight: '', reps: '', completed: false },
        ],
      },
      {
        name: 'Squat',
        sets: [
          { weight: '', reps: '', completed: false },
          { weight: '', reps: '', completed: false },
        ],
      },
    ],
  });

  // ========================================
  // TOOL 1: logWorkoutSet (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 1: logWorkoutSet (Enhanced)');
  console.log('='.repeat(70));

  // Test 1.1: Basic set logging
  console.log('\n[Test 1.1] Basic set logging (weight + reps)');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t1_1 = await logWorkoutSet({ exerciseName: 'Bench Press', weight: 225, reps: 8, userId: 'test' });
  if (t1_1.success && t1_1.data.weight === 225 && t1_1.data.reps === 8) {
    console.log('✅ PASS:', t1_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t1_1.message);
    failed++;
  }

  // Test 1.2: Set with RPE
  console.log('\n[Test 1.2] Set logging with RPE');
  const t1_2 = await logWorkoutSet({ exerciseName: 'Bench Press', weight: 225, reps: 8, rpe: 8, userId: 'test' });
  if (t1_2.success && t1_2.data.rpe === 8 && t1_2.message.includes('RPE 8')) {
    console.log('✅ PASS:', t1_2.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t1_2.message);
    failed++;
  }

  // Test 1.3: Warmup set with notes
  console.log('\n[Test 1.3] Warmup set with notes');
  const t1_3 = await logWorkoutSet({
    exerciseName: 'Bench Press',
    weight: 135,
    reps: 10,
    setType: 'warmup',
    notes: 'Easy warmup',
    setNumber: 1,
    userId: 'test'
  });
  if (t1_3.success && t1_3.data.setType === 'warmup' && t1_3.data.notes === 'Easy warmup') {
    console.log('✅ PASS:', t1_3.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t1_3.message);
    failed++;
  }

  // ========================================
  // TOOL 2: modifyActiveWorkout (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 2: modifyActiveWorkout (New)');
  console.log('='.repeat(70));

  // Test 2.1: Remove exercise
  console.log('\n[Test 2.1] Remove exercise from workout');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t2_1 = await modifyActiveWorkout({ action: 'remove_exercise', exerciseName: 'Squat', userId: 'test' });
  const workout2_1 = JSON.parse(await AsyncStorage.getItem('@active_workout'));
  if (t2_1.success && workout2_1.exercises.length === 1) {
    console.log('✅ PASS:', t2_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t2_1.message);
    failed++;
  }

  // Test 2.2: Reorder exercise to position 1
  console.log('\n[Test 2.2] Reorder exercise to first position');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t2_2 = await modifyActiveWorkout({ action: 'reorder_exercise', exerciseName: 'Squat', position: 1, userId: 'test' });
  const workout2_2 = JSON.parse(await AsyncStorage.getItem('@active_workout'));
  if (t2_2.success && workout2_2.exercises[0].name === 'Squat') {
    console.log('✅ PASS:', t2_2.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t2_2.message);
    failed++;
  }

  // Test 2.3: Reorder to last position
  console.log('\n[Test 2.3] Reorder exercise to last position');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t2_3 = await modifyActiveWorkout({ action: 'reorder_exercise', exerciseName: 'Bench Press', position: 2, userId: 'test' });
  const workout2_3 = JSON.parse(await AsyncStorage.getItem('@active_workout'));
  if (t2_3.success && workout2_3.exercises[1].name === 'Bench Press') {
    console.log('✅ PASS:', t2_3.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t2_3.message);
    failed++;
  }

  // ========================================
  // TOOL 3: finishWorkout (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 3: finishWorkout (New)');
  console.log('='.repeat(70));

  // Test 3.1: Basic finish
  console.log('\n[Test 3.1] Basic finish workout');
  const workout3_1 = setupWorkout();
  workout3_1.exercises[0].sets[0] = { weight: '225', reps: '8', completed: true };
  await AsyncStorage.setItem('@active_workout', JSON.stringify(workout3_1));
  const t3_1 = await finishWorkout({ userId: 'test' });
  const clearedWorkout = await AsyncStorage.getItem('@active_workout');
  if (t3_1.success && clearedWorkout === null && t3_1.data.totalSets === 1) {
    console.log('✅ PASS:', t3_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t3_1.message);
    failed++;
  }

  // Test 3.2: Finish with custom title and notes
  console.log('\n[Test 3.2] Finish with title and notes');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(workout3_1));
  const t3_2 = await finishWorkout({ workoutTitle: 'Epic Session', notes: 'Great workout', userId: 'test' });
  if (t3_2.success) {
    console.log('✅ PASS:', t3_2.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t3_2.message);
    failed++;
  }

  // Test 3.3: Finish with rating
  console.log('\n[Test 3.3] Finish with rating');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(workout3_1));
  const t3_3 = await finishWorkout({ rating: 5, userId: 'test' });
  if (t3_3.success && t3_3.data.rating === 5 && t3_3.message.includes('Rating: 5/5')) {
    console.log('✅ PASS:', t3_3.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t3_3.message);
    failed++;
  }

  // ========================================
  // TOOL 4: startRestTimer (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 4: startRestTimer (New)');
  console.log('='.repeat(70));

  // Test 4.1: 60 second timer
  console.log('\n[Test 4.1] Start 60 second timer');
  const t4_1 = await startRestTimer({ duration: 60, userId: 'test' });
  if (t4_1.success && t4_1.data.durationText === '1 min') {
    console.log('✅ PASS:', t4_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t4_1.message);
    failed++;
  }

  // Test 4.2: 90 second timer
  console.log('\n[Test 4.2] Start 90 second timer');
  const t4_2 = await startRestTimer({ duration: 90, userId: 'test' });
  if (t4_2.success && t4_2.data.durationText === '1 min 30 sec') {
    console.log('✅ PASS:', t4_2.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t4_2.message);
    failed++;
  }

  // Test 4.3: 3 minute timer
  console.log('\n[Test 4.3] Start 180 second (3 min) timer');
  const t4_3 = await startRestTimer({ duration: 180, userId: 'test' });
  if (t4_3.success && t4_3.data.durationText === '3 min') {
    console.log('✅ PASS:', t4_3.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t4_3.message);
    failed++;
  }

  // ========================================
  // TOOL 5: getActiveWorkoutStatus (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 5: getActiveWorkoutStatus (New)');
  console.log('='.repeat(70));

  // Test 5.1: Status with no completed sets
  console.log('\n[Test 5.1] Get status - no completed sets');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t5_1 = await getActiveWorkoutStatus({ userId: 'test' });
  if (t5_1.success && t5_1.data.completedSets === 0 && t5_1.data.totalSets === 5) {
    console.log('✅ PASS:', t5_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t5_1.message);
    failed++;
  }

  // Test 5.2: Status with some completed sets
  console.log('\n[Test 5.2] Get status - 2 sets completed');
  const workout5_2 = setupWorkout();
  workout5_2.exercises[0].sets[0] = { weight: '225', reps: '8', completed: true };
  workout5_2.exercises[0].sets[1] = { weight: '225', reps: '8', completed: true };
  await AsyncStorage.setItem('@active_workout', JSON.stringify(workout5_2));
  const t5_2 = await getActiveWorkoutStatus({ userId: 'test' });
  if (t5_2.success && t5_2.data.completedSets === 2 && t5_2.data.totalVolume === 3600) {
    console.log('✅ PASS:', t5_2.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t5_2.message);
    failed++;
  }

  // Test 5.3: Status calculation
  console.log('\n[Test 5.3] Get status - verify duration');
  const t5_3 = await getActiveWorkoutStatus({ userId: 'test' });
  if (t5_3.success && t5_3.data.duration >= 29 && t5_3.data.duration <= 31) { // ~30 min
    console.log('✅ PASS:', t5_3.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t5_3.message);
    failed++;
  }

  // ========================================
  // TOOL 6: skipToNextExercise (3 tests)
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('TOOL 6: skipToNextExercise (New)');
  console.log('='.repeat(70));

  // Test 6.1: Skip from first to second exercise
  console.log('\n[Test 6.1] Skip from first to second exercise');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  const t6_1 = await skipToNextExercise({ userId: 'test' });
  if (t6_1.success && t6_1.data.skippedTo === 'Squat' && t6_1.data.nextExerciseIndex === 1) {
    console.log('✅ PASS:', t6_1.message);
    passed++;
  } else {
    console.log('❌ FAIL:', t6_1.message);
    failed++;
  }

  // Test 6.2: Skip when on last exercise (should fail)
  console.log('\n[Test 6.2] Try to skip on last exercise');
  const workout6_2 = setupWorkout();
  workout6_2.exercises[0].sets = workout6_2.exercises[0].sets.map(s => ({ ...s, completed: true }));
  await AsyncStorage.setItem('@active_workout', JSON.stringify(workout6_2));
  const t6_2 = await skipToNextExercise({ userId: 'test' });
  if (!t6_2.success && t6_2.message.includes('last exercise')) {
    console.log('✅ PASS:', t6_2.message);
    passed++;
  } else {
    console.log('❌ FAIL: Should have failed on last exercise');
    failed++;
  }

  // Test 6.3: Verify storage update
  console.log('\n[Test 6.3] Verify exercise index stored');
  await AsyncStorage.setItem('@active_workout', JSON.stringify(setupWorkout()));
  await skipToNextExercise({ userId: 'test' });
  const storedIndex = await AsyncStorage.getItem('@ai_current_exercise_index');
  if (storedIndex === '1') {
    console.log('✅ PASS: Exercise index correctly stored as 1');
    passed++;
  } else {
    console.log('❌ FAIL: Exercise index not stored correctly');
    failed++;
  }

  // FINAL RESULTS
  console.log('\n' + '='.repeat(70));
  console.log('FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: 18`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / 18) * 100)}%`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! All 6 tools are working correctly! 🎉\n');
  } else {
    console.log(`\n⚠️ ${failed} test(s) failed. Please review the failures above.\n`);
  }
}

// RUN ALL TESTS
runAllTests().catch(console.error);
