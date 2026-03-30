/**
 * Ingredient.js
 * 
 * Represents a single item in the fridge inventory.
 * Handles properties like quantity, expiry date, and category.
 */

export class Ingredient {
    /**
     * @param {Object} data - The raw data object.
     * @param {string} [data.id] - Unique identifier (auto-generated if missing).
     * @param {string} data.name - Name of the ingredient (e.g., 'Milk').
     * @param {string} data.category - Category (e.g., 'Dairy', 'Vegetables').
     * @param {number} data.quantity - Quantity of the item.
     * @param {string|Date} data.expiryDate - Expiration date string or object.
     * @param {string} [data.thumbnail] - URL to the item's image.
     */
    constructor({ id, name, category, quantity, expiryDate, thumbnail }) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.category = category;
        this.quantity = quantity || 1;
        this.expiryDate = new Date(expiryDate);
        this.thumbnail = thumbnail || '';
    }

    /**
     * Checks if the item is expired based on the current date.
     * @returns {boolean} True if expired.
     */
    isExpired() {
        const today = new Date();
        // Reset time part to compare only dates if strictly needed, 
        // but usually specific time expiry is fine. 
        // Here we just compare timestamps.
        return this.expiryDate < today;
    }

    /**
     * Calculates the number of days until the item expires.
     * Returns negative numbers if already expired.
     * @returns {number} Days remaining (rounded).
     */
    daysUntilExpiry() {
        const today = new Date();
        const diffTime = this.expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Serializes the object for storage.
     * @returns {Object} Plain object representation.
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            quantity: this.quantity,
            expiryDate: this.expiryDate.toISOString(),
            thumbnail: this.thumbnail
        };
    }
}
