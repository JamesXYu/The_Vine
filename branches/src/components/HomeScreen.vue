<template>
  <div class="library-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Library</h1>
        <p class="subtitle">Organize and manage your documents</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search documents..." 
          />
        </div>
        <button v-if="isAdmin || activeTab !== 'public'" class="btn-primary" @click="createNewDocument">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Document
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'personal' }" 
        @click="activeTab = 'personal'"
        class="tab"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Personal Library
        <span class="tab-count">{{ personalDocuments.length }}</span>
      </button>
      <button 
        :class="{ active: activeTab === 'public' }" 
        @click="activeTab = 'public'"
        class="tab"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        Public Library
        <span class="tab-count public">{{ publicDocuments.length }}</span>
      </button>
    </div>

    <!-- Personal Library -->
    <div v-if="activeTab === 'personal'" class="tab-content">
      <!-- Breadcrumb Navigation -->
      <div class="breadcrumb">
        <button @click="navigateToFolder(null)" class="breadcrumb-item" :class="{ active: !currentFolder }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Home
        </button>
        <template v-for="(crumb, index) in breadcrumbPath" :key="index">
          <svg class="breadcrumb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button @click="navigateToFolder(crumb)" class="breadcrumb-item" :class="{ active: index === breadcrumbPath.length - 1 }">
            {{ crumb }}
          </button>
        </template>
      </div>

      <!-- Actions Bar -->
      <div class="actions-bar">
        <div class="sort-options">
          <button 
            v-for="option in sortOptions" 
            :key="option.value"
            :class="{ active: sortBy === option.value }"
            @click="sortBy = option.value"
            class="sort-btn"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="btn-secondary" @click="showNewFolderModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          New Folder
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="currentFoldersInView.length === 0 && currentDocsInView.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 v-if="currentFolder">{{ currentFolder }} is empty</h3>
        <h3 v-else>Your personal library is empty</h3>
        <p v-if="currentFolder">This folder has no files or subfolders</p>
        <p v-else>Create your first document to get started</p>
        <button v-if="currentFolder" class="btn-primary" @click="createNewDocumentInFolder">
          Create Document Here
        </button>
        <button v-else class="btn-primary" @click="createNewDocument">
          Create Document
        </button>
      </div>

      <!-- Folder Grid -->
      <div v-if="currentFoldersInView.length > 0" class="items-section">
        <h3 class="section-title">Folders</h3>
        <div class="items-grid">
          <div 
            v-for="folder in currentFoldersInView" 
            :key="folder.id" 
            class="item-card folder"
            :class="{ 'drag-over': dragOverFolderId === folder.id }"
            @click="navigateToFolder(folder.name)"
            @dragover.prevent="handleDragOver($event, folder)"
            @dragleave="handleDragLeave"
            @drop="handleDropOnFolder($event, folder)"
          >
            <div class="item-icon-large folder-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="item-name">{{ folder.displayName }}</div>
            <div class="item-count">{{ folder.count }} items</div>
            <button class="item-menu" @click.stop="toggleFolderMenu(folder.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            <div v-if="folderMenuId === folder.id" class="item-dropdown">
              <button @click="renameFolder(folder)">Rename</button>
              <button @click="confirmDeleteFolder(folder)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Grid -->
      <div v-if="currentDocsInView.length > 0" class="items-section">
        <h3 class="section-title">Documents</h3>
        <div class="items-grid">
          <div 
            v-for="doc in currentDocsInView" 
            :key="doc.id" 
            class="item-card document"
            :class="{ dragging: draggedItem?.id === doc.id }"
            @click="openDocument(doc)"
            draggable="true"
            @dragstart="handleDragStart($event, doc, 'personal')"
            @dragend="handleDragEnd"
          >
            <div class="item-icon-large doc-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="item-name">{{ doc.title }}</div>
            <div class="item-date">{{ formatDate(doc.updated_at) }}</div>
            <div class="item-actions">
              <button class="action-btn" @click.stop="editDocument(doc)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn" @click.stop="duplicateDocument(doc)" title="Duplicate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button v-if="isAdmin" class="action-btn publish-btn" @click.stop="publishDocument(doc)" title="Publish">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </button>
              <button class="action-btn danger" @click.stop="confirmDeleteDocument(doc)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Public Library -->
    <div v-if="activeTab === 'public'" class="tab-content">
      <!-- Breadcrumb Navigation for Public -->
      <div class="breadcrumb">
        <button @click="navigateToPublicFolder(null)" class="breadcrumb-item" :class="{ active: !currentPublicFolder }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Public Library
        </button>
        <template v-for="(crumb, index) in publicBreadcrumbPath" :key="index">
          <svg class="breadcrumb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button @click="navigateToPublicFolder(crumb)" class="breadcrumb-item" :class="{ active: index === publicBreadcrumbPath.length - 1 }">
            {{ crumb }}
          </button>
        </template>
      </div>

      <!-- Actions Bar for Public Library -->
      <div v-if="isAdmin" class="actions-bar">
        <div class="sort-options">
          <button 
            v-for="option in sortOptions" 
            :key="option.value"
            :class="{ active: sortBy === option.value }"
            @click="sortBy = option.value"
            class="sort-btn"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="btn-secondary" @click="showNewPublicFolderModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          New Folder
        </button>
      </div>

      <div v-if="currentPublicFoldersInView.length === 0 && currentPublicDocsInView.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <h3>Public library is empty</h3>
        <p>Documents published by admins will appear here</p>
      </div>

      <!-- Public Folders Grid -->
      <div v-if="currentPublicFoldersInView.length > 0" class="items-section">
        <h3 class="section-title">Folders</h3>
        <div class="items-grid">
          <div 
            v-for="folder in currentPublicFoldersInView" 
            :key="folder.id" 
            class="item-card folder"
            :class="{ 'drag-over': dragOverFolderId === folder.id }"
            @click="navigateToPublicFolder(folder.name)"
            @dragover.prevent="handleDragOver($event, folder)"
            @dragleave="handleDragLeave"
            @drop="handleDropOnFolder($event, folder)"
          >
            <div class="item-icon-large folder-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="item-name">{{ folder.displayName }}</div>
            <div class="item-count">{{ folder.count }} items</div>
            <button v-if="isAdmin" class="item-menu" @click.stop="togglePublicFolderMenu(folder.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            <div v-if="publicFolderMenuId === folder.id" class="item-dropdown">
              <button @click="renamePublicFolder(folder)">Rename</button>
              <button @click="deletePublicFolder(folder)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Public Documents Grid -->
      <div v-if="currentPublicDocsInView.length > 0" class="items-section">
        <h3 class="section-title">Published Documents</h3>
        <div class="items-grid">
          <div 
            v-for="doc in currentPublicDocsInView" 
            :key="doc.id" 
            class="item-card document public-doc"
            :class="{ dragging: draggedItem?.id === doc.id }"
            @click="viewPublicDocument(doc)"
            draggable="true"
            @dragstart="handleDragStart($event, doc, 'public')"
            @dragend="handleDragEnd"
          >
            <div class="item-icon-large doc-icon public">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="item-name">{{ doc.title }}</div>
            <div class="item-author">{{ doc.user_email }}</div>
            <div class="item-date">{{ formatDate(doc.published_at) }}</div>
            <div class="item-actions">
              <button v-if="isAdmin" class="action-btn" @click.stop="editPublicDocument(doc)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button v-if="isAdmin" class="action-btn danger" @click.stop="confirmDeletePublicDocument(doc)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Public Folder Modal -->
    <div v-if="showNewPublicFolderModal" class="modal-overlay" @click.self="showNewPublicFolderModal = false">
      <div class="modal">
        <h3>Create New Folder in Public Library</h3>
        <div class="form-group">
          <label>Folder Name</label>
          <input 
            v-model="newPublicFolderName" 
            type="text" 
            class="input" 
            placeholder="Enter folder name"
            @keyup.enter="createPublicFolder"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showNewPublicFolderModal = false">Cancel</button>
          <button class="btn-primary" @click="createPublicFolder" :disabled="!newPublicFolderName.trim()">
            Create Folder
          </button>
        </div>
      </div>
    </div>

    <!-- New Folder Modal -->
    <div v-if="showNewFolderModal" class="modal-overlay" @click.self="showNewFolderModal = false">
      <div class="modal">
        <h3>Create New Folder</h3>
        <div class="form-group">
          <label>Folder Name</label>
          <input 
            v-model="newFolderName" 
            type="text" 
            class="input" 
            placeholder="Enter folder name"
            @keyup.enter="createFolder"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showNewFolderModal = false">Cancel</button>
          <button class="btn-primary" @click="createFolder" :disabled="!newFolderName.trim()">
            Create Folder
          </button>
        </div>
      </div>
    </div>

    <!-- Rename Folder Modal -->
    <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
      <div class="modal">
        <h3>Rename Folder</h3>
        <div class="form-group">
          <label>New Name</label>
          <input 
            v-model="renameFolderName" 
            type="text" 
            class="input" 
            placeholder="Enter new name"
            @keyup.enter="confirmRenameFolder"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showRenameModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmRenameFolder" :disabled="!renameFolderName.trim()">
            Rename
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p class="modal-warning">
          Are you sure you want to delete "{{ itemToDelete?.title || itemToDelete?.name }}"?
          {{ itemToDelete?.type === 'folder' ? 'All documents inside will be moved to root.' : '' }}
          This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
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
import { useRouter } from 'vue-router'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'HomeScreen',
  setup() {
    const router = useRouter()
    const db = useDatabase()
    
    // State
    const activeTab = ref('personal')
    const searchQuery = ref('')
    const sortBy = ref('recent')
    const sortOptions = [
      { value: 'recent', label: 'Recent' },
      { value: 'name', label: 'Name' },
      { value: 'created', label: 'Created' }
    ]
    const currentFolder = ref(null)
    const folderMenuId = ref(null)
    const currentUser = ref(null)
    
    // Documents & Folders
    const personalDocuments = ref([])
    const publicDocuments = ref([])
    const personalFolders = ref([])
    const publicFolders = ref([])
    
    // Public library state
    const currentPublicFolder = ref(null)
    const publicFolderMenuId = ref(null)
    
    // User
    const isAdmin = ref(false)
    
    // Modals
    const showNewFolderModal = ref(false)
    const showNewPublicFolderModal = ref(false)
    const showRenameModal = ref(false)
    const showDeleteModal = ref(false)
    const newFolderName = ref('')
    const newPublicFolderName = ref('')
    const renameFolderName = ref('')
    const itemToDelete = ref(null)
    const folderToRename = ref(null)
    
    // Drag and Drop
    const draggedItem = ref(null)
    const dragSource = ref(null) // 'personal' or 'public'
    const dragOverFolderId = ref(null)
    
    // Toast
    const toast = ref('')
    const toastType = ref('success')
    
    // Real-time unsubscribers (disabled for now - enable in Supabase dashboard)
    // let unsubDocuments = null
    // let unsubFolders = null

    // Breadcrumb path for nested folders
    const breadcrumbPath = computed(() => {
      if (!currentFolder.value) return []
      // currentFolder is the full path like "Folder1/Subfolder1"
      return currentFolder.value.split('/')
    })

    // Folders in current view (only direct children)
    const currentFoldersInView = computed(() => {
      const folders = personalFolders.value.filter(folder => {
        const folderPath = folder.name
        if (currentFolder.value) {
          // Only show folders that are directly inside currentFolder
          // A direct child folder path would be "currentFolder/child"
          return folderPath.startsWith(currentFolder.value + '/')
        }
        // At root, only show folders not in any subfolder
        return !folder.name.includes('/')
      })
      
      // Remove the prefix from nested folder names for display
      return folders.map(f => {
        if (currentFolder.value) {
          return {
            ...f,
            displayName: f.name.replace(currentFolder.value + '/', '')
          }
        }
        return { ...f, displayName: f.name }
      }).sort((a, b) => a.displayName.localeCompare(b.displayName))
    })

    // Documents in current view (only direct children)
    const currentDocsInView = computed(() => {
      let docs = personalDocuments.value.filter(doc => {
        if (currentFolder.value) {
          return doc.folder === currentFolder.value
        }
        return !doc.folder
      })
      
      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        docs = docs.filter(doc => doc.title.toLowerCase().includes(query))
      }
      
      // Sort
      if (sortBy.value === 'name') {
        docs.sort((a, b) => a.title.localeCompare(b.title))
      } else if (sortBy.value === 'created') {
        docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        docs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      }
      
      return docs
    })
    
    const filteredPublicDocuments = computed(() => {
      let docs = [...publicDocuments.value]
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        docs = docs.filter(doc => doc.title.toLowerCase().includes(query))
      }
      
      docs.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      
      return docs
    })

    // Public library computed
    const publicBreadcrumbPath = computed(() => {
      if (!currentPublicFolder.value) return []
      return currentPublicFolder.value.split('/')
    })

    // Public folders in current view
    const currentPublicFoldersInView = computed(() => {
      const folders = publicFolders.value.filter(folder => {
        const folderPath = folder.name
        if (currentPublicFolder.value) {
          return folderPath.startsWith(currentPublicFolder.value + '/')
        }
        return !folder.name.includes('/')
      })
      
      return folders.map(f => {
        if (currentPublicFolder.value) {
          return {
            ...f,
            displayName: f.name.replace(currentPublicFolder.value + '/', ''),
            count: publicDocuments.value.filter(d => d.folder === f.name).length
          }
        }
        return { 
          ...f, 
          displayName: f.name,
          count: publicDocuments.value.filter(d => d.folder === f.name).length
        }
      }).sort((a, b) => a.displayName.localeCompare(b.displayName))
    })

    // Public documents in current view
    const currentPublicDocsInView = computed(() => {
      let docs = publicDocuments.value.filter(doc => {
        if (currentPublicFolder.value) {
          return doc.folder === currentPublicFolder.value
        }
        return !doc.folder
      })
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        docs = docs.filter(doc => doc.title.toLowerCase().includes(query))
      }
      
      docs.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      
      return docs
    })

    // Methods
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

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        currentUser.value = user
        const userEmail = user.email
        const userName = user.user_metadata?.display_name || userEmail.split('@')[0]
        
        // Check if admin - based on role in metadata
        isAdmin.value = user.user_metadata?.role === 'admin'
        
        // Load personal documents using composable
        const docs = await db.getDocuments(user.id)
        personalDocuments.value = docs.map(d => ({
          ...d,
          user_email: userName
        }))
        
        // Load personal folders
        const folders = await db.getFolders(user.id, false)
        personalFolders.value = folders.map(f => ({
          ...f,
          user_email: userName,
          // Count documents directly in this folder
          count: personalDocuments.value.filter(d => d.folder === f.name).length
        }))
        
        // Load public documents (from new public_documents table)
        const pubDocs = await db.getPublicDocuments()
        publicDocuments.value = pubDocs.map(d => ({
          ...d,
          user_email: d.user_email || 'Admin'
        }))
        
        // Load public folders
        const pubFolders = await db.getPublicFolders()
        publicFolders.value = pubFolders.map(f => ({
          ...f,
          count: publicDocuments.value.filter(d => d.folder === f.name).length
        }))
      }
    }

    const navigateToFolder = (folderName) => {
      currentFolder.value = folderName
    }

    const createNewDocumentInFolder = async () => {
      await createNewDocument()
    }

    const createNewDocument = async () => {
      if (!currentUser.value) return
      
      try {
        const doc = await db.createDocument(currentUser.value.id, {
          title: 'Untitled Document',
          content: '<p>Start writing...</p>',
          folder: currentFolder.value
        })
        router.push(`/admin?doc=${doc.id}`)
      } catch (err) {
        showToast('Failed to create document', 'error')
        // Fallback: just go to editor
        router.push('/admin')
      }
    }

    const openDocument = (doc) => {
      // View document in read-only mode - navigate to Document Viewer
      router.push({ path: '/read', query: { doc: doc.id } })
    }

    const editDocument = (doc) => {
      // Edit document directly - navigate to Admin Console
      router.push({ path: '/admin', query: { doc: doc.id } })
    }

    const duplicateDocument = async (doc) => {
      if (!currentUser.value) return
      
      try {
        await db.duplicateDocument(doc, currentUser.value.id)
        showToast('Document duplicated!')
        await loadData()
      } catch (err) {
        showToast('Failed to duplicate document', 'error')
      }
    }

    const publishDocument = async (doc) => {
      try {
        await db.publishDocument(doc.id)
        showToast('Published to public library!')
        await loadData()
      } catch (err) {
        showToast('Failed to publish', 'error')
      }
    }

    const unpublishDocument = async (doc) => {
      try {
        await db.unpublishDocument(doc.id)
        showToast('Removed from public library')
        await loadData()
      } catch (err) {
        showToast('Failed to unpublish', 'error')
      }
    }

    const deletePublicDocument = (doc) => {
      itemToDelete.value = { ...doc, type: 'public_document' }
      showDeleteModal.value = true
    }

    const deleteDocument = (doc) => {
      itemToDelete.value = { ...doc, type: 'document' }
      showDeleteModal.value = true
    }

    const createFolder = async () => {
      if (!newFolderName.value.trim() || !currentUser.value) return
      
      try {
        console.log('Creating folder:', {
          userId: currentUser.value.id,
          name: newFolderName.value,
          folder: currentFolder.value ? currentFolder.value + '/' + newFolderName.value.trim() : newFolderName.value.trim()
        })
        const folderPath = currentFolder.value 
          ? currentFolder.value + '/' + newFolderName.value.trim()
          : newFolderName.value.trim()
        await db.createFolder(currentUser.value.id, folderPath)
        showToast('Folder created!')
        showNewFolderModal.value = false
        newFolderName.value = ''
        await loadData()
      } catch (err) {
        console.error('Create folder error:', err)
        showToast('Failed to create folder - check RLS policies', 'error')
      }
    }

    const renameFolder = (folder) => {
      folderToRename.value = folder
      renameFolderName.value = folder.name
      showRenameModal.value = true
      folderMenuId.value = null
    }

    const confirmRenameFolder = async () => {
      if (!renameFolderName.value.trim() || !folderToRename.value || !currentUser.value) return
      
      try {
        await db.renameFolderWithDocuments(
          folderToRename.value.id, 
          folderToRename.value.name, 
          renameFolderName.value
        )
        showToast('Folder renamed!')
        showRenameModal.value = false
        renameFolderName.value = ''
        folderToRename.value = null
        await loadData()
      } catch (err) {
        showToast('Failed to rename folder', 'error')
      }
    }

    const deleteFolder = (folder) => {
      itemToDelete.value = { ...folder, type: 'folder' }
      showDeleteModal.value = true
      folderMenuId.value = null
    }

    const confirmDelete = async () => {
      if (!itemToDelete.value) return
      
      try {
        if (itemToDelete.value.type === 'document') {
          await db.deleteDocument(itemToDelete.value.id)
          showToast('Document deleted')
        } else if (itemToDelete.value.type === 'public_document') {
          await db.deletePublicDocument(itemToDelete.value.id)
          showToast('Document deleted from public library')
        } else if (itemToDelete.value.type === 'folder') {
          await db.deleteFolder(
            itemToDelete.value.id, 
            itemToDelete.value.name, 
            currentUser.value.id
          )
          showToast('Folder deleted')
          currentFolder.value = null
        }
        
        showDeleteModal.value = false
        itemToDelete.value = null
        await loadData()
      } catch (err) {
        console.error('Delete error:', err)
        showToast('Failed to delete - check RLS policies', 'error')
      }
    }

    const toggleFolderMenu = (id) => {
      folderMenuId.value = folderMenuId.value === id ? null : id
    }

    const editPublicDocument = (doc) => {
      router.push(`/admin?doc=${doc.id}`)
    }

    const viewPublicDocument = (doc) => {
      router.push(`/read?doc=${doc.id}`)
    }

    // Public Library Methods
    const navigateToPublicFolder = (folderName) => {
      currentPublicFolder.value = folderName
    }

    const createPublicFolder = async () => {
      if (!newPublicFolderName.value.trim() || !currentUser.value) return
      
      try {
        const folderPath = currentPublicFolder.value 
          ? currentPublicFolder.value + '/' + newPublicFolderName.value.trim()
          : newPublicFolderName.value.trim()
        await db.createFolder(currentUser.value.id, folderPath, true)
        showToast('Folder created!')
        showNewPublicFolderModal.value = false
        newPublicFolderName.value = ''
        await loadData()
      } catch (err) {
        showToast('Failed to create folder', 'error')
      }
    }

    const confirmDeletePublicDocument = (doc) => {
      itemToDelete.value = { ...doc, type: 'public_document' }
      showDeleteModal.value = true
    }

    const renamePublicFolder = (folder) => {
      folderToRename.value = folder
      renameFolderName.value = folder.name
      showRenameModal.value = true
      publicFolderMenuId.value = null
    }

    const deletePublicFolder = async (folder) => {
      try {
        await db.deletePublicFolder(folder.id)
        showToast('Folder deleted')
        await loadData()
      } catch (err) {
        showToast('Failed to delete folder', 'error')
      }
      publicFolderMenuId.value = null
    }

    const togglePublicFolderMenu = (id) => {
      publicFolderMenuId.value = publicFolderMenuId.value === id ? null : id
    }

    // Drag and Drop Methods
    const handleDragStart = (event, item, source) => {
      draggedItem.value = item
      dragSource.value = source
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', JSON.stringify(item))
    }

    const handleDragEnd = () => {
      draggedItem.value = null
      dragSource.value = null
      dragOverFolderId.value = null
    }

    const handleDragOver = (event, folder) => {
      event.preventDefault()
      dragOverFolderId.value = folder.id
    }

    const handleDragLeave = () => {
      dragOverFolderId.value = null
    }

    const handleDropOnFolder = async (event, folder) => {
      event.preventDefault()
      dragOverFolderId.value = null
      
      if (!draggedItem.value) return
      
      try {
        if (draggedItem.value.title !== undefined) {
          // It's a document
          const newFolderPath = folder.name
          
          if (dragSource.value === 'personal') {
            await db.moveDocumentToFolder(draggedItem.value.id, newFolderPath)
            showToast(`Moved to "${folder.displayName || folder.name}"`)
          } else {
            await db.movePublicDocumentToFolder(draggedItem.value.id, newFolderPath)
            showToast(`Moved to "${folder.displayName || folder.name}"`)
          }
          await loadData()
        }
      } catch (err) {
        console.error('Error moving item:', err)
        showToast('Failed to move item', 'error')
      }
      
      handleDragEnd()
    }

    // Confirmation methods for personal library
    const confirmDeleteDocument = (doc) => {
      itemToDelete.value = { ...doc, type: 'document' }
      showDeleteModal.value = true
    }

    const confirmDeleteFolder = (folder) => {
      itemToDelete.value = { ...folder, type: 'folder' }
      showDeleteModal.value = true
      folderMenuId.value = null
    }

    // Setup real-time subscriptions (requires enabling in Supabase dashboard)
    // For now, we manually reload data after each action

    onMounted(async () => {
      await loadData()
    })

    return {
      activeTab,
      searchQuery,
      sortBy,
      sortOptions,
      currentFolder,
      currentPublicFolder,
      folderMenuId,
      publicFolderMenuId,
      personalDocuments,
      publicDocuments,
      personalFolders,
      publicFolders,
      isAdmin,
      showNewFolderModal,
      showNewPublicFolderModal,
      showRenameModal,
      showDeleteModal,
      newFolderName,
      newPublicFolderName,
      renameFolderName,
      itemToDelete,
      toast,
      toastType,
      draggedItem,
      dragOverFolderId,
      breadcrumbPath,
      publicBreadcrumbPath,
      currentFoldersInView,
      currentDocsInView,
      currentPublicFoldersInView,
      currentPublicDocsInView,
      filteredPublicDocuments,
      formatDate,
      navigateToFolder,
      navigateToPublicFolder,
      createNewDocument,
      createNewDocumentInFolder,
      openDocument,
      duplicateDocument,
      publishDocument,
      unpublishDocument,
      deletePublicDocument,
      deleteDocument,
      createFolder,
      createPublicFolder,
      renameFolder,
      confirmRenameFolder,
      deleteFolder,
      confirmDelete,
      toggleFolderMenu,
      togglePublicFolderMenu,
      editPublicDocument,
      viewPublicDocument,
      editDocument,
      confirmDeleteDocument,
      confirmDeleteFolder,
      confirmDeletePublicDocument,
      renamePublicFolder,
      deletePublicFolder,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDropOnFolder
    }
  }
}
</script>

<style scoped>
.library-page {
  padding: 24px 32px;
  min-height: 100vh;
  box-sizing: border-box;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 240px;
  padding: 10px 16px 10px 40px;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: all 0.2s;
}

.search-box input:focus {
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #adb5bd;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 6px;
  background: #f5f5f5;
  border-radius: 14px;
  width: fit-content;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #1a1a1a;
}

.tab.active {
  background: white;
  color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-count {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.tab.active .tab-count {
  background: #1a1a1a;
  color: white;
}

.tab-count.public {
  background: #e3f2fd;
  color: #1976d2;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
  font-size: 13px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.breadcrumb-item:hover {
  background: #f0f0f0;
  color: #1a1a1a;
}

.breadcrumb-item.active {
  color: #1a1a1a;
  font-weight: 500;
  background: #f0f0f0;
}

.breadcrumb-arrow {
  color: #ccc;
  flex-shrink: 0;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sort-options {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 10px;
}

.sort-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  color: #1a1a1a;
}

.sort-btn.active {
  background: white;
  color: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border-radius: 20px;
}

.empty-icon {
  margin-bottom: 20px;
  color: #ccc;
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

/* Items Section */
.items-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* Items Grid - Finder style */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px 12px;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 8px;
  position: relative;
  background: transparent;
  border: 2px solid transparent;
}

.item-card:hover {
  background: rgba(0, 0, 0, 0.04);
}

.item-card:hover .item-icon-large {
  transform: scale(1.05);
}

.item-card.folder:hover {
  background: rgba(0, 0, 0, 0.04);
}

.item-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.item-card.drag-over {
  background: rgba(26, 26, 26, 0.08);
  border: 2px dashed #1a1a1a;
}

.item-icon-large {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: transform 0.15s;
}

.item-icon-large.folder-icon {
  color: #5c9fea;
}

.item-icon-large.doc-icon {
  color: #666;
}

.item-icon-large.doc-icon.public {
  color: #7c5cbf;
}

.item-name {
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-date, .item-count {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.item-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.item-menu {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.item-card:hover .item-menu {
  opacity: 1;
}

.item-menu:hover {
  background: rgba(0, 0, 0, 0.08);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
}

.item-author {
  font-size: 11px;
  color: #999;
}

.item-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.admin-badge {
  background: #1a1a1a;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-menu {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-menu:hover {
  background: #f5f5f5;
}

.item-dropdown {
  position: absolute;
  top: 48px;
  right: 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
}

.item-dropdown button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
}

.item-dropdown button:hover {
  background: #f5f5f5;
}

.item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: flex-start;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #e9ecef;
  color: #1a1a1a;
}

.action-btn.publish-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.action-btn.danger:hover {
  background: #fff5f5;
  color: #dc3545;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.btn-primary:hover {
  background: #333;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #1a1a1a;
  border: 1px solid #e9ecef;
  border-radius: 10px;
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
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #c82333;
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
}

.input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
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
