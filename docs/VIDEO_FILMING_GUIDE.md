# Exercise Video Filming Guide

## Overview
This guide explains how to film exercise demonstration videos for the Workout Wave app. When you're ready, tell Claude and we'll integrate the videos into the app.

---

## Equipment Needed

| Item | Notes | Cost |
|------|-------|------|
| Phone | iPhone or Android with good camera | You have |
| Tripod | Phone tripod with adjustable height | $15-30 |
| Lighting | Natural light or ring light | Optional |
| Background | Clean gym wall or plain backdrop | Free |

---

## Filming Setup

### Camera Position
- Height: Waist to chest level
- Distance: 5-6 feet from you
- Angle: Straight on (front view)
- Mode: **Landscape** (horizontal)

### Video Settings
- Resolution: 1080p (Full HD)
- Frame rate: 30fps
- Format: MP4

### Environment
- Good lighting (no shadows on your body)
- Clean, uncluttered background
- Quiet area (though videos will be muted)

---

## Filming Each Exercise

### Duration
- **5-8 seconds** per video
- 3-4 slow, controlled reps
- Videos will loop automatically

### Form Tips
- Wear fitted clothes so form is visible
- Full range of motion
- Controlled, smooth movements
- No talking needed (videos are muted in app)

### Multiple Angles (Optional - Future)
- Front view (required)
- Side view (nice to have)

---

## File Naming Convention

Name files to match exercise names in the database:

```
bench-press.mp4
incline-bench-press.mp4
decline-bench-press.mp4
dumbbell-fly.mp4
push-ups.mp4
squat.mp4
deadlift.mp4
bicep-curl.mp4
tricep-pushdown.mp4
lat-pulldown.mp4
...
```

**Rules:**
- All lowercase
- Use hyphens instead of spaces
- No special characters
- `.mp4` extension

---

## Folder Structure

Drop your videos here:

```
AI-Gym-Trainer/
  assets/
    videos/
      exercises/
        bench-press.mp4
        squat.mp4
        deadlift.mp4
        bicep-curl.mp4
        ... (all exercise videos)
```

---

## Exercise List to Film

### Chest (8 exercises)
- [ ] Bench Press
- [ ] Incline Bench Press
- [ ] Decline Bench Press
- [ ] Chest Fly
- [ ] Cable Crossover
- [ ] Push-ups
- [ ] Chest Dips
- [ ] Machine Chest Press

### Back (14 exercises)
- [ ] Lat Pulldown
- [ ] Cable Row
- [ ] One Arm Row
- [ ] Pullover
- [ ] Band Assisted Pull-up
- [ ] Cable Incline Pushdown
- [ ] Chin Up
- [ ] Muscle Up
- [ ] One Arm Lat Pulldown
- [ ] Pull Ups
- [ ] V Bar Pulldown
- [ ] Weighted Pull Ups
- [ ] T-Bar Row
- [ ] Assisted Pull-up

### Shoulders (8 exercises)
- [ ] Shoulder Press
- [ ] Lateral Raise
- [ ] Front Raise
- [ ] Shrugs
- [ ] Rear Delt Fly
- [ ] Upright Row
- [ ] Face Pull
- [ ] Rear Delt Cable

### Biceps (11 exercises)
- [ ] Bicep Curl
- [ ] One Arm Bicep Curl
- [ ] Hammer Curl
- [ ] Preacher Curl
- [ ] Concentration Curl
- [ ] Cross Body Hammer Curl
- [ ] High Cable Curl
- [ ] Reverse Curl
- [ ] Spider Curl
- [ ] Zottman Curl
- [ ] Cable Bicep Curl

### Triceps (10 exercises)
- [ ] Tricep Pushdown
- [ ] One Arm Tricep Pushdown
- [ ] Overhead Tricep Extension
- [ ] One Arm Overhead Extension
- [ ] Skull Crusher
- [ ] Dips
- [ ] Close Grip Bench Press
- [ ] Cable Incline Tricep Extension
- [ ] Diamond Push-ups
- [ ] Weighted Dips

### Abs (10 exercises)
- [ ] Crunches
- [ ] Plank
- [ ] Leg Raises
- [ ] Russian Twist
- [ ] Ab Wheel Rollout
- [ ] Bicycle Crunches
- [ ] Mountain Climbers
- [ ] Dead Bug
- [ ] Sit-Ups
- [ ] Burpees

### Legs (18 exercises)
- [ ] Leg Extension
- [ ] Leg Curl
- [ ] Standing Calf Raise
- [ ] Squat
- [ ] Hip Abduction
- [ ] Glute Kickback
- [ ] Hang Clean
- [ ] Hip Thrust
- [ ] Hack Squat
- [ ] Lunges
- [ ] Seated Calf Raise
- [ ] Deadlift
- [ ] Leg Press
- [ ] Bulgarian Split Squat
- [ ] Front Squat
- [ ] Step-Ups
- [ ] Hip Adduction
- [ ] Glute Bridge
- [ ] Romanian Deadlift

### Forearms (5 exercises)
- [ ] Wrist Curl
- [ ] Reverse Wrist Curl
- [ ] Farmer's Walk
- [ ] Plate Pinch
- [ ] Wrist Roller

### Cardio (7 exercises - optional, can skip)
- [ ] Treadmill
- [ ] Stationary Bike
- [ ] Rowing Machine
- [ ] Elliptical
- [ ] Jump Rope
- [ ] Stair Climber
- [ ] Burpees

---

## Total: ~90 exercises

**Time estimate:** 1-2 days at a gym

---

## When You're Ready

1. Film all videos following this guide
2. Drop them in `assets/videos/exercises/`
3. Tell Claude: "I've filmed the exercise videos, please integrate them"
4. Claude will:
   - Update the video player code
   - Set up the file mappings
   - Test playback
   - Bundle videos with the app (or set up cloud hosting)

---

## Hosting Options

### Option 1: Bundle with App
- Videos stored in app
- Works offline
- Increases app size (~500MB-1GB)

### Option 2: Firebase Storage (Recommended)
- Videos hosted in cloud
- Smaller app size
- Requires internet to view
- Free tier: 5GB storage, 1GB/day downloads

### Option 3: Your Own Server
- Full control
- Requires server setup
- Monthly hosting costs

---

## Questions?

When you're ready to start, just tell Claude and we'll set everything up!
