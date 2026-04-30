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
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
  background-color: #1a1a1a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

h1 {
  text-align: center;
  margin-bottom: 8px;
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: #6c757d;
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
  color: #1a1a1a;
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
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.role-btn:hover {
  border-color: #ccc;
  background: #fafafa;
}

.role-btn.active {
  border-color: #1a1a1a;
  background: #f5f5f5;
  color: #1a1a1a;
}

.role-hint {
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  text-align: center;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}

input::placeholder {
  color: #adb5bd;
}

input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
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
  background-color: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

button:hover:not(:disabled) {
  background-color: #333;
  transform: translateY(-1px);
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
  color: #6c757d;
  font-size: 14px;
}

.toggle-text span {
  color: #1a1a1a;
  cursor: pointer;
  font-weight: 600;
  margin-left: 4px;
}

.toggle-text span:hover {
  text-decoration: underline;
}
</style>
