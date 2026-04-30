<template>
  <div class="screen-container">
    <header class="header">
      <h1>Shared</h1>
      <p class="subtitle">Documents shared with you or by you</p>
    </header>
    
    <div class="content-placeholder">
      <div class="placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <p>Shared documents will appear here</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SharedScreen'
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
