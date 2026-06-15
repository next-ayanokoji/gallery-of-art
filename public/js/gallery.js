/**
 * Gallery JavaScript
 * Handles artwork gallery interactions, filtering, and modal functionality
 */

// DOM Elements
const galleryGrid = document.getElementById('galleryGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const artworkCount = document.getElementById('artworkCount');
const searchInput = document.getElementById('searchInput');
const imageModal = document.getElementById('imageModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalCaption = document.getElementById('modalCaption');
const modalCategory = document.getElementById('modalCategory');
const modalDate = document.getElementById('modalDate');
const navLinks = document.querySelectorAll('.nav-link');

// State
let currentCategory = 'all';
let currentSearch = '';
let artworks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArtworks();
    setupEventListeners();
});

/**
 * Load artworks from API
 */
async function loadArtworks() {
    try {
        showLoading();
        
        // Build query parameters
        const params = new URLSearchParams();
        if (currentCategory !== 'all') {
            params.append('category', currentCategory);
        }
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        const response = await fetch(`/api/artworks?${params}`);
        const data = await response.json();
        
        if (data.success) {
            artworks = data.artworks;
            renderArtworks(artworks);
            updateArtworkCount(artworks.length);
        } else {
            showError('Failed to load artworks');
        }
    } catch (error) {
        console.error('Error loading artworks:', error);
        showError('Error loading artworks. Please try again.');
    }
}

/**
 * Render artworks to the grid
 */
function renderArtworks(artworksToRender) {
    galleryGrid.innerHTML = '';
    
    if (artworksToRender.length === 0) {
        showEmpty();
        return;
    }
    
    hideLoading();
    hideEmpty();
    
    artworksToRender.forEach(artwork => {
        const card = createArtworkCard(artwork);
        galleryGrid.appendChild(card);
    });
}

/**
 * Create artwork card element
 */
function createArtworkCard(artwork) {
    const card = document.createElement('div');
    card.className = 'artwork-card glass-card';
    card.setAttribute('data-id', artwork._id);
    
    const formattedDate = formatDate(artwork.createdAt);
    
    card.innerHTML = `
        <img src="${artwork.imageUrl}" alt="${artwork.title}" class="artwork-image" loading="lazy">
        <div class="artwork-info">
            <h3 class="artwork-title">${escapeHtml(artwork.title)}</h3>
        </div>
        <div class="artwork-overlay">
            <h3 class="artwork-title">${escapeHtml(artwork.title)}</h3>
            <p class="artwork-caption">${escapeHtml(artwork.caption)}</p>
            <div class="artwork-meta">
                <span class="artwork-category">${escapeHtml(artwork.category)}</span>
                <span class="artwork-date">${formattedDate}</span>
            </div>
        </div>
    `;
    
    // Add click event for modal
    card.addEventListener('click', () => openModal(artwork));
    
    return card;
}

/**
 * Open image modal
 */
function openModal(artwork) {
    modalImage.src = artwork.imageUrl;
    modalImage.alt = artwork.title;
    modalTitle.textContent = artwork.title;
    modalCaption.textContent = artwork.caption;
    modalCategory.textContent = artwork.category;
    modalDate.textContent = formatDate(artwork.createdAt);
    
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close image modal
 */
function closeModal() {
    imageModal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim();
            loadArtworks();
        }, 300);
    });
    
    // Category filter links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update category and reload
            currentCategory = link.getAttribute('data-filter');
            loadArtworks();
        });
    });
    
    // Modal close button
    modalClose.addEventListener('click', closeModal);
    
    // Close modal on backdrop click
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal.classList.contains('active')) {
            closeModal();
        }
    });
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    galleryGrid.innerHTML = '';
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.style.display = 'none';
}

/**
 * Show empty state
 */
function showEmpty() {
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    galleryGrid.innerHTML = '';
}

/**
 * Hide empty state
 */
function hideEmpty() {
    emptyState.style.display = 'none';
}

/**
 * Update artwork count
 */
function updateArtworkCount(count) {
    artworkCount.textContent = `${count} artwork${count !== 1 ? 's' : ''}`;
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
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

/**
 * Show error message
 */
function showError(message) {
    hideLoading();
    showEmpty();
    emptyState.querySelector('h4').textContent = 'Error';
    emptyState.querySelector('p').textContent = message;
}
