console.log('AI Gym Trainer - Starting application...');

class GymTrainer {
    constructor() {
        this.workouts = [];
        this.users = [];
    }

    addWorkout(workout) {
        this.workouts.push(workout);
        console.log(`Workout added: ${workout.name}`);
    }

    getWorkouts() {
        return this.workouts;
    }
}

const trainer = new GymTrainer();
trainer.addWorkout({ name: 'Push Day', exercises: ['Bench Press', 'Shoulder Press', 'Tricep Dips'] });

console.log('Application initialized successfully!');