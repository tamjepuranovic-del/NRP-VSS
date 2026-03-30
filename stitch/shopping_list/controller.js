/**
 * controller.js - Shopping List
 */

import { $, $$, on, createEl } from '../js/utils/dom.js';

// State
let items = [
    { id: '1', name: 'Almond Milk', category: 'Drinks', checked: false },
    { id: '2', name: 'Eggs (Dozen)', category: 'Dairy', checked: false },
    { id: '3', name: 'Avocados', category: 'Vegetables', checked: true }
];

const ELEMENTS = {
    tbody: $('#shopping-list-body'),
    addBtn: $('#add-item-btn'),
    emptyState: $('#empty-state')
};

function init() {
    render();
    setupEventListeners();
}

function render() {
    if (!ELEMENTS.tbody) return;

    ELEMENTS.tbody.innerHTML = '';

    if (items.length === 0) {
        ELEMENTS.emptyState.classList.remove('hidden');
        ELEMENTS.emptyState.classList.add('flex');
        return;
    } else {
        ELEMENTS.emptyState.classList.add('hidden');
        ELEMENTS.emptyState.classList.remove('flex');
    }

    items.forEach(item => {
        const tr = createEl('tr', 'group hover:bg-primary/5 transition-colors');
        if (item.checked) tr.classList.add('opacity-50', 'bg-gray-50', 'dark:bg-white/5');

        tr.innerHTML = `
            <td class="px-6 py-4">
                <input type="checkbox" class="w-5 h-5 rounded border-primary text-primary focus:ring-primary cursor-pointer toggle-check" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
            </td>
            <td class="px-6 py-4">
                <p class="font-bold text-[#0d1b0d] dark:text-white ${item.checked ? 'line-through text-gray-500' : ''}">${item.name}</p>
            </td>
            <td class="px-6 py-4 text-sm">${item.category}</td>
            <td class="px-6 py-4 text-right">
                <button class="p-2 hover:bg-red-50 rounded-lg text-red-500 btn-delete transition-colors" data-id="${item.id}" title="Remove Item">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        `;

        ELEMENTS.tbody.appendChild(tr);
    });

    // Re-attach dynamic listeners
    $$('.toggle-check').forEach(cb => {
        on(cb, 'change', (e) => {
            toggleItem(e.target.dataset.id);
        });
    });

    $$('.btn-delete').forEach(btn => {
        on(btn, 'click', (e) => {
            deleteItem(e.currentTarget.dataset.id);
        });
    });
}

function toggleItem(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        render();
    }
}

function deleteItem(id) {
    if (confirm('Remove this item from the list?')) {
        items = items.filter(i => i.id !== id);
        render();
    }
}

function setupEventListeners() {
    if (ELEMENTS.addBtn) {
        on(ELEMENTS.addBtn, 'click', () => {
            const name = prompt("What do you need to buy?");
            if (name) {
                items.push({
                    id: Date.now().toString(),
                    name: name,
                    category: 'Uncategorized', // Default
                    checked: false
                });
                render();
            }
        });
    }
}

init();
