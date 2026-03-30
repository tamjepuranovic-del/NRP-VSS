/**
 * AuthService.js
 * 
 * Manages user authentication (login, register, logout).
 * currently uses a mock implementation interacting with the Store.
 */

import store from '../core/Store.js';
import { User } from '../models/User.js';

export const AuthService = {

    /**
     * Mocks a login process.
     * In a real app, this would verify against a backend API.
     * Here, we just check if the email matches the stored mock user for simplicity,
     * or allow any login if we treated it as a single-local-user app.
     * 
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<User>} The authenticated user object.
     */
    async login(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const storedUser = store.get('user');

        // Simple mock validation: 
        // If a user exists in store, check email. 
        // If not, maybe we should have failed, but Store seeds a user by default.
        if (storedUser && storedUser.email === email) {
            // We could check password here if we stored it, but we don't for this mock.
            // For now, accept the seeded user credential.
            return new User(storedUser);
        }

        throw new Error('Invalid credentials');
    },

    /**
     * Registers a new user.
     * Overwrites the single "current user" in our local store for this demo.
     * 
     * @param {Object} data - { name, email, password }
     * @returns {Promise<User>} The new user.
     */
    async register(data) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser = new User({
            name: data.name,
            email: data.email,
            // Password is not stored in this simple mock model
            preferences: {
                allergies: [],
                diet: null,
                smartFilter: false
            }
        });

        store.set('user', newUser);
        return newUser;
    },

    /**
     * Retrieves the currently logged-in user from the store.
     * @returns {User|null}
     */
    getCurrentUser() {
        const userData = store.get('user');
        if (!userData) return null;
        return new User(userData);
    },

    /**
     * Logs out the user.
     * For this local-only app, strictly speaking we might clear the 'user' key 
     * or just hold session state. Let's assume we keep data but "logout" 
     * might just be a UI state change in a real app. 
     * Here we'll do nothing distinctive for persistence 
     * unless we wanted to support multiple users on one device.
     */
    /**
     * Updates the user data in the store.
     * @param {User} user 
     */
    saveUser(user) {
        store.set('user', user);
    },

    logout() {
        // In a real JWT setup, we'd clear tokens here.
        console.log('User logged out');
    }
};
