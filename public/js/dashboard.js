/**
 * Dashboard JavaScript
 * Handles admin dashboard functionality including stats, uploads, and artwork management using Supabase directly
 */

// DOM Elements
const logoutButton = document.getElementById('logoutButton');
const adminInfo = document.getElementById('adminInfo');
const avatarUploadBtn = document.getElementById('avatarUploadBtn');
const avatarInput = document.getElementById('avatarInput');
const uploadSectionAvatar = document.getElementById('uploadSectionAvatar');
const uploaderName = document.getElementById('uploaderName');
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
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadDashboardData();
    setupEventListeners();
});

/**
 * Check authentication status
 */
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'admin.html';
        return;
    }
    
    // Get user data
    let userData;
    let userError;
    
    try {
        const result = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
        userData = result.data;
        userError = result.error;
    } catch (e) {
        userError = e;
    }
    
    console.log('User data from DB:', userData);
    console.log('User error:', userError);
    console.log('Avatar URL from DB:', userData?.avatar_url);
    
    // If user doesn't exist in users table, create them
    if (!userData || userError) {
        console.log('User not found in users table, creating...');
        const { data: newUser, error: createError } = await supabaseClient
            .from('users')
            .insert([{
                id: session.user.id,
                email: session.user.email,
                username: session.user.email?.split('@')[0] || 'admin',
                role: 'admin'
            }])
            .select()
            .single();
        
        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log('User created:', newUser);
            userData = newUser;
        }
    }
    
    currentUser = userData || { username: session.user.email?.split('@')[0] || 'Admin' };
    adminInfo.textContent = `Welcome, ${currentUser.username || 'Admin'}`;
    
    // Show admin avatar if available
    if (currentUser.avatar_url) {
        console.log('Loading avatar:', currentUser.avatar_url);
        const adminAvatar = document.getElementById('adminAvatar');
        adminAvatar.src = currentUser.avatar_url;
        adminAvatar.style.display = 'block';
        
        // Update upload section avatar
        uploadSectionAvatar.src = currentUser.avatar_url;
    } else {
        console.log('No avatar found, using default');
        // Show default avatar
        const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%237c3aed"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7.33 2.67-8 6h16c-.67-3.33-4-6-8-6z"/></svg>';
        const adminAvatar = document.getElementById('adminAvatar');
        adminAvatar.src = defaultAvatar;
        adminAvatar.style.display = 'block';
        
        // Update upload section avatar
        uploadSectionAvatar.src = defaultAvatar;
    }
    
    // Update uploader name in upload section
    uploaderName.textContent = currentUser.username || 'Admin';
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
        // Get total count
        const { count: totalArtworksCount, error: countError } = await supabaseClient
            .from('artworks')
            .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        // Get artworks by category
        const { data: artworksData, error: dataError } = await supabaseClient
            .from('artworks')
            .select('category');
        
        if (dataError) throw dataError;
        
        // Group by category
        const artworksByCategory = artworksData.reduce((acc, artwork) => {
            const category = artwork.category;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        
        totalArtworks.textContent = totalArtworksCount || 0;
        totalCategories.textContent = Object.keys(artworksByCategory).length;
        
        // Calculate recent uploads (this month)
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const recentCount = artworks.filter(a => new Date(a.createdAt) >= thisMonth).length;
        recentUploads.textContent = recentCount;
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
        
        const { data: artworksData, error } = await supabaseClient
            .from('artworks')
            .select('*, users(username, avatar_url)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        artworks = artworksData.map(convertArtwork);
        renderArtworksTable(artworks);
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
 * Convert Supabase artwork to frontend format
 */
function convertArtwork(artwork) {
    return {
        ...artwork,
        _id: artwork.id,
        createdAt: artwork.created_at,
        imageUrl: artwork.image_url,
        uploadedBy: artwork.uploaded_by,
        uploaderName: artwork.users?.username || 'Unknown',
        uploaderAvatar: artwork.users?.avatar_url
    };
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
        <td class="uploader-cell">
            <div class="uploader-info">
                ${artwork.uploaderAvatar ? `<img src="${artwork.uploaderAvatar}" alt="${escapeHtml(artwork.uploaderName)}" class="table-avatar">` : ''}
                <span>${escapeHtml(artwork.uploaderName)}</span>
            </div>
        </td>
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
    
    // Avatar upload
    avatarUploadBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarUpload);
    
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
async function handleLogout() {
    console.log('Logging out...');
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    } else {
        console.log('Logout successful');
    }
    window.location.href = 'admin.html';
}

/**
 * Handle avatar upload
 */
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
    }
    
    try {
        // Upload avatar to Supabase Storage
        const fileName = `${currentUser.id}-${Date.now()}-${file.name}`;
        const filePath = `avatars/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('user-avatars')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('user-avatars')
            .getPublicUrl(filePath);
        
        // Update user record with new avatar URL
        console.log('Updating user record with avatar URL:', publicUrl);
        console.log('Current user ID:', currentUser.id);
        
        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', currentUser.id);
        
        if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
        }
        
        console.log('Avatar saved to database:', publicUrl);
        
        // Verify the update
        const { data: verifyData } = await supabaseClient
            .from('users')
            .select('avatar_url')
            .eq('id', currentUser.id)
            .single();
        
        console.log('Verified avatar_url in DB:', verifyData?.avatar_url);
        
        // Update UI
        const adminAvatar = document.getElementById('adminAvatar');
        adminAvatar.src = publicUrl;
        uploadSectionAvatar.src = publicUrl;
        currentUser.avatar_url = publicUrl;
        
        alert('Avatar updated successfully!');
    } catch (error) {
        console.error('Avatar upload error:', error);
        alert('Failed to upload avatar. Please try again.');
    }
    
    // Reset input
    avatarInput.value = '';
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
        // Upload image to Supabase Storage
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const filePath = `artwork-images/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('artwork-images')
            .upload(filePath, selectedFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('artwork-images')
            .getPublicUrl(filePath);
        
        // Create artwork record
        const { error: dbError } = await supabaseClient
            .from('artworks')
            .insert([{
                title,
                caption,
                category,
                image_url: publicUrl,
                storage_path: filePath,
                uploaded_by: currentUser.id
            }]);
        
        if (dbError) {
            // Clean up uploaded image if database insert fails
            await supabaseClient.storage.from('artwork-images').remove([filePath]);
            throw dbError;
        }
        
        // Reset form
        uploadForm.reset();
        handleFileRemove();
        
        // Reload data
        await loadDashboardData();
        
        // Show success message
        alert('Artwork uploaded successfully!');
    } catch (error) {
        console.error('Upload error:', error);
        showError(uploadError, error.message || 'An error occurred. Please try again.');
    } finally {
        setLoading(uploadButton, false);
    }
}

/**
 * Open edit modal
 */
function openEditModal(artwork) {
    document.getElementById('editArtworkId').value = artwork.id;
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
        // Get existing artwork
        const { data: existingArtwork, error: fetchError } = await supabaseClient
            .from('artworks')
            .select('*')
            .eq('id', artworkId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const updateData = {
            title,
            caption,
            category
        };
        
        // Update image if new one is uploaded
        if (editSelectedFile) {
            // Delete old image from Supabase Storage
            await supabaseClient.storage.from('artwork-images').remove([existingArtwork.storage_path]);
            
            // Upload new image
            const fileName = `${Date.now()}-${editSelectedFile.name}`;
            const filePath = `artwork-images/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('artwork-images')
                .upload(filePath, editSelectedFile);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('artwork-images')
                .getPublicUrl(filePath);
            
            updateData.image_url = publicUrl;
            updateData.storage_path = filePath;
        }
        
        // Update artwork in database
        const { error } = await supabaseClient
            .from('artworks')
            .update(updateData)
            .eq('id', artworkId);
        
        if (error) throw error;
        
        closeEditModal();
        await loadDashboardData();
        alert('Artwork updated successfully!');
    } catch (error) {
        console.error('Edit error:', error);
        showError(editError, error.message || 'An error occurred. Please try again.');
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
        // Get artwork
        const { data: artwork, error: fetchError } = await supabaseClient
            .from('artworks')
            .select('*')
            .eq('id', artworkToDelete)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Delete image from Supabase Storage
        await supabaseClient.storage.from('artwork-images').remove([artwork.storage_path]);
        
        // Delete artwork from database
        const { error } = await supabaseClient
            .from('artworks')
            .delete()
            .eq('id', artworkToDelete);
        
        if (error) throw error;
        
        closeDeleteModal();
        await loadDashboardData();
        alert('Artwork deleted successfully!');
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
