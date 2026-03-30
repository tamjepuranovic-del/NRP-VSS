/**
 * Recipe.js
 * 
 * Represents a recipe that can be cooked using ingredients.
 * Includes methods for potential matching with inventory.
 */

export class Recipe {
    /**
     * @param {Object} data - The raw data object.
     * @param {string} [data.id] - Unique identifier.
     * @param {string} data.name - Name of the recipe.
     * @param {string[]} data.ingredients - List of required ingredient names.
     * @param {number} data.timeMinutes - Preparation/cooking time.
     * @param {string} data.difficulty - e.g., 'Easy', 'Medium'.
     * @param {string[]} data.dietTags - e.g., ['Vegan', 'Gluten-Free'].
     * @param {string} [data.image] - URL to recipe image.
     */
    constructor({ id, name, ingredients, timeMinutes, difficulty, dietTags, image }) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.ingredients = ingredients || [];
        this.timeMinutes = timeMinutes || 0;
        this.difficulty = difficulty || 'Easy';
        this.dietTags = dietTags || [];
        this.image = image || '';
    }

    /**
     * Calculates match score based on user inventory.
     * @param {Array<Object>} inventoryList - List of user's current ingredients.
     * @returns {number} Percentage match (0-100).
     */
    getMatchScore(inventoryList) {
        if (!inventoryList || inventoryList.length === 0) return 0;

        // Simple string matching for now (case-insensitive)
        const inventoryNames = inventoryList.map(i => i.name.toLowerCase());

        let matchCount = 0;
        this.ingredients.forEach(ing => {
            // Check if ingredient name (partially or fully) exists in inventory
            if (inventoryNames.some(invName => invName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(invName))) {
                matchCount++;
            }
        });

        return Math.round((matchCount / this.ingredients.length) * 100);
    }

    /**
     * Returns list of ingredients missing from the user's inventory.
     * @param {Array<Object>} inventoryList 
     * @returns {string[]} List of missing ingredient names.
     */
    getMissingIngredients(inventoryList) {
        if (!inventoryList) return this.ingredients;

        const inventoryNames = inventoryList.map(i => i.name.toLowerCase());

        return this.ingredients.filter(ing => {
            return !inventoryNames.some(invName => invName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(invName));
        });
    }

    /**
     * Checks if recipe fits within dietary needs.
     * @param {string} diet - e.g., 'Vegan'
     * @returns {boolean}
     */
    matchesDiet(diet) {
        if (!diet) return true;
        return this.dietTags.includes(diet);
    }

    /**
     * Calculates a priority score based on ingredient expiration dates.
     * @param {Array<Object>} inventoryList
     * @returns {number} Bonus score (higher is more urgent).
     */
    getExpirationScore(inventoryList) {
        if (!inventoryList || inventoryList.length === 0) return 0;

        const inventoryMap = new Map(inventoryList.map(i => [i.name.toLowerCase(), i]));
        let expirationScore = 0;

        this.ingredients.forEach(reqIng => {
            const lowerReq = reqIng.toLowerCase();
            // Find match in inventory (partial matching like in getMatchScore)
            const match = Array.from(inventoryMap.values()).find(invItem => {
                const lowerInv = invItem.name.toLowerCase();
                return lowerInv.includes(lowerReq) || lowerReq.includes(lowerInv);
            });

            if (match && typeof match.daysUntilExpiry === 'function') {
                const daysLeft = match.daysUntilExpiry();
                if (daysLeft <= 0) {
                    expirationScore += 20; // Expired - high priority to use
                } else if (daysLeft <= 3) {
                    expirationScore += 10; // Expiring very soon
                } else if (daysLeft <= 7) {
                    expirationScore += 5; // Expiring soon
                }
            }
        });

        return expirationScore;
    }
}
