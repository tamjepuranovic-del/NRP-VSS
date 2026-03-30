/**
 * RecipeService.js
 * 
 * Manages recipe logic, including fetching recipes from the store,
 * calculating match scores against inventory, and filtering by dietary preferences.
 */

import store from '../core/Store.js';
import { Recipe } from '../models/Recipe.js';

export const RecipeService = {

    /**
     * Retrieves all recipes from the store.
     * @returns {Recipe[]} Array of Recipe objects.
     */
    getAll() {
        const rawData = store.get('recipes') || [];
        return rawData.map(item => new Recipe(item));
    },

    /**
     * Suggests recipes based on the provided inventory.
     * Sorts recipes by match score (highest first).
     * @param {Array<Ingredient>} inventory - List of available ingredients.
     * @returns {Recipe[]} Sorted list of recipes with match scores calculated.
     */
    suggestRecipes(inventory) {
        const allRecipes = this.getAll();

        // Calculate match score for each recipe
        // We strictly act on the Recipe model logic here
        const scoredRecipes = allRecipes.map(recipe => {
            // We attach a temporary property for sorting, 
            // effectively 'decorating' the object for this context
            // OR we could return a wrapper object. 
            // For simplicity in this vanilla app, we'll rely on the model's method 
            // and just sort the array based on re-calculating or caching.
            // Let's rely on the model method dynamically during sort to avoid mutating state too much,
            // or better, let's just sort.
            return recipe;
        });

        // Sort by match score descending, then by expiration score descending
        scoredRecipes.sort((a, b) => {
            const scoreA = a.getMatchScore(inventory);
            const scoreB = b.getMatchScore(inventory);

            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // If match scores are equal, prioritize expiring ingredients
            const expA = a.getExpirationScore(inventory);
            const expB = b.getExpirationScore(inventory);
            return expB - expA;
        });

        return scoredRecipes;
    },

    /**
     * Filters recipes by a specific diet tag.
     * @param {Recipe[]} recipes - List of recipes to filter.
     * @param {string|null} diet - Diet tag to filter by (e.g., 'Vegan'). If null/empty, returns all.
     * @returns {Recipe[]} Filtered list.
     */
    filterByDiet(recipes, diet) {
        if (!diet || diet === 'All') return recipes;
        return recipes.filter(recipe => recipe.matchesDiet(diet));
    },

    /**
     * Retrieves a single recipe by ID.
     * @param {string} id 
     * @returns {Recipe|null}
     */
    getById(id) {
        const recipes = this.getAll();
        return recipes.find(r => r.id === id) || null;
    }
};
