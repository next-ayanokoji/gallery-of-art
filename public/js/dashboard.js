/**
 * Dashboard JavaScript
 * Handles admin dashboard functionality including stats, uploads, and artwork management
 */

// DOM Elements
const logoutButton = document.getElementById('logoutButton');
const adminInfo = document.getElementById('adminInfo');
const totalArtworks = document.getElementById('totalArtworks');
const totalCategories = document.getElementById('totalCategories');
const recentUploads = document.getElementById('recentUploads');
const uploadForm = document.getElementById('uploadForm');
const uploadButton = document.getElementById('uploadButton');
const uploadError = document.getElementById('uploadError');
const fileUpload = document.getElementById('fileUpload');
const fileUploadContent = document.getElementById('fileUploadContent');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const fileRemove = document.getElementById('fileRemove');
const artworksTable = document.getElementById('artworksTable');
const artworksTableBody = document.getElementById('artworksTableBody');
const tableLoading = document.getElementById('tableLoading');
const tableEmpty = document.getElementById('tableEmpty');
const editModal = document.getElementById('editModal');
const editModalClose = document.getElementById('editModalClose');
const editForm = document.getElementById('editForm');
const editButton = document.getElementById('editButton');
const editError = document.getElementById('editError');
const editFileUpload = document.getElementById('editFileUpload');
const editFileUploadContent = document.getElementById('editFileUploadContent');
const editFilePreview = document.getElementById('editFilePreview');
const editPreviewImage = document.getElementById('editPreviewImage');
const editFileRemove = document.getElementById('editFileRemove');
const deleteModal = document.getElementById('deleteModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// State
let artworks = [];
let artworkToDelete = null;
let selectedFile = null;
let editSelectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
});

/**
 * Check authentication status
 */
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    if (!token) {
        window.location.href = '/admin';
        return;
    }
    
    // Update admin info
    adminInfo.textContent = `Welcome, ${user.username || 'Admin'}`;
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadArtworks()
    ]);
}

/**
 * Load statistics
 */
async function loadStats() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/artworks/stats/summary', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            totalArtworks.textContent = data.stats.totalArtworks;
            totalCategories.textContent = data.stats.artworksByCategory.length;
            
            // Calculate recent uploads (this month)
            const thisMonth = new Date();
            thisMonth.setDate(1);
            const recentCount = artworks.filter(a => new Date(a.createdAt) >= thisMonth).length;
            recentUploads.textContent = recentCount;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load artworks for table
 */
async function loadArtworks() {
    try {
        showTableLoading();
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/artworks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            artworks = data.artworks;
            renderArtworksTable(artworks);
        } else {
            showTableEmpty();
        }
    } catch (error) {
        console.error('Error loading artworks:', error);
        showTableEmpty();
    }
}

/**
 * Render artworks table
 */
function renderArtworksTable(artworksToRender) {
    artworksTableBody.innerHTML = '';
    
    if (artworksToRender.length === 0) {
        showTableEmpty();
        return;
    }
    
    hideTableLoading();
    hideTableEmpty();
    
    artworksToRender.forEach(artwork => {
        const row = createArtworkRow(artwork);
        artworksTableBody.appendChild(row);
    });
}

/**
 * Create artwork table row
 */
function createArtworkRow(artwork) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <img src="${artwork.imageUrl}" alt="${escapeHtml(artwork.title)}" loading="lazy">
        </td>
        <td class="artwork-title-cell">${escapeHtml(artwork.title)}</td>
        <td><span class="category-badge">${escapeHtml(artwork.category)}</span></td>
        <td class="date-cell">${formatDate(artwork.createdAt)}</td>
        <td class="actions-cell">
            <button class="action-btn edit" data-id="${artwork._id}" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="action-btn delete" data-id="${artwork._id}" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </td>
    `;
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit');
    const deleteBtn = row.querySelector('.delete');
    
    editBtn.addEventListener('click', () => openEditModal(artwork));
    deleteBtn.addEventListener('click', () => openDeleteModal(artwork._id));
    
    return row;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout button
    logoutButton.addEventListener('click', handleLogout);
    
    // Upload form
    uploadForm.addEventListener('submit', handleUpload);
    
    // File upload
    const imageInput = document.getElementById('image');
    imageInput.addEventListener('change', handleFileSelect);
    
    // File remove
    fileRemove.addEventListener('click', handleFileRemove);
    
    // Edit modal close
    editModalClose.addEventListener('click', closeEditModal);
    
    // Edit form
    editForm.addEventListener('submit', handleEdit);
    
    // Edit file upload
    const editImageInput = document.getElementById('editImage');
    editImageInput.addEventListener('change', handleEditFileSelect);
    
    // Edit file remove
    editFileRemove.addEventListener('click', handleEditFileRemove);
    
    // Delete modal close
    deleteModalClose.addEventListener('click', closeDeleteModal);
    
    // Delete confirmation
    cancelDelete.addEventListener('click', closeDeleteModal);
    confirmDelete.addEventListener('click', handleDelete);
    
    // Close modals on backdrop click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editModal.classList.contains('active')) closeEditModal();
            if (deleteModal.classList.contains('active')) closeDeleteModal();
        }
    });
}

/**
 * Handle logout
 */
function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin';
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(uploadError, 'Please select an image file');
            return;
        }
        
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError(uploadError, 'File size must be less than 10MB');
            return;
        }
        
        selectedFile = file;
        showFilePreview(file);
        hideError(uploadError);
    }
}

/**
 * Show file preview
 */
function showFilePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        fileUploadContent.style.display = 'none';
        filePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

/**
 * Handle file remove
 */
function handleFileRemove() {
    selectedFile = null;
    document.getElementById('image').value = '';
    fileUploadContent.style.display = 'block';
    filePreview.style.display = 'none';
    previewImage.src = '';
}

/**
 * Handle upload form submission
 */
async function handleUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const caption = document.getElementById('caption').value.trim();
    const category = document.getElementById('category').value;
    
    if (!title || !caption || !category) {
        showError(uploadError, 'Please fill in all required fields');
        return;
    }
    
    if (!selectedFile) {
        showError(uploadError, 'Please select an image');
        return;
    }
    
    setLoading(uploadButton, true);
    hideError(uploadError);
    
    try {
        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('caption', caption);
        formData.append('category', category);
        formData.append('image', selectedFile);
        
        const response = await fetch('/api/artworks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reset form
            uploadForm.reset();
            handleFileRemove();
            
            // Reload data
            await loadDashboardData();
            
            // Show success message
            alert('Artwork uploaded successfully!');
        } else {
            showError(uploadError, data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(uploadError, 'An error occurred. Please try again.');
    } finally {
        setLoading(uploadButton, false);
    }
}

/**
 * Open edit modal
 */
function openEditModal(artwork) {
    document.getElementById('editArtworkId').value = artwork._id;
    document.getElementById('editTitle').value = artwork.title;
    document.getElementById('editCategory').value = artwork.category;
    document.getElementById('editCaption').value = artwork.caption;
    
    // Reset file upload
    editSelectedFile = null;
    document.getElementById('editImage').value = '';
    editFileUploadContent.style.display = 'block';
    editFilePreview.style.display = 'none';
    editPreviewImage.src = '';
    
    hideError(editError);
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editForm.reset();
    hideError(editError);
}

/**
 * Handle edit file selection
 */
function handleEditFileSelect(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (!file.type.startsWith('image/')) {
            showError(editError, 'Please select an image file');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showError(editError, 'File size must be less than 10MB');
            return;
        }
        
        editSelectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            editPreviewImage.src = e.target.result;
            editFileUploadContent.style.display = 'none';
            editFilePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        hideError(editError);
    }
}

/**
 * Handle edit file remove
 */
function handleEditFileRemove() {
    editSelectedFile = null;
    document.getElementById('editImage').value = '';
    editFileUploadContent.style.display = 'block';
    editFilePreview.style.display = 'none';
    editPreviewImage.src = '';
}

/**
 * Handle edit form submission
 */
async function handleEdit(e) {
    e.preventDefault();
    
    const artworkId = document.getElementById('editArtworkId').value;
    const title = document.getElementById('editTitle').value.trim();
    const caption = document.getElementById('editCaption').value.trim();
    const category = document.getElementById('editCategory').value;
    
    if (!title || !caption || !category) {
        showError(editError, 'Please fill in all required fields');
        return;
    }
    
    setLoading(editButton, true);
    hideError(editError);
    
    try {
        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('caption', caption);
        formData.append('category', category);
        
        if (editSelectedFile) {
            formData.append('image', editSelectedFile);
        }
        
        const response = await fetch(`/api/artworks/${artworkId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeEditModal();
            await loadDashboardData();
            alert('Artwork updated successfully!');
        } else {
            showError(editError, data.message || 'Update failed');
        }
    } catch (error) {
        console.error('Edit error:', error);
        showError(editError, 'An error occurred. Please try again.');
    } finally {
        setLoading(editButton, false);
    }
}

/**
 * Open delete modal
 */
function openDeleteModal(artworkId) {
    artworkToDelete = artworkId;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = '';
    artworkToDelete = null;
}

/**
 * Handle delete confirmation
 */
async function handleDelete() {
    if (!artworkToDelete) return;
    
    setLoading(confirmDelete, true);
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/artworks/${artworkToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeDeleteModal();
            await loadDashboardData();
            alert('Artwork deleted successfully!');
        } else {
            alert(data.message || 'Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        setLoading(confirmDelete, false);
    }
}

/**
 * Show table loading state
 */
function showTableLoading() {
    tableLoading.style.display = 'block';
    tableEmpty.style.display = 'none';
    artworksTableBody.innerHTML = '';
}

/**
 * Hide table loading state
 */
function hideTableLoading() {
    tableLoading.style.display = 'none';
}

/**
 * Show table empty state
 */
function showTableEmpty() {
    tableLoading.style.display = 'none';
    tableEmpty.style.display = 'block';
    artworksTableBody.innerHTML = '';
}

/**
 * Hide table empty state
 */
function hideTableEmpty() {
    tableEmpty.style.display = 'none';
}

/**
 * Set button loading state
 */
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        button.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

/**
 * Hide error message
 */
function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
