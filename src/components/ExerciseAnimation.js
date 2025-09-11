import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/theme';

export default function ExerciseAnimation({ exerciseType, isPlaying = true }) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isPlaying]);

  const renderAnimation = () => {
    switch(exerciseType) {
      case 'bench-press':
      case 'barbell-press':
        return <BenchPressAnimation animatedValue={animatedValue} />;
      case 'squat':
      case 'leg-press':
        return <SquatAnimation animatedValue={animatedValue} />;
      case 'deadlift':
      case 'romanian-deadlift':
        return <DeadliftAnimation animatedValue={animatedValue} />;
      case 'pull-up':
      case 'lat-pulldown':
        return <PullUpAnimation animatedValue={animatedValue} />;
      case 'curl':
      case 'bicep-curl':
        return <CurlAnimation animatedValue={animatedValue} />;
      case 'push-up':
      case 'dip':
        return <PushUpAnimation animatedValue={animatedValue} />;
      case 'lateral-raise':
      case 'shoulder-raise':
        return <LateralRaiseAnimation animatedValue={animatedValue} />;
      case 'row':
      case 'cable-row':
        return <RowAnimation animatedValue={animatedValue} />;
      case 'leg-curl':
        return <LegCurlAnimation animatedValue={animatedValue} />;
      case 'leg-extension':
        return <LegExtensionAnimation animatedValue={animatedValue} />;
      case 'fly':
      case 'cable-fly':
        return <FlyAnimation animatedValue={animatedValue} />;
      case 'crunch':
      case 'sit-up':
        return <CrunchAnimation animatedValue={animatedValue} />;
      case 'plank':
        return <PlankAnimation animatedValue={animatedValue} />;
      default:
        return <DefaultAnimation animatedValue={animatedValue} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderAnimation()}
    </View>
  );
}

// Bench Press Animation
const BenchPressAnimation = ({ animatedValue }) => {
  const barY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  return (
    <View style={styles.animationContainer}>
      {/* Bench */}
      <View style={styles.bench} />
      
      {/* Person lying on bench */}
      <View style={styles.bodyHorizontal}>
        <View style={styles.head} />
        <View style={styles.torso} />
        <View style={styles.legs} />
      </View>
      
      {/* Arms and Bar */}
      <Animated.View style={[styles.barbell, { transform: [{ translateY: barY }] }]}>
        <View style={styles.weight} />
        <View style={styles.bar} />
        <View style={styles.weight} />
      </Animated.View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.chestIndicator]}>
        <Text style={styles.muscleText}>Chest</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.tricepIndicator]}>
        <Text style={styles.muscleText}>Triceps</Text>
      </View>
    </View>
  );
};

// Squat Animation
const SquatAnimation = ({ animatedValue }) => {
  const bodyY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const kneeAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.standingBody, { transform: [{ translateY: bodyY }] }]}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
        <View style={styles.barOnBack} />
      </Animated.View>
      
      <View style={styles.legsContainer}>
        <Animated.View style={[styles.thigh, { transform: [{ rotate: kneeAngle }] }]} />
        <View style={styles.calf} />
      </View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.quadIndicator]}>
        <Text style={styles.muscleText}>Quads</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.gluteIndicator]}>
        <Text style={styles.muscleText}>Glutes</Text>
      </View>
    </View>
  );
};

// Pull-Up Animation
const PullUpAnimation = ({ animatedValue }) => {
  const bodyY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <View style={styles.animationContainer}>
      {/* Pull-up bar */}
      <View style={styles.pullUpBar} />
      
      {/* Body */}
      <Animated.View style={[styles.hangingBody, { transform: [{ translateY: bodyY }] }]}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
        <View style={styles.armsUp} />
      </Animated.View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.latIndicator]}>
        <Text style={styles.muscleText}>Lats</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.bicepIndicator]}>
        <Text style={styles.muscleText}>Biceps</Text>
      </View>
    </View>
  );
};

// Curl Animation
const CurlAnimation = ({ animatedValue }) => {
  const forearmRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.standingBodySide}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
        
        {/* Upper arm */}
        <View style={styles.upperArm} />
        
        {/* Forearm with dumbbell */}
        <Animated.View style={[styles.forearm, { transform: [{ rotate: forearmRotate }] }]}>
          <View style={styles.dumbbell} />
        </Animated.View>
      </View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.bicepIndicator]}>
        <Text style={styles.muscleText}>Biceps</Text>
      </View>
    </View>
  );
};

// Deadlift Animation
const DeadliftAnimation = ({ animatedValue }) => {
  const hipAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '0deg'],
  });

  const barY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.bentBody, { transform: [{ rotate: hipAngle }] }]}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
      </Animated.View>
      
      <Animated.View style={[styles.deadliftBar, { transform: [{ translateY: barY }] }]}>
        <View style={styles.weight} />
        <View style={styles.bar} />
        <View style={styles.weight} />
      </Animated.View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.backIndicator]}>
        <Text style={styles.muscleText}>Back</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.hamstringIndicator]}>
        <Text style={styles.muscleText}>Hamstrings</Text>
      </View>
    </View>
  );
};

// Push-Up Animation
const PushUpAnimation = ({ animatedValue }) => {
  const bodyY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.pushUpPosition, { transform: [{ translateY: bodyY }] }]}>
        <View style={styles.plankBody} />
        <View style={styles.armsPushUp} />
      </Animated.View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.chestIndicator]}>
        <Text style={styles.muscleText}>Chest</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.tricepIndicator]}>
        <Text style={styles.muscleText}>Triceps</Text>
      </View>
    </View>
  );
};

// Lateral Raise Animation
const LateralRaiseAnimation = ({ animatedValue }) => {
  const armAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.standingBodyFront}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
        
        {/* Arms with dumbbells */}
        <Animated.View style={[styles.armLateral, styles.leftArm, { transform: [{ rotate: `-${armAngle}` }] }]}>
          <View style={styles.dumbbellSmall} />
        </Animated.View>
        <Animated.View style={[styles.armLateral, styles.rightArm, { transform: [{ rotate: armAngle }] }]}>
          <View style={styles.dumbbellSmall} />
        </Animated.View>
      </View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.shoulderIndicator]}>
        <Text style={styles.muscleText}>Shoulders</Text>
      </View>
    </View>
  );
};

// Row Animation
const RowAnimation = ({ animatedValue }) => {
  const handleX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.seatedBody}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
      </View>
      
      {/* Cable handle */}
      <Animated.View style={[styles.cableHandle, { transform: [{ translateX: handleX }] }]}>
        <View style={styles.handle} />
        <View style={styles.cable} />
      </Animated.View>
      
      {/* Muscle indicators */}
      <View style={[styles.muscleIndicator, styles.backIndicator]}>
        <Text style={styles.muscleText}>Back</Text>
      </View>
      <View style={[styles.muscleIndicator, styles.bicepIndicator]}>
        <Text style={styles.muscleText}>Biceps</Text>
      </View>
    </View>
  );
};

// Leg Curl Animation
const LegCurlAnimation = ({ animatedValue }) => {
  const legAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.lyingBody}>
        <View style={styles.headLying} />
        <View style={styles.torsoLying} />
      </View>
      
      <Animated.View style={[styles.lowerLeg, { transform: [{ rotate: legAngle }] }]}>
        <View style={styles.pad} />
      </Animated.View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.hamstringIndicator]}>
        <Text style={styles.muscleText}>Hamstrings</Text>
      </View>
    </View>
  );
};

// Leg Extension Animation
const LegExtensionAnimation = ({ animatedValue }) => {
  const legAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['90deg', '0deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.seatedBody}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
      </View>
      
      <Animated.View style={[styles.lowerLegExtension, { transform: [{ rotate: legAngle }] }]}>
        <View style={styles.pad} />
      </Animated.View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.quadIndicator]}>
        <Text style={styles.muscleText}>Quads</Text>
      </View>
    </View>
  );
};

// Fly Animation
const FlyAnimation = ({ animatedValue }) => {
  const armSpread = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 20],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.bench} />
      <View style={styles.bodyHorizontal}>
        <View style={styles.head} />
        <View style={styles.torso} />
      </View>
      
      <Animated.View style={[styles.flyArms, { width: armSpread }]}>
        <View style={styles.dumbbellSmall} />
        <View style={styles.dumbbellSmall} />
      </Animated.View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.chestIndicator]}>
        <Text style={styles.muscleText}>Chest</Text>
      </View>
    </View>
  );
};

// Crunch Animation
const CrunchAnimation = ({ animatedValue }) => {
  const torsoAngle = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });

  return (
    <View style={styles.animationContainer}>
      <View style={styles.lyingBody}>
        <Animated.View style={[styles.upperBody, { transform: [{ rotate: torsoAngle }] }]}>
          <View style={styles.headLying} />
          <View style={styles.torsoPartial} />
        </Animated.View>
        <View style={styles.lowerBody} />
      </View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.absIndicator]}>
        <Text style={styles.muscleText}>Abs</Text>
      </View>
    </View>
  );
};

// Plank Animation
const PlankAnimation = ({ animatedValue }) => {
  const shake = animatedValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -2, 0, 2, 0],
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.plankPosition, { transform: [{ translateY: shake }] }]}>
        <View style={styles.plankBody} />
        <View style={styles.elbowsDown} />
      </Animated.View>
      
      {/* Muscle indicator */}
      <View style={[styles.muscleIndicator, styles.coreIndicator]}>
        <Text style={styles.muscleText}>Core</Text>
      </View>
    </View>
  );
};

// Default Animation for exercises without specific animation
const DefaultAnimation = ({ animatedValue }) => {
  const pulse = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.defaultBody, { transform: [{ scale: pulse }] }]}>
        <View style={styles.headStanding} />
        <View style={styles.torsoStanding} />
        <View style={styles.armsDefault} />
        <View style={styles.legsDefault} />
      </Animated.View>
      
      <Text style={styles.defaultText}>Exercise Movement</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  animationContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Basic body parts
  head: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  headStanding: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: Colors.text,
    opacity: 0.3,
    marginBottom: 5,
  },
  headLying: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  torso: {
    width: 40,
    height: 60,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  torsoStanding: {
    width: 35,
    height: 50,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  torsoLying: {
    width: 60,
    height: 30,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  torsoPartial: {
    width: 30,
    height: 35,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  legs: {
    width: 30,
    height: 50,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  
  // Equipment
  bench: {
    position: 'absolute',
    width: 100,
    height: 10,
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
    bottom: 80,
  },
  barbell: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: 40,
  },
  bar: {
    width: 80,
    height: 6,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  weight: {
    width: 15,
    height: 25,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    borderRadius: 4,
  },
  dumbbell: {
    width: 30,
    height: 8,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    borderRadius: 4,
  },
  dumbbellSmall: {
    width: 20,
    height: 6,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    borderRadius: 3,
  },
  pullUpBar: {
    position: 'absolute',
    top: 20,
    width: 120,
    height: 6,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  
  // Body positions
  bodyHorizontal: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  standingBody: {
    alignItems: 'center',
  },
  standingBodySide: {
    alignItems: 'center',
    position: 'relative',
  },
  standingBodyFront: {
    alignItems: 'center',
    position: 'relative',
  },
  seatedBody: {
    alignItems: 'center',
    position: 'relative',
  },
  lyingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hangingBody: {
    alignItems: 'center',
    position: 'absolute',
    top: 30,
  },
  bentBody: {
    alignItems: 'center',
    transformOrigin: 'bottom',
  },
  pushUpPosition: {
    position: 'relative',
  },
  plankPosition: {
    position: 'relative',
  },
  
  // Arms and legs
  armsUp: {
    position: 'absolute',
    top: 25,
    width: 60,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  upperArm: {
    position: 'absolute',
    top: 35,
    width: 4,
    height: 25,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  forearm: {
    position: 'absolute',
    top: 60,
    width: 4,
    height: 25,
    backgroundColor: Colors.text,
    opacity: 0.3,
    transformOrigin: 'top',
  },
  armLateral: {
    position: 'absolute',
    top: 35,
    width: 30,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    transformOrigin: 'left',
  },
  leftArm: {
    left: 5,
  },
  rightArm: {
    right: 5,
    transformOrigin: 'right',
  },
  armsPushUp: {
    position: 'absolute',
    width: 80,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    top: 10,
  },
  armsDefault: {
    width: 50,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    marginVertical: 5,
  },
  legsDefault: {
    width: 30,
    height: 60,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  legsContainer: {
    position: 'absolute',
    bottom: 30,
  },
  thigh: {
    width: 30,
    height: 35,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
    transformOrigin: 'top',
  },
  calf: {
    width: 25,
    height: 30,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
    marginTop: -5,
  },
  lowerLeg: {
    position: 'absolute',
    right: 40,
    bottom: 60,
    width: 40,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    transformOrigin: 'left',
  },
  lowerLegExtension: {
    position: 'absolute',
    bottom: 50,
    width: 40,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    transformOrigin: 'left',
  },
  
  // Other equipment
  barOnBack: {
    position: 'absolute',
    top: 30,
    width: 70,
    height: 6,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    zIndex: -1,
  },
  deadliftBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 20,
  },
  cableHandle: {
    position: 'absolute',
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  handle: {
    width: 15,
    height: 20,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    borderRadius: 4,
  },
  cable: {
    width: 40,
    height: 2,
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  pad: {
    width: 20,
    height: 10,
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
    borderRadius: 4,
    position: 'absolute',
    right: 0,
  },
  flyArms: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    top: 60,
  },
  plankBody: {
    width: 80,
    height: 8,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 4,
  },
  elbowsDown: {
    position: 'absolute',
    bottom: -5,
    width: 60,
    height: 4,
    backgroundColor: Colors.text,
    opacity: 0.3,
    left: 10,
  },
  upperBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    transformOrigin: 'right',
  },
  lowerBody: {
    width: 40,
    height: 25,
    backgroundColor: Colors.text,
    opacity: 0.3,
    borderRadius: 8,
  },
  defaultBody: {
    alignItems: 'center',
  },
  
  // Muscle indicators
  muscleIndicator: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    opacity: 0.9,
  },
  muscleText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  chestIndicator: {
    top: 60,
    left: 20,
  },
  tricepIndicator: {
    top: 60,
    right: 20,
  },
  bicepIndicator: {
    top: 70,
    right: 20,
  },
  backIndicator: {
    top: 50,
    left: 20,
  },
  latIndicator: {
    top: 60,
    left: 20,
  },
  shoulderIndicator: {
    top: 40,
    right: 20,
  },
  quadIndicator: {
    bottom: 40,
    left: 20,
  },
  gluteIndicator: {
    bottom: 60,
    right: 20,
  },
  hamstringIndicator: {
    bottom: 50,
    right: 20,
  },
  absIndicator: {
    top: 70,
    left: '45%',
  },
  coreIndicator: {
    top: 80,
    left: '45%',
  },
  
  defaultText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});