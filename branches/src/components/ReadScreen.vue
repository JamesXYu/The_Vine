<template>
  <div class="read-page">
    <!-- No Document Selected State -->
    <div v-if="!currentDocId && !loading" class="no-document">
      <div class="no-doc-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <h2>No Document Selected</h2>
      <p>Select a document from the Library to view it here</p>
      <router-link to="/" class="go-to-library-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Go to Library
      </router-link>
    </div>

    <!-- Document Header -->
    <div v-else class="doc-header">
      <div class="header-left">
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

    <!-- Editor Container with Tiptap (Read-only) -->
    <div v-if="currentDocId" class="editor-wrapper">
      <!-- Floating Toolbar (Visual only) -->
      <div class="toolbar-placeholder">
        <div class="toolbar-group">
          <span class="toolbar-label">Reading Mode</span>
        </div>
      </div>

      <!-- Tiptap Editor (Read-only) -->
      <div class="editor-container">
        <editor-content :editor="editor" class="editor-content" />
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast" :class="toastType">
      {{ toast }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'ReadScreen',
  components: {
    EditorContent
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const db = useDatabase()
    
    const docTitle = ref('Untitled')
    const currentDocId = ref(null)
    const currentUser = ref(null)
    const isAdmin = ref(false)
    const loading = ref(false)
    const toast = ref('')
    const toastType = ref('success')

    // Create read-only Tiptap editor
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Placeholder.configure({
          placeholder: 'No content',
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight,
      ],
      content: '',
      editable: false, // Read-only mode
      editorProps: {
        attributes: {
          class: 'prose',
        },
      },
    })

    const wordCount = computed(() => {
      if (!editor.value) return 0
      const text = editor.value.getText()
      return text.split(/\s+/).filter(word => word.length > 0).length
    })

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => toast.value = '', 3000)
    }

    const loadDocument = async (docId) => {
      loading.value = true
      try {
        // First try to fetch from public_documents table (for public library docs)
        let doc = await db.getPublicDocument(docId)
        
        // If not found, try documents table (for personal library docs)
        if (!doc) {
          doc = await db.getDocument(docId)
        }
        
        if (doc) {
          currentDocId.value = doc.id
          docTitle.value = doc.title
          // Set content in Tiptap editor
          editor.value?.commands.setContent(doc.content || '<p>No content</p>')
        } else {
          showToast('Document not found', 'error')
        }
      } catch (err) {
        console.error('Error loading document:', err)
        showToast('Failed to load document', 'error')
      } finally {
        loading.value = false
      }
    }

    const editDocument = () => {
      if (currentDocId.value) {
        router.push(`/admin?doc=${currentDocId.value}`)
      }
    }

    onMounted(async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      currentUser.value = user
      isAdmin.value = user?.user_metadata?.role === 'admin'

      // Check for doc parameter in URL
      const docId = route.query.doc || route.params.id
      if (docId) {
        await loadDocument(docId)
      }
    })

    onBeforeUnmount(() => {
      editor.value?.destroy()
    })

    return {
      docTitle,
      editor,
      wordCount,
      loading,
      currentDocId,
      isAdmin,
      toast,
      toastType,
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

/* No Document Selected State */
.no-document {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
}

.no-doc-icon {
  color: #ccc;
  margin-bottom: 24px;
}

.no-document h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.no-document p {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.go-to-library-btn {
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

.go-to-library-btn:hover {
  background: #333;
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
  position: relative;
  overflow: hidden;
}

/* Toolbar Placeholder (Visual indicator) */
.toolbar-placeholder {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.toolbar-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

/* Editor Container */
.editor-container {
  height: 100%;
  overflow-y: auto;
  padding: 80px 48px 48px;
}

/* Editor Content */
.editor-content {
  max-width: 720px;
  margin: 0 auto;
}

/* Prose Styles */
.editor-content :deep(.ProseMirror) {
  outline: none;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
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

.editor-content :deep(text-align-center) {
  text-align: center;
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
