<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <span class="logo-text">The Vine</span>
      </div>

      <h1>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h1>
      <p class="subtitle">{{ isSignUp ? 'Sign up to get started' : 'Sign in to continue' }}</p>
      
      <form @submit.prevent="handleSubmit">
        <!-- Role Selection for Sign Up -->
        <div v-if="isSignUp" class="form-group">
          <label>I am a...</label>
          <div class="role-selector">
            <button 
              type="button"
              :class="{ active: role === 'member' }"
              @click="role = 'member'"
              class="role-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Member
            </button>
            <button 
              type="button"
              :class="{ active: role === 'admin' }"
              @click="role = 'admin'"
              class="role-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin
            </button>
          </div>
          <p class="role-hint">Admins can publish documents to the public library</p>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>
        
        <!-- Display Name for Sign Up -->
        <div v-if="isSignUp" class="form-group">
          <label>Display Name</label>
          <input
            v-model="displayName"
            type="text"
            placeholder="How should we call you?"
            required
          />
        </div>
        
        <p v-if="error" class="message error">{{ error }}</p>
        <p v-if="success" class="message success">{{ success }}</p>
        
        <button type="submit" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '' : (isSignUp ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>
      
      <p class="toggle-text">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <span @click="toggleMode">{{ isSignUp ? 'Sign In' : 'Sign Up' }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { supabase } from '../supabase'

export default {
  name: 'LoginScreen',
  emits: ['login-success'],
  setup(props, { emit }) {
    const email = ref('')
    const password = ref('')
    const displayName = ref('')
    const role = ref('member')
    const isSignUp = ref(false)
    const loading = ref(false)
    const error = ref('')
    const success = ref('')

    const toggleMode = () => {
      isSignUp.value = !isSignUp.value
      error.value = ''
      success.value = ''
      // Reset fields when toggling
      if (!isSignUp.value) {
        displayName.value = ''
      }
    }

    const handleSubmit = async () => {
      loading.value = true
      error.value = ''
      success.value = ''

      try {
        if (isSignUp.value) {
          const { error: err } = await supabase.auth.signUp({
            email: email.value,
            password: password.value,
            options: {
              data: {
                display_name: displayName.value,
                role: role.value
              }
            }
          })
          if (err) throw err
          success.value = 'Check your email for confirmation!'
          // Auto sign in after successful signup
          setTimeout(async () => {
            const { data, error: signInErr } = await supabase.auth.signInWithPassword({
              email: email.value,
              password: password.value,
            })
            if (!signInErr && data.user) {
              emit('login-success', data.user)
            }
          }, 1500)
        } else {
          const { data, error: err } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value,
          })
          if (err) throw err
          emit('login-success', data.user)
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      password,
      displayName,
      role,
      isSignUp,
      loading,
      error,
      success,
      toggleMode,
      handleSubmit,
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--neo-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-box {
  background: var(--neo-bg);
  padding: 40px;
  border-radius: var(--neo-radius-lg);
  box-shadow: var(--neo-raised-lg);
  border: none;
  width: 100%;
  max-width: 400px;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background-color: var(--neo-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--neo-accent);
  box-shadow: var(--neo-raised-sm);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--neo-text);
}

h1 {
  text-align: center;
  margin-bottom: 8px;
  color: var(--neo-text);
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: var(--neo-text-muted);
  font-size: 14px;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--neo-text);
  margin-bottom: 8px;
}

.role-selector {
  display: flex;
  gap: 12px;
}

.role-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--neo-bg);
  border: none;
  border-radius: var(--neo-radius);
  cursor: pointer;
  transition: box-shadow 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: var(--neo-text-muted);
  box-shadow: var(--neo-raised-sm);
}

.role-btn:hover {
  color: var(--neo-text);
}

.role-btn.active {
  color: var(--neo-accent);
  box-shadow: var(--neo-inset-sm);
}

.role-hint {
  font-size: 12px;
  color: var(--neo-text-muted);
  margin-top: 8px;
  text-align: center;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  transition: box-shadow 0.2s;
  font-family: inherit;
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-inset-sm);
}

input::placeholder {
  color: var(--neo-text-muted);
}

input:focus {
  outline: none;
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.25);
}

.message {
  text-align: center;
  margin-bottom: 16px;
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 8px;
}

.error {
  color: #dc3545;
  background-color: #fff5f5;
}

.success {
  color: #198754;
  background-color: #f0f9f4;
}

button {
  width: 100%;
  padding: 14px;
  background-color: var(--neo-accent);
  color: white;
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  box-shadow: var(--neo-raised-sm), 0 0 12px rgba(232, 149, 111, 0.35);
}

button:hover:not(:disabled) {
  box-shadow: var(--neo-inset-sm), 0 0 8px rgba(232, 149, 111, 0.25);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toggle-text {
  text-align: center;
  margin-top: 24px;
  color: var(--neo-text-muted);
  font-size: 14px;
}

.toggle-text span {
  color: var(--neo-accent);
  cursor: pointer;
  font-weight: 600;
  margin-left: 4px;
}

.toggle-text span:hover {
  text-decoration: underline;
}
</style>
