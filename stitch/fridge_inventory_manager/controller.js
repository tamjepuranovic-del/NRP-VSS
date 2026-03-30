/**
 * controller.js - Fridge Inventory Manager
 * 
 * Handles the logic for the inventory list page:
 * - Rendering the list of ingredients
 * - Filtering by category and search term
 * - Adding, editing, deleting items
 */

import { InventoryService } from '../js/services/InventoryService.js';
import { $, $$, on, createEl } from '../js/utils/dom.js';

// State
let state = {
    items: [],
    filter: 'All',
    search: ''
};

// Selectors
const ELEMENTS = {
    tbody: $('tbody'),
    searchInput: $('input[placeholder*="Search"]'),
    filterButtons: $$('.overflow-x-auto button'),
    addBtn: $('#add-item-btn'),
    // Stats Cards
    statTotal: $('#stat-total'),
    statExpiring: $('#stat-expiring'),
    statExpired: $('#stat-expired'),
    cardTotal: $('#card-total'),
    cardExpiring: $('#card-expiring'),
    cardExpired: $('#card-expired'),
    // Footer
    showingText: $('#showing-text')
};

/**
 * Initialize the page
 */
function init() {
    loadData();
    setupEventListeners();
    render();
}

/**
 * Load data from service
 */
function loadData() {
    state.items = InventoryService.getAll();
}

/**
 * Setup static event listeners
 */
function setupEventListeners() {
    // Search
    if (ELEMENTS.searchInput) {
        on(ELEMENTS.searchInput, 'input', (e) => {
            state.search = e.target.value.toLowerCase();
            render();
        });
    }

    // Filter Chips
    if (ELEMENTS.filterButtons) {
        ELEMENTS.filterButtons.forEach(btn => {
            on(btn, 'click', (e) => {
                // Update UI state of buttons
                ELEMENTS.filterButtons.forEach(b => {
                    b.classList.remove('bg-primary', 'text-[#0d1b0d]', 'font-bold');
                    b.classList.add('bg-primary/10', 'text-[#0d1b0d]', 'dark:text-white', 'font-medium');
                });

                // Active state
                const target = e.currentTarget;
                target.classList.remove('bg-primary/10', 'text-[#0d1b0d]', 'dark:text-white', 'font-medium');
                target.classList.add('bg-primary', 'text-[#0d1b0d]', 'font-bold');

                // Update filter logic
                const text = target.textContent.trim();
                state.filter = text.includes('All Items') ? 'All' : text.replace(/[^a-zA-Z]/g, '').trim();

                // Fallback checks
                if (target.innerText.includes('Dairy')) state.filter = 'Dairy';
                else if (target.innerText.includes('Meat')) state.filter = 'Meat';
                else if (target.innerText.includes('Vegetables')) state.filter = 'Vegetables';
                else if (target.innerText.includes('Fruit')) state.filter = 'Fruit';
                else if (target.innerText.includes('Drinks')) state.filter = 'Drinks';
                else if (target.innerText.includes('Grains')) state.filter = 'Grains';

                render();
            });
        });
    }

    // Stats Cards Filters
    if (ELEMENTS.cardTotal) {
        on(ELEMENTS.cardTotal, 'click', () => {
            state.filter = 'All';
            render();
        });
    }
    if (ELEMENTS.cardExpiring) {
        on(ELEMENTS.cardExpiring, 'click', () => {
            state.filter = 'Expiring';
            render();
        });
    }
    if (ELEMENTS.cardExpired) {
        on(ELEMENTS.cardExpired, 'click', () => {
            state.filter = 'Expired';
            render();
        });
    }

    // Add Item (Mock)
    if (ELEMENTS.addBtn) {
        on(ELEMENTS.addBtn, 'click', () => {
            const name = prompt("Enter item name (e.g., Cheddar Cheese):");
            if (name) {
                InventoryService.add({
                    name: name,
                    category: 'Dairy',
                    quantity: 1,
                    expiryDate: new Date(Date.now() + 86400000 * 7),
                    thumbnail: ''
                });
                loadData();
                render();
            }
        });
    }
}

/**
 * Render the table based on state
 */
function render() {
    if (!ELEMENTS.tbody) return;

    // Filter items
    const filtered = state.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(state.search);

        // Category or Status filtering
        let matchesFilter = state.filter === 'All' || item.category === state.filter;

        if (state.filter === 'Expiring') {
            matchesFilter = !item.isExpired() && item.daysUntilExpiry() <= 7;
        } else if (state.filter === 'Expired') {
            matchesFilter = item.isExpired();
        }

        return matchesSearch && matchesFilter;
    });

    // Update Stats Card Highlights
    const cards = [ELEMENTS.cardTotal, ELEMENTS.cardExpiring, ELEMENTS.cardExpired];
    cards.forEach(c => c?.classList.remove('ring-2', 'ring-primary', 'bg-primary/5'));

    if (state.filter === 'All' && ELEMENTS.cardTotal) {
        ELEMENTS.cardTotal.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
    } else if (state.filter === 'Expiring' && ELEMENTS.cardExpiring) {
        ELEMENTS.cardExpiring.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
    } else if (state.filter === 'Expired' && ELEMENTS.cardExpired) {
        ELEMENTS.cardExpired.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
    }

    // Update Stats
    const stats = InventoryService.getStats();
    if (ELEMENTS.statTotal) ELEMENTS.statTotal.textContent = stats.total;
    if (ELEMENTS.statExpiring) ELEMENTS.statExpiring.textContent = stats.expiringSoon;
    if (ELEMENTS.statExpired) ELEMENTS.statExpired.textContent = stats.expired;

    // Remove existing rows
    ELEMENTS.tbody.innerHTML = '';

    // Render rows
    if (filtered.length === 0) {
        ELEMENTS.tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No items found.</td></tr>';
    } else {
        filtered.forEach(item => {
            const isExpired = item.isExpired();
            const daysLeft = item.daysUntilExpiry();

            let statusStyles = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            let statusText = new Date(item.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            if (isExpired) {
                statusStyles = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
                statusText = "Expired";
            } else if (daysLeft <= 3) {
                statusStyles = "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
                statusText = `In ${daysLeft} days`;
            }

            const tr = createEl('tr', 'hover:bg-primary/5 transition-colors');
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                            ${item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined">inventory_2</span>'}
                        </div>
                        <div>
                            <p class="font-bold text-[#0d1b0d] dark:text-white">${item.name}</p>
                            <p class="text-xs text-[#4c9a4c]">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm">${item.category}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${statusStyles}">${statusText}</span>
                </td>
                <td class="px-6 py-4 text-center font-medium">${item.quantity}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        <button class="p-2 hover:bg-primary/10 rounded-lg text-[#4c9a4c] btn-edit" data-id="${item.id}"><span class="material-symbols-outlined">edit</span></button>
                        <button class="p-2 hover:bg-red-50 rounded-lg text-red-500 btn-delete" data-id="${item.id}"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </td>
            `;
            ELEMENTS.tbody.appendChild(tr);
        });
    }

    // Update Footer Text
    if (ELEMENTS.showingText) {
        ELEMENTS.showingText.innerText = `Showing ${filtered.length} of ${state.items.length} items`;
    }

    // Attach dynamic listeners (Delete)
    $$('.btn-delete').forEach(btn => {
        on(btn, 'click', (e) => {
            if (confirm('Delete this item?')) {
                const id = e.currentTarget.dataset.id;
                InventoryService.remove(id);
                loadData();
                render();
            }
        });
    });

    // Attach dynamic listeners (Edit)
    $$('.btn-edit').forEach(btn => {
        on(btn, 'click', (e) => {
            const id = e.currentTarget.dataset.id;
            const item = state.items.find(i => i.id === id);
            if (!item) return;

            const newName = prompt("Edit item name:", item.name);
            if (newName) {
                InventoryService.update(id, { name: newName });
                loadData();
                render();
            }
        });
    });
}

// Start
init();
