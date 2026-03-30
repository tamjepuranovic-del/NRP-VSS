/**
 * dom.js
 * 
 * Helper functions for common DOM operations.
 */

/**
 * Shorthand for document.querySelector.
 * @param {string} selector - CSS selector.
 * @param {HTMLElement|Document} [scope=document] - Element to search within.
 * @returns {HTMLElement|null} The matching element or null.
 */
export function $(selector, scope = document) {
    return scope.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll.
 * @param {string} selector - CSS selector.
 * @param {HTMLElement|Document} [scope=document] - Element to search within.
 * @returns {NodeList} The matching elements.
 */
export function $$(selector, scope = document) {
    return scope.querySelectorAll(selector);
}

/**
 * Creates a DOM element with specified tag, classes, and attributes.
 * @param {string} tag - HTML tag name (e.g., 'div', 'button').
 * @param {string|string[]} [classes] - Class string or array of class names.
 * @param {Object} [attributes] - Key-value pair of attributes (e.g., { id: 'my-id', src: '...' }).
 * @param {string} [text] - Text content of the element.
 * @returns {HTMLElement} The created element.
 */
export function createEl(tag, classes = '', attributes = {}, text = '') {
    const el = document.createElement(tag);

    // Add classes
    if (classes) {
        if (Array.isArray(classes)) {
            el.classList.add(...classes);
        } else {
            el.className = classes;
        }
    }

    // Add attributes
    for (const [key, value] of Object.entries(attributes)) {
        if (value !== null && value !== undefined) {
            el.setAttribute(key, value);
        }
    }

    // Add text content
    if (text) {
        el.textContent = text;
    }

    return el;
}

/**
 * Adds an event listener to an element.
 * @param {HTMLElement} el 
 * @param {string} event 
 * @param {Function} handler 
 */
export function on(el, event, handler) {
    if (el) {
        el.addEventListener(event, handler);
    }
}
