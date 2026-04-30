<template>
  <div class="screen-container">
    <header class="header">
      <h1>Recent</h1>
      <p class="subtitle">Documents you've recently viewed or edited</p>
    </header>
    
    <div class="content-placeholder">
      <div class="placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <p>Recent documents will appear here</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecentScreen'
}
</script>

<style scoped>
.screen-container {
  padding: 24px 32px;
}

.header {
  margin-bottom: 32px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #6c757d;
}

.content-placeholder {
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  color: #adb5bd;
}

.placeholder-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder-icon svg {
  color: #1a1a1a;
}
</style>
