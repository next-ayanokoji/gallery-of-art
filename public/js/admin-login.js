/**
 * Admin Login JavaScript
 * Handles admin authentication, login, and registration
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const registerLink = document.getElementById('registerLink');
const registerModal = document.getElementById('registerModal');
const registerModalClose = document.getElementById('registerModalClose');
const registerForm = document.getElementById('registerForm');
const registerButton = document.getElementById('registerButton');
const registerError = document.getElementById('registerError');

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

/**
 * Check authentication status
 */
function checkAuthStatus() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Verify token is valid
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Token is valid, redirect to dashboard
                window.location.href = '/admin/dashboard';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('adminToken');
            }
        })
        .catch(() => {
            localStorage.removeItem('adminToken');
        });
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Register link click
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        openRegisterModal();
    });
    
    // Register modal close
    registerModalClose.addEventListener('click', closeRegisterModal);
    
    // Register form submission
    registerForm.addEventListener('submit', handleRegister);
    
    // Close modal on backdrop click
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            closeRegisterModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && registerModal.classList.contains('active')) {
            closeRegisterModal();
        }
    });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError(loginError, 'Please fill in all fields');
        return;
    }
    
    setLoading(loginButton, true);
    hideError(loginError);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token in localStorage
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = '/admin/dashboard';
        } else {
            showError(loginError, data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, 'An error occurred. Please try again.');
    } finally {
        setLoading(loginButton, false);
    }
}

/**
 * Handle registration form submission
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        showError(registerError, 'Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError(registerError, 'Password must be at least 6 characters');
        return;
    }
    
    setLoading(registerButton, true);
    hideError(registerError);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token in localStorage
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Close modal and redirect to dashboard
            closeRegisterModal();
            window.location.href = '/admin/dashboard';
        } else {
            showError(registerError, data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError(registerError, 'An error occurred. Please try again.');
    } finally {
        setLoading(registerButton, false);
    }
}

/**
 * Open registration modal
 */
function openRegisterModal() {
    registerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close registration modal
 */
function closeRegisterModal() {
    registerModal.classList.remove('active');
    document.body.style.overflow = '';
    registerForm.reset();
    hideError(registerError);
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
