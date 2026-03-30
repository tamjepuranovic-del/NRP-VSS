/**
 * User.js
 * 
 * Represents the current application user.
 * Manages profile data and dietary preferences.
 */

export class User {
    /**
     * @param {Object} data
     * @param {string} data.id
     * @param {string} data.name
     * @param {string} data.email
     * @param {string} data.avatar
     * @param {Object} data.preferences
     */
    constructor({ id, name, email, avatar, preferences }) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this.email = email;
        this.avatar = avatar || '';
        this.preferences = preferences || {
            allergies: [],
            diet: null,
            smartFilter: false
        };
    }

    /**
     * Checks if the user has a specific allergy.
     * @param {string} allergen - e.g., 'Peanuts'
     * @returns {boolean}
     */
    hasAllergy(allergen) {
        return this.preferences.allergies.includes(allergen);
    }

    /**
     * Updates user preferences.
     * @param {Object} newPrefs - Partial preferences object to merge.
     */
    updatePreferences(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
    }
}
