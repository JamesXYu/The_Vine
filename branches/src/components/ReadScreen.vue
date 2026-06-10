<template>
  <div v-if="splitNotesOpen && !embedded" class="public-split-view">
    <div class="split-pane split-pane--read">
      <ReadScreen embedded :document-id="currentDocId" />
    </div>
    <div class="split-pane split-pane--notes">
      <AdminScreen
        :key="splitNotesKey"
        embedded
        split-mode
        @close-split="closeSplitNotes"
      />
    </div>
  </div>

  <div v-else class="read-page" :class="{ embedded }">
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
        <div class="title-row">
          <input 
            v-model="docTitle" 
            class="doc-title" 
            placeholder="Untitled"
            readonly
          />
          <span v-if="currentFolderTag" class="folder-tag" :style="{ color: currentFolderTag.color, borderColor: currentFolderTag.color }">
            {{ currentFolderTag.name }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <span class="word-count">{{ wordCount }} words</span>
        <button 
          class="save-btn" 
          :class="{ saved: isSaved }"
          @click="toggleSave"
        >
          <svg v-if="!isSaved" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {{ isSaved ? 'Saved' : 'Save' }}
        </button>
        <button v-if="isAdmin || isOwner" class="edit-btn" @click="editDocument">
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

    <button
      v-if="showNotesFab"
      type="button"
      class="notes-split-fab"
      aria-label="Take notes while reading"
      @click="openSplitNotes"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { ParagraphSpacing } from '../extensions/paragraphSpacing'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'
import AdminScreen from './AdminScreen.vue'
import ReadScreen from './ReadScreen.vue'

export default {
  name: 'ReadScreen',
  components: {
    EditorContent,
    AdminScreen,
    ReadScreen
  },
  props: {
    embedded: {
      type: Boolean,
      default: false
    },
    documentId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const db = useDatabase()
    
    const docTitle = ref('Untitled')
    const currentDocId = ref(null)
    const currentUser = ref(null)
    const isAdmin = ref(false)
    const isOwner = ref(false)  // Track if current user owns the document
    const isSaved = ref(false)
    const isPublicDoc = ref(false)  // Track if document is from public library
    const currentFolderTag = ref(null)  // Track folder tag for display
    const loading = ref(false)
    const toast = ref('')
    const toastType = ref('success')
    const splitNotesOpen = ref(false)
    const splitNotesKey = ref(0)

    const resolveDocId = () => props.documentId || route.query.doc || route.params.id || null

    const showNotesFab = computed(() =>
      !props.embedded && currentDocId.value && !splitNotesOpen.value
    )

    const openSplitNotes = () => {
      splitNotesKey.value += 1
      splitNotesOpen.value = true
    }

    const closeSplitNotes = () => {
      splitNotesOpen.value = false
    }

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
        ParagraphSpacing,
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
        let folderTag = null
        
        if (doc) {
          isPublicDoc.value = true  // Mark as public document
          // Fetch folder tag for public folders
          if (doc.folder) {
            try {
              console.log('Fetching public folder tag for folder:', doc.folder, 'docId:', docId)
              const { data: folder } = await supabase
                .from('public_folders')
                .select('tag_name, tag_color')
                .eq('name', doc.folder)
                .maybeSingle()
              console.log('Public folder query result:', folder)
              if (folder && folder.tag_name && folder.tag_name.trim() !== '') {
                folderTag = { name: folder.tag_name.trim(), color: folder.tag_color || '#6c757d' }
                console.log('Folder tag set:', folderTag)
              } else {
                console.log('No folder tag found (folder missing, tag_name null, or empty):', folder)
              }
            } catch (err) {
              console.error('Error fetching public folder tag for document:', docId, err)
            }
          }
        } else {
          // If not found, try documents table (for personal library docs)
          doc = await db.getDocument(docId)
          isPublicDoc.value = false  // Mark as personal document
          // Fetch folder tag for personal folders
          if (doc && doc.folder) {
            try {
              console.log('Fetching personal folder tag for folder:', doc.folder, 'docId:', docId)
              const { data: folder } = await supabase
                .from('folders')
                .select('tag_name, tag_color')
                .eq('name', doc.folder)
                .maybeSingle()
              console.log('Personal folder query result:', folder)
              if (folder && folder.tag_name && folder.tag_name.trim() !== '') {
                folderTag = { name: folder.tag_name.trim(), color: folder.tag_color || '#6c757d' }
                console.log('Folder tag set:', folderTag)
              } else {
                console.log('No folder tag found (folder missing, tag_name null, or empty):', folder)
              }
            } catch (err) {
              console.error('Error fetching personal folder tag for document:', docId, err)
            }
          }
        }
        
        if (doc) {
          currentDocId.value = doc.id
          docTitle.value = doc.title
          // Store folder tag for display
          currentFolderTag.value = folderTag
          // Check if current user is the owner
          if (currentUser.value) {
            isOwner.value = doc.user_id === currentUser.value.id
          }
          // Set content in Tiptap editor
          editor.value?.commands.setContent(doc.content || '<p>No content</p>')
          // Check if document is saved
          if (currentUser.value) {
            isSaved.value = await db.isDocumentSaved(currentUser.value.id, doc.id)
          }
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

    const toggleSave = async () => {
      if (!currentUser.value || !currentDocId.value) return
      
      try {
        if (isSaved.value) {
          await db.unsaveDocument(currentUser.value.id, currentDocId.value)
          isSaved.value = false
          showToast('Removed from saved')
        } else {
          // Pass isPublic flag based on document type
          await db.saveDocument(currentUser.value.id, currentDocId.value, isPublicDoc.value)
          isSaved.value = true
          showToast('Document saved!')
        }
      } catch (err) {
        console.error('Error toggling save:', err)
        showToast('Failed to save document: ' + (err.message || 'Unknown error'), 'error')
      }
    }

    const initReadScreen = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      currentUser.value = user
      isAdmin.value = user?.user_metadata?.role === 'admin'

      const docId = resolveDocId()
      if (docId) {
        await loadDocument(docId)
      }
    }

    onMounted(() => {
      initReadScreen()
    })

    watch(
      () => props.documentId,
      async (docId) => {
        if (props.embedded && docId) {
          await loadDocument(docId)
        }
      }
    )

    watch(
      () => route.query.doc,
      async (docId) => {
        if (!props.embedded && docId) {
          await loadDocument(docId)
        }
      }
    )

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
      isOwner,
      isSaved,
      currentFolderTag,
      toast,
      toastType,
      editDocument,
      toggleSave,
      splitNotesOpen,
      splitNotesKey,
      showNotesFab,
      openSplitNotes,
      closeSplitNotes
    }
  }
}
</script>

<style scoped>
.public-split-view {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--neo-bg);
}

.split-pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.split-pane--read {
  border-right: 1px solid rgba(163, 177, 198, 0.35);
}

.split-pane--notes {
  background: var(--neo-bg);
}

.notes-split-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--neo-accent);
  color: #fff;
  box-shadow: 0 4px 16px rgba(232, 149, 111, 0.45);
  cursor: pointer;
}

.notes-split-fab:active {
  transform: scale(0.96);
}

.read-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  background-color: var(--neo-bg);
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.read-page.embedded {
  height: 100%;
  min-height: 0;
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
  color: var(--neo-text);
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
  background: var(--neo-accent);
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
  background: var(--neo-accent);
}

/* Document Header */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 48px;
  background: var(--neo-bg);
  border-bottom: 1px solid #eee;
  max-width: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.folder-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.doc-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--neo-text);
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
  background: var(--neo-bg);
  border-radius: 6px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--neo-bg);
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: var(--neo-bg);
  border-color: #ccc;
  color: var(--neo-text);
}

.save-btn.saved {
  background: #fff3e0;
  border-color: #ffb74d;
  color: #f57c00;
}

.save-btn.saved:hover {
  background: #ffe0b2;
  border-color: #ff9800;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--neo-accent);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: var(--neo-accent);
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
  background: var(--neo-bg);
  border-radius: 12px;
  box-shadow: var(--neo-raised);
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
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 80px 48px 48px;
  box-sizing: border-box;
}

/* Editor Content */
.editor-content {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Prose Styles */
.editor-content :deep(.ProseMirror) {
  outline: none;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
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
  color: var(--neo-text);
  margin: 0 0 24px;
  line-height: 1.3;
}

.editor-content :deep(h2) {
  font-size: 26px;
  font-weight: 600;
  color: var(--neo-text);
  margin: 0 0 16px;
  line-height: 1.4;
}

.editor-content :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  color: var(--neo-text);
  margin: 0 0 16px;
  line-height: 1.4;
}

.editor-content :deep(p) {
  margin: 0 0 6px;
}

.editor-content :deep(p[data-paragraph-spacing="relaxed"]) {
  margin-bottom: 16px;
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
  background: var(--neo-accent);
  color: #f8f8f2;
  padding: 20px 24px;
  border-radius: 12px;
  margin: 24px 0;
  max-width: 100%;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  box-sizing: border-box;
}

.editor-content :deep(img),
.editor-content :deep(video),
.editor-content :deep(iframe) {
  max-width: 100%;
  height: auto;
}

.editor-content :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.editor-content :deep(code) {
  background: var(--neo-bg);
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
  background: var(--neo-accent);
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--neo-raised);
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

@media (max-width: 768px) {
  .public-split-view {
    flex-direction: column;
    height: 100%;
    margin-bottom: calc(-1 * (var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px)));
    padding-bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px));
  }

  .split-pane--read {
    border-right: none;
    border-bottom: 1px solid rgba(163, 177, 198, 0.35);
  }

  .notes-split-fab {
    right: 16px;
    bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);
    width: 52px;
    height: 52px;
  }

  .read-page {
    height: 100%;
    min-height: 0;
  }

  .doc-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left,
  .header-right {
    width: 100%;
    min-width: 0;
  }

  .title-row {
    flex-wrap: wrap;
    width: 100%;
    min-width: 0;
  }

  .doc-title {
    font-size: 18px;
    width: 100%;
    min-width: 0;
  }

  .header-right {
    flex-wrap: wrap;
    gap: 10px;
  }

  .editor-container {
    padding: 64px 16px 32px;
  }

  .toolbar-placeholder {
    left: 16px;
    right: 16px;
    transform: none;
    max-width: calc(100% - 32px);
    justify-content: center;
  }

  .toast {
    left: 16px;
    right: 16px;
    bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);
  }
}
</style>
