# 🔬 Scientific Database Research & Implementation Plan

**Last Updated:** 2025-10-11
**Purpose:** Build scientifically accurate, evidence-based exercise and nutrition databases for AI-powered coaching

---

## 📊 PART 1: EXERCISE SCIENCE DATABASES

### 🎯 Authoritative Sources

#### **Academic Research Databases**
- **SPORTDiscus** - Most comprehensive exercise science database
- **PubMed/MEDLINE** - NIH medical research (free access)
- **Scopus** - International peer-reviewed literature
- **NSCA** - National Strength & Conditioning Association
- **ACSM** - American College of Sports Medicine

#### **Professional Organizations**
1. **NSCA (National Strength & Conditioning Association)**
   - Gold standard for program design
   - Evidence-based training protocols
   - Resource: "Essentials of Strength Training and Conditioning" (4th Edition)

2. **ACSM (American College of Sports Medicine)**
   - Medical-grade exercise guidelines
   - Position stands on resistance training
   - Progression models for healthy adults

### 💾 Free Exercise Database APIs

#### **1. ExerciseDB API** ⭐ RECOMMENDED
- **GitHub:** https://github.com/ExerciseDB/exercisedb-api
- **Exercises:** 1500+ (recently expanded to 5000+)
- **Data Includes:**
  - Target body parts
  - Equipment needed
  - Videos & GIFs
  - Step-by-step instructions
  - Visual guidance images
- **License:** Open Source
- **Status:** Actively maintained (2025)

#### **2. Free Exercise DB**
- **GitHub:** https://github.com/yuhonas/free-exercise-db
- **Demo:** https://yuhonas.github.io/free-exercise-db/
- **Exercises:** 800+
- **Data Includes:**
  - Exercise name
  - Force (push/pull/static)
  - Level (beginner/intermediate/advanced)
  - Mechanic (compound/isolation)
  - Equipment
  - Primary & secondary muscles
  - Instructions
- **License:** Public Domain
- **Format:** JSON (direct access from GitHub)

#### **3. Wrkout Exercises.json**
- **GitHub:** https://github.com/wrkout/exercises.json
- **Features:** PostgreSQL export scripts
- **Goal:** Complete public domain dataset
- **License:** Public Domain

### 📚 Evidence-Based Training Principles (ACSM/NSCA)

#### **Training Frequency**
| Level | Frequency |
|-------|-----------|
| Novice | 2-3 days/week |
| Intermediate | 3-4 days/week |
| Advanced | 4-5 days/week |

#### **Loading & Repetitions**
| Goal | Load (% 1RM) | Reps | Rest Period | Velocity |
|------|--------------|------|-------------|----------|
| **Strength** | 80-100% | 1-5 | 3-5 min | Slow/moderate |
| **Hypertrophy** | 67-85% | 6-12 | 1-2 min | Moderate |
| **Endurance** | 40-60% | 12-20+ | 30-60 sec | Moderate/fast |
| **General (Novice)** | 67-85% | 8-12 | 1-2 min | Moderate |

#### **Progressive Overload Principles**
1. Increase weight by 2-10% when target reps exceeded
2. Periodization: vary volume/intensity every 4-8 weeks
3. Include concentric, eccentric, isometric actions
4. Balance bilateral and unilateral exercises
5. Mix single-joint and multi-joint movements

---

## 🍽️ PART 2: NUTRITION DATABASES

### 🎯 Authoritative Sources

#### **1. USDA FoodData Central API** ⭐ GOLD STANDARD
- **Website:** https://fdc.nal.usda.gov/
- **API Docs:** https://fdc.nal.usda.gov/api-guide/
- **Registration:** https://api.data.gov (free API key)
- **License:** Public Domain (CC0 1.0)

**Data Types:**
1. **Foundation Foods** - Core nutrient data
2. **SR Legacy** - Historical reference data
3. **FNDDS** - Food & Nutrient Database for Dietary Studies
4. **Branded Foods** - 300,000+ commercial products
5. **Experimental Foods** - Research data (includes Iodine database)

**API Endpoints:**
```
Base URL: https://api.nal.usda.gov/fdc/v1/

GET /food/{fdcId}            - Get food details
GET /foods                   - Get multiple foods
GET /foods/search            - Search foods
GET /foods/list              - Paged list
```

**Last Updated:** April 2025 (includes Child Nutrition Database)

#### **2. Open Food Facts API** ⭐ BARCODE SCANNING
- **Website:** https://world.openfoodfacts.org/
- **API Docs:** https://openfoodfacts.github.io/openfoodfacts-server/api/
- **Database Size:** 3+ million products worldwide
- **License:** Open Database License (free)

**Features:**
- Barcode scanning (GET /api/v2/product/{barcode})
- Nutri-Score calculation
- NOVA group (ultra-processing level)
- Allergen detection
- Vegan/vegetarian classification
- Ingredient parsing
- Additives identification

**Write Operations:** Yes (with authentication)

### 📊 Evidence-Based Nutrition Guidelines

#### **Macronutrient Splits by Goal**
| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| **Muscle Gain** | 30-35% | 40-50% | 20-30% |
| **Fat Loss** | 30-40% | 30-40% | 20-30% |
| **Maintenance** | 25-30% | 40-50% | 25-30% |
| **Endurance** | 15-20% | 55-65% | 20-25% |

#### **Protein Requirements (g/kg bodyweight/day)**
- Sedentary: 0.8-1.0
- Recreational athlete: 1.0-1.5
- Strength training: 1.6-2.2
- Fat loss (preserve muscle): 1.8-2.7

#### **Meal Planning Algorithms**
Based on research, optimal meal planning uses:

1. **Multi-Objective Optimization**
   - Nutritional goals (macros, micros)
   - User preferences
   - Dietary restrictions
   - Economic constraints
   - Environmental impact (optional)

2. **Reinforcement Learning + Collaborative Filtering**
   - Q-learning for meal suggestions
   - User feedback integration
   - Personalization over time

3. **Fuzzy Logic + Heuristic Search**
   - "Plate Value" optimization (>0.9 optimal)
   - Balance across meals (breakfast/lunch/dinner)
   - Flexibility vs constraints

4. **Linear Programming**
   - Minimize/maximize specific nutrients
   - Budget constraints
   - Food variety constraints

---

## 🤖 PART 3: AI COACHING LOGIC

### 🎯 Core Coaching Principles

#### **Exercise Programming**
1. **Needs Analysis**
   - Training age (beginner/intermediate/advanced)
   - Goals (strength/hypertrophy/endurance)
   - Available equipment
   - Time constraints
   - Injury history

2. **Progressive Overload**
   ```
   IF user completes target_reps for all sets:
       NEXT_WORKOUT: weight += 2.5-5% (upper body) or 5-10% (lower body)

   IF user fails to complete reps:
       NEXT_WORKOUT: maintain weight or reduce 5%

   IF plateau (no progress for 2+ weeks):
       APPLY: deload week (reduce volume 40-50%)
       OR CHANGE: rep scheme, exercise variation
   ```

3. **Volume Landmarks (Dr. Mike Israetel - Renaissance Periodization)**
   - **MV** (Maintenance Volume): Min to maintain muscle
   - **MEV** (Min Effective Volume): Min for growth
   - **MAV** (Max Adaptive Volume): Optimal growth zone
   - **MRV** (Max Recoverable Volume): Upper limit

   Example per muscle group per week:
   - Chest: 12-20 sets
   - Back: 14-22 sets
   - Legs: 12-18 sets
   - Arms: 14-20 sets

4. **Deload Protocol**
   - Every 4-8 weeks
   - Reduce volume by 40-50%
   - Maintain intensity (weight)
   - Duration: 1 week

#### **Nutrition Coaching**
1. **Caloric Targets**
   ```
   BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + s
   where s = +5 for males, -161 for females (Mifflin-St Jeor)

   TDEE = BMR × activity_factor
   Activity factors:
   - Sedentary: 1.2
   - Light (1-3 days/week): 1.375
   - Moderate (3-5 days/week): 1.55
   - Active (6-7 days/week): 1.725
   - Very active (2x/day): 1.9

   Weight Loss: TDEE - 300-500 cal
   Muscle Gain: TDEE + 200-400 cal
   Maintenance: TDEE
   ```

2. **Macro Distribution**
   - Set protein first (1.6-2.2 g/kg)
   - Set fats (0.8-1.0 g/kg minimum for hormones)
   - Fill remainder with carbs

3. **Meal Timing (Optional Optimization)**
   - Pre-workout: Carbs 1-3 hours before
   - Post-workout: Protein + carbs within 2 hours
   - Protein distribution: 20-40g per meal (3-5 meals)

### 🧠 AI Coach Decision Tree

```
START → User Profile
    ├─ Training Age?
    │  ├─ Beginner (0-1 year) → Full body 3x/week
    │  ├─ Intermediate (1-3 years) → Upper/Lower or Push/Pull/Legs
    │  └─ Advanced (3+ years) → Specialized split
    │
    ├─ Primary Goal?
    │  ├─ Strength → 3-6 reps, 85-100% 1RM
    │  ├─ Hypertrophy → 6-12 reps, 67-85% 1RM
    │  ├─ Fat Loss → Circuit training, metabolic work
    │  └─ General Fitness → 8-12 reps, balanced approach
    │
    ├─ Equipment Available?
    │  ├─ Full gym → All exercises available
    │  ├─ Home (dumbbells) → Filter to DB/bodyweight
    │  └─ Bodyweight only → Calisthenics program
    │
    ├─ Weekly Frequency?
    │  ├─ 2-3 days → Full body
    │  ├─ 4 days → Upper/Lower
    │  ├─ 5 days → Push/Pull/Legs + 2
    │  └─ 6 days → Push/Pull/Legs x2
    │
    └─ Nutrition Status?
       ├─ Logged food today? → Analyze macros
       ├─ Hitting protein target? → Suggest high-protein meals
       ├─ Calorie deficit needed? → Suggest low-cal high-volume foods
       └─ Macro imbalance? → Recommend specific foods
```

---

## 📋 PART 4: IMPLEMENTATION PLAN

### Phase 1: Database Integration (Week 1-2)
- [ ] Get USDA FoodData Central API key
- [ ] Test USDA API endpoints
- [ ] Clone ExerciseDB repository
- [ ] Parse JSON data into app format
- [ ] Set up Open Food Facts API
- [ ] Test barcode scanning integration

### Phase 2: Data Schema Design (Week 2)
- [ ] Design enhanced exercise schema
- [ ] Design enhanced food/recipe schema
- [ ] Create meal plan template schema
- [ ] Create workout program template schema
- [ ] Design AI coaching history schema

### Phase 3: Scientific Database Population (Week 3)
- [ ] Import 1500+ exercises from ExerciseDB
- [ ] Categorize by muscle group, equipment, level
- [ ] Add form cues and safety notes
- [ ] Create 100+ scientifically accurate meal templates
- [ ] Create 20+ evidence-based workout programs

### Phase 4: AI Coach Logic (Week 4-5)
- [ ] Implement user profiling algorithm
- [ ] Build progressive overload calculator
- [ ] Create meal plan generator
- [ ] Implement macro balancing algorithm
- [ ] Build coaching recommendation engine

### Phase 5: Integration & Testing (Week 6)
- [ ] Connect AI coach to user data
- [ ] Test recommendation accuracy
- [ ] Validate against NSCA/ACSM guidelines
- [ ] User acceptance testing
- [ ] Performance optimization

---

## 🔑 API Keys & Access

### Required Registrations
1. **USDA FoodData Central**
   - Register at: https://api.data.gov
   - Free tier: 1000 requests/hour
   - Store in: `.env` as `USDA_API_KEY`

2. **Open Food Facts**
   - No API key required for read
   - Write access needs user account
   - Rate limit: reasonable use

### Optional APIs
- **Nutritionix** - Alternative nutrition database ($50/month)
- **Spoonacular** - Recipe API (200 free requests/day)
- **Edamam** - Nutrition analysis (free tier available)

---

## 📚 Key References

### Exercise Science
1. NSCA "Essentials of Strength Training and Conditioning" (4th Ed)
2. ACSM Position Stand on Resistance Training (2009)
3. Renaissance Periodization - Volume Landmarks (Dr. Mike Israetel)
4. ExerciseDB Open Source Database

### Nutrition Science
1. USDA FoodData Central (April 2025)
2. ACSM/Academy of Nutrition Guidelines
3. International Society of Sports Nutrition (ISSN)
4. Evidence-based meal planning algorithms (2021-2024 research)

### AI & Algorithms
1. "Reinforcement Learning in Meal Planning" (PMC, 2024)
2. "Multi-objective Optimization for Diet Problems" (2021)
3. "Personalized Flexible Meal Planning" (NIH, 2023)

---

## ⚠️ Important Considerations

### Legal & Disclaimer
- App must include: "Consult a physician before starting any exercise program"
- Nutrition advice: "For informational purposes only, not medical advice"
- Exercise form: Include injury warnings and proper technique videos

### Data Quality
- Verify all exercise data against NSCA standards
- Cross-check nutrition data between USDA and Open Food Facts
- Include source citations for scientific claims
- Regular updates (quarterly) from authoritative sources

### User Safety
- Screen for health conditions before recommendations
- Progressive overload must be gradual (2-10% increases)
- Include deload protocols to prevent overtraining
- Warn about form breakdown and injury risks

---

## 🎯 Success Metrics

### App Credibility
- [ ] All exercises verified against NSCA database
- [ ] Nutrition data from USDA (gold standard)
- [ ] Training programs follow ACSM guidelines
- [ ] AI recommendations cite scientific principles

### User Outcomes
- [ ] Progressive overload tracking shows consistent strength gains
- [ ] Nutrition tracking helps users hit macro targets
- [ ] AI coach provides actionable, evidence-based advice
- [ ] Users achieve their goals (strength, muscle, fat loss)

---

**Next Steps:** Design database schemas based on this research
