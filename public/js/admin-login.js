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
    // Clear form fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    checkAuthStatus();
    setupEventListeners();
});

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    console.log('Current session:', session);
    if (session) {
        // User is logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
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
    
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError(loginError, 'Please fill in all fields');
        return;
    }
    
    setLoading(loginButton, true);
    hideError(loginError);
    
    try {
        console.log('Attempting login with email:', email);
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        console.log('Login response:', data, error);
        
        if (error) {
            console.error('Login error:', error);
            showError(loginError, error.message || 'Login failed');
        } else {
            console.log('Login successful, user:', data.user);
            // Create user record if it doesn't exist
            const { error: userError } = await supabaseClient
                .from('users')
                .upsert([{
                    id: data.user.id,
                    email: data.user.email,
                    username: data.user.email?.split('@')[0] || 'admin',
                    role: 'admin'
                }], {
                    onConflict: 'id'
                });
            
            if (userError) {
                console.error('User record error:', userError);
            }
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
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
    
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!email || !password) {
        showError(registerError, 'Please fill in all required fields');
        return;
    }
    
    if (password.length < 6) {
        showError(registerError, 'Password must be at least 6 characters');
        return;
    }
    
    setLoading(registerButton, true);
    hideError(registerError);
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username || email.split('@')[0]
                }
            }
        });
        
        if (error) {
            showError(registerError, error.message || 'Registration failed');
        } else {
            // Create user record
            const { error: userError } = await supabaseClient
                .from('users')
                .insert([{
                    id: data.user.id,
                    email: data.user.email,
                    username: username || email.split('@')[0],
                    role: 'admin'
                }]);
            
            if (userError) {
                console.error('User record error:', userError);
            }
            
            // Close modal and redirect to dashboard
            closeRegisterModal();
            window.location.href = 'dashboard.html';
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
