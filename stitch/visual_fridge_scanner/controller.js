/**
 * controller.js - Visual Fridge Scanner
 * 
 * Handles simulation of camera capture or file upload.
 * Detects items using TensorFlow.js (COCO-SSD) and adds them to inventory.
 */

import { InventoryService } from '../js/services/InventoryService.js';
import { $, on, createEl } from '../js/utils/dom.js';

const ELEMENTS = {
    cameraPreview: $('#scanner-preview'), // The preview area
    scanBtn: $('#btn-scan'), // "Adjust View" in HTML
    retakeBtn: $('#btn-retake'),
    uploadBtn: $('#btn-upload'),
    fileInput: $('#file-input'),
    addInventoryBtn: $('#btn-add-inventory'),
    addManualBtn: $('#btn-add-manual'),
    generateRecipesBtn: $('#btn-generate-recipes'),
    detectedList: $('#detected-items-list'),
    resultsArea: $('div.absolute.inset-0')
};

// State
let detectedItems = [];
let model = null;
let currentImageSrc = '';

// Category mapping for COCO classes
const CATEGORY_MAP = {
    'apple': 'Fruit', 'banana': 'Fruit', 'orange': 'Fruit', 'broccoli': 'Vegetables', 'carrot': 'Vegetables',
    'hot dog': 'Meat', 'pizza': 'Ready Meal', 'donut': 'Sweets', 'cake': 'Sweets', 'sandwich': 'Ready Meal',
    'bottle': 'Beverages', 'wine glass': 'Beverages', 'cup': 'Kitchenware', 'fork': 'Kitchenware',
    'knife': 'Kitchenware', 'spoon': 'Kitchenware', 'bowl': 'Kitchenware', 'potted plant': 'Other'
};

// Blacklist for unwanted detections
const BLOCKED_CLASSES = ['refrigerator', 'microwave', 'oven', 'sink', 'toilet', 'dining table', 'chair', 'book'];

async function init() {
    setupEventListeners();
    // Default image
    currentImageSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuBw5K0xZNNtal3sVZ9bYD9KjEGaLYBI103QovFZLBz0E4ULQXXNk-1CCLIL0vViMxb22u9q89VMMktiCIRP1fGpFiDrs3tdNSCHN8AZuD-zKzQv_kqlJ4k2WQKAWPtlOJocqwLr4cvIwjm9Cm1APfnUIZWpTAOwRWJzjZEmcfjRGTEP7I6BE0DjM8_NMvUm_DyB8k93P5X6x41tXJ4BpLbEcUVLjcC5UjPHNAuKIMycmyv3SZSVTR--4H4SFtv4_GPqcKrO9Ot_Zg";

    // Load Model
    console.log('Loading AI Model...');
    if (ELEMENTS.detectedList) {
        ELEMENTS.detectedList.innerHTML = `<div class="text-center py-4 text-sm text-[#4c9a4c]">Loading AI Model...</div>`;
    }

    try {
        model = await cocoSsd.load();
        console.log('AI Model Loaded');
        if (ELEMENTS.detectedList) {
            ELEMENTS.detectedList.innerHTML = `
                <div class="text-center text-gray-500 py-10 opacity-70">
                    <span class="material-symbols-outlined text-4xl mb-2">image_search</span>
                    <p>Model Ready. Upload a photo.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load model', err);
        alert('Failed to load AI model. Please check your internet connection.');
    }
}

function setupEventListeners() {
    // "Adjust View"
    if (ELEMENTS.scanBtn) {
        on(ELEMENTS.scanBtn, 'click', () => {
            if (ELEMENTS.cameraPreview) {
                ELEMENTS.cameraPreview.classList.toggle('scale-110'); // simplified transition
                ELEMENTS.cameraPreview.style.transition = 'transform 0.3s ease';
                ELEMENTS.cameraPreview.style.transform = ELEMENTS.cameraPreview.style.transform === 'scale(1.1)' ? 'scale(1)' : 'scale(1.1)';
            }
        });
    }

    // "Retake"
    if (ELEMENTS.retakeBtn) {
        on(ELEMENTS.retakeBtn, 'click', () => {
            detectedItems = [];
            renderItems([]);
            currentImageSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuBw5K0xZNNtal3sVZ9bYD9KjEGaLYBI103QovFZLBz0E4ULQXXNk-1CCLIL0vViMxb22u9q89VMMktiCIRP1fGpFiDrs3tdNSCHN8AZuD-zKzQv_kqlJ4k2WQKAWPtlOJocqwLr4cvIwjm9Cm1APfnUIZWpTAOwRWJzjZEmcfjRGTEP7I6BE0DjM8_NMvUm_DyB8k93P5X6x41tXJ4BpLbEcUVLjcC5UjPHNAuKIMycmyv3SZSVTR--4H4SFtv4_GPqcKrO9Ot_Zg";
            if (ELEMENTS.cameraPreview) {
                ELEMENTS.cameraPreview.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url("${currentImageSrc}")`;
                ELEMENTS.cameraPreview.style.transform = 'scale(1)';
            }
            if (ELEMENTS.fileInput) ELEMENTS.fileInput.value = '';
        });
    }

    // File Upload
    if (ELEMENTS.uploadBtn && ELEMENTS.fileInput) {
        on(ELEMENTS.uploadBtn, 'click', () => {
            ELEMENTS.fileInput.click();
        });

        on(ELEMENTS.fileInput, 'change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageUrl = e.target.result;
                    currentImageSrc = imageUrl;
                    if (ELEMENTS.cameraPreview) {
                        ELEMENTS.cameraPreview.style.backgroundImage = `url("${imageUrl}")`;
                    }
                    performScan(imageUrl);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // "Manually Add Item"
    if (ELEMENTS.addManualBtn) {
        on(ELEMENTS.addManualBtn, 'click', () => {
            const name = prompt("Enter ingredient name:");
            if (name && name.trim()) {
                const newItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: name.trim(),
                    category: 'Other',
                    confidence: 100, // Manual = 100% confidence
                    icon: 'edit_note',
                    quantity: 1
                };

                // Check if already exists, just inc
                const existing = detectedItems.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
                if (existing) {
                    existing.quantity++;
                } else {
                    detectedItems.push(newItem);
                }

                renderItems(detectedItems);
            }
        });
    }

    // "Add to Inventory"
    if (ELEMENTS.addInventoryBtn) {
        on(ELEMENTS.addInventoryBtn, 'click', () => {
            if (detectedItems.length === 0) {
                alert('No items detected to add. Please scan an image first.');
                return;
            }

            const itemsToAdd = detectedItems.map(item => ({
                name: item.name,
                category: item.category,
                quantity: item.quantity || 1,
                expiryDate: new Date(Date.now() + 86400000 * 7)
            }));

            itemsToAdd.forEach(item => InventoryService.add(item));
            alert(`Added ${itemsToAdd.length} items to inventory!`);
            window.location.href = '../fridge_inventory_manager/code.html';
        });
    }

    // "Generate Recipes"
    if (ELEMENTS.generateRecipesBtn) {
        on(ELEMENTS.generateRecipesBtn, 'click', () => {
            if (detectedItems.length === 0) {
                alert('Please scan items first to generate recipes.');
                return;
            }
            // Just redirect to recipe suggestions for now. 
            // In a real flow we might pass these items as query params or store state.
            // Let's store them in localStorage so the recipe page could potentially use them.
            const itemNames = detectedItems.map(i => i.name).join(',');
            localStorage.setItem('stitch_temp_scan_ingredients', itemNames);

            window.location.href = '../recipe_suggestions/code.html';
        });
    }
}

async function performScan(imageSrc) {
    if (!model) {
        alert('AI Model is still loading. Please wait a moment.');
        return;
    }

    // UI Loading
    if (ELEMENTS.detectedList) {
        ELEMENTS.detectedList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 gap-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p class="text-primary font-bold">Analysing Image (Enhanced)...</p>
            </div>
        `;
    }

    try {
        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "anonymous"; // Needed for external images, might fail for some
        await img.decode(); // Wait for load

        // Detect with lower threshold (0.15) to catch faint items
        // maxNumBoxes = 20, minScore = 0.15
        const predictions = await model.detect(img, 20, 0.15);
        console.log('Predictions: ', predictions);

        if (predictions.length > 0) {
            const rawItems = predictions
                .filter(p => !BLOCKED_CLASSES.includes(p.class.toLowerCase())) // Filter blocked classes
                .map(p => {
                    // Specific overrides for common fridge items that might be misclassified
                    let name = p.class.charAt(0).toUpperCase() + p.class.slice(1);
                    let category = CATEGORY_MAP[p.class] || 'Other';

                    // Handle animal classes (raw meat/fish often misclassified as live animals)
                    if (p.class === 'bird') {
                        name = 'Poultry/Fish';
                        category = 'Meat';
                    } else if (p.class === 'cow') {
                        name = 'Beef';
                        category = 'Meat';
                    } else if (p.class === 'sheep') {
                        name = 'Lamb';
                        category = 'Meat';
                    } else if (p.class === 'bottle') {
                        name = 'Beverage/Sauce'; // Generic bottle
                        category = 'Beverages';
                    }

                    return {
                        id: Math.random().toString(36).substr(2, 9), // Simple ID for editing
                        name: name,
                        category: category,
                        confidence: Math.round(p.score * 100),
                        icon: getIconForClass(p.class),
                        quantity: 1
                    };
                });

            detectedItems = aggregateItems(rawItems);
        } else {
            // Fallback/Empty
            detectedItems = [];
        }

        renderItems(detectedItems);

    } catch (err) {
        console.error('Detection error:', err);
        if (ELEMENTS.detectedList) {
            ELEMENTS.detectedList.innerHTML = `<div class="text-red-500 p-4 text-center">Error analyzing image. Try another.</div>`;
        }
    }
}

function aggregateItems(items) {
    const map = new Map();
    items.forEach(item => {
        if (map.has(item.name)) {
            const existing = map.get(item.name);
            existing.quantity += 1;
            existing.confidence = Math.max(existing.confidence, item.confidence); // Keep highest confidence
        } else {
            map.set(item.name, item);
        }
    });
    return Array.from(map.values());
}

function getIconForClass(className) {
    const map = {
        'apple': 'nutrition', 'banana': 'nutrition', 'carrot': 'nutrition', 'broccoli': 'nutrition',
        'cake': 'cake', 'pizza': 'local_pizza', 'hot dog': 'hot_tub', // funny match
        'bottle': 'liquor', 'cup': 'local_cafe',
        'bird': 'set_meal', 'cow': 'lunch_dining', 'sheep': 'lunch_dining'
    };
    return map[className] || 'restaurant';
}

function renderItems(items) {
    if (!ELEMENTS.detectedList) return;

    if (items.length === 0) {
        ELEMENTS.detectedList.innerHTML = `
            <div class="text-center text-gray-500 py-10 opacity-70">
                <span class="material-symbols-outlined text-4xl mb-2">no_food</span>
                <p>No ingredients detected.</p>
                <p class="text-xs mt-2">Try a clearer photo of food items.</p>
            </div>
        `;
        return;
    }

    // Update Header Count
    const countHeader = document.querySelector('h3.text-lg.font-bold');
    if (countHeader) {
        const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        countHeader.textContent = `Detected (${totalCount})`;
    }

    ELEMENTS.detectedList.innerHTML = '';
    items.forEach(item => {
        const card = createEl('div', ['flex', 'items-center', 'justify-between', 'p-3', 'rounded-lg', 'border', 'border-primary', 'bg-primary/5', 'animate-in', 'fade-in', 'slide-in-from-bottom-2']);

        const quantityBadge = item.quantity > 1 ? `<span class="bg-primary text-[#0d1b0d] text-xs font-bold px-1.5 py-0.5 rounded ml-2">x${item.quantity}</span>` : '';

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="size-10 rounded bg-white dark:bg-[#1a331a] flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">${item.icon}</span>
                </div>
                <div>
                    <div class="flex items-center">
                        <p class="text-sm font-bold text-[#0d1b0d] dark:text-white">${item.name}</p>
                        ${quantityBadge}
                    </div>
                    <p class="text-[10px] text-[#4c9a4c]">Confidence: ${item.confidence}%</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn-edit text-[#4c9a4c] hover:text-primary" data-id="${item.id}"><span class="material-symbols-outlined text-lg">edit</span></button>
                <button class="btn-delete text-[#4c9a4c] hover:text-red-500" data-id="${item.id}"><span class="material-symbols-outlined text-lg">delete</span></button>
            </div>
        `;

        // Add listeners directly
        const editBtn = card.querySelector('.btn-edit');
        const deleteBtn = card.querySelector('.btn-delete');

        on(editBtn, 'click', () => {
            const newName = prompt('Edit Ingredient Name:', item.name);
            if (newName && newName.trim() !== '') {
                item.name = newName.trim();
                renderItems(detectedItems); // Re-render to show new name
            }
        });

        on(deleteBtn, 'click', () => {
            if (confirm(`Remove ${item.name}?`)) {
                detectedItems = detectedItems.filter(i => i.id !== item.id);
                renderItems(detectedItems);
            }
        });

        ELEMENTS.detectedList.appendChild(card);
    });
}

init();
