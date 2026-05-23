import { ref, computed } from 'vue'
import { supabase } from '../supabase'

const notifications = ref([])
const selectedNotification = ref(null)
const loading = ref(false)
const currentUserId = ref(null)

const SECTION_TYPES = ['notes', 'announcement', 'calendar']

function storageKey(userId) {
  return `the_vine_notification_seen_${userId}`
}

function loadSeenKeys(userId) {
  if (!userId) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return new Set(JSON.parse(raw || '[]'))
  } catch {
    return new Set()
  }
}

function persistSeenKeys(userId, keys) {
  if (!userId) return
  localStorage.setItem(storageKey(userId), JSON.stringify([...keys]))
}

function isAnnouncementFolder(folder) {
  if (!folder) return false
  return /announcement/i.test(String(folder).trim())
}

function stripHtmlPreview(content, maxLen = 200) {
  if (!content) return ''
  const text = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatEventRange(startAt, endAt, allDay) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (allDay) {
    const sameDay = start.toDateString() === end.toDateString()
    const fmt = (dt) => dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    return sameDay ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
  }
  const datePart = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeFmt = { hour: 'numeric', minute: '2-digit' }
  return `${datePart}, ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`
}

const unreadCount = computed(() =>
  notifications.value.filter((n) => !n.read).length
)

const notificationsBySection = computed(() => {
  const grouped = { notes: [], announcement: [], calendar: [] }
  for (const n of notifications.value) {
    if (grouped[n.type]) grouped[n.type].push(n)
  }
  return grouped
})

const isActionableCalendarInvite = (notification) =>
  notification?.subtype === 'invite'

function applySeenState(list, seenKeys) {
  return list.map((n) => ({
    ...n,
    read: isActionableCalendarInvite(n) ? false : seenKeys.has(n.key)
  }))
}

const markAsRead = (notification) => {
  if (!notification || !currentUserId.value) return
  if (isActionableCalendarInvite(notification)) return
  const seenKeys = loadSeenKeys(currentUserId.value)
  seenKeys.add(notification.key)
  persistSeenKeys(currentUserId.value, seenKeys)
  notifications.value = notifications.value.filter((n) => n.key !== notification.key)
}

const dismissCalendarInviteNotification = (notification) => {
  if (!notification || !currentUserId.value) return
  const seenKeys = loadSeenKeys(currentUserId.value)
  seenKeys.add(notification.key)
  persistSeenKeys(currentUserId.value, seenKeys)
  notifications.value = notifications.value.filter((n) => n.key !== notification.key)
}

const markAllAsRead = () => {
  if (!currentUserId.value) return
  const seenKeys = loadSeenKeys(currentUserId.value)
  const remaining = []
  for (const n of notifications.value) {
    if (isActionableCalendarInvite(n)) {
      remaining.push(n)
      continue
    }
    seenKeys.add(n.key)
  }
  persistSeenKeys(currentUserId.value, seenKeys)
  notifications.value = remaining
  if (
    selectedNotification.value &&
    !isActionableCalendarInvite(selectedNotification.value)
  ) {
    selectedNotification.value = null
  }
}

const openNotification = (notification) => {
  selectedNotification.value = notification
  if (!isActionableCalendarInvite(notification)) {
    markAsRead(notification)
  }
}

const closeNotificationDetail = () => {
  selectedNotification.value = null
}

const acceptCalendarInvite = async (notification, { acceptMemberInvite } = {}) => {
  const memberId = notification?.payload?.memberId
  if (!memberId || !acceptMemberInvite) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return false

  try {
    await acceptMemberInvite(memberId, user.id, user.email)
  } catch (err) {
    console.error('Accept invite failed:', err)
    return false
  }

  dismissCalendarInviteNotification(notification)
  closeNotificationDetail()
  return notification?.payload?.tagId || true
}

const acceptEventInvite = async (notification, { acceptEventInvite: acceptFn } = {}) => {
  const eventId = notification?.payload?.eventId
  if (!eventId || !acceptFn) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return false

  try {
    await acceptFn(eventId, user.id, user.email)
  } catch (err) {
    console.error('Accept event invite failed:', err)
    return false
  }

  markAsRead(notification)
  closeNotificationDetail()
  notifications.value = notifications.value.filter((n) => n.key !== notification.key)
  return notification?.payload?.tagId || true
}

const rejectEventInvite = async (notification, { rejectEventInvite: rejectFn } = {}) => {
  const eventId = notification?.payload?.eventId
  if (!eventId || !rejectFn) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return false

  try {
    await rejectFn(eventId, user.id, user.email)
  } catch (err) {
    console.error('Reject event invite failed:', err)
    return false
  }

  dismissCalendarInviteNotification(notification)
  closeNotificationDetail()
  return true
}

const rejectCalendarInvite = async (notification, { rejectMemberInvite } = {}) => {
  const memberId = notification?.payload?.memberId
  if (!memberId || !rejectMemberInvite) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return false

  try {
    await rejectMemberInvite(memberId, user.id, user.email)
  } catch (err) {
    console.error('Reject invite failed:', err)
    return false
  }

  markAsRead(notification)
  closeNotificationDetail()
  notifications.value = notifications.value.filter((n) => n.key !== notification.key)
  return true
}

async function fetchPublicDocNotifications(userId, seenKeys) {
  const { data: docs, error } = await supabase
    .from('public_documents')
    .select('id, title, content, display_name, user_email, user_id, folder, published_at, created_at')
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Notification docs fetch failed:', error)
    return []
  }

  const items = []
  for (const doc of docs || []) {
    const isAnnouncement = isAnnouncementFolder(doc.folder)
    const type = isAnnouncement ? 'announcement' : 'notes'
    const key = `${type}:${doc.id}`
    if (seenKeys.has(key)) continue

    const at = doc.published_at || doc.created_at
    items.push({
      id: key,
      key,
      type,
      subtype: 'upload',
      title: isAnnouncement
        ? `New announcement: "${doc.title}"`
        : `New note published: "${doc.title}"`,
      time: formatRelativeTime(at),
      timestamp: at,
      read: false,
      payload: {
        docId: doc.id,
        author: doc.display_name || doc.user_email || 'Anonymous',
        preview: stripHtmlPreview(doc.content),
        publishedAt: at,
        folder: doc.folder
      }
    })
  }
  return items
}

async function fetchMemberRemovalNotifications(userId, userEmail, seenKeys) {
  const email = (userEmail || '').trim().toLowerCase()
  const items = []

  try {
    const { data: rows, error } = await supabase
      .from('calendar_member_removals')
      .select('id, tag_id, calendar_name, removed_by_email, created_at')
      .or(`user_id.eq.${userId},user_email.ilike.${email}`)
      .order('created_at', { ascending: false })
      .limit(40)

    if (error) {
      if (error.code === '42P01') return []
      console.error('Notification calendar removals failed:', error)
      return []
    }

    for (const row of rows || []) {
      const key = `calendar-removed:${row.id}`
      if (seenKeys.has(key)) continue
      items.push({
        id: key,
        key,
        type: 'calendar',
        subtype: 'member_removed',
        title: `Removed from calendar: ${row.calendar_name}`,
        time: formatRelativeTime(row.created_at),
        timestamp: row.created_at,
        read: false,
        payload: {
          tagId: row.tag_id,
          calendarName: row.calendar_name,
          removedBy: row.removed_by_email || 'The calendar owner'
        }
      })
    }
  } catch (err) {
    console.warn('Member removal notifications skipped:', err)
  }

  return items
}

async function fetchCalendarNotifications(userId, userEmail, seenKeys) {
  const email = (userEmail || '').trim().toLowerCase()
  const items = []

  items.push(...await fetchMemberRemovalNotifications(userId, userEmail, seenKeys))

  let memberQuery = supabase
    .from('calendar_tag_members')
    .select('id, tag_id, role, invite_status, created_at, calendar_tags(id, name, color, owner_id, owner_email)')
    .or(`user_id.eq.${userId},user_email.ilike.${email}`)

  const { data: memberships, error: memberErr } = await memberQuery
  if (memberErr) {
    console.error('Notification calendar members failed:', memberErr)
    return []
  }

  for (const row of memberships || []) {
    const tag = row.calendar_tags
    const isOwner = tag ? tag.owner_id === userId : false
    const status = row.invite_status || 'accepted'

    if (!isOwner && status === 'pending') {
      const key = `calendar-invite:${row.id}`
      const calendarName = tag?.name || 'Shared calendar'
      items.push({
        id: key,
        key,
        type: 'calendar',
        subtype: 'invite',
        title: `Calendar invite: ${calendarName}`,
        time: formatRelativeTime(row.created_at),
        timestamp: row.created_at,
        read: false,
        requiresAction: true,
        payload: {
          memberId: row.id,
          tagId: row.tag_id,
          calendarName,
          calendarColor: tag?.color,
          inviterEmail: tag?.owner_email || 'Someone',
          role: row.role
        }
      })
      continue
    }

    if (status === 'rejected' && !isOwner) continue
    if (status !== 'accepted' && !isOwner) continue
  }

  const acceptedTagIds = (memberships || [])
    .filter((m) => {
      const tag = m.calendar_tags
      if (!tag) return false
      if (tag.owner_id === userId) return true
      return (m.invite_status || 'accepted') === 'accepted'
    })
    .map((m) => m.tag_id)

  if (!acceptedTagIds.length) return items

  const pendingEventKeys = new Set()

  try {
    const { data: pendingRows, error: pendingErr } = await supabase
      .from('calendar_event_responses')
      .select(`
        id,
        event_id,
        response_status,
        created_at,
        calendar_events (
          id,
          title,
          description,
          start_at,
          end_at,
          all_day,
          tag_id,
          created_by,
          creator_email,
          creator_name,
          calendar_tags ( name, color )
        )
      `)
      .eq('response_status', 'pending')
      .or(`user_id.eq.${userId},user_email.ilike.${email}`)

    if (!pendingErr) {
      for (const row of pendingRows || []) {
        const ev = row.calendar_events
        if (!ev || !acceptedTagIds.includes(ev.tag_id)) continue
        if (ev.created_by === userId) continue

        const key = `calendar-event-invite:${row.id}`
        pendingEventKeys.add(ev.id)
        if (seenKeys.has(key)) continue

        const tagName = ev.calendar_tags?.name || 'Calendar'
        items.push({
          id: key,
          key,
          type: 'calendar',
          subtype: 'event_invite',
          title: `New event: ${ev.title}`,
          time: formatRelativeTime(row.created_at),
          timestamp: row.created_at,
          read: false,
          payload: {
            responseId: row.id,
            eventId: ev.id,
            tagId: ev.tag_id,
            calendarName: tagName,
            calendarColor: ev.calendar_tags?.color,
            organizer: ev.creator_name || ev.creator_email || 'Someone',
            description: ev.description || '',
            when: formatEventRange(ev.start_at, ev.end_at, ev.all_day)
          }
        })
      }
    } else if (pendingErr.code !== '42P01') {
      console.error('Notification event invites failed:', pendingErr)
    }
  } catch (err) {
    console.warn('Event invite notifications skipped:', err)
  }

  const { data: events, error: evErr } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_at, end_at, all_day, created_at, updated_at, created_by, tag_id, calendar_tags(name, color)')
    .in('tag_id', acceptedTagIds)
    .order('updated_at', { ascending: false })
    .limit(80)

  if (evErr) {
    console.error('Notification calendar events failed:', evErr)
    return items
  }

  for (const ev of events || []) {
    if (pendingEventKeys.has(ev.id) && ev.created_by !== userId) continue

    const created = new Date(ev.created_at).getTime()
    const updated = new Date(ev.updated_at).getTime()
    const isUpdate = updated - created > 2000

    const subKey = isUpdate ? `updated:${ev.updated_at}` : 'created'
    const key = `calendar-event:${ev.id}:${subKey}`
    if (seenKeys.has(key)) continue

    const tagName = ev.calendar_tags?.name || 'Calendar'
    items.push({
      id: key,
      key,
      type: 'calendar',
      subtype: isUpdate ? 'event_updated' : 'event_created',
      title: isUpdate
        ? `Event updated: ${ev.title}`
        : `New event: ${ev.title}`,
      time: formatRelativeTime(isUpdate ? ev.updated_at : ev.created_at),
      timestamp: isUpdate ? ev.updated_at : ev.created_at,
      read: false,
      payload: {
        eventId: ev.id,
        tagId: ev.tag_id,
        calendarName: tagName,
        description: ev.description || '',
        when: formatEventRange(ev.start_at, ev.end_at, ev.all_day),
        isOwnEvent: ev.created_by === userId
      }
    })
  }

  return items
}

const syncNotifications = async (userId, userEmail) => {
  if (!userId) {
    notifications.value = []
    currentUserId.value = null
    return
  }

  currentUserId.value = userId
  loading.value = true

  try {
    const seenKeys = loadSeenKeys(userId)
    const [docItems, calendarItems] = await Promise.all([
      fetchPublicDocNotifications(userId, seenKeys),
      fetchCalendarNotifications(userId, userEmail, seenKeys)
    ])

    const merged = [...docItems, ...calendarItems].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )

    for (const n of merged) {
      if (isActionableCalendarInvite(n)) {
        seenKeys.delete(n.key)
      }
    }
    persistSeenKeys(userId, seenKeys)

    notifications.value = applySeenState(merged, seenKeys)
  } catch (err) {
    console.error('syncNotifications failed:', err)
  } finally {
    loading.value = false
  }
}

const clearNotificationsState = () => {
  notifications.value = []
  selectedNotification.value = null
  currentUserId.value = null
}

export function useNotifications() {
  return {
    notifications,
    notificationsBySection,
    selectedNotification,
    loading,
    unreadCount,
    SECTION_TYPES,
    syncNotifications,
    clearNotificationsState,
    markAllAsRead,
    markAsRead,
    openNotification,
    closeNotificationDetail,
    acceptCalendarInvite,
    rejectCalendarInvite,
    acceptEventInvite,
    rejectEventInvite
  }
}
