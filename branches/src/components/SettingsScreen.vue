<template>
  <div class="settings-page">
    <header class="settings-header">
      <h1>Settings</h1>
      <p>Manage your account preferences</p>
    </header>

    <!-- Settings Sections -->
    <div class="settings-sections">
      <!-- Profile Section -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3>Profile</h3>
            <p>Your public profile information</p>
          </div>
        </div>

        <div class="card-body">
          <!-- Avatar -->
          <div class="avatar-row">
            <div class="avatar-wrapper" @click="triggerAvatarUpload">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="avatar-img" />
              <div v-else class="avatar-placeholder">{{ userInitials }}</div>
              <div class="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*" style="display: none" />
            <div class="avatar-text">
              <span class="avatar-label">Profile Photo</span>
              <span class="avatar-hint">JPG, PNG or GIF. Max 2MB</span>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="form-row">
            <div class="form-group">
              <label>Display Name</label>
              <input v-model="displayName" type="text" class="input" placeholder="Enter your display name" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input :value="email" type="email" class="input" disabled />
            </div>
          </div>

          <div class="form-group">
            <label>Bio</label>
            <textarea v-model="bio" class="input textarea" rows="3" placeholder="Tell us about yourself"></textarea>
          </div>

          <div class="card-actions">
            <button class="btn-primary" @click="saveProfile" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Security Section -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h3>Security</h3>
            <p>Password and authentication</p>
          </div>
        </div>

        <div class="card-body">
          <div class="security-item">
            <div class="security-info">
              <span class="security-label">Password</span>
              <span class="security-hint">Last changed: Never</span>
            </div>
            <button class="btn-secondary" @click="showPasswordModal = true">
              Change Password
            </button>
          </div>
        </div>
      </section>

      <!-- Appearance Section -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </div>
          <div>
            <h3>Appearance</h3>
            <p>Customize how it looks</p>
          </div>
        </div>

        <div class="card-body">
          <div class="appearance-item">
            <span class="appearance-label">Theme</span>
            <div class="theme-options">
              <button 
                class="theme-btn" 
                :class="{ active: theme === 'light' }"
                @click="theme = 'light'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
                Light
              </button>
              <button 
                class="theme-btn" 
                :class="{ active: theme === 'dark' }"
                @click="theme = 'dark'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Dark
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Account Section -->
      <section class="settings-card danger-zone">
        <div class="card-header">
          <div class="card-icon danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3>Danger Zone</h3>
            <p>Irreversible actions</p>
          </div>
        </div>

        <div class="card-body">
          <div class="danger-item">
            <div class="danger-info">
              <span class="danger-label">Delete Account</span>
              <span class="danger-desc">Permanently delete your account and all data</span>
            </div>
            <button class="btn-danger" @click="showDeleteModal = true">
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal">
        <h3>Change Password</h3>
        <div class="modal-body">
          <div class="form-group">
            <label>New Password</label>
            <input v-model="newPassword" type="password" class="input" placeholder="Enter new password" />
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input v-model="confirmPassword" type="password" class="input" placeholder="Confirm new password" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPasswordModal = false">Cancel</button>
          <button class="btn-primary" @click="changePassword" :disabled="changingPassword || !newPassword || !confirmPassword">
            {{ changingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal danger">
        <h3>Delete Account</h3>
        <div class="modal-body">
          <p class="warning-text">
            This will permanently delete your account, remove all your documents, and cannot be undone.
          </p>
          <div class="form-group">
            <label>Type "DELETE" to confirm</label>
            <input v-model="deleteConfirm" type="text" class="input" placeholder="DELETE" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="deleteAccount" :disabled="deleteConfirm !== 'DELETE'">
            Permanently Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast" :class="toastType">
      {{ toast }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

export default {
  name: 'SettingsScreen',
  setup() {
    const email = ref('')
    const displayName = ref('')
    const bio = ref('')
    const avatarUrl = ref('')
    const avatarFile = ref(null)
    const avatarInput = ref(null)
    const theme = ref('light')
    
    const saving = ref(false)
    const showPasswordModal = ref(false)
    const showDeleteModal = ref(false)
    const changingPassword = ref(false)
    const toast = ref('')
    const toastType = ref('success')
    
    const newPassword = ref('')
    const confirmPassword = ref('')
    const deleteConfirm = ref('')

    const userInitials = computed(() => {
      const name = displayName.value || email.value || 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    })

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => { toast.value = '' }, 3000)
    }

    const triggerAvatarUpload = () => avatarInput.value?.click()

    const handleAvatarChange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be less than 2MB', 'error')
        return
      }
      avatarFile.value = file
      avatarUrl.value = URL.createObjectURL(file)
    }

    const saveProfile = async () => {
      if (!displayName.value.trim()) {
        showToast('Display name is required', 'error')
        return
      }
      
      saving.value = true
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            display_name: displayName.value, 
            bio: bio.value 
          }
        })
        if (updateError) throw updateError

        if (avatarFile.value) {
          const fileExt = avatarFile.value.name.split('.').pop()
          const fileName = `${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('avatars').upload(fileName, avatarFile.value)
          if (!uploadError) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
            await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
          }
        }
        showToast('Profile updated successfully!')
      } catch (error) {
        console.error('Error saving profile:', error)
        showToast('Failed to update profile', 'error')
      } finally {
        saving.value = false
      }
    }

    const changePassword = async () => {
      if (newPassword.value !== confirmPassword.value) {
        showToast('Passwords do not match', 'error')
        return
      }
      if (newPassword.value.length < 6) {
        showToast('Password must be at least 6 characters', 'error')
        return
      }
      
      changingPassword.value = true
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword.value })
        if (error) throw error
        
        showPasswordModal.value = false
        newPassword.value = ''
        confirmPassword.value = ''
        showToast('Password updated successfully!')
      } catch (error) {
        console.error('Error changing password:', error)
        showToast('Failed to update password', 'error')
      } finally {
        changingPassword.value = false
      }
    }

    const deleteAccount = async () => {
      if (deleteConfirm.value !== 'DELETE') return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Delete user's documents
        await supabase.from('documents').delete().eq('user_id', user.id)
        await supabase.from('public_documents').delete().eq('user_id', user.id)
        await supabase.from('folders').delete().eq('user_id', user.id)
        await supabase.from('public_folders').delete().eq('user_id', user.id)
        
        await supabase.auth.signOut()
        showToast('Account deleted. Redirecting...', 'success')
        setTimeout(() => { window.location.reload() }, 2000)
      } catch (error) {
        console.error('Error deleting account:', error)
        showToast('Failed to delete account', 'error')
      }
    }

    onMounted(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        email.value = user.email
        displayName.value = user.user_metadata?.display_name || ''
        bio.value = user.user_metadata?.bio || ''
        avatarUrl.value = user.user_metadata?.avatar_url || ''
      }
    })

    return {
      email, displayName, bio, avatarUrl, avatarInput,
      saving, showPasswordModal, showDeleteModal,
      changingPassword, newPassword, confirmPassword,
      deleteConfirm, toast, toastType, userInitials, theme,
      triggerAvatarUpload, handleAvatarChange, saveProfile,
      changePassword, deleteAccount
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 32px 48px;
  min-height: 100vh;
  box-sizing: border-box;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.settings-header p {
  font-size: 14px;
  color: #6c757d;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.settings-card.danger-zone {
  border: 1px solid #f5c6cb;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.card-icon.danger {
  background: #fff5f5;
  color: #dc3545;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.card-header p {
  font-size: 13px;
  color: #6c757d;
}

.card-body {
  padding: 24px;
}

/* Avatar */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.avatar-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.avatar-hint {
  font-size: 12px;
  color: #6c757d;
}

/* Form */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.input:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.card-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* Security */
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.security-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.security-hint {
  font-size: 12px;
  color: #6c757d;
}

/* Appearance */
.appearance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.appearance-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.theme-options {
  display: flex;
  gap: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  border-color: #ccc;
  color: #1a1a1a;
}

.theme-btn.active {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: white;
}

/* Danger */
.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.danger-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.danger-label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.danger-desc {
  font-size: 12px;
  color: #6c757d;
}

/* Buttons */
.btn-primary {
  padding: 10px 20px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #333;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  color: #1a1a1a;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.btn-danger {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 28px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.modal.danger h3 {
  color: #dc3545;
}

.modal-body {
  margin-bottom: 24px;
}

.warning-text {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 14px 24px;
  background: #1a1a1a;
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  z-index: 1001;
}

.toast.error {
  background: #dc3545;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
