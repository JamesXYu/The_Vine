<template>
  <div class="home-page">
    <!-- Welcome Section -->
    <header class="page-header">
      <div class="welcome">
        <h1>Welcome back, {{ displayName }}</h1>
        <p class="subtitle">Explore the latest from the community</p>
      </div>
    </header>

    <!-- Main Content Grid (fit to viewport, no scroll) -->
    <div class="main-grid" v-if="recentPublicDocs.length > 0 || mostSavedDocs.length > 0 || !loading">
      <!-- Left Column: Scripture + Announcement -->
      <div class="left-column">
        <!-- Scripture of Today Section (30%) -->
        <section class="scripture-section">
          <h2 class="section-title">Scripture of Today</h2>
          <div class="scripture-card">
            <div class="scripture-content">
              <p class="scripture-text">
                "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing."
              </p>
              <div class="scripture-reference">John 15:5</div>
            </div>
          </div>
        </section>

        <!-- Announcement Section (65%) -->
        <section class="announcement-section">
          <h2 class="section-title">Announcement</h2>
          <div class="announcement-card">
            <div class="announcement-content">
              <h3 class="announcement-title">Welcome to The Vine</h3>
              <p class="announcement-text">
                This is a placeholder announcement. The admin will be able to post important updates and announcements here.
              </p>
              <div class="announcement-meta">
                <span class="announcement-date">Today</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column (spans remaining space) -->
      <div class="right-column">
        <!-- Top Half: Recently Updated -->
        <section class="section half-section recent-section">
          <h2 class="section-title">Recently Updated</h2>
          <div class="recent-docs">
            <!-- Most Recent (60% width) -->
            <div
              v-if="recentPublicDocs[0]"
              class="preview-card card-recent-primary"
              @click="openDocument(recentPublicDocs[0])"
            >
              <div class="card-accent"></div>
              <div v-if="recentPublicDocs[0].folder_tag" class="card-badge" :style="{ color: recentPublicDocs[0].folder_tag.color, borderColor: recentPublicDocs[0].folder_tag.color }">
                {{ recentPublicDocs[0].folder_tag.name }}
              </div>
              <div v-else class="card-badge">Public</div>
              <h3 class="card-title">{{ recentPublicDocs[0].title }}</h3>
              <p class="card-preview">{{ getPreview(recentPublicDocs[0].content) }}</p>
              <div class="card-meta">
                <span class="card-author">{{ recentPublicDocs[0].display_name || 'Anonymous' }}</span>
                <span class="card-date">{{ formatDate(recentPublicDocs[0].published_at || recentPublicDocs[0].created_at) }}</span>
              </div>
            </div>

            <!-- Second Most Recent (35% width) -->
            <div
              v-if="recentPublicDocs[1]"
              class="preview-card card-recent-secondary"
              @click="openDocument(recentPublicDocs[1])"
            >
              <div class="card-accent"></div>
              <div v-if="recentPublicDocs[1].folder_tag" class="card-badge" :style="{ color: recentPublicDocs[1].folder_tag.color, borderColor: recentPublicDocs[1].folder_tag.color }">
                {{ recentPublicDocs[1].folder_tag.name }}
              </div>
              <div v-else class="card-badge">Public</div>
              <h3 class="card-title">{{ recentPublicDocs[1].title }}</h3>
              <p class="card-preview">{{ getPreview(recentPublicDocs[1].content) }}</p>
              <div class="card-meta">
                <span class="card-author">{{ recentPublicDocs[1].display_name || 'Anonymous' }}</span>
                <span class="card-date">{{ formatDate(recentPublicDocs[1].published_at || recentPublicDocs[1].created_at) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bottom Half: Most Saved (reversed: 35% + 60%) -->
        <section class="section half-section most-saved-section">
          <h2 class="section-title">Most Saved</h2>
          <div class="saved-docs">
            <!-- First Most Saved (35% width) -->
            <div
              v-if="mostSavedDocs[0]"
              class="preview-card card-saved-first"
              @click="openDocument(mostSavedDocs[0])"
            >
              <div class="card-accent"></div>
              <div class="card-badge saved-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {{ mostSavedDocs[0].save_count }} saves
              </div>
              <h3 class="card-title">
                {{ mostSavedDocs[0].title }}
                <span v-if="mostSavedDocs[0].folder_tag" class="card-tag-inline" :style="{ color: mostSavedDocs[0].folder_tag.color, borderColor: mostSavedDocs[0].folder_tag.color }">
                  {{ mostSavedDocs[0].folder_tag.name }}
                </span>
              </h3>
              <p class="card-preview">{{ getPreview(mostSavedDocs[0].content) }}</p>
              <div class="card-meta">
                <span class="card-author">{{ mostSavedDocs[0].display_name || 'Anonymous' }}</span>
                <span class="card-date">{{ formatDate(mostSavedDocs[0].published_at || mostSavedDocs[0].created_at) }}</span>
              </div>
            </div>

            <!-- Second Most Saved (60% width) -->
            <div
              v-if="mostSavedDocs[1]"
              class="preview-card card-saved-second"
              @click="openDocument(mostSavedDocs[1])"
            >
              <div class="card-accent"></div>
              <div class="card-badge saved-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {{ mostSavedDocs[1].save_count }} saves
              </div>
              <h3 class="card-title">
                {{ mostSavedDocs[1].title }}
                <span v-if="mostSavedDocs[1].folder_tag" class="card-tag-inline" :style="{ color: mostSavedDocs[1].folder_tag.color, borderColor: mostSavedDocs[1].folder_tag.color }">
                  {{ mostSavedDocs[1].folder_tag.name }}
                </span>
              </h3>
              <p class="card-preview">{{ getPreview(mostSavedDocs[1].content) }}</p>
              <div class="card-meta">
                <span class="card-author">{{ mostSavedDocs[1].display_name || 'Anonymous' }}</span>
                <span class="card-date">{{ formatDate(mostSavedDocs[1].published_at || mostSavedDocs[1].created_at) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Empty State for Public Library -->
    <div v-if="recentPublicDocs.length === 0 && mostSavedDocs.length === 0 && !loading" class="empty-state">
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
    const mostSavedDocs = ref([])
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
      // Strip HTML tags but preserve <br> as newlines
      const text = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim()
      // Split by newlines and get first 3 lines
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      return lines.slice(0, 3).join('\n') || 'No content available'
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
        // Fetch folder tag for each document (up to 3)
        const docsWithTags = await Promise.all(
          pubDocs.slice(0, 3).map(async (doc) => {
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

        // Load most saved documents (with folder tags)
        const mostSaved = await db.getMostSavedDocuments(2)
        // Fetch folder tag for each most saved document
        const mostSavedWithTags = await Promise.all(
          mostSaved.map(async (doc) => {
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
        mostSavedDocs.value = mostSavedWithTags
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
      mostSavedDocs,
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
  padding: 24px 32px;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--neo-bg);
}

/* Header */
.page-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.welcome h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--neo-text);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--neo-text-muted);
}

/* Main Grid Layout (fills remaining height) */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  flex: 1;
  min-height: 0; /* Allow grid to shrink */
}

/* Left Column (Scripture + Announcement) */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

/* Scripture of Today Section (fixed height) */
.scripture-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.scripture-card {
  background: var(--neo-bg);
  border-radius: var(--neo-radius);
  padding: 20px;
  border: none;
  box-shadow: var(--neo-raised);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.scripture-section {
  background: rgba(139, 115, 85, 0.08);
  border-radius: 20px;
  padding: 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.scripture-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.scripture-text {
  font-size: 13px;
  line-height: 1.6;
  color: #5a4a3a;
  font-style: italic;
  flex: 1;
  margin-bottom: 10px;
}

.scripture-reference {
  font-size: 11px;
  font-weight: 600;
  color: #8b7355;
  text-align: right;
  padding-top: 8px;
  border-top: 1px solid #e8e0d4;
}

/* Announcement Section (fills remaining space) */
.announcement-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 20px;
  padding: 16px;
}

.announcement-card {
  background: var(--neo-bg);
  border-radius: 20px;
  padding: 28px;
  border: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.announcement-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.announcement-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--neo-text);
  margin-bottom: 14px;
}

.announcement-text {
  font-size: 15px;
  line-height: 1.8;
  color: #666;
  flex: 1;
  overflow: auto;
}

.announcement-meta {
  margin-top: 18px;
  padding-top: 18px;
  border-top: none;
}

.announcement-date {
  font-size: 13px;
  color: #999;
}

/* Right Column (spans remaining space) */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

/* Half Sections (top and bottom) */
.half-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-radius: 20px;
  padding: 16px;
}

/* Recently Updated Section - soft green */
.recent-section {
  background: rgba(34, 197, 94, 0.08);
}

/* Most Saved Section - soft amber */
.most-saved-section {
  background: rgba(245, 158, 11, 0.08);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

/* Recently Updated Docs Container (60% + 5% gap + 35%) */
.recent-docs {
  display: grid;
  grid-template-columns: 60% 35%;
  gap: 5%;
  flex: 1;
  min-height: 0;
}

/* Most Saved Docs Container (35% + 5% gap + 60%) */
.saved-docs {
  display: grid;
  grid-template-columns: 35% 60%;
  gap: 5%;
  flex: 1;
  min-height: 0;
}

/* Preview Card Base (reduced padding) */
.preview-card {
  position: relative;
  background: var(--neo-bg);
  border-radius: var(--neo-radius);
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  border: none;
  box-shadow: var(--neo-raised);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--neo-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.preview-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--neo-raised-lg);
}

.preview-card:hover .card-accent {
  transform: scaleX(1);
}

/* Primary Recent Card (60% width) */
.card-recent-primary {
  min-height: 0;
}

.card-recent-primary .card-title {
  font-size: 18px;
  margin-bottom: 8px;
}

.card-recent-primary .card-preview {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  overflow: hidden;
}

/* Secondary Recent Card (35% width) */
.card-recent-secondary {
  min-height: 0;
}

.card-recent-secondary .card-title {
  font-size: 16px;
  margin-bottom: 6px;
}

.card-recent-secondary .card-preview {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  overflow: hidden;
}

/* Most Saved First Card (35% width) */
.card-saved-first {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #fafafa 0%, #f5f5f5 100%);
  min-height: 0;
}

.card-saved-first .card-title {
  font-size: 16px;
  margin-bottom: 6px;
}

.card-saved-first .card-preview {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  overflow: hidden;
}

.card-saved-first .card-accent {
  background: #c9a96e;
}

.card-saved-first:hover {
  background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%);
}

/* Most Saved Second Card (60% width) */
.card-saved-second {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #fafafa 0%, #f5f5f5 100%);
  min-height: 0;
}

.card-saved-second .card-title {
  font-size: 18px;
  margin-bottom: 8px;
}

.card-saved-second .card-preview {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  overflow: hidden;
}

.card-saved-second .card-accent {
  background: #c9a96e;
}

.card-saved-second:hover {
  background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%);
}

/* Card Badge */
.card-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 9px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid transparent;
}

.saved-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.06);
  color: #555;
}

/* Card Content */
.card-title {
  font-weight: 700;
  color: var(--neo-text);
  line-height: 1.3;
  padding-right: 70px;
  margin-bottom: 6px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-preview {
  color: #666;
  margin-bottom: 8px;
  overflow: hidden;
  white-space: pre-line;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #999;
  margin-top: auto;
  flex-shrink: 0;
}

.card-author {
  font-weight: 500;
  font-size: 13px;
}

.card-date {
  opacity: 0.8;
  font-size: 10px;
}

.card-tag-inline {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  background: #f0f0f0;
  border: 1px solid transparent;
  margin-left: 6px;
  vertical-align: middle;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: var(--neo-bg);
  border-radius: 20px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 20px;
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

.btn-primary {
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

.btn-primary:hover {
  background: var(--neo-accent);
}

/* Responsive — stack and scroll when the viewport is too small to fit the dashboard */
@media (max-width: 1100px), (max-height: 720px) {
  .home-page {
    flex: none;
    min-height: min(100%, auto);
    overflow: visible;
  }

  .main-grid {
    grid-template-columns: 1fr;
    flex: none;
  }

  .left-column {
    gap: 16px;
    height: auto;
  }

  .scripture-section {
    flex: 0 0 auto;
  }

  .scripture-card {
    min-height: 120px;
  }

  .announcement-section {
    flex: 0 0 auto;
  }

  .announcement-card {
    min-height: 160px;
  }

  .right-column {
    flex: none;
  }

  .half-section {
    flex: none;
    min-height: auto;
  }

  .recent-docs,
  .saved-docs {
    min-height: 200px;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 16px;
  }

  .welcome h1 {
    font-size: 22px;
  }

  .recent-docs {
    grid-template-columns: 1fr;
  }

  .saved-docs {
    grid-template-columns: 1fr;
  }

  .preview-card {
    padding: 16px;
  }
}
</style>
