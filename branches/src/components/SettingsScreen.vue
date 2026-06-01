<template>
  <div class="settings-page">
    <header class="settings-header">
      <h1>Settings</h1>
      <p>Your account details</p>
    </header>

    <div class="settings-body">
      <section class="settings-card">
        <div class="profile-row">
          <div class="avatar" :class="{ 'has-image': !!avatarUrl }">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" class="avatar-img" />
            <span v-else class="avatar-initials">{{ userInitials }}</span>
          </div>
          <div class="profile-meta">
            <span class="profile-label">Signed in as</span>
            <span class="profile-email">{{ email }}</span>
            <span v-if="roleLabel" class="role-badge">{{ roleLabel }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="display-name">Display name</label>
          <input
            id="display-name"
            v-model="displayName"
            type="text"
            class="input"
            placeholder="How you appear in the app"
          />
        </div>

        <div class="card-actions">
          <button class="btn-primary" :disabled="saving" @click="saveProfile">
            {{ saving ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="card-title">Security</h2>
        <p class="card-desc">Update the password you use to sign in.</p>
        <button type="button" class="btn-secondary" @click="showPasswordModal = true">
          Change password
        </button>
      </section>

      <p class="settings-footnote">
        Use <strong>Logout</strong> in the sidebar to sign out of this device.
      </p>
    </div>

    <div
      v-if="showPasswordModal"
      class="modal-overlay"
      @click.self="closePasswordModal"
    >
      <div class="modal">
        <h3>Change password</h3>
        <div class="modal-body">
          <div class="form-group">
            <label for="new-password">New password</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="At least 6 characters"
              autocomplete="new-password"
            />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              class="input"
              placeholder="Re-enter new password"
              autocomplete="new-password"
            />
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closePasswordModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="changingPassword || !canSubmitPassword"
            @click="changePassword"
          >
            {{ changingPassword ? 'Updating…' : 'Update password' }}
          </button>
        </div>
      </div>
    </div>

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
    const avatarUrl = ref('')
    const role = ref('')
    const saving = ref(false)
    const showPasswordModal = ref(false)
    const changingPassword = ref(false)
    const newPassword = ref('')
    const confirmPassword = ref('')
    const toast = ref('')
    const toastType = ref('success')

    const userInitials = computed(() => {
      const name = displayName.value || email.value || 'U'
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    })

    const roleLabel = computed(() => {
      if (role.value === 'admin') return 'Administrator'
      if (role.value === 'member') return 'Member'
      return ''
    })

    const canSubmitPassword = computed(
      () => newPassword.value.length >= 6 && confirmPassword.value.length >= 6
    )

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => {
        toast.value = ''
      }, 3000)
    }

    const closePasswordModal = () => {
      showPasswordModal.value = false
      newPassword.value = ''
      confirmPassword.value = ''
    }

    const saveProfile = async () => {
      if (!displayName.value.trim()) {
        showToast('Display name is required', 'error')
        return
      }

      saving.value = true
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { display_name: displayName.value.trim() }
        })
        if (updateError) throw updateError

        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id && user?.email) {
          await supabase.from('user_profiles').upsert(
            {
              id: user.id,
              email: user.email.trim().toLowerCase(),
              display_name: displayName.value.trim(),
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
          )
        }

        showToast('Profile saved')
      } catch (error) {
        console.error('Error saving profile:', error)
        showToast('Could not save profile', 'error')
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
        const { error } = await supabase.auth.updateUser({
          password: newPassword.value
        })
        if (error) throw error

        closePasswordModal()
        showToast('Password updated')
      } catch (error) {
        console.error('Error changing password:', error)
        showToast(error.message || 'Could not update password', 'error')
      } finally {
        changingPassword.value = false
      }
    }

    onMounted(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        email.value = user.email || ''
        displayName.value = user.user_metadata?.display_name || ''
        avatarUrl.value = user.user_metadata?.avatar_url || ''
        role.value = user.user_metadata?.role || ''
      }
    })

    return {
      email,
      displayName,
      avatarUrl,
      saving,
      showPasswordModal,
      changingPassword,
      newPassword,
      confirmPassword,
      canSubmitPassword,
      toast,
      toastType,
      userInitials,
      roleLabel,
      saveProfile,
      changePassword,
      closePasswordModal
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 24px 32px;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--neo-bg);
}

.settings-header {
  margin-bottom: 20px;
  flex-shrink: 0;
  width: 100%;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--neo-text);
  margin-bottom: 4px;
}

.settings-header p {
  font-size: 14px;
  color: var(--neo-text-muted);
}

.settings-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: min-content;
  align-content: start;
  gap: 20px;
  padding: 24px;
  box-sizing: border-box;
  background: var(--neo-bg);
  border-radius: var(--neo-radius-lg);
  box-shadow: var(--neo-inset);
}

.settings-card {
  background: var(--neo-bg);
  border-radius: var(--neo-radius-lg);
  padding: 28px;
  box-shadow: var(--neo-raised);
  min-height: 0;
  height: fit-content;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--neo-text);
  margin: 0 0 6px;
}

.card-desc {
  font-size: 13px;
  color: var(--neo-text-muted);
  margin: 0 0 20px;
  line-height: 1.45;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  box-shadow: inset 0 -1px 0 rgba(163, 177, 198, 0.25);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neo-bg);
  box-shadow: var(--neo-raised-sm);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 20px;
  font-weight: 600;
  color: var(--neo-accent);
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.profile-label {
  font-size: 12px;
  color: var(--neo-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-email {
  font-size: 14px;
  font-weight: 500;
  color: var(--neo-text);
  word-break: break-all;
}

.role-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--neo-accent);
  background: var(--neo-bg);
  border-radius: var(--neo-radius-pill);
  box-shadow: var(--neo-inset-sm);
  width: fit-content;
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
  color: var(--neo-text);
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-family: inherit;
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-inset-sm);
  transition: box-shadow 0.2s;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.25);
}

.card-actions {
  margin-top: 8px;
}

.btn-primary {
  padding: 12px 24px;
  background: var(--neo-accent);
  color: #fff;
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--neo-raised-sm), 0 0 10px rgba(232, 149, 111, 0.3);
  transition: box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--neo-inset-sm), 0 0 8px rgba(232, 149, 111, 0.25);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: var(--neo-bg);
  color: var(--neo-text);
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--neo-raised-sm);
  transition: box-shadow 0.2s;
}

.btn-secondary:hover {
  box-shadow: var(--neo-inset-sm);
}

.settings-footnote {
  grid-column: 1 / -1;
  font-size: 13px;
  color: var(--neo-text-muted);
  line-height: 1.5;
  margin: 0;
  padding-top: 4px;
}

.settings-footnote strong {
  color: var(--neo-text);
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(163, 177, 198, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: var(--neo-bg);
  padding: 28px;
  border-radius: var(--neo-radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--neo-raised-lg);
  box-sizing: border-box;
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--neo-text);
  margin: 0 0 20px;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 14px 24px;
  background: var(--neo-accent);
  color: white;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--neo-raised);
  z-index: 1001;
}

.toast.error {
  background: #c0392b;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .settings-body {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn-primary,
  .modal-actions .btn-secondary {
    width: 100%;
  }
}
</style>
