/**
 * WorkoutTools - AI tools for workout generation and planning
 * Updated with 2024 exercise science research (Jeff Nippard, EMG studies, meta-analyses)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutSyncService from '../../backend/WorkoutSyncService';
import { getAllExercises } from '../../../data/exerciseDatabase';
import FitnessKnowledge from '../FitnessKnowledge';
import ProvenWorkoutTemplates from '../ProvenWorkoutTemplates';
import { getExercisesByPriority, getEquipmentPriority, getExerciseTier2024 } from '../ExerciseHierarchy2024';

/**
 * Exercises to NEVER generate (proven suboptimal for bodybuilding)
 */
const EXCLUDED_EXERCISES = [
  'decline bench press',
  'decline dumbbell bench press',
  'decline barbell bench press',
  'decline press',
  'decline chest press',
  'decline flyes',
  'decline dumbbell flyes',
];

/**
 * Filter to exclude suboptimal exercises
 */
function filterExcludedExercises(exercises) {
  return exercises.filter(ex => {
    const nameLower = ex.name.toLowerCase();
    return !EXCLUDED_EXERCISES.some(excluded => nameLower.includes(excluded));
  });
}

/**
 * Generate a complete workout plan
 * Used when user asks: "Create a push workout", "Plan a leg day", etc.
 */
export async function generateWorkoutPlan({ muscleGroups, experienceLevel, duration, goal, equipment }) {
  try {
    // Get available exercises
    const allExercises = getAllExercises();

    // STEP 1: Map user terms to proper muscle groups using scientific knowledge
    // Example: "pull" → ["Back", "Lats", "Traps", "Rhomboids", "Biceps", "Rear Deltoids"]
    const expandedMuscleGroups = muscleGroups.flatMap(mg =>
      FitnessKnowledge.mapUserTermToMuscleGroups(mg)
    );

    console.log(`📚 Scientific mapping: ${muscleGroups.join(', ')} → ${expandedMuscleGroups.join(', ')}`);

    // STEP 2: Determine workout type (push/pull/legs/upper/lower) for validation
    const workoutType = muscleGroups[0]?.toLowerCase();
    const isPushPullLegsSplit = ['push', 'pull', 'legs', 'leg'].some(type =>
      workoutType?.includes(type)
    );
    const isUpperLowerSplit = ['upper', 'lower'].some(type =>
      workoutType?.includes(type)
    );

    // STEP 3: Filter exercises by muscle groups and equipment
    let availableExercises = allExercises.filter(ex => {
      // For push/pull/legs splits, use scientific classification
      if (isPushPullLegsSplit) {
        const classification = FitnessKnowledge.classifyExercise(ex);

        // Match classification to workout type
        if (workoutType.includes('push')) {
          if (classification !== 'push') return false;
        } else if (workoutType.includes('pull')) {
          if (classification !== 'pull') return false;
        } else if (workoutType.includes('leg')) {
          if (classification !== 'legs') return false;
        }
      } else if (isUpperLowerSplit) {
        // For upper/lower splits, classify as upper (push + pull) or lower (legs)
        const classification = FitnessKnowledge.classifyExercise(ex);

        if (workoutType.includes('upper')) {
          // Upper body = push + pull movements
          if (classification !== 'push' && classification !== 'pull') return false;
        } else if (workoutType.includes('lower')) {
          // Lower body = legs only
          if (classification !== 'legs') return false;
        }
      } else {
        // For specific muscle groups, use traditional matching
        const matchesMuscle = expandedMuscleGroups.some(mg => {
          const mgLower = mg.toLowerCase();
          return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
                 ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
                 ex.muscleGroup?.toLowerCase().includes(mgLower);
        });

        if (!matchesMuscle) return false;
      }

      // Check equipment if specified (equipment field is comma-separated string)
      const matchesEquipment = !equipment || equipment.length === 0 ||
        equipment.some(eq => {
          const equipmentStr = ex.equipment?.toLowerCase() || '';
          return equipmentStr.includes(eq.toLowerCase());
        });

      return matchesEquipment;
    });

    // Filter out excluded exercises (decline movements, etc.)
    availableExercises = filterExcludedExercises(availableExercises);

    // FALLBACK 1: If no exercises found, try without equipment restriction
    if (availableExercises.length === 0 && equipment && equipment.length > 0) {
      console.log('⚠️ No exercises with specified equipment, trying without equipment filter...');
      availableExercises = allExercises.filter(ex => {
        const matchesMuscle = muscleGroups.some(mg => {
          const mgLower = mg.toLowerCase();
          return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
                 ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
                 ex.muscleGroup?.toLowerCase().includes(mgLower);
        });
        return matchesMuscle;
      });
    }

    // FALLBACK 2: If still no exercises, broaden muscle group search
    if (availableExercises.length === 0) {
      console.log('⚠️ No exercises found, trying broader muscle groups...');
      // Map common variations
      const broadMuscleGroups = muscleGroups.flatMap(mg => {
        const mgLower = mg.toLowerCase();
        if (mgLower.includes('chest')) return ['chest', 'pectorals', 'pecs'];
        if (mgLower.includes('tricep')) return ['triceps', 'arms'];
        if (mgLower.includes('bicep')) return ['biceps', 'arms'];
        if (mgLower.includes('back')) return ['back', 'lats', 'traps'];
        if (mgLower.includes('shoulder')) return ['shoulders', 'deltoids', 'delts'];
        if (mgLower.includes('leg')) return ['legs', 'quadriceps', 'hamstrings', 'glutes'];
        return [mg];
      });

      availableExercises = allExercises.filter(ex => {
        return broadMuscleGroups.some(mg => {
          const mgLower = mg.toLowerCase();
          return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
                 ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
                 ex.muscleGroup?.toLowerCase().includes(mgLower) ||
                 ex.name?.toLowerCase().includes(mgLower);
        });
      });
    }

    // If STILL no exercises, return error
    if (availableExercises.length === 0) {
      return {
        success: false,
        error: `No exercises found for muscle groups: ${muscleGroups.join(', ')}. Database may need updating.`
      };
    }

    console.log(`✅ Found ${availableExercises.length} exercises matching criteria`);

    // Determine exercise count based on duration
    let exerciseCount;
    if (duration <= 30) exerciseCount = 4;
    else if (duration <= 45) exerciseCount = 5;
    else if (duration <= 60) exerciseCount = 6;
    else exerciseCount = 7;

    // Select exercises (smart selection based on goal)
    let selectedExercises = smartSelectExercises(
      availableExercises,
      exerciseCount,
      muscleGroups,
      goal
    );

    // CRITICAL: Limit pressing movements on push days (avoid redundant bench variations)
    if (isPushPullLegsSplit && workoutType.includes('push')) {
      const pressingMovements = ['Bench Press', 'Incline', 'Decline', 'Close Grip', 'Chest Press', 'Dumbbell Press'];
      const isolationMovements = ['Lateral Raise', 'Front Raise', 'Tricep', 'Flyes', 'Cable Fly'];

      // Count pressing movements (chest/shoulder presses)
      const pressingCount = selectedExercises.filter(ex =>
        pressingMovements.some(pm => ex.name.toLowerCase().includes(pm.toLowerCase()))
      ).length;

      // If TOO MANY pressing movements (>3), replace with isolation
      if (pressingCount > 3) {
        console.log(`⚠️ Removing redundant pressing movements (${pressingCount} found, max 3 allowed)`);

        const pressesToRemove = [];
        let foundCount = 0;
        selectedExercises.forEach((ex, idx) => {
          if (pressingMovements.some(pm => ex.name.toLowerCase().includes(pm.toLowerCase()))) {
            foundCount++;
            // Keep first 3 pressing movements (compounds), remove the rest
            if (foundCount > 3) {
              pressesToRemove.push(idx);
            }
          }
        });

        // Replace extra presses with lateral raises, tricep isolation, or flyes
        pressesToRemove.forEach(idx => {
          const lateralRaise = availableExercises.find(ex =>
            ex.name.toLowerCase().includes('lateral raise') && !selectedExercises.some(sel => sel.name === ex.name)
          );
          const tricepIsolation = availableExercises.find(ex =>
            (ex.name.toLowerCase().includes('tricep') &&
             (ex.name.toLowerCase().includes('pushdown') || ex.name.toLowerCase().includes('extension'))) &&
            !selectedExercises.some(sel => sel.name === ex.name)
          );
          const flyes = availableExercises.find(ex =>
            ex.name.toLowerCase().includes('fly') && !selectedExercises.some(sel => sel.name === ex.name)
          );

          selectedExercises[idx] = lateralRaise || tricepIsolation || flyes || selectedExercises[idx];
        });
      }
    }

    // CRITICAL: Ensure pull workouts include BOTH vertical and horizontal pulls
    // Horizontal pulls (rows) should DOMINATE: 1 vertical + 2-3 horizontal minimum
    if (isPushPullLegsSplit && workoutType.includes('pull')) {
      const verticalPulls = ['Pull-up', 'Chin-up', 'Lat Pulldown', 'Pull Up'];
      const horizontalPulls = ['Row', 'Barbell Row', 'Dumbbell Row', 'Cable Row', 'T-Bar Row', 'Seated Row', 'Seal Row', 'Chest Supported Row', 'Inverted Row'];

      // Count vertical and horizontal pulls
      const verticalCount = selectedExercises.filter(ex =>
        verticalPulls.some(vp => ex.name.toLowerCase().includes(vp.toLowerCase()))
      ).length;

      const horizontalCount = selectedExercises.filter(ex =>
        horizontalPulls.some(hp => ex.name.toLowerCase().includes(hp.toLowerCase()))
      ).length;

      console.log(`📊 Pull day balance: ${verticalCount} vertical, ${horizontalCount} horizontal`);

      // Rule 1: MAX 2 vertical pulls (avoid lat pulldown → pull-up → one-arm lat pulldown)
      if (verticalCount > 2) {
        console.log(`⚠️ Removing redundant vertical pulls (${verticalCount} found, max 2 allowed)`);

        const verticalsToRemove = [];
        let foundCount = 0;
        selectedExercises.forEach((ex, idx) => {
          if (verticalPulls.some(vp => ex.name.toLowerCase().includes(vp.toLowerCase()))) {
            foundCount++;
            if (foundCount > 2) {
              verticalsToRemove.push(idx);
            }
          }
        });

        // Replace extra verticals with horizontal rows (priority) or face pulls
        verticalsToRemove.forEach(idx => {
          const horizontalRow = availableExercises.find(ex =>
            horizontalPulls.some(hp => ex.name.toLowerCase().includes(hp.toLowerCase())) &&
            !selectedExercises.some(sel => sel.name === ex.name)
          );
          const facePull = availableExercises.find(ex =>
            (ex.name.toLowerCase().includes('face pull') || ex.name.toLowerCase().includes('rear delt')) &&
            !selectedExercises.some(sel => sel.name === ex.name)
          );
          selectedExercises[idx] = horizontalRow || facePull || selectedExercises[idx];
        });
      }

      // Rule 2: Ensure at least 1 vertical pull (for lat development)
      if (verticalCount === 0) {
        const verticalExercise = availableExercises.find(ex =>
          verticalPulls.some(vp => ex.name.toLowerCase().includes(vp.toLowerCase()))
        );
        if (verticalExercise) {
          console.log('⚠️ Adding vertical pull to ensure lat development');
          selectedExercises[selectedExercises.length - 1] = verticalExercise;
        }
      }

      // Rule 3: Ensure at least 2 horizontal pulls (rows should dominate)
      if (horizontalCount < 2) {
        console.log(`⚠️ Not enough horizontal pulls (${horizontalCount} found, need 2+ for balanced back development)`);

        const missingHorizontal = 2 - horizontalCount;
        const lastIndex = selectedExercises.length - 1;

        for (let i = 0; i < missingHorizontal; i++) {
          const horizontalRow = availableExercises.find(ex =>
            horizontalPulls.some(hp => ex.name.toLowerCase().includes(hp.toLowerCase())) &&
            !selectedExercises.some(sel => sel.name === ex.name)
          );

          if (horizontalRow) {
            selectedExercises[lastIndex - i] = horizontalRow;
          }
        }
      }
    }

    // CRITICAL: Ensure leg workouts include BOTH quad and hamstring exercises
    if (isPushPullLegsSplit && workoutType.includes('leg')) {
      const quadExercises = ['Squat', 'Leg Press', 'Leg Extension', 'Front Squat', 'Hack Squat', 'Lunge'];
      const hamstringExercises = ['Romanian Deadlift', 'RDL', 'Leg Curl', 'Deadlift', 'Good Morning', 'Hip Thrust'];

      const hasQuad = selectedExercises.some(ex =>
        quadExercises.some(qe => ex.name.toLowerCase().includes(qe.toLowerCase()))
      );
      const hasHamstring = selectedExercises.some(ex =>
        hamstringExercises.some(he => ex.name.toLowerCase().includes(he.toLowerCase()))
      );

      // If missing quad or hamstring, add it
      if (!hasQuad) {
        const quadExercise = availableExercises.find(ex =>
          quadExercises.some(qe => ex.name.toLowerCase().includes(qe.toLowerCase()))
        );
        if (quadExercise) {
          console.log('⚠️ Adding quad exercise to ensure balance');
          selectedExercises[selectedExercises.length - 1] = quadExercise;
        }
      }

      if (!hasHamstring) {
        const hamstringExercise = availableExercises.find(ex =>
          hamstringExercises.some(he => ex.name.toLowerCase().includes(he.toLowerCase()))
        );
        if (hamstringExercise) {
          console.log('⚠️ Adding hamstring exercise to ensure balance');
          selectedExercises[selectedExercises.length - 2] = hamstringExercise;
        }
      }
    }

    // Generate set/rep scheme based on goal using scientific principles
    const workoutExercises = selectedExercises.map((exercise, index) => {
      let optimalRange = FitnessKnowledge.getOptimalRepRange(goal || 'hypertrophy', experienceLevel);

      // GOAL-SPECIFIC ADJUSTMENTS
      let targetRPE = '7-8';
      let sets = parseInt(optimalRange.sets.split('-')[0]);
      let reps = optimalRange.reps;
      let restTime = optimalRange.restTime;

      if (goal === 'strength') {
        // Strength: Lower reps, longer rest, higher RPE
        reps = index < 2 ? '3-5' : '4-6'; // Main lifts get lowest reps
        sets = index < 2 ? 5 : 4;
        restTime = index < 2 ? 240 : 180; // 4min for main lifts, 3min for accessories
        targetRPE = index < 2 ? '8-9' : '7-8';
      } else if (goal === 'hypertrophy') {
        // Hypertrophy: Classic 6-12 reps
        reps = index < 2 ? '6-10' : '8-12';
        sets = index < 2 ? 4 : 3;
        restTime = 75; // 60-90s range
        targetRPE = index < 2 ? '8' : '7-8';
      } else if (goal === 'weight_loss' || goal === 'fat_loss' || goal === 'conditioning') {
        // Weight Loss: Higher reps, shorter rest, circuit format
        reps = index < 2 ? '12-15' : '15-20'; // Higher reps for metabolic stress
        sets = 3;
        restTime = 45; // Minimal rest for fat burn
        targetRPE = '6-8'; // Sustainable intensity for high volume
      } else if (goal === 'endurance') {
        // Endurance: Very high reps, short rest
        reps = '15-20';
        sets = 3;
        restTime = 45;
        targetRPE = '6-7';
      }

      return {
        name: exercise.name,
        equipment: exercise.equipment,
        muscleGroup: exercise.primaryMuscles?.[0] || 'General',
        sets: sets,
        reps: reps,
        restTime: restTime,
        rpe: targetRPE,
        // Keep instructions short - just first sentence
        instructions: exercise.instructions?.split('.')[0] + '.' || '',
      };
    });

    // VALIDATION: Ensure workout is scientifically correct (only for push/pull/legs splits)
    if (isPushPullLegsSplit) {
      const validation = FitnessKnowledge.validateWorkout(
        selectedExercises,
        workoutType.includes('push') ? 'push' :
        workoutType.includes('pull') ? 'pull' : 'legs'
      );

      if (!validation.isValid) {
        console.error('❌ Workout validation failed:', validation.errors);
        return {
          success: false,
          error: `Workout validation failed: ${validation.errors.join(', ')}`,
          details: validation
        };
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Workout warnings:', validation.warnings);
      }

      console.log('✅ Workout passed scientific validation');
    } else {
      console.log('ℹ️ Skipping validation for non-PPL workout');
    }

    // Add circuit/superset guidance for weight loss
    let formatNotes = '';
    if (goal === 'weight_loss' || goal === 'fat_loss' || goal === 'conditioning') {
      formatNotes = 'CIRCUIT FORMAT: Pair exercises as supersets (A1/A2, B1/B2) with minimal rest between exercises, 45s rest between circuits. Add 5-10min cardio finisher at end.';
    }

    return {
      success: true,
      workout: {
        title: generateWorkoutTitle(muscleGroups, goal),
        muscleGroups,
        goal,
        estimatedDuration: duration,
        exercises: workoutExercises,
        totalExercises: workoutExercises.length,
        formatNotes: formatNotes, // Circuit/superset guidance
      }
    };
  } catch (error) {
    console.error('❌ generateWorkoutPlan error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Smart exercise selection algorithm - TIER-BASED (2024 Research Update)
 * Uses 2024 research from Jeff Nippard, EMG studies, and meta-analyses
 *
 * Key 2024 Updates:
 * - Incline Press > Flat Bench for chest
 * - Overhead Extensions > Pushdowns for triceps (+50% long head growth)
 * - Pull-ups > Lat Pulldowns (upgraded to S-tier)
 * - Bayesian Curls > Preacher Curls for biceps
 * - Freeweights prioritized over machines
 */
function smartSelectExercises(exercises, count, muscleGroups, goal) {
  // Determine category (push/pull/legs/fullbody)
  const muscleGroupsLower = muscleGroups.map(mg => mg.toLowerCase());

  // Detect if this is a full body workout (has multiple major muscle groups)
  const hasPush = muscleGroupsLower.some(mg => ['chest', 'shoulders', 'triceps', 'tricep'].includes(mg));
  const hasPull = muscleGroupsLower.some(mg => ['back', 'biceps', 'bicep'].includes(mg));
  const hasLegs = muscleGroupsLower.some(mg => ['legs', 'leg', 'quads', 'hamstrings', 'glutes', 'calves'].includes(mg));

  const isFullBody = (hasPush && hasPull) || (hasPush && hasLegs) || (hasPull && hasLegs);

  // Determine category
  let category;
  if (isFullBody) {
    category = 'fullbody';
  } else {
    category = muscleGroupsLower[0]?.includes('push') ? 'push' :
               muscleGroupsLower[0]?.includes('pull') ? 'pull' :
               muscleGroupsLower[0]?.includes('leg') ? 'legs' :
               hasPush ? 'push' : hasPull ? 'pull' : hasLegs ? 'legs' : 'push';
  }

  console.log(`🎯 Exercise prioritization for ${category} (2024 Research):`);

  // STEP 1: Prioritize exercises using 2024 research hierarchy
  // This includes: Incline > Flat, Overhead Extensions > Pushdowns, Pull-ups > Pulldowns
  let prioritized;

  if (category === 'fullbody') {
    // For full body, select from all categories proportionally
    // Apply 2024 research to each category
    const pushExercises = sortByResearch2024(
      exercises.filter(ex => FitnessKnowledge.classifyExercise(ex) === 'push'),
      'push'
    );
    const pullExercises = sortByResearch2024(
      exercises.filter(ex => FitnessKnowledge.classifyExercise(ex) === 'pull'),
      'pull'
    );
    const legExercises = sortByResearch2024(
      exercises.filter(ex => FitnessKnowledge.classifyExercise(ex) === 'legs'),
      'legs'
    );

    // Distribute exercises evenly across categories
    const pushCount = Math.ceil(count / 3);
    const pullCount = Math.ceil(count / 3);
    const legCount = count - pushCount - pullCount;

    // CRITICAL: Alternate push/pull/legs to prevent muscle group fatigue
    // Pattern: Push → Pull → Legs → Push → Pull → Legs...
    const alternated = [];
    const maxIterations = Math.max(pushCount, pullCount, legCount);

    for (let i = 0; i < maxIterations; i++) {
      if (i < pushCount && pushExercises[i]) alternated.push(pushExercises[i]);
      if (i < pullCount && pullExercises[i]) alternated.push(pullExercises[i]);
      if (i < legCount && legExercises[i]) alternated.push(legExercises[i]);
    }

    prioritized = alternated.slice(0, count);

    console.log(`   Full Body - Alternated Pattern (Push/Pull/Legs): ${pushCount}/${pullCount}/${legCount}`);
  } else {
    // Apply 2024 research prioritization
    prioritized = sortByResearch2024(exercises, category);
    console.log(`   🔬 2024 Tier S (Research-backed): ${prioritized.slice(0, 5).map(e => e.name).join(', ')}`);
  }

  // STEP 2: Select exercises based on goal
  const selected = [];

  if (goal === 'strength') {
    // Strength: Heavy compounds (mostly Tier S)
    // 70% Tier S compounds, 30% Tier A accessories
    const tierSCount = Math.ceil(count * 0.7);
    selected.push(...prioritized.slice(0, tierSCount));
    selected.push(...prioritized.slice(tierSCount, count));

  } else if (goal === 'hypertrophy') {
    // Hypertrophy: Balanced compounds + accessories
    // 40% Tier S, 40% Tier A, 20% Tier B
    const tierSCount = Math.ceil(count * 0.4);
    const tierACount = Math.ceil(count * 0.4);

    // Get Tier S exercises
    const tierS = prioritized.filter(ex =>
      ProvenWorkoutTemplates.isTierSExercise(ex.name, category)
    );
    selected.push(...tierS.slice(0, tierSCount));

    // Fill remaining with Tier A and B
    const remaining = prioritized.filter(ex => !selected.includes(ex));
    selected.push(...remaining.slice(0, count - selected.length));

  } else if (goal === 'endurance') {
    // Endurance: More variety, lighter exercises
    // 30% Tier S, 30% Tier A, 40% Tier B
    const tierSCount = Math.ceil(count * 0.3);
    selected.push(...prioritized.slice(0, tierSCount));
    selected.push(...prioritized.slice(tierSCount, count));

  } else {
    // General: Balanced approach (default hypertrophy style)
    const tierSCount = Math.ceil(count * 0.4);
    selected.push(...prioritized.slice(0, tierSCount));
    selected.push(...prioritized.slice(tierSCount, count));
  }

  // STEP 3: Ensure we have the minimum required exercises
  let finalSelection = selected.slice(0, count);

  // STEP 4: Intelligent Exercise Ordering (prevent CNS fatigue)
  // Alternate high-CNS compounds with low-CNS isolation exercises
  // Compounds: Squat, Deadlift, Bench, Row, OHP, Pull-ups
  // Isolation: Curls, Extensions, Raises, Flyes
  const compounds = ['Squat', 'Deadlift', 'Bench', 'Press', 'Row', 'Pull-up', 'Pull Up', 'Dip', 'Lunge'];
  const isolation = ['Curl', 'Extension', 'Raise', 'Fly', 'Flyes', 'Pushdown', 'Pulldown'];

  const isCompound = (ex) => compounds.some(comp => ex.name.includes(comp));
  const isIsolation = (ex) => isolation.some(iso => ex.name.includes(iso));

  // Reorder to alternate compound → isolation → compound → isolation
  const reordered = [];
  const compoundExercises = finalSelection.filter(isCompound);
  const isolationExercises = finalSelection.filter(isIsolation);
  const otherExercises = finalSelection.filter(ex => !isCompound(ex) && !isIsolation(ex));

  // Start with heaviest compound
  const maxCompounds = Math.max(compoundExercises.length, isolationExercises.length);
  for (let i = 0; i < maxCompounds; i++) {
    if (compoundExercises[i]) reordered.push(compoundExercises[i]);
    if (isolationExercises[i]) reordered.push(isolationExercises[i]);
  }

  // Add any remaining exercises
  reordered.push(...otherExercises);

  finalSelection = reordered.slice(0, count);

  // Log what was selected
  console.log(`✅ Selected ${finalSelection.length} exercises (ordered compound→isolation): ${finalSelection.map(e => e.name).join(', ')}`);

  return finalSelection;
}

/**
 * Sort exercises by 2024 research findings
 * Prioritizes research-backed exercises over older methodologies
 *
 * Key priorities:
 * 1. Research tier (S > A > B) based on 2024 studies
 * 2. Equipment type (Freeweights > Cables > Machines)
 * 3. Specific findings (Incline > Flat, Overhead Extensions > Pushdowns, Pull-ups > Pulldowns)
 */
function sortByResearch2024(exercises, category) {
  return exercises.sort((a, b) => {
    // Priority 1: Research tier from 2024 hierarchy
    const aTier = getExerciseTier2024(a.name, category);
    const bTier = getExerciseTier2024(b.name, category);

    const tierValues = { 'S': 1, 'A': 2, 'B': 3 };
    const aTierValue = tierValues[aTier] || 99;
    const bTierValue = tierValues[bTier] || 99;

    if (aTierValue !== bTierValue) {
      return aTierValue - bTierValue; // Lower is better (S=1, A=2, B=3)
    }

    // Priority 2: Equipment type (Freeweights > Cables > Machines)
    const aEquipmentPriority = getEquipmentPriority(a.equipment);
    const bEquipmentPriority = getEquipmentPriority(b.equipment);

    if (aEquipmentPriority !== bEquipmentPriority) {
      return aEquipmentPriority - bEquipmentPriority; // Lower is better
    }

    // Priority 3: Specific 2024 research findings
    // Incline Press > Flat Bench Press
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();

    if (category === 'push') {
      // Prioritize incline press over flat bench
      if (aNameLower.includes('incline') && bNameLower.includes('bench') && !bNameLower.includes('incline')) {
        return -1; // a (incline) comes first
      }
      if (bNameLower.includes('incline') && aNameLower.includes('bench') && !aNameLower.includes('incline')) {
        return 1; // b (incline) comes first
      }

      // Prioritize overhead extensions over pushdowns
      if (aNameLower.includes('overhead') && aNameLower.includes('extension') &&
          bNameLower.includes('pushdown')) {
        return -1;
      }
      if (bNameLower.includes('overhead') && bNameLower.includes('extension') &&
          aNameLower.includes('pushdown')) {
        return 1;
      }
    }

    if (category === 'pull') {
      // Prioritize pull-ups over lat pulldowns
      if (aNameLower.includes('pull-up') || aNameLower.includes('pull up')) {
        if (bNameLower.includes('pulldown') || bNameLower.includes('pull down')) {
          return -1; // a (pull-up) comes first
        }
      }
      if (bNameLower.includes('pull-up') || bNameLower.includes('pull up')) {
        if (aNameLower.includes('pulldown') || aNameLower.includes('pull down')) {
          return 1; // b (pull-up) comes first
        }
      }

      // Prioritize Bayesian curls over preacher curls
      if (aNameLower.includes('bayesian') && bNameLower.includes('preacher')) {
        return -1;
      }
      if (bNameLower.includes('bayesian') && aNameLower.includes('preacher')) {
        return 1;
      }
    }

    // Keep original order if no other criteria
    return 0;
  });
}

/**
 * Generate set/rep scheme based on goal
 */
function generateSetScheme(goal, experienceLevel) {
  const schemes = {
    strength: {
      beginner: { sets: 3, reps: '5-6', restTime: 180 },
      intermediate: { sets: 4, reps: '4-6', restTime: 180 },
      advanced: { sets: 5, reps: '3-5', restTime: 240 },
    },
    hypertrophy: {
      beginner: { sets: 3, reps: '8-10', restTime: 90 },
      intermediate: { sets: 4, reps: '8-12', restTime: 90 },
      advanced: { sets: 4, reps: '8-12', restTime: 60 },
    },
    endurance: {
      beginner: { sets: 2, reps: '12-15', restTime: 60 },
      intermediate: { sets: 3, reps: '15-20', restTime: 45 },
      advanced: { sets: 3, reps: '20-25', restTime: 30 },
    },
    general: {
      beginner: { sets: 3, reps: '8-10', restTime: 90 },
      intermediate: { sets: 3, reps: '8-12', restTime: 75 },
      advanced: { sets: 4, reps: '8-12', restTime: 60 },
    },
  };

  const goalSchemes = schemes[goal] || schemes.general;
  return goalSchemes[experienceLevel] || goalSchemes.intermediate;
}

/**
 * Generate workout title
 */
function generateWorkoutTitle(muscleGroups, goal) {
  const muscleStr = muscleGroups.join(' + ');
  const goalStr = goal === 'strength' ? 'Strength' :
                  goal === 'hypertrophy' ? 'Hypertrophy' :
                  goal === 'endurance' ? 'Endurance' : '';

  return `${muscleStr} ${goalStr}`.trim();
}

/**
 * GENERATE WORKOUT PROGRAM (Multiple Workouts - Full Program)
 * User says: "Create 4-day program" or "Make PPL program"
 */
export async function generateWorkoutProgram({ days, muscleGroups, experienceLevel, goal }) {
  try {
    console.log('📋 Generating program:', { days, muscleGroups, experienceLevel, goal });

    const programDays = parseInt(days) || 4;
    const workouts = [];

    // Common program splits based on days
    const programSplits = {
      3: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
      ],
      4: [
        { name: 'Upper', groups: ['chest', 'back', 'shoulders', 'arms'] },
        { name: 'Lower', groups: ['legs'] },
        { name: 'Upper', groups: ['chest', 'back', 'shoulders', 'arms'] },
        { name: 'Lower', groups: ['legs'] },
      ],
      5: [
        { name: 'Chest', groups: ['chest'] },
        { name: 'Back', groups: ['back'] },
        { name: 'Legs', groups: ['legs'] },
        { name: 'Shoulders', groups: ['shoulders'] },
        { name: 'Arms', groups: ['biceps', 'triceps'] },
      ],
      6: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
      ],
    };

    // Use the split or create custom
    const split = programSplits[programDays] || programSplits[4];

    // Generate each workout in the program
    for (let i = 0; i < programDays; i++) {
      const dayConfig = split[i % split.length];
      const workout = await generateWorkoutPlan({
        muscleGroups: dayConfig.groups,
        experienceLevel,
        goal,
        duration: 60,
      });

      if (workout.success) {
        workouts.push({
          dayNumber: i + 1,
          dayName: `Day ${i + 1}: ${dayConfig.name}`,
          name: dayConfig.name,
          exercises: workout.workout.exercises,
          muscleGroups: dayConfig.groups,
        });
      }
    }

    return {
      success: true,
      program: {
        title: `${programDays}-Day ${goal || 'General'} Program`,
        days: programDays,
        workouts,
        goal: goal || 'general',
        experienceLevel: experienceLevel || 'intermediate',
        totalWorkouts: workouts.length,
      },
    };
  } catch (error) {
    console.error('❌ generateWorkoutProgram error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Find exercise alternatives
 */
export async function findExerciseAlternatives({ exerciseName, equipment, muscleGroup }) {
  try {
    const allExercises = getAllExercises();

    // Find the original exercise
    const original = allExercises.find(ex =>
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    if (!original) {
      return {
        success: false,
        error: 'Original exercise not found'
      };
    }

    // Find alternatives targeting same muscles
    const targetMuscles = original.primaryMuscles || [muscleGroup];

    let alternatives = allExercises.filter(ex => {
      if (ex.name === original.name) return false;

      // Match primary muscles
      const matchesMuscles = targetMuscles.some(muscle =>
        ex.primaryMuscles?.includes(muscle)
      );

      // Match equipment if specified
      const matchesEquipment = !equipment || ex.equipment === equipment;

      return matchesMuscles && matchesEquipment;
    });

    // Filter out excluded exercises
    alternatives = filterExcludedExercises(alternatives);

    // Top 5 alternatives
    alternatives = alternatives.slice(0, 5);

    return {
      success: true,
      original: original.name,
      alternatives: alternatives.map(ex => ({
        name: ex.name,
        equipment: ex.equipment,
        muscles: ex.primaryMuscles,
        difficulty: ex.difficulty,
      }))
    };
  } catch (error) {
    console.error('❌ findExerciseAlternatives error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Replace an exercise in active or planned workout (ONE-SHOT)
 * Combines find alternative + replace into a single fluid action
 */
export async function replaceExerciseInWorkout({
  oldExerciseName,
  newExerciseName,
  workoutType = 'active', // 'active' or 'planned'
  equipment,
  userId
}) {
  try {
    const allExercises = getAllExercises();

    // Step 1: Find the old exercise
    const oldExercise = allExercises.find(ex =>
      ex.name.toLowerCase() === oldExerciseName.toLowerCase()
    );

    if (!oldExercise) {
      return {
        success: false,
        error: `Exercise "${oldExerciseName}" not found`
      };
    }

    let newExercise;

    // Step 2: Get the new exercise (either specified or auto-select best alternative)
    if (newExerciseName) {
      // User specified exact replacement
      newExercise = allExercises.find(ex =>
        ex.name.toLowerCase() === newExerciseName.toLowerCase()
      );

      if (!newExercise) {
        return {
          success: false,
          error: `Replacement exercise "${newExerciseName}" not found`
        };
      }
    } else {
      // Auto-select best alternative
      const targetMuscles = oldExercise.primaryMuscles || [];
      let alternatives = allExercises.filter(ex => {
        if (ex.name === oldExercise.name) return false;
        const matchesMuscles = targetMuscles.some(muscle =>
          ex.primaryMuscles?.includes(muscle)
        );
        const matchesEquipment = !equipment || ex.equipment?.toLowerCase() === equipment.toLowerCase();
        return matchesMuscles && matchesEquipment;
      });

      // Filter out excluded exercises
      alternatives = filterExcludedExercises(alternatives);

      if (alternatives.length === 0) {
        return {
          success: false,
          error: `No suitable alternatives found for "${oldExerciseName}"`
        };
      }

      // Pick the first (best) alternative
      newExercise = alternatives[0];
    }

    // Step 3: Replace in workout
    if (workoutType === 'active') {
      // Replace in active workout
      const activeWorkoutKey = '@active_workout';
      const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

      if (!activeWorkoutStr) {
        return {
          success: false,
          error: "No active workout found. Start a workout first."
        };
      }

      const activeWorkout = JSON.parse(activeWorkoutStr);

      // Find and replace the exercise
      const exerciseIndex = activeWorkout.exercises?.findIndex(ex =>
        ex.name.toLowerCase() === oldExerciseName.toLowerCase()
      );

      if (exerciseIndex === -1) {
        return {
          success: false,
          error: `"${oldExerciseName}" not found in active workout`
        };
      }

      // Replace exercise while keeping sets data
      const oldExerciseData = activeWorkout.exercises[exerciseIndex];
      activeWorkout.exercises[exerciseIndex] = {
        ...oldExerciseData,
        name: newExercise.name,
        equipment: newExercise.equipment,
        primaryMuscles: newExercise.primaryMuscles,
        secondaryMuscles: newExercise.secondaryMuscles,
        instructions: newExercise.instructions,
      };

      await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

      return {
        success: true,
        message: `Replaced "${oldExerciseName}" with "${newExercise.name}" in active workout`,
        oldExercise: oldExerciseName,
        newExercise: newExercise.name
      };

    } else if (workoutType === 'planned') {
      // Replace in planned workout
      // TODO: Implement planned workout replacement
      return {
        success: false,
        error: "Planned workout replacement not yet implemented. Use 'active' for now."
      };
    }

  } catch (error) {
    console.error('❌ replaceExerciseInWorkout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get workout history analysis
 */
export async function analyzeWorkoutHistory({ userId, days = 30 }) {
  try {
    const workouts = await WorkoutSyncService.getAllWorkouts(100);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        analysis: {
          totalWorkouts: 0,
          message: 'No workout history found'
        }
      };
    }

    // Filter to recent workouts
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentWorkouts = workouts.filter(w =>
      new Date(w.date) >= cutoffDate
    );

    // Calculate stats
    const totalWorkouts = recentWorkouts.length;
    const totalVolume = recentWorkouts.reduce((sum, w) => {
      return sum + (w.exercises || []).reduce((exSum, ex) => {
        return exSum + (ex.sets || []).reduce((setSum, set) => {
          return setSum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0);
      }, 0);
    }, 0);

    // Count muscle group frequency
    const muscleGroupCount = {};
    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const muscle = ex.primaryMuscles?.[0] || ex.muscleGroup || 'Unknown';
        muscleGroupCount[muscle] = (muscleGroupCount[muscle] || 0) + 1;
      });
    });

    // Find most/least trained
    const muscleEntries = Object.entries(muscleGroupCount);
    const mostTrained = muscleEntries.sort((a, b) => b[1] - a[1])[0];
    const leastTrained = muscleEntries.sort((a, b) => a[1] - b[1])[0];

    return {
      success: true,
      analysis: {
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        avgWorkoutsPerWeek: (totalWorkouts / (days / 7)).toFixed(1),
        muscleGroupBreakdown: muscleGroupCount,
        mostTrained: mostTrained ? mostTrained[0] : 'N/A',
        leastTrained: leastTrained ? leastTrained[0] : 'N/A',
        frequency: totalWorkouts / days,
      }
    };
  } catch (error) {
    console.error('❌ analyzeWorkoutHistory error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * INTELLIGENT WORKOUT RECOMMENDATION
 * Analyzes user data to recommend what to train today
 * Based on: muscle balance, active programs, recovery, and performance trends
 */
export async function recommendTodaysWorkout({ userId }) {
  try {
    console.log('🧠 Analyzing workout history for intelligent recommendation...');

    // Get recent workouts (last 30 days)
    const workouts = await WorkoutSyncService.getAllWorkouts(100);
    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        recommendation: {
          suggested: 'Full Body',
          reason: 'No workout history found. Start with a balanced full body workout.',
          muscleGroups: ['chest', 'back', 'legs'],
          restDayRecommended: false,
        }
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last30DaysWorkouts = workouts.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const last7DaysWorkouts = workouts.filter(w => new Date(w.date) >= sevenDaysAgo);

    // ANALYSIS 1: Check what was trained yesterday
    const yesterdaysWorkout = workouts.find(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === yesterday.toDateString();
    });

    // ANALYSIS 2: Muscle Group Balance (last 30 days)
    const muscleGroupCount = {};
    last30DaysWorkouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const muscles = ex.primaryMuscles || [ex.muscleGroup] || [];
        muscles.forEach(muscle => {
          if (muscle) {
            const muscleKey = muscle.toLowerCase();
            muscleGroupCount[muscleKey] = (muscleGroupCount[muscleKey] || 0) + 1;
          }
        });
      });
    });

    // Categorize into Push/Pull/Legs
    const pushMuscles = ['chest', 'pectorals', 'pecs', 'shoulders', 'deltoids', 'delts', 'triceps'];
    const pullMuscles = ['back', 'lats', 'traps', 'rhomboids', 'biceps', 'rear deltoids'];
    const legMuscles = ['legs', 'quadriceps', 'quads', 'hamstrings', 'glutes', 'calves'];

    let pushCount = 0, pullCount = 0, legCount = 0;

    Object.entries(muscleGroupCount).forEach(([muscle, count]) => {
      if (pushMuscles.some(pm => muscle.includes(pm))) pushCount += count;
      if (pullMuscles.some(pm => muscle.includes(pm))) pullCount += count;
      if (legMuscles.some(lm => muscle.includes(lm))) legCount += count;
    });

    console.log(`📊 Muscle balance (30 days): Push ${pushCount}, Pull ${pullCount}, Legs ${legCount}`);

    // ANALYSIS 3: Detect workout pattern/program
    const workoutTitles = last7DaysWorkouts.map(w => w.title?.toLowerCase() || '').filter(t => t);
    const isPPLProgram = workoutTitles.some(t => t.includes('push') || t.includes('pull') || t.includes('leg'));
    const isUpperLower = workoutTitles.some(t => t.includes('upper') || t.includes('lower'));

    // ANALYSIS 4: Recovery check (days since last workout)
    const lastWorkout = workouts[0];
    const lastWorkoutDate = lastWorkout ? new Date(lastWorkout.date) : null;
    const daysSinceLastWorkout = lastWorkoutDate ?
      Math.floor((now - lastWorkoutDate) / (1000 * 60 * 60 * 24)) : 999;

    console.log(`📅 Days since last workout: ${daysSinceLastWorkout}`);

    // ANALYSIS 5: Weekly workout frequency
    const weeklyFrequency = last7DaysWorkouts.length;
    console.log(`📈 Weekly frequency: ${weeklyFrequency} workouts`);

    // ============================================================
    // DECISION LOGIC
    // ============================================================

    let recommended = '';
    let reason = '';
    let muscleGroups = [];
    let restDayRecommended = false;

    // Calculate muscle balance percentages
    const total = pushCount + pullCount + legCount;
    const pushPercent = total > 0 ? (pushCount / total * 100).toFixed(0) : 0;
    const pullPercent = total > 0 ? (pullCount / total * 100).toFixed(0) : 0;
    const legPercent = total > 0 ? (legCount / total * 100).toFixed(0) : 0;

    // PRIORITY RULE: Severe muscle imbalance overrides everything (including rest days!)
    // If any muscle group is completely neglected (0%) or severely undertrained (<10%), fix that first
    if (total > 0 && (legCount === 0 || (legCount / total < 0.1))) {
      recommended = 'Legs';
      reason = `Muscle imbalance detected: Legs only ${legPercent}% vs Push ${pushPercent}%. Train Legs to balance.`;
      muscleGroups = ['legs', 'quadriceps', 'hamstrings', 'glutes'];
      // Note: Continue below to add rest day warning if needed
    } else if (total > 0 && (pullCount === 0 || (pullCount / total < 0.1))) {
      recommended = 'Pull';
      reason = `Muscle imbalance detected: Pull only ${pullPercent}% vs Push ${pushPercent}%. Train Pull to balance.`;
      muscleGroups = ['back', 'biceps'];
    } else if (total > 0 && (pushCount === 0 || (pushCount / total < 0.1))) {
      recommended = 'Push';
      reason = `Muscle imbalance detected: Push only ${pushPercent}% vs Pull ${pullPercent}%. Train Push to balance.`;
      muscleGroups = ['chest', 'shoulders', 'triceps'];
    }

    // Rule 1: Rest day needed? (>= 6 workouts this week)
    // Only recommend rest if there's no severe muscle imbalance
    else if (weeklyFrequency >= 6) {
      restDayRecommended = true;
      reason = `You've trained ${weeklyFrequency} times this week. Take a rest day for recovery.`;
      return {
        success: true,
        recommendation: {
          suggested: 'Rest Day',
          reason,
          restDayRecommended: true,
          alternativeWorkout: 'Light cardio or stretching',
        }
      };
    }

    // Rule 2: If following PPL program, recommend next in sequence (only if no severe imbalance)
    else if (!recommended && isPPLProgram && yesterdaysWorkout) {
      const yesterdayTitle = yesterdaysWorkout.title?.toLowerCase() || '';

      if (yesterdayTitle.includes('push')) {
        recommended = 'Pull';
        reason = 'You did Push yesterday. Following PPL sequence, today is Pull day.';
        muscleGroups = ['back', 'biceps'];
      } else if (yesterdayTitle.includes('pull')) {
        recommended = 'Legs';
        reason = 'You did Pull yesterday. Following PPL sequence, today is Leg day.';
        muscleGroups = ['legs'];
      } else if (yesterdayTitle.includes('leg')) {
        if (weeklyFrequency >= 5) {
          restDayRecommended = true;
          recommended = 'Rest Day';
          reason = 'You did Legs yesterday and trained 5+ times this week. Rest day recommended, or start new PPL cycle with Push tomorrow.';
        } else {
          recommended = 'Push';
          reason = 'You did Legs yesterday. Starting new PPL cycle with Push day.';
          muscleGroups = ['chest', 'shoulders', 'triceps'];
        }
      }
    }

    // Rule 3: If following Upper/Lower, recommend next (only if no severe imbalance or PPL)
    else if (!recommended && isUpperLower && yesterdaysWorkout) {
      const yesterdayTitle = yesterdaysWorkout.title?.toLowerCase() || '';

      if (yesterdayTitle.includes('upper')) {
        recommended = 'Lower';
        reason = 'You did Upper yesterday. Following Upper/Lower split, today is Lower day.';
        muscleGroups = ['legs'];
      } else if (yesterdayTitle.includes('lower')) {
        recommended = 'Upper';
        reason = 'You did Lower yesterday. Following Upper/Lower split, today is Upper day.';
        muscleGroups = ['chest', 'back', 'shoulders', 'arms'];
      }
    }

    // Rule 4: Muscle balance - recommend weakest muscle group (only if no recommendation yet)
    else if (!recommended) {
      if (total === 0) {
        recommended = 'Full Body';
        reason = 'Start with a balanced full body workout to assess your baseline.';
        muscleGroups = ['chest', 'back', 'legs'];
      } else {
        // Find least trained muscle group
        const balance = [
          { name: 'Push', count: pushCount, percent: (pushCount / total * 100).toFixed(0) },
          { name: 'Pull', count: pullCount, percent: (pullCount / total * 100).toFixed(0) },
          { name: 'Legs', count: legCount, percent: (legCount / total * 100).toFixed(0) },
        ].sort((a, b) => a.count - b.count);

        const weakest = balance[0];
        const strongest = balance[2];

        // If imbalance is >40% difference, strongly recommend weakest
        if (strongest.count - weakest.count >= total * 0.4) {
          recommended = weakest.name;
          reason = `Muscle imbalance detected: ${weakest.name} only ${weakest.percent}% vs ${strongest.name} ${strongest.percent}%. Train ${weakest.name} to balance.`;

          if (weakest.name === 'Push') muscleGroups = ['chest', 'shoulders', 'triceps'];
          else if (weakest.name === 'Pull') muscleGroups = ['back', 'biceps'];
          else if (weakest.name === 'Legs') muscleGroups = ['legs'];
        }
        // Else recommend based on rest days
        else if (daysSinceLastWorkout >= 2) {
          recommended = 'Full Body';
          reason = `${daysSinceLastWorkout} days since last workout. Jump back in with a full body session.`;
          muscleGroups = ['chest', 'back', 'legs'];
        } else if (daysSinceLastWorkout === 1) {
          recommended = balance[0].name; // Train weakest
          reason = `Muscle balance: ${balance.map(b => `${b.name} ${b.percent}%`).join(', ')}. Train ${balance[0].name} today.`;

          if (balance[0].name === 'Push') muscleGroups = ['chest', 'shoulders', 'triceps'];
          else if (balance[0].name === 'Pull') muscleGroups = ['back', 'biceps'];
          else if (balance[0].name === 'Legs') muscleGroups = ['legs'];
        } else {
          // Worked out today already
          restDayRecommended = true;
          recommended = 'Rest Day';
          reason = 'You already trained today. Rest and recover.';
        }
      }
    }

    // Rule 5: Prevent training same muscle group 2 days in a row (unless program-based)
    if (yesterdaysWorkout && !isPPLProgram && !isUpperLower) {
      const yesterdayMuscles = yesterdaysWorkout.exercises?.flatMap(ex =>
        (ex.primaryMuscles || [ex.muscleGroup] || []).map(m => m?.toLowerCase())
      ) || [];

      const isSameMuscleGroup = muscleGroups.some(mg =>
        yesterdayMuscles.some(ym => ym?.includes(mg) || mg.includes(ym))
      );

      if (isSameMuscleGroup && !restDayRecommended) {
        // Switch to different muscle group
        const alternatives = [
          { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
          { name: 'Pull', muscles: ['back', 'biceps'] },
          { name: 'Legs', muscles: ['legs'] },
        ].filter(alt => !alt.muscles.some(m => yesterdayMuscles.includes(m)));

        if (alternatives.length > 0) {
          const chosen = alternatives[0];
          recommended = chosen.name;
          muscleGroups = chosen.muscles;
          reason = `You trained similar muscles yesterday. Switch to ${chosen.name} for recovery.`;
        }
      }
    }

    // Add rest day warning if training volume is high but muscle imbalance exists
    if (weeklyFrequency >= 6 && recommended && recommended !== 'Rest Day') {
      reason += ` ⚠️ Note: You've trained ${weeklyFrequency} times this week - consider keeping this session light or taking a rest day after.`;
    }

    return {
      success: true,
      recommendation: {
        suggested: recommended,
        reason: reason,
        muscleGroups: muscleGroups,
        restDayRecommended: restDayRecommended,
        analysis: {
          weeklyFrequency,
          daysSinceLastWorkout,
          muscleBalance: {
            push: `${(pushCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
            pull: `${(pullCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
            legs: `${(legCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
          },
          programDetected: isPPLProgram ? 'PPL' : isUpperLower ? 'Upper/Lower' : 'None',
        }
      }
    };

  } catch (error) {
    console.error('❌ recommendTodaysWorkout error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export tool schemas for Gemini function calling
export const workoutToolSchemas = [
  {
    name: 'recommendTodaysWorkout',
    description: 'Intelligent workout recommendation based on user history, muscle balance, active programs, and recovery. Use when user asks "What should I train today?" or "What to train today?". Analyzes: 1) Yesterday\'s workout to follow program sequence (PPL/Upper-Lower), 2) 30-day muscle balance to identify weak points, 3) Weekly frequency to suggest rest days, 4) Performance trends.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to analyze workout history',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'generateWorkoutProgram',
    description: 'Generate a FULL PROGRAM with multiple workouts (e.g., 4-day, 6-day PPL). Use when user asks to create a PROGRAM or multiple workouts. Returns complete program with all workouts.',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days per week (e.g., 3, 4, 5, 6)',
        },
        muscleGroups: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific muscle focus. If empty, creates balanced split.',
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level',
        },
        goal: {
          type: 'string',
          enum: ['strength', 'hypertrophy', 'endurance', 'general'],
          description: 'Training goal',
        },
      },
      required: ['days'],
    },
  },
  {
    name: 'generateWorkoutPlan',
    description: 'Generate a SINGLE workout (not a program). Use this when user asks to create ONE workout for today or a specific session.',
    parameters: {
      type: 'object',
      properties: {
        muscleGroups: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target muscle groups (e.g., ["chest", "triceps"])',
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level',
        },
        duration: {
          type: 'number',
          description: 'Workout duration in minutes',
        },
        goal: {
          type: 'string',
          enum: ['strength', 'hypertrophy', 'endurance', 'general'],
          description: 'Training goal',
        },
        equipment: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available equipment (e.g., ["barbell", "dumbbell"])',
        },
      },
      required: ['muscleGroups'],
    },
  },
  {
    name: 'findExerciseAlternatives',
    description: 'Find alternative exercises that target the same muscles. Use when user asks for substitutes or alternatives.',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise to find alternatives for',
        },
        equipment: {
          type: 'string',
          description: 'Preferred equipment (optional)',
        },
        muscleGroup: {
          type: 'string',
          description: 'Target muscle group',
        },
      },
      required: ['exerciseName'],
    },
  },
  {
    name: 'replaceExerciseInWorkout',
    description: 'ONE-SHOT exercise replacement. Instantly replace an exercise in the active workout with a specific exercise OR auto-select best alternative. Use when user says "replace X with Y" or "swap X for Y" or "change X to Y". Fluid single-step replacement - no extra questions needed.',
    parameters: {
      type: 'object',
      properties: {
        oldExerciseName: {
          type: 'string',
          description: 'Name of the exercise to replace (e.g., "Bench Press")',
        },
        newExerciseName: {
          type: 'string',
          description: 'Name of the new exercise (optional - if not provided, auto-selects best alternative)',
        },
        workoutType: {
          type: 'string',
          enum: ['active', 'planned'],
          description: 'Type of workout to modify (default: active)',
        },
        equipment: {
          type: 'string',
          description: 'Preferred equipment for auto-selection (e.g., "dumbbell", "barbell")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['oldExerciseName'],
    },
  },
  {
    name: 'analyzeWorkoutHistory',
    description: 'Analyze user workout history to identify patterns, frequency, volume, and muscle group balance. Use when user asks about their training history or patterns.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 30)',
        },
      },
      required: ['userId'],
    },
  },
];
