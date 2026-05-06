<template>
  <div class="saved-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Saved Documents</h1>
        <p class="subtitle">Your bookmarked documents for quick access</p>
      </div>
    </header>

    <!-- Empty State -->
    <div v-if="savedDocs.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h3>No saved documents yet</h3>
      <p>Save documents from the library or reading view to access them quickly here</p>
      <router-link to="/lib" class="btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Browse Library
      </router-link>
    </div>

    <!-- Saved Documents List -->
    <div v-else class="saved-list">
      <div 
        v-for="doc in savedDocs" 
        :key="doc.id" 
        class="saved-doc-item"
        @click="openDocument(doc)"
      >
        <div class="doc-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="doc-info">
          <div class="doc-title-row">
            <span class="doc-title">{{ doc.title }}</span>
            <span v-if="doc.folder_tag" class="folder-tag" :style="{ color: doc.folder_tag.color, borderColor: doc.folder_tag.color }">
              {{ doc.folder_tag.name }}
            </span>
          </div>
          <span class="doc-date">Saved {{ formatDate(doc.saved_at) }}</span>
        </div>
        <div class="doc-actions">
          <button class="action-btn unsave-btn" @click.stop="unsaveDocument(doc)" title="Remove from saved">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'SavedScreen',
  setup() {
    const router = useRouter()
    const db = useDatabase()
    
    const savedDocs = ref([])
    const loading = ref(false)
    const currentUser = ref(null)
    const toast = ref('')
    const toastType = ref('success')

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => toast.value = '', 3000)
    }

    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      const now = new Date()
      const diff = now - d
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) return 'today'
      if (days === 1) return 'yesterday'
      if (days < 7) return `${days} days ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const loadSavedDocuments = async () => {
      loading.value = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        currentUser.value = user
        
        if (user) {
          const docs = await db.getSavedDocuments(user.id)
          
          // Fetch folder tag info for each document
          const docsWithTags = await Promise.all(
            docs.map(async (doc) => {
              if (doc.folder) {
                try {
                  // Check if it's a public or private folder
                  const folderTable = doc.is_public ? 'public_folders' : 'folders'
                  const { data: folder } = await supabase
                    .from(folderTable)
                    .select('tag_name, tag_color')
                    .eq('name', doc.folder)
                    .maybeSingle()
                  
                  if (folder && folder.tag_name) {
                    return {
                      ...doc,
                      folder_tag: {
                        name: folder.tag_name,
                        color: folder.tag_color || '#6c757d'
                      }
                    }
                  }
                } catch (err) {
                  console.error('Error fetching folder tag for saved document:', doc.id, err)
                }
              }
              return doc
            })
          )
          
          savedDocs.value = docsWithTags
        }
      } catch (err) {
        console.error('Error loading saved documents:', err)
        showToast('Failed to load saved documents', 'error')
      } finally {
        loading.value = false
      }
    }

    const openDocument = (doc) => {
      router.push({ path: '/read', query: { doc: doc.id } })
    }

    const unsaveDocument = async (doc) => {
      if (!currentUser.value) return
      
      try {
        await db.unsaveDocument(currentUser.value.id, doc.id)
        savedDocs.value = savedDocs.value.filter(d => d.id !== doc.id)
        showToast('Removed from saved')
      } catch (err) {
        console.error('Error unsaving document:', err)
        showToast('Failed to remove from saved', 'error')
      }
    }

    onMounted(() => {
      loadSavedDocuments()
    })

    return {
      savedDocs,
      loading,
      toast,
      toastType,
      formatDate,
      openDocument,
      unsaveDocument
    }
  }
}
</script>

<style scoped>
.saved-page {
  padding: 32px 48px;
  min-height: 100vh;
  width: 100%;
}

/* Header */
.page-header {
  margin-bottom: 32px;
}

.header-left h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #6c757d;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 48px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 24px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #333;
}

/* Saved List */
.saved-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.saved-doc-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid #f0f0f0;
}

.saved-doc-item:hover {
  background: #f8f9fa;
}

.saved-doc-item:last-child {
  border-bottom: none;
}

.doc-icon {
  color: #999;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.doc-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-title {
  font-size: 17px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 900;
  color: white;
  white-space: nowrap;
  background: white;
  border: 3.5px solid;
}

.doc-date {
  font-size: 14px;
  color: #999;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.unsave-btn {
  color: #f57c00;
}

.unsave-btn:hover {
  background: #fff3e0;
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
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .saved-page {
    padding: 20px;
  }
  
  .doc-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
