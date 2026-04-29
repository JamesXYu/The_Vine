<template>
  <div class="docuflow">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <span class="logo-text">{{ placeholders.appName }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-btn active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          {{ placeholders.navAllDocs }}
        </button>
        <button class="nav-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ placeholders.navRecent }}
        </button>
        <button class="nav-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {{ placeholders.navShared }}
        </button>
        <button class="nav-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {{ placeholders.navAdmin }}
        </button>
        <button class="nav-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {{ placeholders.navSettings }}
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar"></div>
          <div class="user-info">
            <div class="user-name">{{ placeholders.userName }}</div>
            <div class="user-role">{{ placeholders.userRole }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="page-title">
          <button class="menu-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span>{{ placeholders.pageTitle }}</span>
        </div>
        <div class="top-bar-right">
          <div class="search-box">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" :placeholder="placeholders.searchPlaceholder" />
          </div>
          <div class="user-avatar-small"></div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <span class="hero-badge">{{ placeholders.heroBadge }}</span>
          <h1 class="hero-title">{{ placeholders.heroTitle }}</h1>
          <p class="hero-description">{{ placeholders.heroDescription }}</p>
          <button class="hero-cta">
            {{ placeholders.heroCta }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
        <div class="hero-image">
          <div class="hero-image-placeholder">
            {{ placeholders.heroImageText }}
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Main Card -->
        <div class="main-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <button class="favorite-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          <h2 class="card-title">{{ placeholders.mainCardTitle }}</h2>
          <p class="card-description">{{ placeholders.mainCardDescription }}</p>
          <div class="card-tags">
            <span class="tag">{{ placeholders.tag1 }}</span>
            <span class="tag">{{ placeholders.tag2 }}</span>
          </div>
          <div class="card-footer">
            <span class="card-time">{{ placeholders.cardTime }}</span>
            <button class="external-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Small Cards -->
        <div class="small-cards">
          <div class="small-card">
            <div class="small-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 class="small-card-title">{{ placeholders.smallCard1Title }}</h3>
            <p class="small-card-desc">{{ placeholders.smallCard1Desc }}</p>
            <div class="small-card-meta">
              <span>{{ placeholders.smallCard1Size }}</span>
              <span class="file-type">{{ placeholders.smallCard1Type }}</span>
            </div>
          </div>

          <div class="small-card">
            <div class="small-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3 class="small-card-title">{{ placeholders.smallCard2Title }}</h3>
            <p class="small-card-desc">{{ placeholders.smallCard2Desc }}</p>
            <div class="small-card-meta">
              <span>{{ placeholders.smallCard2Size }}</span>
              <span class="file-type">{{ placeholders.smallCard2Type }}</span>
            </div>
          </div>

          <div class="small-card">
            <div class="small-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 class="small-card-title">{{ placeholders.smallCard3Title }}</h3>
            <p class="small-card-desc">{{ placeholders.smallCard3Desc }}</p>
            <div class="small-card-meta">
              <span>{{ placeholders.smallCard3Size }}</span>
              <span class="file-type">{{ placeholders.smallCard3Type }}</span>
            </div>
          </div>

          <div class="small-card">
            <div class="small-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 class="small-card-title">{{ placeholders.smallCard4Title }}</h3>
            <p class="small-card-desc">{{ placeholders.smallCard4Desc }}</p>
            <div class="small-card-meta">
              <span>{{ placeholders.smallCard4Size }}</span>
              <span class="file-type">{{ placeholders.smallCard4Type }}</span>
            </div>
          </div>
        </div>

        <!-- Metrics Card -->
        <div class="metrics-card">
          <h3 class="metrics-title">{{ placeholders.metricsTitle }}</h3>
          <p class="metrics-desc">{{ placeholders.metricsDesc }}</p>
          <div class="metrics-chart">
            <div class="metric-circle">
              <span class="metric-value">{{ placeholders.metricValue }}</span>
              <span class="metric-label">{{ placeholders.metricLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FAB -->
      <button class="fab">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </main>
  </div>
</template>

<script>
export default {
  name: 'HomeScreen',
  data() {
    return {
      placeholders: {
        // App
        appName: 'DocuFlow',
        
        // Navigation
        navAllDocs: 'All Documents',
        navRecent: 'Recent',
        navShared: 'Shared',
        navAdmin: 'Admin Console',
        navSettings: 'Settings',
        
        // User
        userName: 'User Name',
        userRole: 'System Administrator',
        
        // Top Bar
        pageTitle: 'Library',
        searchPlaceholder: 'Search archive...',
        
        // Hero
        heroBadge: 'Featured Insight',
        heroTitle: 'Title Text Here',
        heroDescription: 'Description text goes here. Add your content.',
        heroCta: 'Read Latest',
        heroImageText: 'Hero Image',
        
        // Main Card
        mainCardTitle: 'Main Card Title',
        mainCardDescription: 'Card description text goes here.',
        tag1: 'Tag 1',
        tag2: 'Tag 2',
        cardTime: 'Updated 2h ago',
        
        // Small Cards
        smallCard1Title: 'Card Title 1',
        smallCard1Desc: 'Card description text.',
        smallCard1Size: '12.4 MB',
        smallCard1Type: 'PDF',
        
        smallCard2Title: 'Card Title 2',
        smallCard2Desc: 'Card description text.',
        smallCard2Size: '1.1 MB',
        smallCard2Type: 'XLSX',
        
        smallCard3Title: 'Card Title 3',
        smallCard3Desc: 'Card description text.',
        smallCard3Size: '45 KB',
        smallCard3Type: 'DOCX',
        
        smallCard4Title: 'Card Title 4',
        smallCard4Desc: 'Card description text.',
        smallCard4Size: '22 MB',
        smallCard4Type: 'PDF',
        
        // Metrics
        metricsTitle: 'System Performance',
        metricsDesc: 'Metrics description text.',
        metricValue: '98%',
        metricLabel: 'Efficiency'
      }
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.docuflow {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.sidebar-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background-color: #1a1a1a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  border-radius: 10px;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: #f8f9fa;
  color: #1a1a1a;
}

.nav-btn.active {
  background-color: #1a1a1a;
  color: white;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.user-role {
  font-size: 12px;
  color: #6c757d;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
}

.top-bar-right {
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
  width: 280px;
  padding: 10px 16px 10px 40px;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  font-size: 14px;
  background-color: #fff;
  outline: none;
}

.search-box input::placeholder {
  color: #adb5bd;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #adb5bd;
}

.user-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Hero Section */
.hero-section {
  display: flex;
  background-color: #fff;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 24px;
  gap: 40px;
  align-items: center;
}

.hero-content {
  flex: 1;
}

.hero-badge {
  display: inline-block;
  padding: 6px 12px;
  background-color: #1a1a1a;
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  margin-bottom: 16px;
}

.hero-description {
  font-size: 15px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 400px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s;
}

.hero-cta:hover {
  background-color: #f8f9fa;
}

.hero-image {
  width: 400px;
  height: 280px;
}

.hero-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
}

/* Main Card */
.main-card {
  grid-row: span 2;
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-icon {
  width: 48px;
  height: 48px;
  background-color: #1a1a1a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.favorite-btn {
  background: none;
  border: none;
  color: #adb5bd;
  cursor: pointer;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.card-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tag {
  padding: 6px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.card-time {
  font-size: 12px;
  color: #adb5bd;
}

.external-link {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
}

/* Small Cards */
.small-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.small-card {
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
}

.small-card-icon {
  width: 40px;
  height: 40px;
  background-color: #f8f9fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  margin-bottom: 16px;
}

.small-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.small-card-desc {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 16px;
}

.small-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #adb5bd;
}

.file-type {
  padding: 4px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* Metrics Card */
.metrics-card {
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.metrics-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.metrics-desc {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 20px;
}

.metrics-chart {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.metric-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(#1a1a1a 98%, #e9ecef 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.metric-circle::before {
  content: '';
  position: absolute;
  width: 64px;
  height: 64px;
  background-color: #fff;
  border-radius: 50%;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  position: relative;
  z-index: 1;
}

.metric-label {
  font-size: 10px;
  color: #adb5bd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  background-color: #1a1a1a;
  border: none;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.fab:hover {
  transform: scale(1.05);
}
</style>
