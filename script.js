class DataStorage {
    constructor() {
        this.storageKey = 'cyberbullying_platform_data';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                reports: [],
                aspirations: [],
                statistics: {
                    totalReports: 0,
                    resolvedCases: 0,
                    totalAspirations: 0,
                    confidentialityRate: 100
                },
                settings: {
                    autoSave: true,
                    notifications: true
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {};
        } catch (error) {
            console.error('Error reading data:', error);
            return {};
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    addReport(reportData) {
        const data = this.getData();
        const report = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            status: 'pending',
            ...reportData
        };
        
        data.reports.push(report);
        data.statistics.totalReports++;
        
        if (this.saveData(data)) {
            this.updateStatistics();
            return report.id;
        }
        return null;
    }

    addAspiration(aspirationData) {
        const data = this.getData();
        const aspiration = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            status: 'received',
            ...aspirationData
        };
        
        data.aspirations.push(aspiration);
        data.statistics.totalAspirations++;
        
        if (this.saveData(data)) {
            this.updateStatistics();
            return aspiration.id;
        }
        return null;
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateStatistics() {
        const data = this.getData();
        const stats = data.statistics;
        
        const statElements = document.querySelectorAll('.stat-item h3');
        if (statElements.length >= 3) {
            statElements[0].textContent = stats.totalReports;
            statElements[1].textContent = stats.resolvedCases;
            statElements[2].textContent = stats.totalAspirations;
        }
    }

    exportData() {
        const data = this.getData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            platform: 'Stop Cyberbullying - SMA Negeri 34 Jakarta'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cyberbullying_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            localStorage.removeItem(this.storageKey);
            this.init();
            this.updateStatistics();
            alert('Data berhasil dihapus.');
        }
    }
}

class FormValidator {
    constructor() {
        this.rules = {
            required: (value) => value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            minLength: (value, min) => value.length >= min,
            maxLength: (value, max) => value.length <= max,
            fileSize: (file, maxSize) => file.size <= maxSize,
            fileType: (file, allowedTypes) => allowedTypes.includes(file.type)
        };
    }

    validateField(field, rules = []) {
        const value = field.value.trim();
        const errors = [];

        rules.forEach(rule => {
            if (rule.type === 'required' && !this.rules.required(value)) {
                errors.push(rule.message || 'Field ini wajib diisi');
            } else if (rule.type === 'email' && value && !this.rules.email(value)) {
                errors.push(rule.message || 'Format email tidak valid');
            } else if (rule.type === 'minLength' && !this.rules.minLength(value, rule.value)) {
                errors.push(rule.message || `Minimal ${rule.value} karakter`);
            } else if (rule.type === 'maxLength' && !this.rules.maxLength(value, rule.value)) {
                errors.push(rule.message || `Maksimal ${rule.value} karakter`);
            }
        });

        return errors;
    }

    validateFiles(files, rules = {}) {
        const errors = [];
        const maxSize = rules.maxSize || 5 * 1024 * 1024; // 5MB
        const allowedTypes = rules.allowedTypes || [
            'image/jpeg', 'image/png', 'image/gif', 
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        Array.from(files).forEach(file => {
            if (!this.rules.fileSize(file, maxSize)) {
                errors.push(`File ${file.name} terlalu besar. Maksimal 5MB.`);
            }
            if (!this.rules.fileType(file, allowedTypes)) {
                errors.push(`Format file ${file.name} tidak didukung.`);
            }
        });

        return errors;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        
        const fieldGroup = field.closest('.form-group');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        fieldGroup.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const fieldGroup = field.closest('.form-group');
        const existingError = fieldGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
}

class CyberbullyingPlatform {
    constructor() {
        this.storage = new DataStorage();
        this.validator = new FormValidator();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupTabs();
        this.setupForms();
        this.setupModal();
        this.loadStatistics();
        this.setupAutoSave();
        console.log('Stop Cyberbullying Platform initialized successfully!');
    }

    setupEventListeners() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        // Determine if navbar uses in-page hash links (single-page) or file links (multi-page)
        const hasHashLinks = Array.from(navLinks).some(link => link.getAttribute('href')?.startsWith('#'));

        if (!hasHashLinks) {
            // Multi-page: mark current page link as active based on pathname
            const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
            navLinks.forEach(link => {
                const href = (link.getAttribute('href') || '').toLowerCase();
                link.classList.toggle('active', href === currentPath);
            });
            return; // Skip scroll-based section highlighting on multi-page
        }

        // Single-page: highlight based on visible section
        const highlightNavLink = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.getBoundingClientRect().top;
                if (sectionTop <= 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', this.debounce(highlightNavLink, 10));
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                button.classList.add('active');
                const targetPane = document.getElementById(targetTab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });

            button.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(tabButtons).indexOf(button);
                let targetIndex;
                
                switch(e.key) {
                    case 'ArrowLeft':
                        targetIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
                        break;
                    case 'ArrowRight':
                        targetIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
                        break;
                    case 'Home':
                        targetIndex = 0;
                        break;
                    case 'End':
                        targetIndex = tabButtons.length - 1;
                        break;
                    default:
                        return;
                }
                
                e.preventDefault();
                tabButtons[targetIndex].focus();
                tabButtons[targetIndex].click();
            });
        });
    }

    setupForms() {
        const reportForm = document.getElementById('reportForm');
        if (reportForm) {
            this.setupFormValidation(reportForm);
            reportForm.addEventListener('submit', (e) => this.handleReportSubmission(e));
        }

        const aspirationsForm = document.getElementById('aspirationsForm');
        if (aspirationsForm) {
            this.setupFormValidation(aspirationsForm);
            aspirationsForm.addEventListener('submit', (e) => this.handleAspirationSubmission(e));
        }

        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => this.handleFileUpload(e));
        });
    }

    setupFormValidation(form) {
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateSingleField(field);
            });
            
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.validateSingleField(field);
                }
            });
        });
    }

    validateSingleField(field) {
        const rules = [];
        
        if (field.hasAttribute('required')) {
            rules.push({ type: 'required' });
        }
        
        if (field.type === 'email') {
            rules.push({ type: 'email' });
        }
        
        if (field.tagName === 'TEXTAREA') {
            rules.push({ type: 'minLength', value: 10, message: 'Deskripsi minimal 10 karakter' });
        }

        const errors = this.validator.validateField(field, rules);
        
        if (errors.length > 0) {
            this.validator.showFieldError(field, errors[0]);
            return false;
        } else {
            this.validator.clearFieldError(field);
            return true;
        }
    }

    handleFileUpload(event) {
        const input = event.target;
        const files = input.files;
        const fieldGroup = input.closest('.form-group');
        
        const existingMessages = fieldGroup.querySelectorAll('.file-error, .file-success');
        existingMessages.forEach(msg => msg.remove());

        if (files.length > 0) {
            const errors = this.validator.validateFiles(files);
            
            if (errors.length > 0) {
                errors.forEach(error => {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'file-error';
                    errorDiv.textContent = error;
                    fieldGroup.appendChild(errorDiv);
                });
                input.value = '';
            } else {
                const successDiv = document.createElement('div');
                successDiv.className = 'file-success';
                successDiv.textContent = `${files.length} file berhasil dipilih`;
                fieldGroup.appendChild(successDiv);
                
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.remove();
                    }
                }, 3000);
            }
        }
    }

    handleReportSubmission(event) {
        event.preventDefault();
        const form = event.target;
        
        if (!this.validateForm(form)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        // Collect form data
        const formData = new FormData(form);
        const reportData = {
            type: formData.get('reportType'),
            platform: formData.get('platform'),
            description: formData.get('description'),
            urgency: formData.get('urgency'),
            anonymous: formData.get('anonymous') === 'on',
            terms: formData.get('terms') === 'on',
            files: this.getFileInfo(formData.getAll('evidence'))
        };

        setTimeout(() => {
            const reportId = this.storage.addReport(reportData);
            
            if (reportId) {
                form.reset();
                this.clearFormErrors(form);
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                
                this.showModal(
                    'Laporan Berhasil Dikirim!',
                    `Laporan Anda telah berhasil dikirim dengan ID: ${reportId.substr(-8)}. Tim kami akan segera menindaklanjuti dalam 24 jam. Terima kasih atas kepercayaan Anda.`
                );
                
                this.clearAutoSave('reportForm');
            } else {
                alert('Terjadi kesalahan saat menyimpan laporan. Silakan coba lagi.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        }, 2000);
    }

    handleAspirationSubmission(event) {
        event.preventDefault();
        const form = event.target;
        
        if (!this.validateForm(form)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        const formData = new FormData(form);
        const aspirationData = {
            type: formData.get('aspirationType'),
            title: formData.get('aspirationTitle'),
            content: formData.get('aspirationContent'),
            priority: formData.get('priority'),
            anonymous: formData.get('aspirationAnonymous') === 'on'
        };

        setTimeout(() => {
            const aspirationId = this.storage.addAspiration(aspirationData);
            
            if (aspirationId) {
                form.reset();
                this.clearFormErrors(form);
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                
                this.showModal(
                    'Aspirasi Berhasil Dikirim!',
                    `Aspirasi Anda telah berhasil dikirim dengan ID: ${aspirationId.substr(-8)}. Terima kasih atas kontribusi Anda untuk menciptakan lingkungan sekolah yang lebih baik.`
                );
                
                this.clearAutoSave('aspirationsForm');
            } else {
                alert('Terjadi kesalahan saat menyimpan aspirasi. Silakan coba lagi.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        }, 2000);
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateSingleField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.error-message, .file-error');
        errorElements.forEach(element => element.remove());
        
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    getFileInfo(files) {
        return files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        }));
    }

    setupModal() {
        const modal = document.getElementById('successModal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display === 'block') {
                this.hideModal();
            }
        });

        window.closeModal = () => this.hideModal();
    }

    showModal(title, message) {
        const modal = document.getElementById('successModal');
        const modalTitle = modal?.querySelector('h3');
        const modalMessage = modal?.querySelector('#modalMessage');
        
        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    loadStatistics() {
        this.storage.updateStatistics();
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        const animateElements = document.querySelectorAll('.stat-item, .info-card, .tip-card, .step');
        animateElements.forEach(el => {
            observer.observe(el);
        });
    }

    setupAutoSave() {
        const forms = ['reportForm', 'aspirationsForm'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (!form) return;
            
            this.loadAutoSave(formId);
            
            form.addEventListener('input', this.debounce(() => {
                this.saveAutoSave(formId);
            }, 1000));
        });
    }

    saveAutoSave(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field?.type === 'checkbox') {
                data[key] = field.checked;
            } else {
                data[key] = value;
            }
        }
        
        localStorage.setItem(`${formId}_draft`, JSON.stringify(data));
    }

    loadAutoSave(formId) {
        const savedData = localStorage.getItem(`${formId}_draft`);
        if (!savedData) return;
        
        try {
            const data = JSON.parse(savedData);
            const form = document.getElementById(formId);
            
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key];
                    } else {
                        field.value = data[key];
                    }
                }
            });
        } catch (error) {
            console.error('Error loading auto-save data:', error);
        }
    }

    clearAutoSave(formId) {
        localStorage.removeItem(`${formId}_draft`);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    exportData() {
        this.storage.exportData();
    }

    clearAllData() {
        this.storage.clearData();
    }

    getStoredData() {
        return this.storage.getData();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cyberbullyingPlatform = new CyberbullyingPlatform();
});

// Error boundary for JavaScript errors
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {

    });
}