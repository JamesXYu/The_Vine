import { ref, onMounted, onUnmounted } from 'vue'

const MOBILE_QUERY = '(max-width: 768px)'

function readIsMobile() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(MOBILE_QUERY).matches
}

export function useIsMobile() {
  const isMobile = ref(readIsMobile())
  let mq = null

  const update = () => {
    isMobile.value = mq?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mq = window.matchMedia(MOBILE_QUERY)
    update()
    mq.addEventListener('change', update)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', update)
  })

  return { isMobile }
}
