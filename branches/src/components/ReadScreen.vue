<template>
  <div class="read-page">
    <!-- Document Header -->
    <div class="doc-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <input 
          v-model="docTitle" 
          class="doc-title" 
          placeholder="Untitled"
          readonly
        />
      </div>
      <div class="header-right">
        <span class="word-count">{{ wordCount }} words</span>
        <button v-if="isAdmin" class="edit-btn" @click="editDocument">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
      </div>
    </div>

    <!-- Editor Container -->
    <div class="editor-wrapper">
      <div class="editor-container">
        <div class="editor-content prose" v-html="content"></div>
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
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'ReadScreen',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const db = useDatabase()
    
    const docTitle = ref('Untitled')
    const content = ref('')
    const currentDocId = ref(null)
    const isAdmin = ref(false)
    const toast = ref('')
    const toastType = ref('success')

    const wordCount = computed(() => {
      const text = content.value.replace(/<[^>]*>/g, ' ')
      return text.split(/\s+/).filter(word => word.length > 0).length
    })

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => toast.value = '', 3000)
    }

    const loadDocument = async (docId) => {
      const doc = await db.getDocument(docId)
      if (doc) {
        currentDocId.value = doc.id
        docTitle.value = doc.title
        content.value = doc.content || '<p>No content</p>'
      } else {
        showToast('Document not found', 'error')
        router.push('/')
      }
    }

    const goBack = () => {
      router.push('/')
    }

    const editDocument = () => {
      if (currentDocId.value) {
        router.push(`/admin?doc=${currentDocId.value}`)
      }
    }

    onMounted(async () => {
      // Check if admin
      const { data: { user } } = await supabase.auth.getUser()
      isAdmin.value = user?.email === 'admin@thevine.com' || 
                      user?.user_metadata?.role === 'admin'

      // Load document
      const docId = route.query.doc
      if (docId) {
        await loadDocument(docId)
      } else {
        router.push('/')
      }
    })

    return {
      docTitle,
      content,
      wordCount,
      isAdmin,
      toast,
      toastType,
      goBack,
      editDocument
    }
  }
}
</script>

<style scoped>
.read-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  background-color: #fafafa;
}

/* Document Header */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 48px;
  background: white;
  border-bottom: 1px solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.doc-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  cursor: default;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.word-count {
  font-size: 13px;
  color: #999;
  font-weight: 500;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #333;
}

/* Editor Wrapper */
.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

/* Editor Container */
.editor-container {
  height: 100%;
  overflow-y: auto;
  padding: 48px;
}

/* Prose Styles */
.editor-content {
  max-width: 720px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.editor-content :deep(h1) {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 24px;
  line-height: 1.3;
}

.editor-content :deep(h2) {
  font-size: 26px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 40px 0 16px;
  line-height: 1.4;
}

.editor-content :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 32px 0 12px;
  line-height: 1.4;
}

.editor-content :deep(p) {
  margin: 0 0 16px;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  padding-left: 24px;
  margin: 0 0 16px;
}

.editor-content :deep(li) {
  margin: 8px 0;
}

.editor-content :deep(blockquote) {
  border-left: 3px solid #1a1a1a;
  padding-left: 20px;
  margin: 24px 0;
  color: #666;
  font-style: italic;
}

.editor-content :deep(pre) {
  background: #1a1a1a;
  color: #f8f8f2;
  padding: 20px 24px;
  border-radius: 12px;
  margin: 24px 0;
  overflow-x: auto;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.editor-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 14px;
  color: #e83e8c;
}

.editor-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.editor-content :deep(hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 40px 0;
}

.editor-content :deep(mark) {
  background: #fff3bf;
  padding: 2px 4px;
  border-radius: 4px;
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
</style>
