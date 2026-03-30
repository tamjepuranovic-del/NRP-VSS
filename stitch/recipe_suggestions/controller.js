/**
 * controller.js - Recipe Suggestions
 * 
 * Handles logic for suggesting recipes based on inventory.
 * Features:
 * - Sorting by match score (Inventory Service + Recipe Service)
 * - Filtering by diet
 * - Searching
 */

import { InventoryService } from '../js/services/InventoryService.js';
import { RecipeService } from '../js/services/RecipeService.js';
import { $, $$, on, createEl } from '../js/utils/dom.js';

const state = {
    inventory: [],
    recipes: [],
    filter: 'All', // 'All', 'Vegan', 'Gluten-Free', etc.
    search: ''
};

const ELEMENTS = {
    searchInput: $('input[placeholder*="Search recipes"]'),
    refreshBtn: $('#refresh-inventory-btn'), // "Refresh Inventory" button
    filterTabs: $$('.overflow-x-auto a'), // The tab links
    sectionReady: $('#section-ready .grid'), // "Recipes You Can Make Now" grid
    sectionMissing: $('#section-missing .grid'), // "Missing 1-2 Ingredients" grid

    // We might need to handle the section headers visibility too if lists are empty
    sectionReadyHeader: $('#section-ready'),
    sectionMissingHeader: $('#section-missing')
};

function init() {
    loadData();
    setupEventListeners();
    render();
}

function loadData() {
    state.inventory = InventoryService.getAll();

    // Check for temporary scanned items from the Visual Scanner
    const tempScanData = localStorage.getItem('stitch_temp_scan_ingredients');
    if (tempScanData) {
        const itemNames = tempScanData.split(',').filter(n => n);

        // Convert to temporary Ingredient objects
        // We give them a special ID or flag if we need to distinguish, 
        // but for RecipeService.suggestRecipes it mostly checks names.
        const tempIngredients = itemNames.map((name, index) => ({
            id: `temp_${index}`,
            name: name.trim(),
            category: 'Uncategorized', // Doesn't matter for matching
            quantity: 1,
            daysUntilExpiry: () => 7 // Mock expiry
        }));

        // Merge into inventory (avoid duplicates if possible, or just concat)
        // We'll just concat for the purpose of "Available Ingredients" checking
        console.log('Including scanned items in suggestions:', itemNames);
        state.inventory = [...state.inventory, ...tempIngredients];

        // Optional: Clear after use? 
        // Users might want to go back and forth, so maybe keep it for the session.
        // localStorage.removeItem('stitch_temp_scan_ingredients');
    }

    state.recipes = RecipeService.suggestRecipes(state.inventory);
}

function setupEventListeners() {
    // Search
    if (ELEMENTS.searchInput) {
        on(ELEMENTS.searchInput, 'input', (e) => {
            state.search = e.target.value.toLowerCase();
            render();
        });
    }

    // Refresh
    if (ELEMENTS.refreshBtn) {
        // Just reload data for this demo
        on(ELEMENTS.refreshBtn, 'click', () => {
            ELEMENTS.refreshBtn.classList.add('animate-spin'); // Mock loading
            setTimeout(() => {
                ELEMENTS.refreshBtn.classList.remove('animate-spin');
                loadData();
                render();
            }, 500);
        });
    }

    // Filter Tabs
    if (ELEMENTS.filterTabs) {
        ELEMENTS.filterTabs.forEach(tab => {
            on(tab, 'click', (e) => {
                e.preventDefault();

                // Update UI active state
                ELEMENTS.filterTabs.forEach(t => {
                    t.classList.remove('border-primary', 'text-[#0d1b0d]', 'dark:text-white');
                    t.classList.add('border-transparent', 'text-[#4c9a4c]', 'dark:text-[#a3c2a3]');
                });

                const target = e.currentTarget;
                target.classList.remove('border-transparent', 'text-[#4c9a4c]', 'dark:text-[#a3c2a3]');
                target.classList.add('border-primary', 'text-[#0d1b0d]', 'dark:text-white');

                // Update Filter Logic
                const text = target.innerText.trim();
                state.filter = text === 'All Suggestions' ? 'All' : text;
                render();
            });
        });
    }
}

function render() {
    // Filter recipes based on search and diet
    const filtered = state.recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(state.search);
        const matchesDiet = state.filter === 'All' || recipe.matchesDiet(state.filter);
        return matchesSearch && matchesDiet;
    });

    // Split by match score
    const readyToCook = [];
    const missingItems = [];

    filtered.forEach(recipe => {
        const matchScore = recipe.getMatchScore(state.inventory);
        if (matchScore === 100) {
            readyToCook.push(recipe);
        } else {
            missingItems.push(recipe);
        }
    });

    // Render "Ready to Cook" Section
    if (ELEMENTS.sectionReady) {
        ELEMENTS.sectionReady.innerHTML = '';
        if (readyToCook.length > 0) {
            ELEMENTS.sectionReadyHeader.style.display = 'block';
            readyToCook.forEach(recipe => {
                ELEMENTS.sectionReady.appendChild(createRecipeCard(recipe, true));
            });
        } else {
            ELEMENTS.sectionReadyHeader.style.display = 'none';
        }
    }

    // Render "Missing Ingredients" Section
    if (ELEMENTS.sectionMissing) {
        ELEMENTS.sectionMissing.innerHTML = '';
        if (missingItems.length > 0) {
            ELEMENTS.sectionMissingHeader.style.display = 'block';
            missingItems.forEach(recipe => {
                ELEMENTS.sectionMissing.appendChild(createRecipeCard(recipe, false));
            });
        } else {
            // Keep header visible if we want to show "No other recipes found" or similar, 
            // but if truly empty, hide. 
            // However, to ensure user sees *something* if they used to see valid new recipes:
            if (readyToCook.length === 0 && missingItems.length === 0) {
                ELEMENTS.sectionMissing.innerHTML = '<p class="text-gray-500">No recipes found matching your search.</p>';
                ELEMENTS.sectionMissingHeader.style.display = 'block';
            } else {
                ELEMENTS.sectionMissingHeader.style.display = 'none';
            }
        }
    }
}

function createRecipeCard(recipe, isReady) {
    const missing = recipe.getMissingIngredients(state.inventory);

    // Note: The HTML structure is slightly different for "Ready" vs "Missing".
    // I'll adapt a unified card logic that fits the general style.

    const div = createEl('div', 'group bg-white dark:bg-[#1a3a1a] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#e7f3e7] dark:border-[#2a4a2a]');

    // Image Background
    const bgStyle = recipe.image ? `background-image: url('${recipe.image}')` : 'background-color: #eee';
    const grayscale = isReady ? '' : 'grayscale-[0.3]';

    let badgeHtml = '';
    const expScore = recipe.getExpirationScore(state.inventory);

    if (expScore > 0) {
        badgeHtml = `<div class="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold z-10 animate-pulse flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">warning</span> URGENT: EXPIRING SOON
        </div>`;
    }

    if (!isReady && missing.length > 0) {
        badgeHtml += `<div class="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">${missing.length} ITEMS MISSING</div>`;
    }

    // Content
    const ingredientListHtml = isReady
        ? recipe.ingredients.map(ing => `<span class="flex items-center gap-1 px-2 py-1 bg-[#e7f3e7] dark:bg-primary/10 rounded text-xs text-[#4c9a4c] font-medium"><span class="material-symbols-outlined text-sm">check_circle</span> ${ing}</span>`).join('')
        : `<div class="flex flex-col gap-2">
             <div class="flex items-center justify-between">
                <span class="flex items-center gap-1 text-sm text-[#4c9a4c] dark:text-[#7ab67a]">
                   <span class="material-symbols-outlined text-base">check_circle</span> Have: ${recipe.ingredients.filter(i => !missing.includes(i)).join(', ')}
                </span>
             </div>
             <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20">
                <span class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 font-semibold">
                   <span class="material-symbols-outlined text-base">shopping_cart</span> Need: ${missing.join(', ')}
                </span>
             </div>
           </div>`;

    div.innerHTML = `
        <div class="relative h-48 w-full bg-center bg-cover ${grayscale}" style="${bgStyle}">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            ${badgeHtml}
            <div class="absolute bottom-4 left-4 text-white">
                <span class="flex items-center gap-1 text-xs font-bold uppercase"><span class="material-symbols-outlined text-xs">timer</span> ${recipe.timeMinutes} mins</span>
            </div>
        </div>
        <div class="p-5 flex flex-col gap-3">
            <h3 class="text-[#0d1b0d] dark:text-white text-lg font-bold">${recipe.name}</h3>
            <div class="flex flex-wrap gap-2">
                ${ingredientListHtml}
            </div>
            <button class="w-full py-3 bg-primary text-background-dark font-bold rounded-lg mt-2 group-hover:bg-primary/90 transition-colors">Start Cooking</button>
        </div>
    `;

    return div;
}

init();
