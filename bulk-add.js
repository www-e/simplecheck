class BulkAddManager {
    constructor(checklistInstance) {
        this.checklist = checklistInstance;
        this.modal = document.getElementById('bulkAddModal');
        this.bulkItemsInput = document.getElementById('bulkItemsInput');
        this.bulkAddButton = document.getElementById('bulkAddButton');
        this.closeModal = document.getElementById('closeModal');
        this.bulkAddConfirm = document.getElementById('bulkAddConfirm');
        this.bulkAddCancel = document.getElementById('bulkAddCancel');
        this.bulkCategorySelect = document.getElementById('bulkCategorySelect');
        
        this.init();
    }
    
    init() {
        // Event listeners for modal controls
        this.bulkAddButton.addEventListener('click', () => this.openModal());
        this.closeModal.addEventListener('click', () => this.closeModalHandler());
        this.bulkAddCancel.addEventListener('click', () => this.closeModalHandler());
        this.bulkAddConfirm.addEventListener('click', () => this.processBulkItems());
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModalHandler();
            }
        });
        
        // Handle Ctrl+Enter to confirm bulk add
        this.bulkItemsInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.processBulkItems();
            }
        });
    }
    
    openModal() {
        this.updateBulkCategorySelect();
        this.modal.style.display = 'block';
        this.bulkItemsInput.focus();
        this.bulkItemsInput.select();
    }
    
    updateBulkCategorySelect() {
        let selectHTML = '<option value="">No category</option>';
        this.checklist.categories.forEach(category => {
            selectHTML += `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`;
        });
        this.bulkCategorySelect.innerHTML = selectHTML;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    closeModalHandler() {
        this.modal.style.display = 'none';
        this.bulkItemsInput.value = '';
    }
    
    processBulkItems() {
        const inputText = this.bulkItemsInput.value.trim();
        if (!inputText) {
            this.closeModalHandler();
            return;
        }
        
        // Split by lines and filter out empty lines
        const lines = inputText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) {
            this.closeModalHandler();
            return;
        }
        
        // Get selected category for bulk add
        const categoryId = this.bulkCategorySelect ? this.bulkCategorySelect.value : '';
        
        // Add items to checklist
        lines.forEach(line => {
            this.checklist.addItem(line, categoryId);
        });
        
        this.closeModalHandler();
        
        // Show success message
        this.showSuccessMessage(lines.length);
    }
    
    showSuccessMessage(count) {
        // Create temporary success message
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = `Added ${count} items successfully!`;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(message);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(message);
            }, 300);
        }, 3000);
    }
}