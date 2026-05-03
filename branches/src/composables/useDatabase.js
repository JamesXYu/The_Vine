import { ref } from 'vue'
import { supabase } from '../supabase'

export function useDatabase() {
  const loading = ref(false)
  const error = ref(null)

  // =====================================================
  // DOCUMENTS
  // =====================================================

  /**
   * Get all documents for a user
   */
  const getDocuments = async (userId, includePublished = false) => {
    loading.value = true
    error.value = null
    
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (!includePublished) {
        query = query.eq('user_id', userId).eq('is_published', false)
      } else {
        query = query.eq('is_published', true)
      }
      
      const { data, error: err } = await query
      
      if (err) {
        console.error('Supabase error fetching documents:', err)
        throw err
      }
      
      console.log('Fetched documents:', data)
      return data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching documents:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single document by ID
   */
  const getDocument = async (docId) => {
    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single()
    
    if (err) {
      console.error('Error fetching document:', err)
      return null
    }
    return data
  }

  /**
   * Create a new document
   */
  const createDocument = async (userId, doc = {}) => {
    const newDoc = {
      user_id: userId,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      folder: doc.folder || null,
      is_published: false,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: err } = await supabase
      .from('documents')
      .insert(newDoc)
      .select()
      .single()

    if (err) {
      console.error('Error creating document:', err)
      throw err
    }
    return data
  }

  /**
   * Update a document
   */
  const updateDocument = async (docId, updates) => {
    const { data, error: err } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      .select()
      .single()

    if (err) {
      console.error('Error updating document:', err)
      throw err
    }
    return data
  }

  /**
   * Publish a document to public library (creates a COPY, original stays in personal)
   */
  const publishDocument = async (docId) => {
    // First get the original document
    const original = await getDocument(docId)
    if (!original) throw new Error('Document not found')
    
    // Create a COPY for public library
    const { data, error: err } = await supabase
      .from('public_documents')
      .insert({
        title: original.title,
        content: original.content,
        user_id: original.user_id,
        user_email: original.user_email,
        folder: original.folder,
        original_doc_id: original.id,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (err) {
      console.error('Error publishing document:', err)
      throw err
    }
    return data
  }

  /**
   * Unpublish a document (remove from public, original stays in personal)
   */
  const unpublishDocument = async (publicDocId) => {
    const { error: err } = await supabase
      .from('public_documents')
      .delete()
      .eq('id', publicDocId)

    if (err) {
      console.error('Error unpublishing document:', err)
      throw err
    }
  }

  /**
   * Duplicate a document
   */
  const duplicateDocument = async (doc, userId) => {
    return createDocument(userId, {
      title: `${doc.title} (Copy)`,
      content: doc.content,
      folder: doc.folder
    })
  }

  /**
   * Delete a document from personal library
   */
  const deleteDocument = async (docId) => {
    const { error: err } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (err) {
      console.error('Error deleting document:', err)
      throw err
    }
  }

  /**
   * Delete a document from public library
   */
  const deletePublicDocument = async (publicDocId) => {
    const { error: err } = await supabase
      .from('public_documents')
      .delete()
      .eq('id', publicDocId)

    if (err) {
      console.error('Error deleting public document:', err)
      throw err
    }
  }

  /**
   * Get all public documents
   */
  const getPublicDocuments = async () => {
    const { data, error: err } = await supabase
      .from('public_documents')
      .select('*')
      .order('published_at', { ascending: false })

    if (err) {
      console.error('Error fetching public documents:', err)
      return []
    }
    return data || []
  }

  /**
   * Get a single public document by ID
   */
  const getPublicDocument = async (publicDocId) => {
    const { data, error: err } = await supabase
      .from('public_documents')
      .select('*')
      .eq('id', publicDocId)
      .single()

    if (err) {
      console.error('Error fetching public document:', err)
      return null
    }
    return data
  }

  /**
   * Update a public document
   */
  const updatePublicDocument = async (publicDocId, updates) => {
    const { data, error: err } = await supabase
      .from('public_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', publicDocId)
      .select()
      .single()

    if (err) {
      console.error('Error updating public document:', err)
      throw err
    }
    return data
  }

  /**
   * Move document to a folder (for drag & drop)
   */
  const moveDocumentToFolder = async (docId, folderName) => {
    const { data, error: err } = await supabase
      .from('documents')
      .update({ folder: folderName })
      .eq('id', docId)
      .select()
      .single()

    if (err) {
      console.error('Error moving document:', err)
      throw err
    }
    return data
  }

  /**
   * Move public document to a folder
   */
  const movePublicDocumentToFolder = async (publicDocId, folderName) => {
    const { data, error: err } = await supabase
      .from('public_documents')
      .update({ folder: folderName })
      .eq('id', publicDocId)
      .select()
      .single()

    if (err) {
      console.error('Error moving public document:', err)
      throw err
    }
    return data
  }

  // =====================================================
  // FOLDERS
  // =====================================================

  /**
   * Get all folders for a user (personal or public)
   */
  const getFolders = async (userId) => {
    const { data, error: err } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (err) {
      console.error('Error fetching folders:', err)
      return []
    }
    return data || []
  }

  /**
   * Get all public folders (no user filter needed)
   */
  const getPublicFolders = async () => {
    const { data, error: err } = await supabase
      .from('public_folders')
      .select('*')
      .order('name', { ascending: true })

    if (err) {
      console.error('Error fetching public folders:', err)
      return []
    }
    return data || []
  }

  /**
   * Create a new folder
   */
  const createFolder = async (userId, name) => {
    const { data, error: err } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name: name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (err) {
      console.error('Error creating folder:', err)
      throw err
    }
    return data
  }

  /**
   * Create a new public folder
   */
  const createPublicFolder = async (userId, name) => {
    const { data, error: err } = await supabase
      .from('public_folders')
      .insert({
        user_id: userId,
        name: name.trim()
      })
      .select()
      .single()

    if (err) {
      console.error('Error creating public folder:', err)
      throw err
    }
    return data
  }

  /**
   * Delete a folder from public library
   */
  const deletePublicFolder = async (folderId) => {
    const { error: err } = await supabase
      .from('public_folders')
      .delete()
      .eq('id', folderId)

    if (err) {
      console.error('Error deleting public folder:', err)
      throw err
    }
  }

  /**
   * Rename a folder
   */
  const renameFolder = async (folderId, newName) => {
    // Update the folder
    const { data, error: err } = await supabase
      .from('folders')
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .select()
      .single()

    if (err) {
      console.error('Error renaming folder:', err)
      throw err
    }
    return data
  }

  /**
   * Rename folder and update all documents inside
   */
  const renameFolderWithDocuments = async (folderId, oldName, newName) => {
    // Update all documents in this folder
    await supabase
      .from('documents')
      .update({ folder: newName.trim() })
      .eq('folder', oldName)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    // Update the folder
    const { data, error: err } = await supabase
      .from('folders')
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .select()
      .single()

    if (err) {
      console.error('Error renaming folder:', err)
      throw err
    }
    return data
  }

  /**
   * Delete a folder (moves documents to root)
   */
  const deleteFolder = async (folderId, folderName, userId) => {
    // Move documents to root (set folder to null)
    await supabase
      .from('documents')
      .update({ folder: null })
      .eq('folder', folderName)
      .eq('user_id', userId)

    // Delete the folder
    const { error: err } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (err) {
      console.error('Error deleting folder:', err)
      throw err
    }
  }

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  /**
   * Subscribe to document changes
   */
  const subscribeToDocuments = (userId, callback) => {
    const subscription = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Subscribe to folder changes
   */
  const subscribeToFolders = (userId, callback) => {
    const subscription = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  return {
    loading,
    error,
    // Documents
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    publishDocument,
    unpublishDocument,
    duplicateDocument,
    deleteDocument,
    // Public Documents
    getPublicDocuments,
    getPublicDocument,
    updatePublicDocument,
    deletePublicDocument,
    moveDocumentToFolder,
    movePublicDocumentToFolder,
    // Folders
    getFolders,
    getPublicFolders,
    createFolder,
    createPublicFolder,
    renameFolder,
    renameFolderWithDocuments,
    deleteFolder,
    deletePublicFolder,
    // Real-time
    subscribeToDocuments,
    subscribeToFolders
  }
}
