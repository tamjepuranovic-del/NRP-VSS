/**
 * controller.js - User Login
 * 
 * Handles login form submission.
 * Uses AuthService to mock-authenticate the user.
 */

import { AuthService } from '../js/services/AuthService.js';
import { $, on } from '../js/utils/dom.js';

const ELEMENTS = {
    form: $('form'),
    emailInput: $('input[type="email"]'),
    passwordInput: $('input[type="password"]'),
    submitBtn: $('button'), // The "Sign In" button
    registerLink: $('a[href*="register"]')
};

function init() {
    // Check if already logged in?
    // const user = AuthService.getCurrentUser();
    // if (user) window.location.href = '../inventory_dashboard/code.html';

    setupEventListeners();
}

function setupEventListeners() {
    if (ELEMENTS.form) {
        on(ELEMENTS.form, 'submit', async (e) => {
            e.preventDefault();

            const email = ELEMENTS.emailInput.value;
            const password = ELEMENTS.passwordInput.value;

            // Visual feedback
            const originalBtnText = ELEMENTS.submitBtn.textContent;
            ELEMENTS.submitBtn.textContent = 'Signing in...';
            ELEMENTS.submitBtn.disabled = true;

            try {
                const user = await AuthService.login(email, password);
                console.log('Logged in as:', user.name);

                // Redirect to dashboard
                window.location.href = '../inventory_dashboard/code.html';
            } catch (error) {
                alert('Login failed: ' + error.message);
                ELEMENTS.submitBtn.textContent = originalBtnText;
                ELEMENTS.submitBtn.disabled = false;
            }
        });
    }
}

init();
