/**
 * InventoryService.js
 * 
 * Manages the business logic for the fridge inventory.
 * Interacts with the Store to persist data and transforms raw data into Ingredient models.
 */

import store from '../core/Store.js';
import { Ingredient } from '../models/Ingredient.js';

export const InventoryService = {

    /**
     * Retrieves all ingredients from the store.
     * @returns {Ingredient[]} Array of Ingredient objects.
     */
    getAll() {
        const rawData = store.get('ingredients') || [];
        return rawData.map(item => new Ingredient(item));
    },

    /**
     * Adds a new ingredient to the inventory.
     * If an ingredient with the same name already exists, increases its quantity.
     * @param {Object} itemData - Raw data for the new ingredient.
     * @returns {Ingredient} The added or updated ingredient object.
     */
    add(itemData) {
        const ingredients = this.getAll();
        const existingIndex = ingredients.findIndex(
            item => item.name.toLowerCase() === itemData.name.toLowerCase()
        );

        if (existingIndex !== -1) {
            // Update quantity of existing item
            const existingItem = ingredients[existingIndex];
            const newQuantity = (existingItem.quantity || 0) + (itemData.quantity || 1);

            const updatedItem = new Ingredient({
                ...existingItem,
                quantity: newQuantity,
                // Optionally update expiry if the new item is fresher? 
                // For now, let's just keep the original expiry or use the latest one.
                // Request says "just quantity increased".
            });
            ingredients[existingIndex] = updatedItem;
            this.saveAll(ingredients);
            return updatedItem;
        }

        const newIngredient = new Ingredient(itemData);
        ingredients.push(newIngredient);
        this.saveAll(ingredients);

        return newIngredient;
    },

    /**
     * Removes an ingredient by ID.
     * @param {string} id - The ID of the ingredient to remove.
     */
    remove(id) {
        const ingredients = this.getAll();
        const filtered = ingredients.filter(item => item.id !== id);
        this.saveAll(filtered);
    },

    /**
     * Updates an existing ingredient.
     * @param {string} id - The ID of the item to update.
     * @param {Object} updateData - Partial data to update.
     * @returns {Ingredient|null} The updated item or null if not found.
     */
    update(id, updateData) {
        const ingredients = this.getAll();
        const index = ingredients.findIndex(item => item.id === id);

        if (index === -1) return null;

        // Merge existing data with updates
        // We create a new Ingredient instance to ensure method availability and validation if we had it
        const updatedItem = new Ingredient({ ...ingredients[index], ...updateData });
        ingredients[index] = updatedItem;

        this.saveAll(ingredients);
        return updatedItem;
    },

    /**
     * Calculates statistics for the dashboard.
     * @returns {Object} Stats object { total, expiringSoon, expired }
     */
    getStats() {
        const ingredients = this.getAll();
        const today = new Date();

        let total = 0;
        let expiringSoon = 0;
        let expired = 0;

        ingredients.forEach(item => {
            total++;
            if (item.isExpired()) {
                expired++;
            } else {
                const daysLeft = item.daysUntilExpiry();
                if (daysLeft <= 7) {
                    expiringSoon++;
                }
            }
        });

        return {
            total,
            expiringSoon,
            expired
        };
    },

    /**
     * Helper to persist the full array back to the store.
     * @private
     * @param {Ingredient[]} ingredients 
     */
    saveAll(ingredients) {
        // Serialize back to plain objects for storage
        const rawData = ingredients.map(item => item.toJSON());
        store.set('ingredients', rawData);
    }
};
