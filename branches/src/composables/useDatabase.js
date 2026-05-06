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
   * Create a new folder (with optional tag)
   */
  const createFolder = async (userId, name, tagName = null, tagColor = null) => {
    const { data, error: err } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name: name.trim(),
        tag_name: tagName,
        tag_color: tagColor,
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
   * Create a new public folder (with optional tag)
   */
  const createPublicFolder = async (userId, name, tagName = null, tagColor = null) => {
    const { data, error: err } = await supabase
      .from('public_folders')
      .insert({
        user_id: userId,
        name: name.trim(),
        tag_name: tagName,
        tag_color: tagColor
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

  // =====================================================
  // SAVED DOCUMENTS
  // =====================================================

  /**
   * Get all saved documents for a user (both personal and public)
   */
  const getSavedDocuments = async (userId) => {
    const { data, error: err } = await supabase
      .from('saved_documents')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (err) {
      console.error('Error fetching saved documents:', err)
      return []
    }

    if (!data || data.length === 0) return []

    // Separate personal and public document IDs
    const personalDocIds = data
      .filter(item => !item.is_public)
      .map(item => item.document_id)
    
    const publicDocIds = data
      .filter(item => item.is_public)
      .map(item => item.document_id)

    // Fetch personal documents
    let personalDocs = []
    if (personalDocIds.length > 0) {
      const { data: docs, error: docError } = await supabase
        .from('documents')
        .select('*')
        .in('id', personalDocIds)
      
      if (!docError && docs) {
        personalDocs = docs.map(doc => ({
          ...doc,
          is_public: false
        }))
      }
    }

    // Fetch public documents
    let publicDocs = []
    if (publicDocIds.length > 0) {
      const { data: docs, error: docError } = await supabase
        .from('public_documents')
        .select('*')
        .in('id', publicDocIds)
      
      if (!docError && docs) {
        publicDocs = docs.map(doc => ({
          ...doc,
          is_public: true
        }))
      }
    }

    // Merge and add saved metadata
    const savedMap = {}
    data.forEach(item => {
      savedMap[item.document_id] = {
        saved_id: item.id,
        saved_at: item.saved_at,
        is_public: item.is_public
      }
    })

    const allDocs = [...personalDocs, ...publicDocs].map(doc => ({
      ...doc,
      ...savedMap[doc.id]
    }))

    return allDocs
  }

  /**
   * Save a document (supports both personal and public documents)
   */
  const saveDocument = async (userId, docId, isPublic = false) => {
    try {
      // Check if already saved
      const { data: existing, error: checkError } = await supabase
        .from('saved_documents')
        .select('id')
        .eq('user_id', userId)
        .eq('document_id', docId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking if document is saved:', checkError)
        throw checkError
      }

      if (existing) {
        console.log('Document already saved:', existing)
        return existing // Already saved
      }

      // Insert new saved document
      const { data, error: insertError } = await supabase
        .from('saved_documents')
        .insert({
          user_id: userId,
          document_id: docId,
          is_public: isPublic,
          saved_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving document:', insertError)
        console.error('Insert payload:', { userId, docId, isPublic })
        throw insertError
      }
      
      console.log('Document saved successfully:', data)
      return data
    } catch (err) {
      console.error('Failed to save document:', err.message || err)
      throw err
    }
  }

  /**
   * Unsave a document
   */
  const unsaveDocument = async (userId, docId) => {
    const { error: err } = await supabase
      .from('saved_documents')
      .delete()
      .eq('user_id', userId)
      .eq('document_id', docId)

    if (err) {
      console.error('Error unsaving document:', err)
      throw err
    }
  }

  /**
   * Check if a document is saved
   */
  const isDocumentSaved = async (userId, docId) => {
    const { data } = await supabase
      .from('saved_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('document_id', docId)
      .single()

    return !!data
  }

  /**
   * Get save count for a document
   */
  const getDocumentSaveCount = async (docId) => {
    const { count, error } = await supabase
      .from('saved_documents')
      .select('id', { count: 'exact' })
      .eq('document_id', docId)

    if (error) {
      console.error('Error getting save count:', error)
      return 0
    }
    return count || 0
  }

  /**
   * Get most saved documents (sorted by save count)
   */
  const getMostSavedDocuments = async (limit = 5) => {
    // Get all saved documents with counts
    const { data, error } = await supabase
      .from('saved_documents')
      .select('document_id')

    if (error) {
      console.error('Error getting most saved:', error)
      return []
    }

    // Count saves per document
    const counts = {}
    data.forEach(item => {
      counts[item.document_id] = (counts[item.document_id] || 0) + 1
    })

    // Sort by count and get top documents
    const sortedIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)

    // Fetch full document data
    if (sortedIds.length === 0) return []

    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('*')
      .in('id', sortedIds)

    if (docError) {
      console.error('Error fetching most saved docs:', docError)
      return []
    }

    // Merge with save counts and sort
    return (docs || []).map(doc => ({
      ...doc,
      save_count: counts[doc.id] || 0
    })).sort((a, b) => b.save_count - a.save_count)
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
    // Saved Documents
    getSavedDocuments,
    saveDocument,
    unsaveDocument,
    isDocumentSaved,
    getDocumentSaveCount,
    getMostSavedDocuments,
    // Real-time
    subscribeToDocuments,
    subscribeToFolders
  }
}
