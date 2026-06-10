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
        <button v-if="!isMobile && (isAdmin || activeTab !== 'public')" class="btn-primary" @click="createNewDocument">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Document
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs-row">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'personal' }" 
          @click="activeTab = 'personal'"
          class="tab"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="tab-label-full">Personal Library</span>
          <span class="tab-label-short">Personal</span>
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
          <span class="tab-label-full">Public Library</span>
          <span class="tab-label-short">Public</span>
          <span class="tab-count public">{{ publicLibraryTabCount }}</span>
        </button>
      </div>
      <button
        v-if="isMobile"
        type="button"
        class="library-options-btn"
        aria-label="Library options"
        @click="showLibraryOptions = true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
      </button>
    </div>

    <!-- Personal Library -->
    <div v-if="activeTab === 'personal'" class="tab-content">
      <!-- Breadcrumb Navigation -->
      <div class="breadcrumb">
        <button @click="navigateToFolder(null)" class="breadcrumb-item" :class="{ active: !currentFolder, 'drag-over': dragOverBreadcrumb === 'root' }"
          @dragover.prevent="handleBreadcrumbDragOver($event, 'root')"
          @dragleave="handleBreadcrumbDragLeave"
          @drop="handleDropOnBreadcrumb($event, null)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Home
        </button>
        <template v-for="(crumb, index) in breadcrumbPath" :key="index">
          <svg class="breadcrumb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button @click="navigateToFolder(crumb)" class="breadcrumb-item" :class="{ active: index === breadcrumbPath.length - 1, 'drag-over': dragOverBreadcrumb === crumb }"
            @dragover.prevent="handleBreadcrumbDragOver($event, crumb)"
            @dragleave="handleBreadcrumbDragLeave"
            @drop="handleDropOnBreadcrumb($event, crumb)">
            {{ crumb }}
          </button>
        </template>
      </div>

      <!-- Actions Bar (desktop) -->
      <div v-if="!isMobile" class="actions-bar">
        <div class="actions-left">
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
          <div class="view-toggle">
            <button 
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              class="view-btn"
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              class="view-btn"
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
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
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 9h6l1.5-2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"/>
            <path d="M4 9V7a2 2 0 0 1 2-2h4l2 2"/>
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
        <div class="items-grid" :class="viewMode">
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
            <div
              class="item-icon-large folder-icon"
              :style="{ color: folder.tag_color || 'var(--neo-accent)' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 9h6l1.5-2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"/>
                <path d="M4 9V7a2 2 0 0 1 2-2h4l2 2"/>
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
              <button @click.stop="openTagManagement(folder)">Tag</button>
              <button @click.stop="renameFolder(folder)">Rename</button>
              <button @click.stop="confirmDeleteFolder(folder)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Grid -->
      <div v-if="currentDocsInView.length > 0" class="items-section">
        <h3 class="section-title">Documents</h3>
        <div class="items-grid" :class="viewMode">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 4h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                <path d="M15 4v4h4"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
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
        <button @click="navigateToPublicFolder(null)" class="breadcrumb-item" :class="{ active: !currentPublicFolder, 'drag-over': dragOverBreadcrumb === 'root' }"
          @dragover.prevent="handleBreadcrumbDragOver($event, 'root')"
          @dragleave="handleBreadcrumbDragLeave"
          @drop="handleDropOnBreadcrumb($event, null)">
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
          <button @click="navigateToPublicFolder(crumb)" class="breadcrumb-item" :class="{ active: index === publicBreadcrumbPath.length - 1, 'drag-over': dragOverBreadcrumb === crumb }"
            @dragover.prevent="handleBreadcrumbDragOver($event, crumb)"
            @dragleave="handleBreadcrumbDragLeave"
            @drop="handleDropOnBreadcrumb($event, crumb)">
            {{ crumb }}
          </button>
        </template>
      </div>

      <!-- Actions Bar for Public Library -->
      <div v-if="!isMobile && isAdmin" class="actions-bar">
        <div class="actions-left">
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
          <div class="view-toggle">
            <button 
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              class="view-btn"
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              class="view-btn"
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
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
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M8 4h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
            <path d="M15 4v4h4"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="13" y2="16"/>
          </svg>
        </div>
        <h3>Public library is empty</h3>
        <p>Documents published by admins will appear here</p>
      </div>

      <!-- Public Folders Grid -->
      <div v-if="currentPublicFoldersInView.length > 0" class="items-section">
        <h3 class="section-title">Folders</h3>
        <div class="items-grid" :class="viewMode">
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
            <div
              class="item-icon-large folder-icon"
              :style="{ color: folder.tag_color || 'var(--neo-accent)' }"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 9h6l1.5-2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"/>
                <path d="M4 9V7a2 2 0 0 1 2-2h4l2 2"/>
              </svg>
            </div>
            <div class="item-name">{{ folder.displayName }}</div>
            <div class="item-count">{{ folder.count }} {{ folder.count === 1 ? 'file' : 'files' }}</div>
            <button v-if="isAdmin" class="item-menu" @click.stop="togglePublicFolderMenu(folder.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            <div v-if="publicFolderMenuId === folder.id" class="item-dropdown">
              <button @click.stop="openPublicTagManagement(folder)">Tag</button>
              <button @click.stop="renamePublicFolder(folder)">Rename</button>
              <button @click.stop="deletePublicFolder(folder)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Public Documents Grid -->
      <div v-if="currentPublicDocsInView.length > 0" class="items-section">
        <h3 class="section-title">Published Documents</h3>
        <div class="items-grid" :class="viewMode">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 4h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                <path d="M15 4v4h4"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <div class="item-name">{{ doc.title }}</div>
            <div class="item-author">{{ doc.display_name || 'Anonymous' }}</div>
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
        <div class="form-group">
          <label>Tag Name (Optional)</label>
          <input 
            v-model="newPublicFolderTagName" 
            type="text" 
            class="input" 
            placeholder="e.g. Important, Draft"
          />
        </div>
        <div class="form-group">
          <label>Tag Color</label>
          <div class="color-palette">
            <button
              v-for="color in colorPalette"
              :key="color"
              class="color-circle"
              :class="{ active: newPublicFolderTagColor === color }"
              :style="{ background: color }"
              type="button"
              @click.prevent.stop="selectPublicFolderColor(color)"
              :title="color"
            >
              <svg v-if="newPublicFolderTagColor === color" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showNewPublicFolderModal = false">Cancel</button>
          <button class="btn-primary" @click="createPublicFolder" :disabled="!newPublicFolderName.trim()">
            Create Folder
          </button>
        </div>
      </div>
    </div>

    <!-- Publish Confirmation Modal -->
    <div v-if="showPublishConfirmModal" class="modal-overlay" @click.self="showPublishConfirmModal = false">
      <div class="modal">
        <h3>Confirm Publish</h3>
        <p class="modal-warning">
          Are you sure you want to publish "{{ docToPublish?.title }}" to the public library?
          <br><br>
          This will make the document visible to all users. You can unpublish it later.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPublishConfirmModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmPublish">Publish</button>
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
        <div class="form-group">
          <label>Tag Name (Optional)</label>
          <input 
            v-model="newFolderTagName" 
            type="text" 
            class="input" 
            placeholder="e.g. Important, Draft"
          />
        </div>
        <div class="form-group">
          <label>Tag Color</label>
          <div class="color-palette">
            <button
              v-for="color in colorPalette"
              :key="color"
              class="color-circle"
              :class="{ active: newFolderTagColor === color }"
              :style="{ background: color }"
              type="button"
              @click.prevent.stop="selectFolderColor(color)"
              :title="color"
            >
              <svg v-if="newFolderTagColor === color" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
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

    <!-- Tag Management Modal -->
    <div v-if="showTagManagementModal" class="modal-overlay" @click.self="showTagManagementModal = false">
      <div class="modal">
        <h3>Tag Management</h3>
        <div class="form-group">
          <label>Tag Name</label>
          <input 
            v-model="tagManagementName" 
            type="text" 
            class="input" 
            placeholder="e.g. Important, Draft"
          />
        </div>
        <div class="form-group">
          <label>Tag Color</label>
          <div class="color-palette">
            <button
              v-for="color in colorPalette"
              :key="color"
              class="color-circle"
              :class="{ active: tagManagementColor === color }"
              :style="{ background: color }"
              type="button"
              @click.prevent.stop="tagManagementColor = color"
              :title="color"
            >
              <svg v-if="tagManagementColor === color" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-danger-outline" v-if="tagManagementFolder?.tag_name" @click="removeTag">Remove Tag</button>
          <div v-else></div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" @click="showTagManagementModal = false">Cancel</button>
            <button class="btn-primary" @click="saveTagManagement">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3>Confirm Delete</h3>
        <p class="modal-warning">
          Are you sure you want to delete "{{ itemToDelete?.title || itemToDelete?.name }}"?
          {{ itemToDelete?.type === 'folder' || itemToDelete?.type === 'public_folder' ? 'All documents inside will be moved to root.' : '' }}
          This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- Mobile FAB: New Folder -->
    <button
      v-if="isMobile && (activeTab === 'personal' || (activeTab === 'public' && isAdmin))"
      type="button"
      class="library-fab"
      aria-label="New folder"
      @click="activeTab === 'public' ? showNewPublicFolderModal = true : showNewFolderModal = true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- Mobile Options Sheet -->
    <div
      v-if="isMobile && showLibraryOptions"
      class="library-options-overlay"
      @click.self="showLibraryOptions = false"
    >
      <div class="library-options-sheet" role="dialog" aria-label="Library options">
        <div class="library-options-sheet__head">
          <h3>Options</h3>
          <button
            type="button"
            class="library-options-sheet__close"
            aria-label="Close"
            @click="showLibraryOptions = false"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="library-options-sheet__section">
          <span class="library-options-sheet__label">Sort by</span>
          <div class="sort-options">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              :class="{ active: sortBy === option.value }"
              class="sort-btn"
              @click="sortBy = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="library-options-sheet__section">
          <span class="library-options-sheet__label">Layout</span>
          <div class="view-toggle">
            <button
              :class="{ active: viewMode === 'list' }"
              class="view-btn"
              title="List view"
              @click="viewMode = 'list'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              List
            </button>
            <button
              :class="{ active: viewMode === 'grid' }"
              class="view-btn"
              title="Grid view"
              @click="viewMode = 'grid'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Grid
            </button>
          </div>
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
import { useIsMobile } from '../composables/useIsMobile'
import { DEFAULT_TAG_COLOR, TAG_COLOR_PALETTE } from '../constants/tagColorPalette'

export default {
  name: 'LibScreen',
  setup() {
    const router = useRouter()
    const db = useDatabase()
    const { isMobile } = useIsMobile()
    
    // State
    const activeTab = ref('personal')
    const searchQuery = ref('')
    const sortBy = ref('name')
    const sortOptions = [
      { value: 'name', label: 'Name' },
      { value: 'created', label: 'Created' }
    ]
    const viewMode = ref('list') // 'grid' or 'list'
    const showLibraryOptions = ref(false)
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
    const showPublishConfirmModal = ref(false)
    const showTagManagementModal = ref(false)
    const docToPublish = ref(null)
    const newFolderName = ref('')
    const newFolderTagName = ref('')
    const newFolderTagColor = ref(DEFAULT_TAG_COLOR)
    const newPublicFolderName = ref('')
    const newPublicFolderTagName = ref('')
    const newPublicFolderTagColor = ref(DEFAULT_TAG_COLOR)
    const renameFolderName = ref('')
    const tagManagementFolder = ref(null)
    const tagManagementName = ref('')
    const tagManagementColor = ref(DEFAULT_TAG_COLOR)
    const tagManagementIsPublic = ref(false)

    const colorPalette = TAG_COLOR_PALETTE
    const itemToDelete = ref(null)
    const folderToRename = ref(null)
    
    // Drag and Drop
    const draggedItem = ref(null)
    const dragSource = ref(null) // 'personal' or 'public'
    const dragOverFolderId = ref(null)
    const dragOverBreadcrumb = ref(null)
    
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
      let folders = personalFolders.value.filter(folder => {
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
      folders = folders.map(f => {
        if (currentFolder.value) {
          return {
            ...f,
            displayName: f.name.replace(currentFolder.value + '/', '')
          }
        }
        return { ...f, displayName: f.name }
      })
      
      // Sort folders
      if (sortBy.value === 'created') {
        folders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        folders.sort((a, b) => a.displayName.localeCompare(b.displayName))
      }
      
      return folders
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
      if (sortBy.value === 'created') {
        docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        docs.sort((a, b) => a.title.localeCompare(b.title))
      }
      
      return docs
    })

    const normalizeFolderPath = (path) => (path || '').trim()

    /** Folder is an immediate child of parentPath (one path segment below). */
    const isDirectChildFolderPath = (folderPath, parentPath) => {
      const folder = normalizeFolderPath(folderPath)
      const parent = normalizeFolderPath(parentPath)
      if (!folder) return false
      if (!parent) return !folder.includes('/')
      const prefix = `${parent}/`
      if (!folder.startsWith(prefix)) return false
      const remainder = folder.slice(prefix.length)
      return remainder.length > 0 && !remainder.includes('/')
    }

    const publicFolderNameSet = computed(() =>
      new Set(publicFolders.value.map((f) => normalizeFolderPath(f.name)))
    )

    const isOrphanPublicDocument = (doc) => {
      const folder = normalizeFolderPath(doc.folder)
      if (!folder) return false
      return !publicFolderNameSet.value.has(folder)
    }

    const isPublicDocAtRoot = (doc) => {
      const docFolder = normalizeFolderPath(doc.folder)
      if (!docFolder) return true
      return isOrphanPublicDocument(doc)
    }

    /** Files whose folder path matches exactly (not nested under subfolders). */
    const countDirectDocumentsInFolder = (folderName, documents) => {
      const normalizedFolder = normalizeFolderPath(folderName)
      return documents.filter((d) => {
        const docFolder = normalizeFolderPath(d.folder)
        if (!normalizedFolder) return !docFolder
        if (docFolder === normalizedFolder) return true
        return false
      }).length
    }

    const countPublicFolderItems = (folderPath) =>
      countDirectDocumentsInFolder(folderPath, publicDocuments.value)

    // Personal library: include files in nested subfolders
    const countAllDocumentsInFolder = (folderName, documents, allFolders) => {
      const normalizedFolder = normalizeFolderPath(folderName)
      let count = countDirectDocumentsInFolder(folderName, documents)

      const prefix = normalizedFolder + '/'
      const subfolders = allFolders.filter((f) => normalizeFolderPath(f.name).startsWith(prefix))

      for (const subfolder of subfolders) {
        const relativePath = subfolder.name.replace(prefix, '')
        if (!relativePath.includes('/')) {
          count += countAllDocumentsInFolder(subfolder.name, documents, allFolders)
        }
      }

      return count
    }

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

    // Public folders in current view (from public_folders table)
    const currentPublicFoldersInView = computed(() => {
      let folders = publicFolders.value.filter((folder) =>
        isDirectChildFolderPath(folder.name, currentPublicFolder.value)
      )

      folders = folders.map((f) => {
        const displayName = currentPublicFolder.value
          ? f.name.replace(`${currentPublicFolder.value}/`, '')
          : f.name
        return {
          ...f,
          displayName,
          count: countPublicFolderItems(f.name)
        }
      })
      
      // Sort folders
      if (sortBy.value === 'created') {
        folders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else {
        folders.sort((a, b) => a.displayName.localeCompare(b.displayName))
      }
      
      return folders
    })

    // Public documents in current view
    const currentPublicDocsInView = computed(() => {
      let docs = publicDocuments.value.filter((doc) => {
        if (currentPublicFolder.value) {
          return normalizeFolderPath(doc.folder) === normalizeFolderPath(currentPublicFolder.value)
        }
        return isPublicDocAtRoot(doc)
      })
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        docs = docs.filter(doc => doc.title.toLowerCase().includes(query))
      }
      
      // Sort
      if (sortBy.value === 'created') {
        docs.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      } else {
        docs.sort((a, b) => a.title.localeCompare(b.title))
      }
      
      return docs
    })

    /** Tab badge: files in the current public folder view only (not subfolders or folder cards). */
    const publicLibraryTabCount = computed(() => currentPublicDocsInView.value.length)

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
        const userDisplayName = user.user_metadata?.display_name || ''
        
        // Check if admin - based on role in metadata
        isAdmin.value = user.user_metadata?.role === 'admin'
        
        // Load personal documents using composable
        const docs = await db.getDocuments(user.id)
        personalDocuments.value = docs.map(d => ({
          ...d,
          display_name: userDisplayName
        }))
        
        // Load personal folders
        const folders = await db.getFolders(user.id)
        personalFolders.value = folders.map(f => ({
          ...f,
          display_name: userDisplayName,
          // Count all documents in this folder and subfolders
          count: countAllDocumentsInFolder(f.name, personalDocuments.value, folders)
        }))
        
        // Load public documents (from new public_documents table)
        const pubDocs = await db.getPublicDocuments()
        publicDocuments.value = pubDocs.map(d => ({
          ...d,
          display_name: d.display_name || 'Anonymous'
        }))
        
        // Load public folders
        const pubFolders = await db.getPublicFolders()
        publicFolders.value = pubFolders
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
        const doc = await db.createDocument(currentUser.value.id, currentUser.value.email, {
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
        await db.duplicateDocument(doc, currentUser.value.id, currentUser.value.email)
        showToast('Document duplicated!')
        await loadData()
      } catch (err) {
        showToast('Failed to duplicate document', 'error')
      }
    }

    const publishDocument = (doc) => {
      docToPublish.value = doc
      showPublishConfirmModal.value = true
    }

    const confirmPublish = async () => {
      if (!docToPublish.value) return
      
      try {
        await db.publishDocument(docToPublish.value.id)
        showToast('Published to public library!')
        await loadData()
      } catch (err) {
        showToast('Failed to publish', 'error')
      } finally {
        showPublishConfirmModal.value = false
        docToPublish.value = null
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

    const selectFolderColor = (color) => {
      console.log('Selecting folder color:', color, 'current:', newFolderTagColor.value)
      newFolderTagColor.value = color
    }

    const selectPublicFolderColor = (color) => {
      console.log('Selecting public folder color:', color, 'current:', newPublicFolderTagColor.value)
      newPublicFolderTagColor.value = color
    }

    // Tag Management
    const openTagManagement = (folder) => {
      tagManagementFolder.value = folder
      tagManagementName.value = folder.tag_name || ''
      tagManagementColor.value = folder.tag_color || DEFAULT_TAG_COLOR
      tagManagementIsPublic.value = false
      showTagManagementModal.value = true
      folderMenuId.value = null
    }

    const openPublicTagManagement = (folder) => {
      tagManagementFolder.value = folder
      tagManagementName.value = folder.tag_name || ''
      tagManagementColor.value = folder.tag_color || DEFAULT_TAG_COLOR
      tagManagementIsPublic.value = true
      showTagManagementModal.value = true
      publicFolderMenuId.value = null
    }

    const saveTagManagement = async () => {
      if (!tagManagementFolder.value || !currentUser.value) return
      
      try {
        const tagName = tagManagementName.value.trim() || null
        const tagColor = tagName ? tagManagementColor.value : null
        
        const tableName = tagManagementIsPublic.value ? 'public_folders' : 'folders'
        const { error: err } = await supabase
          .from(tableName)
          .update({
            tag_name: tagName,
            tag_color: tagColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', tagManagementFolder.value.id)

        if (err) throw err
        
        showToast(tagName ? 'Tag updated!' : 'Tag removed!')
        showTagManagementModal.value = false
        tagManagementFolder.value = null
        await loadData()
      } catch (err) {
        console.error('Error updating tag:', err)
        showToast('Failed to update tag', 'error')
      }
    }

    const removeTag = async () => {
      if (!tagManagementFolder.value || !currentUser.value) return
      
      try {
        const tableName = tagManagementIsPublic.value ? 'public_folders' : 'folders'
        const { error: err } = await supabase
          .from(tableName)
          .update({
            tag_name: null,
            tag_color: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', tagManagementFolder.value.id)

        if (err) throw err
        
        showToast('Tag removed!')
        showTagManagementModal.value = false
        tagManagementFolder.value = null
        await loadData()
      } catch (err) {
        console.error('Error removing tag:', err)
        showToast('Failed to remove tag', 'error')
      }
    }

    const createFolder = async () => {
      if (!newFolderName.value.trim() || !currentUser.value) return
      
      try {
        const folderPath = currentFolder.value 
          ? currentFolder.value + '/' + newFolderName.value.trim()
          : newFolderName.value.trim()
        const tagName = newFolderTagName.value.trim() || null
        const tagColor = tagName ? newFolderTagColor.value : null
        
        console.log('Creating folder with tag:', { tagName, tagColor, newFolderTagColor: newFolderTagColor.value })
        
        await db.createFolder(currentUser.value.id, currentUser.value.email, folderPath, tagName, tagColor)
        showToast('Folder created!')
        showNewFolderModal.value = false
        newFolderName.value = ''
        newFolderTagName.value = ''
        newFolderTagColor.value = DEFAULT_TAG_COLOR
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
      
      // Check if this is a public folder (virtual folder)
      if (folderToRename.value.isPublic) {
        try {
          const oldPath = folderToRename.value.name
          const docsInFolder = publicDocuments.value.filter(d => d.folder === oldPath)
          
          for (const doc of docsInFolder) {
            const newPath = currentPublicFolder.value 
              ? currentPublicFolder.value + '/' + renameFolderName.value.trim()
              : renameFolderName.value.trim()
            await db.movePublicDocumentToFolder(doc.id, newPath)
          }
          showToast('Folder renamed!')
          showRenameModal.value = false
          renameFolderName.value = ''
          folderToRename.value = null
          await loadData()
          return
        } catch (err) {
          showToast('Failed to rename folder', 'error')
          return
        }
      }
      
      // Personal folder rename
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
          // Navigate back to root if we're inside the deleted folder
          if (currentFolder.value === itemToDelete.value.name) {
            currentFolder.value = null
          }
        } else if (itemToDelete.value.type === 'public_folder') {
          // Move all documents in this folder back to root, then delete the folder
          console.log('Deleting public folder:', itemToDelete.value)
          const docsInFolder = publicDocuments.value.filter(d => d.folder === itemToDelete.value.name)
          console.log('Docs in folder:', docsInFolder)
          for (const doc of docsInFolder) {
            await db.movePublicDocumentToFolder(doc.id, null)
          }
          // Actually delete the folder record
          console.log('Deleting folder record with id:', itemToDelete.value.id)
          await db.deletePublicFolder(itemToDelete.value.id)
          showToast('Folder deleted (documents moved to root)')
          // Navigate back to root if we're inside the deleted folder
          if (currentPublicFolder.value === itemToDelete.value.name) {
            currentPublicFolder.value = null
          }
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
        const tagName = newPublicFolderTagName.value.trim() || null
        const tagColor = tagName ? newPublicFolderTagColor.value : null
        
        console.log('Creating public folder with tag:', { tagName, tagColor, newPublicFolderTagColor: newPublicFolderTagColor.value })
        
        await db.createPublicFolder(currentUser.value.id, currentUser.value.email, folderPath, tagName, tagColor)
        showToast('Folder created!')
        showNewPublicFolderModal.value = false
        newPublicFolderName.value = ''
        newPublicFolderTagName.value = ''
        newPublicFolderTagColor.value = DEFAULT_TAG_COLOR
        await loadData()
      } catch (err) {
        console.error('Create folder error:', err)
        showToast('Failed to create folder', 'error')
      }
    }

    const confirmDeletePublicDocument = (doc) => {
      itemToDelete.value = { ...doc, type: 'public_document' }
      showDeleteModal.value = true
    }

    const renamePublicFolder = (folder) => {
      folderToRename.value = { ...folder, isPublic: true }
      renameFolderName.value = folder.displayName
      showRenameModal.value = true
      publicFolderMenuId.value = null
    }

    const deletePublicFolder = (folder) => {
      itemToDelete.value = { ...folder, type: 'public_folder' }
      showDeleteModal.value = true
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
      dragOverBreadcrumb.value = null
    }

    // Move document out of folder
    const moveDocOutOfFolder = async (doc) => {
      try {
        await db.moveDocumentOutOfFolder(doc.id)
        showToast('Moved out of folder')
        await loadData()
      } catch (err) {
        console.error('Error moving document out of folder:', err)
        showToast('Failed to move out', 'error')
      }
    }

    // Move public document out of folder
    const movePublicDocOutOfFolder = async (doc) => {
      try {
        await db.movePublicDocumentOutOfFolder(doc.id)
        showToast('Moved out of folder')
        await loadData()
      } catch (err) {
        console.error('Error moving public document out of folder:', err)
        showToast('Failed to move out', 'error')
      }
    }

    // Breadcrumb drag handlers
    const handleBreadcrumbDragOver = (event, target) => {
      // Only allow if a document is being dragged and we're inside a folder
      if (!draggedItem.value) return
      const isPersonalInsideFolder = dragSource.value === 'personal' && currentFolder.value
      const isPublicInsideFolder = dragSource.value === 'public' && currentPublicFolder.value
      if (!isPersonalInsideFolder && !isPublicInsideFolder) return
      
      // Don't allow dropping on current folder (no-op)
      if (target === 'root' || (isPersonalInsideFolder && target !== currentFolder.value) || (isPublicInsideFolder && target !== currentPublicFolder.value)) {
        event.dataTransfer.dropEffect = 'move'
        dragOverBreadcrumb.value = target
      }
    }

    const handleBreadcrumbDragLeave = () => {
      dragOverBreadcrumb.value = null
    }

    const handleDropOnBreadcrumb = async (event, targetFolder) => {
      event.preventDefault()
      dragOverBreadcrumb.value = null
      
      if (!draggedItem.value) return

      try {
        // Determine the target folder path
        let targetPath = null
        if (targetFolder !== null) {
          // Build path from breadcrumb parts
          if (dragSource.value === 'personal') {
            const parts = currentFolder.value.split('/')
            const idx = parts.indexOf(targetFolder)
            targetPath = parts.slice(0, idx + 1).join('/')
          } else {
            const parts = currentPublicFolder.value.split('/')
            const idx = parts.indexOf(targetFolder)
            targetPath = parts.slice(0, idx + 1).join('/')
          }
        }

        // Check if document would actually move (skip if same folder)
        if (dragSource.value === 'personal' && targetPath === draggedItem.value.folder) return
        if (dragSource.value === 'public' && targetPath === draggedItem.value.folder) return

        if (dragSource.value === 'personal') {
          if (targetPath === null) {
            await db.moveDocumentOutOfFolder(draggedItem.value.id)
          } else {
            await db.moveDocumentToFolder(draggedItem.value.id, targetPath)
          }
          showToast(targetPath ? `Moved to "${targetFolder}"` : 'Moved to root')
        } else {
          if (targetPath === null) {
            await db.movePublicDocumentOutOfFolder(draggedItem.value.id)
          } else {
            await db.movePublicDocumentToFolder(draggedItem.value.id, targetPath)
          }
          showToast(targetPath ? `Moved to "${targetFolder}"` : 'Moved to root')
        }
        await loadData()
      } catch (err) {
        console.error('Error moving item:', err)
        showToast('Failed to move item', 'error')
      }
      
      handleDragEnd()
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
      isMobile,
      activeTab,
      searchQuery,
      sortBy,
      sortOptions,
      viewMode,
      showLibraryOptions,
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
      showPublishConfirmModal,
      showTagManagementModal,
      docToPublish,
      newFolderName,
      newFolderTagName,
      newFolderTagColor,
      newPublicFolderName,
      newPublicFolderTagName,
      newPublicFolderTagColor,
      renameFolderName,
      tagManagementFolder,
      tagManagementName,
      tagManagementColor,
      itemToDelete,
      colorPalette,
      toast,
      toastType,
      draggedItem,
      dragOverFolderId,
      dragOverBreadcrumb,
      breadcrumbPath,
      publicBreadcrumbPath,
      currentFoldersInView,
      currentDocsInView,
      currentPublicFoldersInView,
      currentPublicDocsInView,
      publicLibraryTabCount,
      filteredPublicDocuments,
      formatDate,
      navigateToFolder,
      navigateToPublicFolder,
      createNewDocument,
      createNewDocumentInFolder,
      openDocument,
      duplicateDocument,
      publishDocument,
      confirmPublish,
      unpublishDocument,
      deletePublicDocument,
      deleteDocument,
      selectFolderColor,
      selectPublicFolderColor,
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
      openTagManagement,
      openPublicTagManagement,
      saveTagManagement,
      removeTag,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDropOnFolder,
      handleBreadcrumbDragOver,
      handleBreadcrumbDragLeave,
      handleDropOnBreadcrumb,
      moveDocOutOfFolder,
      movePublicDocOutOfFolder
    }
  }
}
</script>

<style scoped>
.library-page {
  padding: 24px 32px;
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--neo-bg);
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
  color: var(--neo-text);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--neo-text-muted);
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
  border: none;
  border-radius: var(--neo-radius-pill);
  font-size: 14px;
  background: var(--neo-bg);
  outline: none;
  transition: box-shadow 0.2s;
  box-shadow: var(--neo-inset-sm);
}

.search-box input:focus {
  border-color: var(--neo-text);
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.2);
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #adb5bd;
}

/* Tabs */
.tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--neo-bg);
  border-radius: var(--neo-radius);
  width: fit-content;
  box-shadow: var(--neo-inset-sm);
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
  color: var(--neo-text);
}

.tab.active {
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-raised-sm);
}

.tab-count {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.tab.active .tab-count {
  background: var(--neo-accent);
  color: white;
}

.tab-count.public {
  background: #e3f2fd;
  color: #1976d2;
}

.tab-label-short {
  display: none;
}

.library-fab,
.library-options-overlay {
  display: none;
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
  color: var(--neo-text);
}

.breadcrumb-item.active {
  color: var(--neo-text);
  font-weight: 500;
  background: #f0f0f0;
}

.breadcrumb-item.drag-over {
  background: #e3f2fd;
  color: #1976d2;
  border: 2px dashed #1976d2;
  border-radius: 6px;
  padding: 4px 8px;
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

.actions-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sort-options {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--neo-bg);
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
  color: var(--neo-text);
}

.sort-btn.active {
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-raised-sm);
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--neo-bg);
  border-radius: 10px;
}

.view-btn {
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn:hover {
  color: var(--neo-text);
}

.view-btn.active {
  background: var(--neo-bg);
  color: var(--neo-text);
  box-shadow: var(--neo-raised-sm);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: var(--neo-bg);
  border-radius: var(--neo-radius-lg);
  box-shadow: var(--neo-raised);
}

.empty-icon {
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: var(--neo-bg);
  box-shadow: var(--neo-inset);
  color: var(--neo-accent);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--neo-text);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--neo-text-muted);
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

/* List View */
.items-grid.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.items-grid.list .item-card {
  flex-direction: row;
  justify-content: flex-start;
  padding: 12px 16px;
  gap: 16px;
  background: var(--neo-bg);
  border-radius: 8px;
}

.items-grid.list .item-card:hover {
  background: var(--neo-bg);
}

.items-grid.list .item-icon-large {
  width: 32px;
  height: 32px;
  margin-bottom: 0;
  flex-shrink: 0;
}

.items-grid.list .item-icon-large svg {
  width: 24px;
  height: 24px;
}

.items-grid.list .item-name {
  flex: 1;
  text-align: left;
  font-size: 14px;
  -webkit-line-clamp: 1;
}

.items-grid.list .item-date,
.items-grid.list .item-author,
.items-grid.list .item-count {
  font-size: 12px;
  min-width: 80px;
  text-align: left;
}

.items-grid.list .item-actions {
  opacity: 1;
  margin-top: 0;
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
  box-shadow: var(--neo-raised-sm);
}

.item-card:hover .item-icon-large {
  transform: scale(1.04);
  box-shadow: var(--neo-raised);
}

.item-card.folder:hover {
  box-shadow: var(--neo-raised-sm);
}

.item-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.item-card.drag-over {
  background: var(--neo-bg);
  border: 2px dashed var(--neo-accent);
  box-shadow: var(--neo-inset-sm);
}

.item-icon-large {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border-radius: 16px;
  background: var(--neo-bg);
  box-shadow: var(--neo-raised-sm);
  transition: transform 0.15s, box-shadow 0.15s;
}

.item-icon-large.folder-icon {
  color: var(--neo-accent);
  transition: color 0.2s, box-shadow 0.15s;
}

.item-icon-large.doc-icon {
  color: var(--neo-text-muted);
}

.item-icon-large.doc-icon.public {
  color: var(--neo-accent-bright);
}

.item-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--neo-text);
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
  color: var(--neo-text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 12px;
  color: var(--neo-text-muted);
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
  background: var(--neo-accent);
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
  background: var(--neo-bg);
}

.item-dropdown {
  position: absolute;
  top: 48px;
  right: 16px;
  background: var(--neo-bg);
  border-radius: 10px;
  box-shadow: var(--neo-raised);
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
  color: var(--neo-text);
  cursor: pointer;
}

.item-dropdown button:hover {
  background: var(--neo-bg);
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
  background: var(--neo-bg);
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
  color: var(--neo-text);
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
  background: var(--neo-accent);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--neo-accent);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--neo-bg);
  color: var(--neo-text);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--neo-bg);
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

.btn-danger-outline {
  padding: 10px 20px;
  background: var(--neo-bg);
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background: #fff5f5;
  border-color: #c82333;
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
  background: var(--neo-bg);
  padding: 32px;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--neo-raised-lg);
}

.modal h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--neo-text);
  margin-bottom: 20px;
}

.modal-warning {
  font-size: 14px;
  color: var(--neo-text-muted);
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
  color: var(--neo-text);
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--neo-text);
  box-shadow: var(--neo-inset-sm), 0 0 0 2px rgba(232, 149, 111, 0.2);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
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

/* Color Palette */
.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 32px);
  gap: 8px;
  margin-top: 4px;
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  padding: 0;
}

.color-circle:hover {
  transform: scale(1.12);
}

.color-circle.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(26, 26, 26, 0.25);
}

@media (max-width: 768px) {
  .library-page {
    padding: 16px;
    padding-bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 72px);
    max-width: 100%;
    overflow-x: hidden;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 20px;
  }

  .header-left h1 {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  .search-box input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .header-actions .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .tabs-row {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .tabs {
    flex: 1;
    min-width: 0;
    width: auto;
    max-width: 100%;
    flex-direction: row;
    box-sizing: border-box;
  }

  .tab {
    flex: 1;
    min-width: 0;
    justify-content: center;
    padding: 10px 8px;
    font-size: 15px;
    gap: 6px;
  }

  .tab-label-full {
    display: none;
  }

  .tab-label-short {
    display: inline;
  }

  .tab svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  .breadcrumb {
    flex-wrap: wrap;
    row-gap: 4px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .library-options-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 10px;
    background: var(--neo-bg);
    color: var(--neo-text);
    cursor: pointer;
    box-shadow: var(--neo-raised-sm);
  }

  .library-options-btn:active {
    transform: scale(0.96);
  }

  .library-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    right: 16px;
    bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 12px);
    z-index: 55;
    width: 52px;
    height: 52px;
    border: none;
    border-radius: 50%;
    background: var(--neo-accent);
    color: #fff;
    box-shadow: 0 4px 16px rgba(232, 149, 111, 0.45);
    cursor: pointer;
  }

  .library-fab:active {
    transform: scale(0.96);
  }

  .library-options-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(0, 0, 0, 0.45);
    align-items: flex-end;
    justify-content: center;
  }

  .library-options-sheet {
    width: 100%;
    max-height: min(50vh, 360px);
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
    background: var(--neo-bg);
    border-radius: 20px 20px 0 0;
    box-shadow: var(--neo-raised-lg);
    box-sizing: border-box;
  }

  .library-options-sheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .library-options-sheet__head h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--neo-text);
  }

  .library-options-sheet__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--neo-bg);
    color: var(--neo-text-muted);
    cursor: pointer;
    box-shadow: var(--neo-inset-sm);
  }

  .library-options-sheet__section {
    margin-bottom: 20px;
  }

  .library-options-sheet__section:last-child {
    margin-bottom: 0;
  }

  .library-options-sheet__label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--neo-text-muted);
    margin-bottom: 10px;
  }

  .library-options-sheet .sort-options,
  .library-options-sheet .view-toggle {
    width: 100%;
  }

  .library-options-sheet .sort-btn {
    flex: 1;
    text-align: center;
  }

  .library-options-sheet .view-btn {
    flex: 1;
    gap: 6px;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    width: 100%;
  }

  .items-grid.list .item-card {
    flex-wrap: wrap;
    gap: 8px;
  }

  .items-grid.list .item-date,
  .items-grid.list .item-author,
  .items-grid.list .item-count {
    min-width: 0;
  }

  .modal {
    margin: 16px;
    padding: 24px;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
  }

  .color-palette {
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  .color-circle {
    width: 100%;
    aspect-ratio: 1;
    height: auto;
  }

  .toast {
    left: 16px;
    right: 16px;
    bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 16px);
  }
}
</style>
