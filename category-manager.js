class CategoryManager {
    constructor(checklistInstance) {
        this.checklist = checklistInstance;
        this.nextCategoryId = 1;
        
        this.categoriesContainer = document.getElementById('categoriesContainer');
        this.categoryFilterContainer = document.getElementById('categoryFilterContainer');
        this.categorySelect = document.getElementById('categorySelect');
        this.newCategoryInput = document.getElementById('newCategoryInput');
        this.addCategoryButton = document.getElementById('addCategoryButton');
        
        this.init();
    }
    
    init() {
        // Load categories from storage or create default
        this.loadCategories();
        this.renderCategories();
        this.renderCategoryFilter();
        this.renderCategorySelect();
        
        // Event listeners
        this.addCategoryButton.addEventListener('click', () => this.addCategory());
        this.newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
    }
    
    addCategory() {
        const name = this.newCategoryInput.value.trim();
        if (!name) return;
        
        // Check if category already exists
        if (this.checklist.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('Category already exists!');
            return;
        }
        
        const category = {
            id: this.nextCategoryId++,
            name: name,
            color: this.generateCategoryColor(),
            createdAt: new Date().toISOString()
        };
        
        this.checklist.categories.push(category);
        this.newCategoryInput.value = '';
        this.saveCategories();
        this.renderCategories();
        this.renderCategorySelect();
        this.onCategoriesChanged();
    }
    
    deleteCategory(categoryId) {
        // Check if any items are assigned to this category
        const itemsInCategory = this.checklist.items.filter(item => item.categoryId === categoryId);
        if (itemsInCategory.length > 0) {
            if (!confirm(`This category has ${itemsInCategory.length} item(s). Are you sure you want to delete it? They will be unassigned.`)) {
                return;
            }
        }
        
        // Remove category and unassign items
        this.checklist.categories = this.checklist.categories.filter(cat => cat.id !== categoryId);
        this.checklist.items.forEach(item => {
            if (item.categoryId === categoryId) {
                delete item.categoryId;
            }
        });
        
        // Clear current filter if it was this category
        if (this.checklist.currentCategoryFilter === `category-${categoryId}`) {
            this.checklist.setCategoryFilter('all');
        }
        
        this.saveCategories();
        this.checklist.saveToStorage();
        this.checklist.render();
        this.renderCategories();
        this.renderCategorySelect();
        this.onCategoriesChanged();
    }
    
    generateCategoryColor() {
        const colors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', 
            '#6f42c1', '#fd7e14', '#20c997', '#e83e8c',
            '#17a2b8', '#6c757d', '#495057', '#6610f2'
        ];
        return colors[this.checklist.categories.length % colors.length];
    }
    
    renderCategories() {
        if (this.checklist.categories.length === 0) {
            this.categoriesContainer.innerHTML = '<div class="no-categories">No categories yet</div>';
            return;
        }
        
        this.categoriesContainer.innerHTML = this.checklist.categories.map(category => {
            const itemCount = this.checklist.items.filter(item => item.categoryId === category.id).length;
            return `
                <div class="category-item" style="border-left: 4px solid ${category.color}">
                    <span class="category-name">${this.escapeHtml(category.name)}</span>
                    <span class="category-count">${itemCount}</span>
                    <button class="delete-category-btn" onclick="checklist.categoryManager.deleteCategory(${category.id})">×</button>
                </div>
            `;
        }).join('');
    }
    
    onCategoriesChanged() {
        this.checklist.renderUnifiedFilters();
    }
    
    renderCategorySelect() {
        let selectHTML = '<option value="">No category</option>';
        this.checklist.categories.forEach(category => {
            selectHTML += `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`;
        });
        this.categorySelect.innerHTML = selectHTML;
        
        // Update bulk add category select if it exists
        if (this.checklist.bulkAddManager) {
            this.checklist.bulkAddManager.updateBulkCategorySelect();
        }
    }
    
    setCategoryForItem(itemId, categoryId) {
        const item = this.checklist.items.find(item => item.id === itemId);
        if (item) {
            if (categoryId) {
                item.categoryId = parseInt(categoryId);
            } else {
                delete item.categoryId;
            }
            this.checklist.saveToStorage();
            this.checklist.render();
            this.renderCategories();
            this.renderCategoryFilter();
        }
    }
    
    saveCategories() {
        localStorage.setItem('checklistCategories', JSON.stringify({
            categories: this.checklist.categories,
            nextCategoryId: this.nextCategoryId
        }));
    }
    
    loadCategories() {
        const saved = localStorage.getItem('checklistCategories');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.checklist.categories = data.categories || [];
                this.nextCategoryId = data.nextCategoryId || 1;
            } catch (e) {
                console.error('Error loading categories:', e);
                this.checklist.categories = [];
                this.nextCategoryId = 1;
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}