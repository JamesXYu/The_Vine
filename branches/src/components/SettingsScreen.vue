<template>
  <div class="settings-layout">
    <!-- Fixed Sidebar -->
    <aside class="settings-sidebar">
      <h2>Settings</h2>
      <nav class="settings-nav">
        <button 
          :class="{ active: activeSection === 'profile' }" 
          @click="activeSection = 'profile'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Profile
        </button>
        <button 
          :class="{ active: activeSection === 'account' }" 
          @click="activeSection = 'account'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Account
        </button>
        <button 
          :class="{ active: activeSection === 'danger' }" 
          @click="activeSection = 'danger'"
          class="danger-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Danger Zone
        </button>
      </nav>
    </aside>

    <!-- Floating Content -->
    <main class="settings-content">
      <!-- Profile Section -->
      <section v-if="activeSection === 'profile'" class="settings-section">
        <h3>Profile</h3>
        <p class="section-desc">Your public profile information</p>

        <div class="avatar-section">
          <div class="avatar-preview" @click="triggerAvatarUpload">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="avatar-img" />
            <div v-else class="avatar-placeholder">{{ userInitials }}</div>
            <div class="avatar-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*" style="display: none" />
          <div class="avatar-info">
            <p class="avatar-hint">Click to upload a new photo</p>
            <p class="avatar-formats">JPG, PNG or GIF. Max 2MB</p>
          </div>
        </div>

        <div class="form-group">
          <label>Display Name</label>
          <input v-model="displayName" type="text" placeholder="Enter your display name" class="input" />
        </div>

        <div class="form-group">
          <label>Bio</label>
          <textarea v-model="bio" placeholder="Tell us about yourself" class="input textarea" rows="3"></textarea>
        </div>

        <button class="btn-primary" @click="saveProfile" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </section>

      <!-- Account Section -->
      <section v-if="activeSection === 'account'" class="settings-section">
        <h3>Account</h3>
        <p class="section-desc">Email and authentication settings</p>

        <div class="form-group">
          <label>Email Address</label>
          <div class="input-with-badge">
            <input :value="email" type="email" disabled class="input disabled" />
            <span class="badge">Verified</span>
          </div>
          <p class="form-hint">Your email address is used for login and notifications</p>
        </div>

        <div class="form-group">
          <label>Password</label>
          <button class="btn-secondary" @click="showPasswordModal = true">
            Change Password
          </button>
        </div>
      </section>

      <!-- Danger Zone Section -->
      <section v-if="activeSection === 'danger'" class="settings-section danger">
        <h3>Danger Zone</h3>
        <p class="section-desc">Irreversible actions</p>

        <div class="danger-item">
          <div class="danger-info">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button class="btn-danger" @click="showDeleteModal = true">
            Delete Account
          </button>
        </div>
      </section>
    </main>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal">
        <h3>Change Password</h3>
        <div class="form-group">
          <label>Current Password</label>
          <input v-model="currentPassword" type="password" class="input" placeholder="Enter current password" />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input v-model="newPassword" type="password" class="input" placeholder="Enter new password" />
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input v-model="confirmPassword" type="password" class="input" placeholder="Confirm new password" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPasswordModal = false">Cancel</button>
          <button class="btn-primary" @click="changePassword" :disabled="changingPassword">
            {{ changingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3 class="danger-title">Delete Account</h3>
        <p class="modal-warning">
          Are you absolutely sure? This will permanently delete your account, 
          remove all your documents, and cannot be undone.
        </p>
        <div class="form-group">
          <label>Type "DELETE" to confirm</label>
          <input v-model="deleteConfirm" type="text" class="input" placeholder="DELETE" />
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
    <div v-if="toast" class="toast" :class="toastType">{{ toast }}</div>
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
    
    const activeSection = ref('profile')
    const saving = ref(false)
    const showPasswordModal = ref(false)
    const showDeleteModal = ref(false)
    const changingPassword = ref(false)
    const toast = ref('')
    const toastType = ref('success')
    
    const currentPassword = ref('')
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
      saving.value = true
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { display_name: displayName.value, bio: bio.value }
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
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        showToast('Password updated successfully!')
      } catch (error) {
        showToast('Failed to update password', 'error')
      } finally {
        changingPassword.value = false
      }
    }

    const deleteAccount = async () => {
      if (deleteConfirm.value !== 'DELETE') return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('documents').delete().eq('user_id', user.id)
        await supabase.auth.signOut()
        showToast('Account deleted. Redirecting...', 'success')
        setTimeout(() => { window.location.reload() }, 2000)
      } catch (error) {
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
      activeSection, saving, showPasswordModal, showDeleteModal,
      changingPassword, currentPassword, newPassword, confirmPassword,
      deleteConfirm, toast, toastType, userInitials,
      triggerAvatarUpload, handleAvatarChange, saveProfile,
      changePassword, deleteAccount
    }
  }
}
</script>

<style scoped>
.settings-layout {
  display: flex;
  min-height: calc(100vh - 48px);
}

/* Fixed Sidebar */
.settings-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #eee;
  padding: 24px 16px;
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 0;
  overflow-y: auto;
}

.settings-sidebar h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  padding: 0 12px;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-nav button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.settings-nav button:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.settings-nav button.active {
  background: #1a1a1a;
  color: white;
}

.settings-nav button.danger-btn {
  margin-top: 24px;
  color: #dc3545;
}

.settings-nav button.danger-btn:hover {
  background: #fff5f5;
}

.settings-nav button.danger-btn.active {
  background: #dc3545;
  color: white;
}

/* Floating Content */
.settings-content {
  flex: 1;
  margin-left: 240px;
  padding: 32px 48px;
  max-width: 640px;
}

.settings-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
}

.settings-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 28px;
}

/* Avatar */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
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
  font-size: 24px;
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

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info { flex: 1; }

.avatar-hint {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.avatar-formats {
  font-size: 12px;
  color: #6c757d;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.input.disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  font-size: 12px;
  color: #6c757d;
  margin-top: 6px;
}

.input-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-with-badge .input {
  flex: 1;
}

.badge {
  padding: 4px 10px;
  background: #d4edda;
  color: #155724;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
}

/* Danger Zone */
.settings-section.danger {
  border: 1px solid #f5c6cb;
}

.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.danger-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.danger-info p {
  font-size: 13px;
  color: #6c757d;
  max-width: 320px;
}

/* Buttons */
.btn-primary {
  padding: 12px 24px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
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
  padding: 12px 24px;
  background: white;
  color: #1a1a1a;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.btn-danger {
  padding: 12px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
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
  padding: 32px;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.modal h3.danger-title {
  color: #dc3545;
}

.modal-warning {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff5f5;
  border-radius: 10px;
  border: 1px solid #f5c6cb;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 14px 24px;
  background: #1a1a1a;
  color: white;
  border-radius: 12px;
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
