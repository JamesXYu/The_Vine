<template>
  <div class="home-page">
    <!-- Welcome Section -->
    <header class="page-header">
      <div class="welcome">
        <h1>Welcome back, {{ displayName }}</h1>
        <p class="subtitle">Explore the latest from the community</p>
      </div>
    </header>

    <!-- Recent Public Documents (2 cards side by side) -->
    <section class="section" v-if="recentPublicDocs.length > 0">
      <h2 class="section-title">Recently Added</h2>
      <div class="two-column-grid">
        <div 
          v-for="doc in recentPublicDocs.slice(0, 2)" 
          :key="doc.id" 
          class="preview-card large"
          @click="openDocument(doc)"
        >
          <div class="card-badge">Public</div>
          <div class="card-title-row">
            <h3 class="card-title">{{ doc.title }}</h3>
            <span v-if="doc.folder_tag" class="folder-tag" :style="{ color: doc.folder_tag.color, borderColor: doc.folder_tag.color }">
              {{ doc.folder_tag.name }}
            </span>
          </div>
          <p class="card-preview">{{ getPreview(doc.content) }}</p>
          <div class="card-meta">
            <span class="card-author">{{ doc.display_name || 'Anonymous' }}</span>
            <span class="card-date">{{ formatDate(doc.published_at || doc.created_at) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Most Saved Document (Featured) -->
    <section class="section" v-if="mostSavedDoc">
      <h2 class="section-title">Most Saved by Members</h2>
      <div class="featured-section">
        <div 
          class="preview-card featured"
          @click="openDocument(mostSavedDoc)"
        >
          <div class="card-badge saved-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {{ mostSavedDoc.save_count }} saves
          </div>
          <h3 class="card-title">{{ mostSavedDoc.title }}</h3>
          <p class="card-preview">{{ getPreview(mostSavedDoc.content) }}</p>
          <div class="card-meta">
            <span class="card-author">{{ mostSavedDoc.display_name || 'Anonymous' }}</span>
            <span class="card-date">{{ formatDate(mostSavedDoc.published_at || mostSavedDoc.created_at) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty State for Public Library -->
    <div v-if="recentPublicDocs.length === 0 && !mostSavedDoc && !loading" class="empty-state">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </div>
      <h3>No public documents yet</h3>
      <p>Public documents published by admins will appear here</p>
      <router-link to="/lib" class="btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Go to Library
      </router-link>
    </div>

    <!-- Quick Navigation -->
    <section class="section quick-nav" v-if="recentPublicDocs.length > 0 || mostSavedDoc">
      <div class="quick-nav-grid">
        <router-link to="/lib" class="quick-nav-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Browse All</span>
        </router-link>
        <router-link to="/saved" class="quick-nav-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>My Saved</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useDatabase } from '../composables/useDatabase'

export default {
  name: 'HomeScreen',
  setup() {
    const router = useRouter()
    const db = useDatabase()
    
    const displayName = ref('')
    const recentPublicDocs = ref([])
    const mostSavedDoc = ref(null)
    const loading = ref(false)

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

    const getPreview = (content) => {
      if (!content) return 'No content available'
      // Strip HTML tags
      const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      // Return first 150 characters
      return text.length > 150 ? text.substring(0, 150) + '...' : text
    }

    const loadData = async () => {
      loading.value = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          displayName.value = user.user_metadata?.display_name || 'there'
        }
        
        // Load public documents (recent first)
        const pubDocs = await db.getPublicDocuments()
        // Fetch folder tag for each document
        const docsWithTags = await Promise.all(
          pubDocs.slice(0, 2).map(async (doc) => {
            if (doc.folder) {
              try {
                const { data: folder } = await supabase
                  .from('public_folders')
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
                console.error('Error fetching folder tag for document:', doc.id, err)
              }
            }
            return doc
          })
        )
        recentPublicDocs.value = docsWithTags
        
        // Load most saved document
        const mostSaved = await db.getMostSavedDocuments(1)
        if (mostSaved.length > 0) {
          mostSavedDoc.value = mostSaved[0]
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        loading.value = false
      }
    }

    const openDocument = (doc) => {
      router.push({ path: '/read', query: { doc: doc.id } })
    }

    onMounted(() => {
      loadData()
    })

    return {
      displayName,
      recentPublicDocs,
      mostSavedDoc,
      loading,
      formatDate,
      getPreview,
      openDocument
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 32px 40px;
  max-width: 1200px;
  min-height: 100vh;
}

/* Header */
.page-header {
  margin-bottom: 40px;
}

.welcome h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #6c757d;
}

/* Section */
.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

/* Two Column Grid */
.two-column-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 768px) {
  .two-column-grid {
    grid-template-columns: 1fr;
  }
}

/* Featured Section */
.featured-section {
  display: grid;
  grid-template-columns: 1fr;
}

/* Preview Card */
.preview-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.preview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.preview-card:hover::before {
  opacity: 1;
}

/* Large Card (for 2-column) */
.preview-card.large {
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.preview-card.large .card-title {
  font-size: 22px;
}

.preview-card.large .card-preview {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
}

/* Featured Card */
.preview-card.featured {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 200px;
}

.preview-card.featured::before {
  display: none;
}

.preview-card.featured .card-title,
.preview-card.featured .card-preview,
.preview-card.featured .card-meta {
  color: white;
}

.preview-card.featured .card-meta {
  opacity: 0.9;
}

/* Card Badge */
.card-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.saved-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.preview-card.featured .card-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Card Content */
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  line-height: 1.3;
  padding-right: 80px;
}

.card-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.card-author {
  font-weight: 500;
}

.card-date {
  opacity: 0.8;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border-radius: 20px;
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

/* Quick Navigation */
.quick-nav {
  margin-top: 40px;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 600px) {
  .quick-nav-grid {
    grid-template-columns: 1fr;
  }
}

.quick-nav-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 14px;
  text-decoration: none;
  color: #1a1a1a;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-nav-card:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-nav-card svg {
  color: #666;
}

@media (max-width: 600px) {
  .home-page {
    padding: 24px 20px;
  }
  
  .welcome h1 {
    font-size: 26px;
  }
  
  .preview-card {
    padding: 24px;
  }
  
  .card-title {
    font-size: 18px;
  }
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
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
</style>
