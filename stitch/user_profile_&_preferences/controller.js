/**
 * controller.js - User Profile & Preferences
 * 
 * Handles displaying and updating user profile data.
 * Manages dietary preferences and smart filter settings.
 */

import { AuthService } from '../js/services/AuthService.js';
import store from '../js/core/Store.js'; // Direct store access for updates for now
import { $, $$, on } from '../js/utils/dom.js';

// Elements
const ELEMENTS = {
    userName: $('h3.font-bold.text-lg'), // This selector might be weak, let's try to be more specific if possible or keep it if it works
    userEmail: $('p.text-sm.text-gray-500'),
    allergyCheckboxes: $$('div.space-y-1 input[type="checkbox"]'),
    dietRadios: $$('input[name="diet"]'),
    saveBtn: $('#save-prefs-btn'),
    resetBtn: $('#reset-prefs-btn'),
    smartFilterToggle: $('input.sr-only.peer')
};

// State
let currentUser = null;

function init() {
    currentUser = AuthService.getCurrentUser();

    // If we have a user, populate the fields
    if (currentUser) {
        renderProfile();
    } else {
        // Fallback for demo if no user is logged in via AuthService (e.g. direct reload)
        // We'll create a dummy user or just let it be empty
        console.warn("No user logged in. Functionality might be limited.");
    }

    setupEventListeners();
}

function renderProfile() {
    console.log('Rendering profile for:', currentUser?.name);

    if (currentUser) {
        // Since we don't have explicit elements for name/email in the profile card (only in the sidebar),
        // we might not be able to update them easily without adding IDs to HTML.
        // However, the side navbar has them.

        // Let's assume the user object has preferences
        // currentUser.preferences = { allergies: [], diet: 'Vegan', smartFilter: true }

        const prefs = currentUser.preferences || {};

        // 1. Allergies
        if (prefs.allergies) {
            ELEMENTS.allergyCheckboxes.forEach(cb => {
                const label = cb.nextElementSibling.textContent.trim();
                cb.checked = prefs.allergies.includes(label);
            });
        }

        // 2. Diet
        if (prefs.diet) {
            ELEMENTS.dietRadios.forEach(radio => {
                // Find reference to label text? 
                // The HTML structure is: div > div > span (Radio Name) ... input
                // Or we can just rely on value if we added value attributes. 
                // The current HTML lacks value attributes on radios! 
                // We'll rely on the surrounding text again.
                const container = radio.parentElement;
                const labelSpan = container.querySelector('span.font-medium, span.font-bold');
                if (labelSpan && labelSpan.textContent.trim() === prefs.diet) {
                    radio.checked = true;
                }
            });
        }

        // 3. Smart Filter
        if (ELEMENTS.smartFilterToggle && prefs.smartFilter !== undefined) {
            ELEMENTS.smartFilterToggle.checked = prefs.smartFilter;
        }
    }
}

function getPreferencesFromUI() {
    // Allergies
    const allergies = [];
    ELEMENTS.allergyCheckboxes.forEach(cb => {
        if (cb.checked) {
            allergies.push(cb.nextElementSibling.textContent.trim());
        }
    });

    // Diet
    let diet = '';
    ELEMENTS.dietRadios.forEach(radio => {
        if (radio.checked) {
            const container = radio.parentElement;
            const labelSpan = container.querySelector('span.font-medium, span.font-bold');
            if (labelSpan) diet = labelSpan.textContent.trim();
        }
    });

    // Smart Filter
    const smartFilter = ELEMENTS.smartFilterToggle ? ELEMENTS.smartFilterToggle.checked : false;

    return { allergies, diet, smartFilter };
}

function setupEventListeners() {
    // Save Button
    if (ELEMENTS.saveBtn) {
        on(ELEMENTS.saveBtn, 'click', () => {
            const newPrefs = getPreferencesFromUI();
            console.log('Saving preferences:', newPrefs);

            if (currentUser) {
                // In a real app, AuthService.updateUser(currentUser.id, { preferences: newPrefs });
                currentUser.preferences = newPrefs;
                AuthService.saveUser(currentUser); // Assuming we add this method or just mock it
                alert('Preferences saved successfully!');
            } else {
                alert('No user loaded to save preferences for.');
            }
        });
    }

    // Reset Button
    if (ELEMENTS.resetBtn) {
        on(ELEMENTS.resetBtn, 'click', () => {
            if (confirm("Reset all preferences to default?")) {
                // Reset UI
                ELEMENTS.allergyCheckboxes.forEach(cb => cb.checked = false);
                ELEMENTS.dietRadios.forEach(r => r.checked = false); // Or default to one
                // Default to generic diet?
                if (ELEMENTS.dietRadios[0]) ELEMENTS.dietRadios[0].checked = true; // First one

                if (ELEMENTS.smartFilterToggle) ELEMENTS.smartFilterToggle.checked = true;

                alert('Preferences reset.');
            }
        });
    }

    // Navigation Links (Placeholders)
    const links = $$('aside nav a');
    links.forEach(link => {
        const text = link.textContent.trim();

        if (text.includes('Notifications') || text.includes('Recipe History')) {
            on(link, 'click', (e) => {
                e.preventDefault();
                alert('Feature Coming Soon!');
            });
        } else if (text.includes('Account Settings')) {
            on(link, 'click', (e) => {
                // Just reload or do nothing as we are here
                // e.preventDefault(); 
            });
        }
    });

    // Sign Out
    const signoutBtn = Array.from(links).find(a => a.textContent.includes('Sign Out'));
    if (signoutBtn) {
        on(signoutBtn, 'click', (e) => {
            e.preventDefault(); // If it's a link, prevent default to handle logic first
            AuthService.logout();
            window.location.href = '../user_login_screen/code.html';
        });
    }
}

init();
