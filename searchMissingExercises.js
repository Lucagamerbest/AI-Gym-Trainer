const fs = require('fs');
const db = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\free_exercise_db.json', 'utf8'));

const searches = [
  ['box jump', 'quadriceps'],
  ['romanian', 'hamstrings'],
  ['dip', 'triceps'],
  ['front raise', 'shoulders'],
  ['glute bridge', 'glutes'],
  ['glute kick', 'glutes'],
  ['lateral raise', 'shoulders'],
  ['leg extension', 'quadriceps'],
  ['leg press', 'quadriceps'],
  ['leg raise', 'abdominals'],
  ['pushup', 'chest'],
  ['step up', 'quadriceps'],
  ['treadmill', null],
  ['jog', null],
  ['wrist curl', 'forearms'],
  ['wrist roller', 'forearms']
];

searches.forEach(([term, muscle]) => {
  const results = db.filter(e => {
    const nameMatch = e.name.toLowerCase().includes(term);
    const muscleMatch = !muscle || (e.primaryMuscles && e.primaryMuscles.includes(muscle));
    return nameMatch && muscleMatch;
  }).slice(0, 3);

  console.log('\n' + term + ':');
  results.forEach(e => console.log('  ' + e.id + ' - ' + e.name));
});
