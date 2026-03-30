/**
 * controller.js - User Registration
 * 
 * Handles registration form submission.
 */

import { AuthService } from '../js/services/AuthService.js';
import { $, on } from '../js/utils/dom.js';

const ELEMENTS = {
    form: $('form'),
    nameInput: $('input[placeholder="John Doe"]'),
    emailInput: $('input[type="email"]'),
    passwordInput: $('input[placeholder="••••••••"][type="password"]'), // First password input
    confirmPasswordInput: $$('input[type="password"]')[1], // Second password input
    termsCheckbox: $('#terms'),
    submitBtn: $('button[type="submit"]')
};

function init() {
    setupEventListeners();
}

function setupEventListeners() {
    if (ELEMENTS.form) {
        on(ELEMENTS.form, 'submit', async (e) => {
            e.preventDefault();

            const name = ELEMENTS.nameInput.value.trim();
            const email = ELEMENTS.emailInput.value.trim();
            const password = ELEMENTS.passwordInput.value;
            const confirmPassword = ELEMENTS.confirmPasswordInput.value;
            const termsAccepted = ELEMENTS.termsCheckbox.checked;

            // Basic Validation
            if (!name || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            if (!termsAccepted) {
                alert("You must agree to the Terms and Privacy Policy.");
                return;
            }

            // Visual feedback
            const originalBtnText = ELEMENTS.submitBtn.innerText;
            ELEMENTS.submitBtn.innerText = 'Creating Account...';
            ELEMENTS.submitBtn.disabled = true;

            try {
                // Attempt registration
                const user = await AuthService.register({ name, email, password });
                console.log('Registered user:', user);

                alert('Account created successfully! Please log in.');
                window.location.href = '../user_login_screen/code.html';

            } catch (error) {
                alert('Registration failed: ' + error.message);
                ELEMENTS.submitBtn.innerText = originalBtnText;
                ELEMENTS.submitBtn.disabled = false;
            }
        });
    }
}

// Helper for selecting multiple elements if needed, though here we used $$ inline or carefully selected.
function $$(selector) {
    return document.querySelectorAll(selector);
}

init();
