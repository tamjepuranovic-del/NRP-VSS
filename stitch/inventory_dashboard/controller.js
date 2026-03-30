/**
 * controller.js - Inventory Dashboard
 * 
 * Handles logic for the dashboard:
 * - Displaying high-level stats (Total, Expiring)
 * - Listing items that are expiring soon
 */

import { InventoryService } from '../js/services/InventoryService.js';
import { $, $$, createEl } from '../js/utils/dom.js';

const ELEMENTS = {
    // Stats Cards - using specific text or structure to find them
    totalCount: $('p.text-3xl.font-bold:not(.text-red-500):not(.text-blue-500)'), // The black one
    expiringCount: $('p.text-3xl.font-bold.text-red-500'),
    recipesCount: $('p.text-3xl.font-bold.text-blue-500'),

    // Expiring Soon List
    expiringListContainer: $('.lg\\:col-span-1 .space-y-3')
    // Note: The selector above targets the container inside the first column of the grid
};

function init() {
    renderStats();
    renderExpiringItems();
}

function renderStats() {
    const stats = InventoryService.getStats();

    if (ELEMENTS.totalCount) ELEMENTS.totalCount.textContent = stats.total;
    if (ELEMENTS.expiringCount) ELEMENTS.expiringCount.textContent = stats.expiringSoon + stats.expired; // Combine or just show one? HTML says "Items Expiring"

    // For "Recipes Ready", we might need RecipeService, but let's just mock or calc simple logic
    // For now, let's leave it static or update if we had the logic ready.
    // If ELEMENTS.recipesCount is present, we could do:
    // ELEMENTS.recipesCount.textContent = 12; // Placeholder
}

function renderExpiringItems() {
    if (!ELEMENTS.expiringListContainer) return;

    const items = InventoryService.getAll();
    // Filter for items expiring soon (<= 3 days) or expired
    const expiringItems = items.filter(item => {
        const days = item.daysUntilExpiry();
        return days <= 3;
    }).sort((a, b) => a.daysUntilExpiry() - b.daysUntilExpiry()).slice(0, 3); // Show top 3

    ELEMENTS.expiringListContainer.innerHTML = '';

    if (expiringItems.length === 0) {
        ELEMENTS.expiringListContainer.innerHTML = '<p class="text-sm text-gray-500">No items expiring soon.</p>';
        return;
    }

    expiringItems.forEach(item => {
        const days = item.daysUntilExpiry();
        let timeText = days < 0 ? 'Expired' : (days === 0 ? 'Today' : `${days} days left`);
        let timeColor = days < 0 ? 'text-red-500' : 'text-orange-500';
        let borderColor = days < 0 ? 'border-red-100 dark:border-red-900/20' : 'border-orange-100 dark:border-orange-900/20';

        const div = createEl('div', `flex items-center gap-4 bg-white dark:bg-[#152a15] p-4 rounded-xl border ${borderColor}`);

        div.innerHTML = `
            <div class="w-12 h-12 rounded-lg bg-center bg-cover shrink-0 bg-gray-200 flex items-center justify-center font-bold text-xs" 
                 style="${item.thumbnail ? `background-image: url('${item.thumbnail}')` : ''}">
                 ${!item.thumbnail ? item.name[0] : ''}
            </div>
            <div class="flex-1">
                <h4 class="text-sm font-bold text-[#0d1b0d] dark:text-white">${item.name}</h4>
                <p class="text-xs ${timeColor} font-medium">${timeText}</p>
            </div>
            <button class="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-slate-400 hover:text-red-500" onclick="alert('Item deleted')">
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>
        `;
        // Note: Inline onclick is lazy; typically we'd use addEventListener, 
        // but for a quick list render this is cleaner to read in the code block. 
        // Better: attach a delegate listener to container.

        ELEMENTS.expiringListContainer.appendChild(div);
    });
}

init();
