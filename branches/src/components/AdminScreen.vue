<template>
  <div class="editor-page">
    <!-- Document Header -->
    <div class="doc-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          View
        </button>
        <input 
          v-model="docTitle" 
          class="doc-title" 
          placeholder="Untitled"
        />
        <span class="word-count">{{ wordCount }} words</span>
      </div>
      <div class="header-actions">
        <button class="save-exit-btn" @click="handleSaveAndExit" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
        <button class="save-btn" @click="handleSave" :disabled="isSaving">
          Save
        </button>
      </div>
    </div>

    <!-- Editor Container -->
    <div class="editor-wrapper">
      <!-- Floating Toolbar -->
      <div class="toolbar" v-if="showToolbar">
        <div class="toolbar-group">
          <button 
            :class="{ active: editor?.isActive('heading', { level: 1 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            title="Heading 1"
          >H1</button>
          <button 
            :class="{ active: editor?.isActive('heading', { level: 2 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            title="Heading 2"
          >H2</button>
          <button 
            :class="{ active: editor?.isActive('heading', { level: 3 }) }"
            @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            title="Heading 3"
          >H3</button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button 
            :class="{ active: editor?.isActive('bold') }"
            @click="editor?.chain().focus().toggleBold().run()"
            title="Bold"
          ><strong>B</strong></button>
          <button 
            :class="{ active: editor?.isActive('italic') }"
            @click="editor?.chain().focus().toggleItalic().run()"
            title="Italic"
          ><em>I</em></button>
          <button 
            :class="{ active: editor?.isActive('underline') }"
            @click="editor?.chain().focus().toggleUnderline().run()"
            title="Underline"
          ><u>U</u></button>
          <button 
            :class="{ active: editor?.isActive('strike') }"
            @click="editor?.chain().focus().toggleStrike().run()"
            title="Strikethrough"
          ><s>S</s></button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button 
            :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
            @click="editor?.chain().focus().setTextAlign('left').run()"
            title="Align Left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </button>
          <button 
            :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
            @click="editor?.chain().focus().setTextAlign('center').run()"
            title="Align Center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button
            :class="{ active: editor?.isActive('paragraph', { paragraphSpacing: 'relaxed' }) }"
            @click="toggleEnlargedParagraphSpacing"
            title="Enlarge line spacing"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="7" x2="13" y2="7"/>
              <line x1="4" y1="12" x2="13" y2="12"/>
              <line x1="4" y1="17" x2="13" y2="17"/>
              <line x1="19" y1="9" x2="19" y2="15"/>
              <polyline points="16,9 19,6 22,9"/>
              <polyline points="16,15 19,18 22,15"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button 
            :class="{ active: editor?.isActive('bulletList') }"
            @click="editor?.chain().focus().toggleBulletList().run()"
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>
            </svg>
          </button>
          <button 
            :class="{ active: editor?.isActive('orderedList') }"
            @click="editor?.chain().focus().toggleOrderedList().run()"
            title="Numbered List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
            </svg>
            <span class="list-numbers">123</span>
          </button>
          <button 
            :class="{ active: editor?.isActive('blockquote') }"
            @click="editor?.chain().focus().toggleBlockquote().run()"
            title="Quote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4z"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-group">
          <button 
            :class="{ active: editor?.isActive('codeBlock') }"
            @click="editor?.chain().focus().toggleCodeBlock().run()"
            title="Code Block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>
          <button 
            @click="editor?.chain().focus().setHorizontalRule().run()"
            title="Divider"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Editor -->
      <div class="editor-container" @mouseenter="showToolbar = true">
        <editor-content :editor="editor" class="editor-content" />
      </div>
      
      <!-- Save Button (Bottom Right) -->
      <button class="save-btn" @click="handleSave" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <!-- Unsaved Changes Confirmation Modal -->
    <div v-if="showUnsavedModal" class="modal-overlay" @click.self="cancelNavigation">
      <div class="modal">
        <h3>Unsaved Changes</h3>
        <p class="modal-warning">
          You have unsaved changes. What would you like to do?
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelNavigation">Cancel</button>
          <button class="btn-danger" @click="discardChanges">Discard</button>
          <button class="btn-primary" @click="saveAndContinue" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save' }}
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { ParagraphSpacing } from '../extensions/paragraphSpacing'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'AdminScreen',
  components: {
    EditorContent
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const db = useDatabase()
    
    const docTitle = ref('Untitled')
    const showToolbar = ref(false)
    const currentDocId = ref(null)
    const currentPublicDocId = ref(null) // Track if this is a public document
    const currentUser = ref(null)
    const toast = ref('')
    const toastType = ref('success')
    const isSaving = ref(false)
    
    // Unsaved changes tracking
    const originalTitle = ref('')
    const originalContent = ref('')
    const showUnsavedModal = ref(false)
    const nextRoute = ref(null)
    const pendingAction = ref(null)
    const forceLeave = ref(false)

    const NEW_DOC_CONTENT = '<h1></h1>'

    const applyNewDocumentContent = (ed) => {
      if (!ed) return
      const html = ed.getHTML().trim()
      const isBlank =
        ed.isEmpty ||
        !html ||
        html === '<p></p>' ||
        html === '<p><br></p>'
      if (isBlank) {
        ed.commands.setContent(NEW_DOC_CONTENT, false)
      }
      ed.commands.focus('start')
    }

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading' && node.attrs.level === 1) {
              return 'Welcome to the Vine'
            }
            if (node.type.name === 'heading') {
              return 'Heading'
            }
            return 'start your note here'
          },
          showOnlyWhenEditable: true,
          showOnlyCurrent: false,
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight,
        ParagraphSpacing,
      ],
      content: NEW_DOC_CONTENT,
      onCreate: ({ editor: ed }) => {
        if (!route.query.doc) {
          applyNewDocumentContent(ed)
        }
      },
      editorProps: {
        attributes: {
          class: 'prose',
        },
      },
    })

    const initNewDocumentEditor = () => applyNewDocumentContent(editor.value)

    const wordCount = computed(() => {
      if (!editor.value) return 0
      const text = editor.value.getText()
      return text.split(/\s+/).filter(word => word.length > 0).length
    })

    const hasMeaningfulContent = () => {
      if (!editor.value) return false
      const text = editor.value.getText().trim()
      return text.length > 0
    }

    const syncSavedSnapshot = async () => {
      await nextTick()
      originalTitle.value = docTitle.value
      originalContent.value = editor.value?.getHTML() || ''
    }

    const hasUnsavedChanges = computed(() => {
      if (!editor.value) return false
      
      // Only warn if there's actual content
      if (!hasMeaningfulContent()) return false
      
      const currentContent = editor.value.getHTML()
      const titleChanged = docTitle.value !== originalTitle.value && docTitle.value.trim() !== '' && docTitle.value.trim() !== 'Untitled'
      const contentChanged = currentContent !== originalContent.value
      return titleChanged || contentChanged
    })

    const showToast = (message, type = 'success') => {
      toast.value = message
      toastType.value = type
      setTimeout(() => toast.value = '', 3000)
    }

    const toggleEnlargedParagraphSpacing = () => {
      if (!editor.value) return
      if (editor.value.isActive('paragraph', { paragraphSpacing: 'relaxed' })) {
        editor.value.chain().focus().setParagraphSpacing('normal').run()
      } else {
        editor.value.chain().focus().setParagraphSpacing('relaxed').run()
      }
    }

    const loadDocument = async (docId) => {
      // First try to fetch from public_documents table
      let doc = await db.getPublicDocument(docId)
      
      // If not found, try documents table
      if (!doc) {
        doc = await db.getDocument(docId)
        currentPublicDocId.value = null
      } else {
        currentPublicDocId.value = docId
      }
      
      if (doc) {
        currentDocId.value = doc.id
        docTitle.value = doc.title
        originalTitle.value = doc.title
        const trimmed = (doc.content || '').trim()
        const isBlank =
          !trimmed ||
          trimmed === '<p></p>' ||
          trimmed === '<p><br></p>'
        const content = isBlank ? NEW_DOC_CONTENT : doc.content
        editor.value?.commands.setContent(content)
        await syncSavedSnapshot()
      } else {
        currentDocId.value = null
        currentPublicDocId.value = null
      }
    }

    const handleSave = async () => {
      if (!currentUser.value) {
        showToast('Please sign in to save', 'error')
        return false
      }

      isSaving.value = true
      try {
        const content = editor.value?.getHTML()
        const title = docTitle.value || 'Untitled'

        if (currentPublicDocId.value) {
          // Update public document
          await db.updatePublicDocument(currentPublicDocId.value, {
            title,
            content
          })
          showToast('Saved to public library!')
        } else if (currentDocId.value) {
          // Update personal document
          await db.updateDocument(currentDocId.value, {
            title,
            content
          })
          showToast('Saved to library!')
        } else {
          // Create new personal document
          const doc = await db.createDocument(currentUser.value.id, currentUser.value.email, {
            title,
            content,
            folder: null
          })
          currentDocId.value = doc.id
          // Update URL without reloading
          router.replace(`/admin?doc=${doc.id}`)
          showToast('Saved to library!')
        }

        await syncSavedSnapshot()
        return true
      } catch (err) {
        console.error('Error saving document:', err)
        showToast('Failed to save', 'error')
        return false
      } finally {
        isSaving.value = false
      }
    }

    const handlePublish = async () => {
      if (!currentUser.value) {
        showToast('Please sign in to publish', 'error')
        return
      }

      isSaving.value = true
      try {
        const content = editor.value?.getHTML()
        const title = docTitle.value || 'Untitled'

        if (currentDocId.value) {
          // Update and publish
          await db.updateDocument(currentDocId.value, {
            title,
            content
          })
          const publishedDoc = await db.publishDocument(currentDocId.value)
          // Document was moved to public library, clear current doc reference
          currentDocId.value = null
          router.replace(`/admin?doc=${publishedDoc.id}`)
        } else {
          // Create and publish
          const doc = await db.createDocument(currentUser.value.id, currentUser.value.email, {
            title,
            content,
            folder: null
          })
          const publishedDoc = await db.publishDocument(doc.id)
          // Document was moved to public library
          currentDocId.value = null
          router.replace(`/admin?doc=${publishedDoc.id}`)
        }
        showToast('Published to public library!')
      } catch (err) {
        console.error('Error publishing document:', err)
        showToast('Failed to publish', 'error')
      } finally {
        isSaving.value = false
      }
    }

    onMounted(async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      currentUser.value = user

      // Check for doc parameter in URL
      const docId = route.query.doc
      if (docId) {
        await loadDocument(docId)
      } else {
        await nextTick()
        initNewDocumentEditor()
      }
    })

    watch(
      () => route.query.doc,
      async (docId) => {
        if (docId) {
          await loadDocument(docId)
        } else {
          await nextTick()
          initNewDocumentEditor()
        }
      }
    )

    onBeforeUnmount(() => {
      editor.value?.destroy()
    })

    // Route guard to check for unsaved changes
    onBeforeRouteLeave((to) => {
      if (forceLeave.value) {
        forceLeave.value = false
        return true
      }
      if (hasUnsavedChanges.value && !isSaving.value) {
        nextRoute.value = to
        pendingAction.value = null
        showUnsavedModal.value = true
        return false
      }
      return true
    })

    const goBack = () => {
      const docId = currentPublicDocId.value || currentDocId.value
      if (docId) {
        router.push(`/read?doc=${docId}`)
      } else {
        router.push('/')
      }
    }

    const navigateToDocumentView = () => {
      const docId = currentPublicDocId.value || currentDocId.value
      if (docId) {
        forceLeave.value = true
        router.push(`/read?doc=${docId}`)
      }
    }

    const handleSaveAndExit = async () => {
      const saved = await handleSave()
      if (!saved) return
      navigateToDocumentView()
    }

    // Unsaved changes handlers
    const handleGoBack = () => {
      if (hasUnsavedChanges.value && !isSaving.value) {
        nextRoute.value = 'back'
        pendingAction.value = null
        showUnsavedModal.value = true
      } else {
        goBack()
      }
    }

    const cancelNavigation = () => {
      showUnsavedModal.value = false
      nextRoute.value = null
      pendingAction.value = null
    }

    const discardChanges = () => {
      showUnsavedModal.value = false
      forceLeave.value = true
      const destination = nextRoute.value
      const action = pendingAction.value
      nextRoute.value = null
      pendingAction.value = null

      if (destination === 'back') {
        goBack()
      } else if (destination) {
        router.push(destination)
      } else if (action) {
        action()
      }
    }

    const saveAndContinue = async () => {
      const saved = await handleSave()
      if (!saved) return

      showUnsavedModal.value = false
      nextRoute.value = null
      pendingAction.value = null
      navigateToDocumentView()
    }

    // Note: beforeunload warning removed to prevent browser's native leave warning

    return {
      docTitle,
      showToolbar,
      editor,
      wordCount,
      handleSave,
      handleSaveAndExit,
      handlePublish,
      goBack: handleGoBack,
      toast,
      toastType,
      // Unsaved changes modal
      showUnsavedModal,
      cancelNavigation,
      discardChanges,
      saveAndContinue,
      toggleEnlargedParagraphSpacing,
      isSaving,
    }
  }
}
</script>

<style scoped>
.editor-page {
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
}

.doc-title::placeholder {
  color: #ccc;
}

.word-count {
  font-size: 13px;
  color: #999;
  font-weight: 500;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-exit-btn {
  padding: 10px 20px;
  background: white;
  color: #1a1a1a;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.save-exit-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.save-exit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn {
  padding: 10px 20px;
  background: white;
  color: #666;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.save-btn:hover {
  background: #f5f5f5;
  color: #1a1a1a;
  border-color: #ccc;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Editor Wrapper */
.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Floating Toolbar */
.toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  z-index: 100;
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 8px;
}

.toolbar button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.15s;
}

.toolbar button:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.toolbar button.active {
  background: #1a1a1a;
  color: white;
}

.toolbar button .list-numbers {
  font-size: 10px;
  font-weight: 700;
  margin-left: -2px;
}

/* Editor Container */
.editor-container {
  height: 100%;
  overflow-y: auto;
  padding: 80px 48px 80px;
}

/* Save Button (Bottom Right) */
.save-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 10px 20px;
  background: white;
  color: #666;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
}

.save-btn:hover {
  background: #f8f8f8;
  border-color: #ccc;
  color: #333;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.editor-content {
  max-width: 720px;
  margin: 0 auto;
}

/* Prose Styles */
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.editor-content :deep(.ProseMirror p.is-empty:first-child::before),
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #ccc;
  opacity: 1;
  pointer-events: none;
  height: 0;
  font-size: 18px;
}

.editor-content :deep(.ProseMirror h1.is-empty:first-child::before),
.editor-content :deep(.ProseMirror h1.is-editor-empty:first-child::before),
.editor-content :deep(.ProseMirror h2.is-empty::before),
.editor-content :deep(.ProseMirror h2.is-editor-empty::before),
.editor-content :deep(.ProseMirror h3.is-empty::before),
.editor-content :deep(.ProseMirror h3.is-editor-empty::before) {
  content: attr(data-placeholder);
  float: left;
  color: #ccc;
  opacity: 1;
  pointer-events: none;
  height: 0;
}

.editor-content :deep(.ProseMirror h1.is-empty:first-child::before),
.editor-content :deep(.ProseMirror h1.is-editor-empty:first-child::before) {
  font-size: 36px;
  font-weight: 700;
  color: #ccc;
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
  margin: 0 0 16px;
  line-height: 1.4;
}

.editor-content :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
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

/* Modal Styles */
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
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.modal-warning {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.btn-primary, .btn-secondary, .btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  flex: 1;
  height: 40px;
}

.btn-primary {
  background: #1a1a1a;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #333;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #1a1a1a;
  border: 1px solid #e9ecef;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #c82333;
}
</style>
