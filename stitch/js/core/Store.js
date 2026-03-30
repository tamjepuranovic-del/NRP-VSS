/**
 * Store.js
 * 
 * A Singleton class acting as a wrapper around localStorage.
 * Handles data persistence, retrieval, and initial seeding of the application state.
 */

class Store {
  constructor() {
    if (Store.instance) {
      return Store.instance;
    }

    this.dbName = 'stitch_fridge_app';
    this.init();
    Store.instance = this;
  }

  /**
   * Initializes the store.
   * Checks if data exists in localStorage; if not, seeds default data.
   */
  init() {
    console.log('Store initialized.');

    // Check if main keys act primarily as our "tables"
    if (!this.get('ingredients')) {
      this.seedIngredients();
    }
    // Seed recipes (Force update if we still have the old small list)
    const currentRecipes = this.get('recipes');
    if (!currentRecipes || currentRecipes.length < 5) {
      this.seedRecipes();
    }
    if (!this.get('user')) {
      this.seedUser();
    }
  }

  // ==========================================================
  // Core CRUD Methods
  // ==========================================================

  /**
   * Retrieves a value by key.
   * @param {string} key - The key to retrieve.
   * @returns {any} The parsed value, or null if not found.
   */
  get(key) {
    try {
      const value = localStorage.getItem(`${this.dbName}_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Saves a value to localStorage.
   * @param {string} key - The key to save to.
   * @param {any} value - The value to stringify and save.
   */
  set(key, value) {
    try {
      localStorage.setItem(`${this.dbName}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }

  /**
   * Removes a key from localStorage.
   * @param {string} key - The key to remove.
   */
  remove(key) {
    localStorage.removeItem(`${this.dbName}_${key}`);
  }

  /**
   * Updates a value by key. 
   * If the existing value is an object, it performs a shallow merge.
   * If it's an array or primitive, it overwrites (same as set).
   * @param {string} key - The key to update.
   * @param {any} newValue - The new data.
   */
  update(key, newValue) {
    const existing = this.get(key);

    // specific logic for object merging if needed, otherwise just overwrite
    if (existing && typeof existing === 'object' && !Array.isArray(existing) && typeof newValue === 'object' && !Array.isArray(newValue)) {
      this.set(key, { ...existing, ...newValue });
    } else {
      this.set(key, newValue);
    }
  }

  /**
   * Returns a dump of all application-specific keys.
   * Useful for debugging or exporting state.
   * @returns {Object} object containing all known collections
   */
  getAll() {
    return {
      ingredients: this.get('ingredients'),
      recipes: this.get('recipes'),
      user: this.get('user')
    };
  }

  // ==========================================================
  // Seeding Default Data
  // ==========================================================

  seedIngredients() {
    const defaultIngredients = [
      { id: '1', name: 'Greek Yogurt', category: 'Dairy', quantity: 1, expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(), thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV47QfVlm0Efps-31bSLZlZkh3AJh1viyqE38hTWQx_VTxldDgaK-4dyONWZQ5KO1ukkes7MInZkPxoKfhYY0P1W41629UX6CFfYomjYYEBWom1egoyUSEsIyguWSjn_-_SBzjsLqinelVcHrKehLxkuyDz0hc9vGiHSkVFVaC2vbV-1bwyVzOKDGahzIubOZ8yxte-Se3MxzEgMa_uMWXnNboLnTLelq2IZjd0SEHJ6c5wwfJe-oKYTdxZnUEI2d63hwBMNganfo' },
      { id: '2', name: 'Fresh Spinach', category: 'Vegetables', quantity: 2, expiryDate: new Date(Date.now() + 86400000 * 2).toISOString(), thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoTlyme4kZJ7r95_2yYxrzsJwBzIQ5qOe4bBvdNmJ3FuvjkYIewVElaROZMChq-GXkYCQ4-DffkldZHp2_VzSab9XbzVd1hqBb8vQ6n7tJ7DssH5JaS1HhBMsFNZ92k3mgZv3hJJ21kWJwUoYhiini9gkHeaQoRXFdxpGj572-IUKzcv2GVPiZhundS597JDraOY7YZW9IGoOSXWD3tGMMXY30rMkAuw1j0IrCdVWFC2p-AnGs3rYkVaPwq_T9g-jNaKUNKNLb4kI' },
      { id: '3', name: 'Whole Milk', category: 'Dairy', quantity: 1, expiryDate: new Date(Date.now() + 86400000 * 1).toISOString(), thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKxaaIUS7_J-YSWY86XYoVnOrlqgiZZ0-vUWcVsbj4y-geowkgz-BdIPLTEAiOU_Uay9l5dK1chxLFY8qRiqZE2e5ZrMBs36rNOlPPNkwh43n6510vLP2f4mpPQNmpaI8FhbqlfHm6CjMbBasZNBHuMLPu73Rv7eHSliH4Hr-zZSeB3Y-sdSeSdKZ77tETukYN-xaa417QoVs5wpzCSfRhCCVzfhqYZUQ2w7eG8PXNmHiD3o4q1f_ddTAoXt2aZVsUN2XnaHfu_7Y' }
    ];
    this.set('ingredients', defaultIngredients);
    console.log('Seeded ingredients.');
  }

  seedRecipes() {
    const defaultRecipes = [
      {
        id: 'r1',
        name: 'Creamy Spinach Pasta',
        timeMinutes: 20,
        difficulty: 'Easy',
        dietTags: ['Vegetarian'],
        ingredients: ['Spinach', 'Milk', 'Pasta', 'Garlic'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiDz3QJiXCCRVe42Y5gEJizzGXPwwevMQ1HIxFbj_5AWaUiYRMYZfOnJlt1HgbVbQVAPmVfLv0b5_YP99muRgbodHkrYvrT8yMK6i3fpgJWIm5C8gLSDJ8fvERlqAzYT7VO2I2i1XbWnJNt43GdPGnQYs9VYzFyLHLLWrOo2r1RzOEPSBJ1csWhdlRh0Ym6C5w0S07FXL5rg7ZpjiFvSPGBR1p6pyBT4mb6zDqnzjaAKZwws3Xz682OSPUdD_hq3S4EV3SxZ1N2Zg'
      },
      {
        id: 'r2',
        name: 'Berry Yogurt Parfait',
        timeMinutes: 10,
        difficulty: 'Beginner',
        dietTags: ['Vegetarian', 'Gluten-Free'],
        ingredients: ['Yogurt', 'Berries', 'Granola', 'Honey'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKWPXo8Qfb1rUYLWZ8m8oCBkpmJFIdLwpUehskP-cWfcMwmPB4_0wLtIeOtSF1MPoFFr3p4RNsb0YIMwjbz8xcdFuEveZvRYyDqlEpKXT28nKBz_q9nsNyyBmTI_kXVZTQ6HQXkwc7nbHJfno_0-HfH_1eHpLL7Wfi6x49tp_R_pqzbUMaMCZmRV87wmiajE8Fqw66Ln5dnQ7FXfjjVxC8n25yGi7KTgbI3jT8o212hCE7sC-QSXR0K-3QzrNGzUoD1ynlDbCg458'
      },
      {
        id: 'r3',
        name: 'Chicken Stir Fry',
        timeMinutes: 25,
        difficulty: 'Medium',
        dietTags: ['High Protein', 'Dairy-Free'],
        ingredients: ['Chicken', 'Broccoli', 'Carrot', 'Soy Sauce', 'Rice'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAmkAwgg340cz2n96H7BloKWK8v1RvazrnmoALHJuBoi-zTMliJAr2gYJ3lcxmaVVAACMyx5JLk_uvz1to1v2iQGxDmepsC5UtW9PwFHUgd_CLJ-uvpW5wl8o0vxkY4vLDcH_nccQQsrjxt6-tuIFEREsdT_IlP82TFOFGmCoOMcJS_ypM9gjRfA-u-ITe_3XdPhYux6PX8165t3J9J_kEbHqe7o78Wz4Kf1pAotPakcM_e90GdfG7ESs95u9fAh1o3OQ5owvFjR8'
      },
      {
        id: 'r4',
        name: 'Classic Omelette',
        timeMinutes: 10,
        difficulty: 'Easy',
        dietTags: ['Vegetarian', 'Gluten-Free', 'High Protein'],
        ingredients: ['Eggs', 'Cheese', 'Spinach', 'Milk'],
        image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?q=80&w=2596&auto=format&fit=crop'
      },
      {
        id: 'r5',
        name: 'Fresh Fruit Salad',
        timeMinutes: 10,
        difficulty: 'Beginner',
        dietTags: ['Vegan', 'Gluten-Free', 'Healthy'],
        ingredients: ['Apple', 'Banana', 'Orange', 'Berries'],
        image: 'https://images.unsplash.com/photo-1565805561330-e3498801ce83?q=80&w=2670&auto=format&fit=crop'
      },
      {
        id: 'r6',
        name: 'Grilled Cheese Sandwich',
        timeMinutes: 15,
        difficulty: 'Easy',
        dietTags: ['Vegetarian', 'Comfort Food'],
        ingredients: ['Bread', 'Cheese', 'Butter'],
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=2673&auto=format&fit=crop'
      },
      {
        id: 'r7',
        name: 'Beef Tacos',
        timeMinutes: 30,
        difficulty: 'Medium',
        dietTags: ['High Protein'],
        ingredients: ['Beef', 'Tortilla', 'Cheese', 'Lettuce', 'Tomato'],
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=2670&auto=format&fit=crop'
      },
      {
        id: 'r8',
        name: 'Banana Bread',
        timeMinutes: 60,
        difficulty: 'Medium',
        dietTags: ['Vegetarian', 'Baking'],
        ingredients: ['Banana', 'Flour', 'Eggs', 'Sugar', 'Butter'],
        image: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?q=80&w=2574&auto=format&fit=crop'
      },
      {
        id: 'r9',
        name: 'Roasted Chicken & Veggies',
        timeMinutes: 45,
        difficulty: 'Medium',
        dietTags: ['High Protein', 'Gluten-Free'],
        ingredients: ['Chicken', 'Carrot', 'Potato', 'Onion', 'Oil'],
        image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=2669&auto=format&fit=crop'
      },
      {
        id: 'r10',
        name: 'Simple Spaghetti Bolognese',
        timeMinutes: 35,
        difficulty: 'Medium',
        dietTags: ['Family Favorite'],
        ingredients: ['Pasta', 'Beef', 'Tomato Sauce', 'Onion', 'Garlic'],
        image: 'https://images.unsplash.com/photo-1626844131082-256783844137?q=80&w=2574&auto=format&fit=crop'
      },
      {
        id: 'r11',
        name: 'Caesar Salad',
        timeMinutes: 15,
        difficulty: 'Easy',
        dietTags: ['Fresh'],
        ingredients: ['Lettuce', 'Chicken', 'Cheese', 'Croutons', 'Dressing'],
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=2670&auto=format&fit=crop'
      },
      {
        id: 'r12',
        name: 'Fish & Chips',
        timeMinutes: 40,
        difficulty: 'Medium',
        dietTags: ['Comfort Food'],
        ingredients: ['Fish', 'Potato', 'Oil', 'Flour'],
        image: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?q=80&w=2670&auto=format&fit=crop'
      }
    ];

    // Force update to ensure user sees new recipes
    // In a real app we'd use versioning, but for this fix we just overwrite.
    this.set('recipes', defaultRecipes);
    console.log('Seeded recipes (Forced Update v2).');
  }

  seedUser() {
    const defaultUser = {
      id: 'u1',
      name: 'John Doe',
      email: 'johndoe@example.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnU3dKMectg3Lh4hoo2T6Z20crY04FaCGoAvGOs0YtOpgFBb4fa5AxrEAKFTnqqtSb_JKcwQnPN3MFbFCaegfYuD1CgeFbUd4-htnTCW4rFm-8izYzgwemHp87vonCckKWN2HxWBG5OL1DkmLxHAccdIXdnCpYZ7-ce3fYoP1CTJQdn2bFZzuiopEBjgi-C2HUqehCWrbrl5TT3CLGJRa0nnfTHdH1mFatZhXpablvQkL00IQD0N79o_g1OuoZ0syd57xcVA60L1s',
      preferences: {
        allergies: ['Peanuts'],
        diet: 'Vegetarian',
        smartFilter: true
      }
    };
    this.set('user', defaultUser);
    console.log('Seeded user.');
  }
}

// Export singleton
const store = new Store();
export default store;
