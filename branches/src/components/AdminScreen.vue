<template>
  <div class="editor-page">
    <!-- Document Header -->
    <div class="doc-header">
      <div class="header-left">
        <input 
          v-model="docTitle" 
          class="doc-title" 
          placeholder="Untitled"
        />
        <span class="word-count">{{ wordCount }} words</span>
      </div>
      <button class="publish-btn" @click="handlePublish">
        Publish
      </button>
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
    const currentUser = ref(null)
    const toast = ref('')
    const toastType = ref('success')
    const isSaving = ref(false)

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight,
      ],
      content: '<p>Start writing...</p>',
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
      const doc = await db.getDocument(docId)
      if (doc) {
        currentDocId.value = doc.id
        docTitle.value = doc.title
        editor.value?.commands.setContent(doc.content || '<p>Start writing...</p>')
      }
    }

    const handleSave = async () => {
      if (!currentUser.value) {
        showToast('Please sign in to save', 'error')
        return
      }

      isSaving.value = true
      try {
        const content = editor.value?.getHTML()
        const title = docTitle.value || 'Untitled'

        if (currentDocId.value) {
          // Update existing document
          await db.updateDocument(currentDocId.value, {
            title,
            content
          })
          showToast('Saved to library!')
        } else {
          // Create new document
          const doc = await db.createDocument(currentUser.value.id, {
            title,
            content,
            folder: null
          })
          currentDocId.value = doc.id
          // Update URL without reloading
          router.replace(`/admin?doc=${doc.id}`)
          showToast('Saved to library!')
        }
      } catch (err) {
        console.error('Error saving document:', err)
        showToast('Failed to save', 'error')
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
          await db.publishDocument(currentDocId.value)
        } else {
          // Create and publish
          const doc = await db.createDocument(currentUser.value.id, {
            title,
            content,
            folder: null
          })
          currentDocId.value = doc.id
          await db.publishDocument(doc.id)
          router.replace(`/admin?doc=${doc.id}`)
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
      }
    })

    onBeforeUnmount(() => {
      editor.value?.destroy()
    })

    return {
      docTitle,
      showToolbar,
      editor,
      wordCount,
      handleSave,
      handlePublish,
      toast,
      toastType
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
  align-items: baseline;
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

.publish-btn {
  padding: 10px 24px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.publish-btn:hover {
  background: #333;
  transform: translateY(-1px);
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
