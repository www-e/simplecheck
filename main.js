        class Checklist {
            constructor() {
                this.items = [];
                this.categories = [];
                this.currentFilter = 'all';
                this.nextId = 1;
                
                this.newItemInput = document.getElementById('newItemInput');
                this.addButton = document.getElementById('addButton');
                this.checklistContainer = document.getElementById('checklistContainer');
                this.unifiedFilterContainer = document.getElementById('unifiedFilterContainer');
                this.categorySelect = document.getElementById('categorySelect');
                
                this.init();
            }
            
            init() {
                this.addButton.addEventListener('click', () => this.addItem());
                this.newItemInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addItem();
                });
                
                this.loadFromStorage();
                this.renderUnifiedFilters();
                this.render();
                
                // Initialize bulk add manager
                this.bulkAddManager = new BulkAddManager(this);
                
                // Initialize category manager
                this.categoryManager = new CategoryManager(this);
            }
            
            addItem(text = null, categoryId = null) {
                const itemText = text !== null ? text : this.newItemInput.value.trim();
                if (!itemText) return;
                
                const item = {
                    id: this.nextId++,
                    text: itemText,
                    checked: false,
                    createdAt: new Date().toISOString(),
                    notes: ''
                };
                
                // Add category if selected (either from dropdown or bulk add)
                const selectedCategoryId = categoryId !== null ? categoryId : this.categorySelect.value;
                if (selectedCategoryId) {
                    item.categoryId = parseInt(selectedCategoryId);
                }
                
                this.items.push(item);
                if (text === null) {
                    this.newItemInput.value = '';
                    this.categorySelect.value = '';
                }
                this.saveToStorage();
                this.render();
                
                // Update category displays
                this.categoryManager.renderCategories();
                this.renderUnifiedFilters();
            }
            
            toggleItem(id) {
                const item = this.items.find(item => item.id === id);
                if (item) {
                    item.checked = !item.checked;
                    this.saveToStorage();
                    this.render();
                }
            }
            
            deleteItem(id) {
                this.items = this.items.filter(item => item.id !== id);
                this.saveToStorage();
                this.render();
            }
            
            setFilter(filter) {
                this.currentFilter = filter;
                this.renderUnifiedFilters();
                this.render();
            }
            
            renderUnifiedFilters() {
                const allItemsCount = this.items.length;
                const checkedItems = this.items.filter(item => item.checked).length;
                const uncheckedItems = this.items.filter(item => !item.checked).length;
                
                let filterHTML = `
                    <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" 
                            data-filter="all">All Items (${allItemsCount})</button>
                    <button class="filter-btn ${this.currentFilter === 'unchecked' ? 'active' : ''}" 
                            data-filter="unchecked">Unchecked (${uncheckedItems})</button>
                    <button class="filter-btn ${this.currentFilter === 'checked' ? 'active' : ''}" 
                            data-filter="checked">Checked (${checkedItems})</button>
                `;
                
                this.categories.forEach(category => {
                    const categoryItems = this.items.filter(item => item.categoryId === category.id);
                    const isActive = this.currentFilter === `category-${category.id}`;
                    filterHTML += `
                        <button class="filter-btn ${isActive ? 'active' : ''}" 
                                data-filter="category-${category.id}" 
                                style="border-left: 3px solid ${category.color}">
                            ${this.escapeHtml(category.name)} (${categoryItems.length})
                        </button>
                    `;
                });
                
                this.unifiedFilterContainer.innerHTML = filterHTML;
                
                // Add event listeners to filter buttons
                this.unifiedFilterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });
            }
            
            getFilteredItems() {
                let filteredItems = this.items;
                
                // Apply unified filter
                switch (this.currentFilter) {
                    case 'checked':
                        filteredItems = filteredItems.filter(item => item.checked);
                        break;
                    case 'unchecked':
                        filteredItems = filteredItems.filter(item => !item.checked);
                        break;
                    default:
                        if (this.currentFilter.startsWith('category-')) {
                            const categoryId = parseInt(this.currentFilter.replace('category-', ''));
                            filteredItems = filteredItems.filter(item => item.categoryId === categoryId);
                        }
                        break;
                }
                
                return filteredItems;
            }
            
            render() {
                const filteredItems = this.getFilteredItems();
                
                if (filteredItems.length === 0) {
                    this.checklistContainer.innerHTML = '<li class="empty-message">No items to show</li>';
                    return;
                }
                
                this.checklistContainer.innerHTML = filteredItems.map((item, index) => {
                    const category = item.categoryId ? this.categories.find(cat => cat.id === item.categoryId) : null;
                    const categoryStyle = category ? `style="border-left: 4px solid ${category.color}"` : '';
                    const notesBtnClass = item.notes && item.notes.trim() ? 'notes-btn has-notes' : 'notes-btn';
                    const notesDisplay = item.notes && item.notes.trim() ? `<div class="item-notes">${this.escapeHtml(item.notes)}</div>` : '';
                    
                    return `
                        <li class="checklist-item ${item.checked ? 'checked' : ''}" data-id="${item.id}" ${categoryStyle}>
                            <div class="item-number">${index + 1}</div>
                            <input type="checkbox" class="checkbox" ${item.checked ? 'checked' : ''} 
                                   onclick="checklist.toggleItem(${item.id})">
                            <span class="item-text">${this.escapeHtml(item.text)}</span>
                            <select class="item-category-select" onchange="checklist.categoryManager.setCategoryForItem(${item.id}, this.value)">
                                <option value="">No category</option>
                                ${this.categories.map(cat => 
                                    `<option value="${cat.id}" ${item.categoryId === cat.id ? 'selected' : ''}>${this.escapeHtml(cat.name)}</option>`
                                ).join('')}
                            </select>
                            <button class="${notesBtnClass}" onclick="checklist.editNotes(${item.id})" title="Add/Edit Notes">📝</button>
                            <button class="delete-btn" onclick="checklist.deleteItem(${item.id})">Delete</button>
                            ${notesDisplay}
                        </li>
                    `;
                }).join('');
            }
            
            editNotes(itemId) {
                const item = this.items.find(item => item.id === itemId);
                if (!item) return;
                
                const currentNotes = item.notes || '';
                const newNotes = prompt('Enter notes for this task:', currentNotes);
                
                if (newNotes !== null) {
                    item.notes = newNotes;
                    this.saveToStorage();
                    this.render();
                }
            }
            
            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            saveToStorage() {
                localStorage.setItem('checklistItems', JSON.stringify({
                    items: this.items,
                    nextId: this.nextId
                }));
            }
            
            loadFromStorage() {
                const saved = localStorage.getItem('checklistItems');
                if (saved) {
                    try {
                        const data = JSON.parse(saved);
                        this.items = data.items || [];
                        this.nextId = data.nextId || 1;
                    } catch (e) {
                        console.error('Error loading saved checklist:', e);
                        this.items = [];
                        this.nextId = 1;
                    }
                }
            }
        }
        
        // Make checklist globally accessible for onclick handlers
        window.checklist = new Checklist();
