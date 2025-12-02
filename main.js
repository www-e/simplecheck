        class Checklist {
            constructor() {
                this.items = [];
                this.categories = [];
                this.currentFilter = 'all';
                this.currentCategoryFilter = 'all';
                this.nextId = 1;
                
                this.newItemInput = document.getElementById('newItemInput');
                this.addButton = document.getElementById('addButton');
                this.checklistContainer = document.getElementById('checklistContainer');
                this.filterButtons = document.querySelectorAll('.filter-btn');
                this.categorySelect = document.getElementById('categorySelect');
                
                this.init();
            }
            
            init() {
                this.addButton.addEventListener('click', () => this.addItem());
                this.newItemInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addItem();
                });
                
                this.filterButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
                });
                
                this.loadFromStorage();
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
                    createdAt: new Date().toISOString()
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
                this.categoryManager.renderCategoryFilter();
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
                
                this.filterButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === filter);
                });
                
                this.render();
            }
            
            setCategoryFilter(categoryFilter) {
                this.currentCategoryFilter = categoryFilter;
                this.categoryManager.renderCategoryFilter();
                this.render();
            }
            
            getFilteredItems() {
                let filteredItems = this.items;
                
                // Apply status filter
                switch (this.currentFilter) {
                    case 'checked':
                        filteredItems = filteredItems.filter(item => item.checked);
                        break;
                    case 'unchecked':
                        filteredItems = filteredItems.filter(item => !item.checked);
                        break;
                }
                
                // Apply category filter
                if (this.currentCategoryFilter !== 'all') {
                    if (this.currentCategoryFilter.startsWith('category-')) {
                        const categoryId = parseInt(this.currentCategoryFilter.replace('category-', ''));
                        filteredItems = filteredItems.filter(item => item.categoryId === categoryId);
                    }
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
                            <button class="delete-btn" onclick="checklist.deleteItem(${item.id})">Delete</button>
                        </li>
                    `;
                }).join('');
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
        
        const checklist = new Checklist();
