// SQLite database for mobile platforms
let SQLite;
let db;

// Helper function to get local date string in YYYY-MM-DD format (avoids UTC timezone issues)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

try {
  SQLite = require('expo-sqlite');
  db = SQLite.openDatabase('foodtracker.db');
} catch (error) {
  // SQLite not available on this platform
}

// Initialize database tables
export const initDatabase = () => {
  if (!db) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Foods table - stores all food items
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT UNIQUE,
          name TEXT NOT NULL,
          brand TEXT,
          calories REAL NOT NULL,
          protein REAL DEFAULT 0,
          carbs REAL DEFAULT 0,
          fat REAL DEFAULT 0,
          fiber REAL DEFAULT 0,
          sugar REAL DEFAULT 0,
          sodium REAL DEFAULT 0,
          saturated_fat REAL DEFAULT 0,
          serving_size TEXT DEFAULT '100g',
          image_url TEXT,
          nutrition_grade TEXT,
          source TEXT DEFAULT 'manual',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => {},
        (_, error) => {}
      );

      // Daily consumption table - tracks what user eats each day
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS daily_consumption (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          food_id INTEGER NOT NULL,
          date DATE NOT NULL,
          meal_type TEXT DEFAULT 'snack',
          quantity_grams REAL NOT NULL,
          calories_consumed REAL NOT NULL,
          protein_consumed REAL DEFAULT 0,
          carbs_consumed REAL DEFAULT 0,
          fat_consumed REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (food_id) REFERENCES foods (id)
        );`,
        [],
        () => {},
        (_, error) => {}
      );

      // User favorites table - quick access to frequent foods
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          food_id INTEGER NOT NULL,
          last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
          use_count INTEGER DEFAULT 1,
          UNIQUE(user_id, food_id),
          FOREIGN KEY (food_id) REFERENCES foods (id)
        );`,
        [],
        () => {},
        (_, error) => {}
      );

      // Create indexes for better search performance
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_foods_name ON foods (name);',
        [],
        () => {},
        (_, error) => {}
      );

      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods (barcode);',
        [],
        () => {},
        (_, error) => {}
      );

      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_consumption_date ON daily_consumption (date);',
        [],
        () => {},
        (_, error) => {}
      );
    },
    () => resolve(),
    (error) => reject(error));
  });
};

// Add or update food in database
export const saveFood = (foodData) => {
  if (!db) return Promise.reject(new Error('Database not available'));

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Check if food exists (by barcode if available)
      if (foodData.barcode) {
        tx.executeSql(
          'SELECT * FROM foods WHERE barcode = ?',
          [foodData.barcode],
          (_, { rows }) => {
            if (rows.length > 0) {
              // Update existing food
              tx.executeSql(
                `UPDATE foods SET
                  name = ?, brand = ?, calories = ?, protein = ?, carbs = ?,
                  fat = ?, fiber = ?, sugar = ?, sodium = ?, saturated_fat = ?,
                  serving_size = ?, image_url = ?, nutrition_grade = ?,
                  source = ?, updated_at = CURRENT_TIMESTAMP
                WHERE barcode = ?`,
                [
                  foodData.name, foodData.brand, foodData.calories,
                  foodData.protein, foodData.carbs, foodData.fat,
                  foodData.fiber, foodData.sugar, foodData.sodium,
                  foodData.saturated_fat, foodData.serving_size,
                  foodData.image_url, foodData.nutrition_grade,
                  foodData.source || 'api', foodData.barcode
                ],
                (_, result) => resolve(rows.item(0).id),
                (_, error) => reject(error)
              );
            } else {
              // Insert new food
              insertFood(tx, foodData, resolve, reject);
            }
          },
          (_, error) => reject(error)
        );
      } else {
        // Insert new food without barcode
        insertFood(tx, foodData, resolve, reject);
      }
    });
  });
};

const insertFood = (tx, foodData, resolve, reject) => {
  tx.executeSql(
    `INSERT INTO foods
      (barcode, name, brand, calories, protein, carbs, fat, fiber,
       sugar, sodium, saturated_fat, serving_size, image_url,
       nutrition_grade, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      foodData.barcode || null,
      foodData.name,
      foodData.brand || '',
      foodData.calories,
      foodData.protein || 0,
      foodData.carbs || 0,
      foodData.fat || 0,
      foodData.fiber || 0,
      foodData.sugar || 0,
      foodData.sodium || 0,
      foodData.saturated_fat || 0,
      foodData.serving_size || '100g',
      foodData.image_url || null,
      foodData.nutrition_grade || null,
      foodData.source || 'manual'
    ],
    (_, result) => resolve(result.insertId),
    (_, error) => reject(error)
  );
};

// Search foods by name
export const searchFoods = (searchQuery) => {
  if (!db) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM foods
         WHERE name LIKE ? OR brand LIKE ?
         ORDER BY
           CASE
             WHEN name LIKE ? THEN 1
             WHEN name LIKE ? THEN 2
             ELSE 3
           END,
           name
         LIMIT 50`,
        [`%${searchQuery}%`, `%${searchQuery}%`, `${searchQuery}%`, `%${searchQuery}%`],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

// Get food by barcode
export const getFoodByBarcode = (barcode) => {
  if (!db) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM foods WHERE barcode = ?',
        [barcode],
        (_, { rows }) => resolve(rows.length > 0 ? rows.item(0) : null),
        (_, error) => reject(error)
      );
    });
  });
};

// Add food to daily consumption
export const addToDaily = (foodId, quantity, userId, mealType = 'snack') => {
  if (!db) return Promise.reject(new Error('Database not available'));
  if (!userId) return Promise.reject(new Error('User ID is required'));

  return new Promise((resolve, reject) => {
    const today = getLocalDateString();

    db.transaction(tx => {
      // Get food details
      tx.executeSql(
        'SELECT * FROM foods WHERE id = ?',
        [foodId],
        (_, { rows }) => {
          if (rows.length === 0) {
            reject(new Error('Food not found'));
            return;
          }

          const food = rows.item(0);
          const multiplier = quantity / 100; // Convert to per 100g basis

          // Calculate consumed values
          const caloriesConsumed = food.calories * multiplier;
          const proteinConsumed = food.protein * multiplier;
          const carbsConsumed = food.carbs * multiplier;
          const fatConsumed = food.fat * multiplier;

          // Insert into daily consumption
          tx.executeSql(
            `INSERT INTO daily_consumption
              (user_id, food_id, date, meal_type, quantity_grams, calories_consumed,
               protein_consumed, carbs_consumed, fat_consumed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId, foodId, today, mealType, quantity, caloriesConsumed,
              proteinConsumed, carbsConsumed, fatConsumed
            ],
            (_, result) => {
              // Update favorites
              updateFavorites(tx, foodId, userId);
              resolve(result.insertId);
            },
            (_, error) => reject(error)
          );
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Update user favorites
const updateFavorites = (tx, foodId, userId) => {
  tx.executeSql(
    `INSERT INTO user_favorites (user_id, food_id, use_count)
     VALUES (?, ?, 1)
     ON CONFLICT(user_id, food_id)
     DO UPDATE SET
       use_count = use_count + 1,
       last_used = CURRENT_TIMESTAMP`,
    [userId, foodId],
    () => {},
    (_, error) => {}
  );
};

// Get daily consumption summary
export const getDailySummary = (userId, date = null) => {
  const targetDate = date || getLocalDateString();

  if (!db) return Promise.resolve({ date: targetDate, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  if (!userId) return Promise.resolve({ date: targetDate, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT
           dc.*,
           f.name as food_name,
           f.brand as food_brand,
           f.image_url
         FROM daily_consumption dc
         JOIN foods f ON dc.food_id = f.id
         WHERE dc.user_id = ? AND dc.date = ?
         ORDER BY dc.created_at DESC`,
        [userId, targetDate],
        (_, { rows }) => {
          // Calculate totals
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          const items = rows._array;
          items.forEach(item => {
            totalCalories += item.calories_consumed;
            totalProtein += item.protein_consumed;
            totalCarbs += item.carbs_consumed;
            totalFat += item.fat_consumed;
          });

          resolve({
            date: targetDate,
            items: items,
            totals: {
              calories: Math.round(totalCalories),
              protein: parseFloat(totalProtein.toFixed(1)),
              carbs: parseFloat(totalCarbs.toFixed(1)),
              fat: parseFloat(totalFat.toFixed(1))
            }
          });
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Get favorite foods
export const getFavorites = (userId, limit = 10) => {
  if (!db) return Promise.resolve([]);
  if (!userId) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT
           f.*,
           uf.use_count,
           uf.last_used
         FROM user_favorites uf
         JOIN foods f ON uf.food_id = f.id
         WHERE uf.user_id = ?
         ORDER BY uf.use_count DESC, uf.last_used DESC
         LIMIT ?`,
        [userId, limit],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

// Get recent foods
export const getRecentFoods = (userId, limit = 10) => {
  if (!db) return Promise.resolve([]);
  if (!userId) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT DISTINCT
           f.*
         FROM daily_consumption dc
         JOIN foods f ON dc.food_id = f.id
         WHERE dc.user_id = ?
         ORDER BY dc.created_at DESC
         LIMIT ?`,
        [userId, limit],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

// Delete food from daily consumption
export const removeFromDaily = (consumptionId, userId) => {
  if (!db) return Promise.resolve(0);
  if (!userId) return Promise.resolve(0);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM daily_consumption WHERE id = ? AND user_id = ?',
        [consumptionId, userId],
        (_, result) => resolve(result.rowsAffected),
        (_, error) => reject(error)
      );
    });
  });
};

// Get weekly summary
export const getWeeklySummary = (userId) => {
  if (!db) return Promise.resolve([]);
  if (!userId) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    db.transaction(tx => {
      tx.executeSql(
        `SELECT
           date,
           SUM(calories_consumed) as total_calories,
           SUM(protein_consumed) as total_protein,
           SUM(carbs_consumed) as total_carbs,
           SUM(fat_consumed) as total_fat
         FROM daily_consumption
         WHERE user_id = ? AND date BETWEEN ? AND ?
         GROUP BY date
         ORDER BY date`,
        [
          userId,
          getLocalDateString(startDate),
          getLocalDateString(endDate)
        ],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

// Save food from API to database
export const saveFoodFromAPI = (apiData) => {
  const foodData = {
    barcode: apiData.barcode,
    name: apiData.name,
    brand: apiData.brand,
    calories: apiData.nutrition.calories,
    protein: apiData.nutrition.protein,
    carbs: apiData.nutrition.carbs,
    fat: apiData.nutrition.fat,
    fiber: apiData.nutrition.fiber,
    sugar: apiData.nutrition.sugar,
    sodium: apiData.nutrition.sodium,
    saturated_fat: apiData.nutrition.saturatedFat,
    serving_size: apiData.servingSize || '100g',
    image_url: apiData.imageUrl,
    nutrition_grade: apiData.nutritionGrade,
    source: apiData.source || 'api'
  };

  return saveFood(foodData);
};