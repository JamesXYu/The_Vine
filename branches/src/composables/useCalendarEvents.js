import { ref } from 'vue'
import { supabase } from '../supabase'

const TAG_COLORS = [
  '#667eea', '#764ba2', '#e74c3c', '#27ae60',
  '#f39c12', '#3498db', '#9b59b6', '#1abc9c'
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toQalendarTime(iso, allDay) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  if (allDay) return `${y}-${m}-${day}`
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day} ${h}:${min}`
}

function slugifyTag(name) {
  return 'tag-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const INTERVAL_MS = 15 * 60 * 1000

export function snapTo15Minutes(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return d
  return new Date(Math.round(d.getTime() / INTERVAL_MS) * INTERVAL_MS)
}

export function formatQalendarDateTime(date) {
  const d = snapTo15Minutes(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function useCalendarEvents() {
  const loading = ref(false)
  const error = ref(null)
  const tags = ref([])
  const events = ref([])
  const members = ref([])

  const claimPendingMemberships = async (userId, userEmail) => {
    if (!userEmail) return
    await supabase
      .from('calendar_tag_members')
      .update({ user_id: userId })
      .ilike('user_email', userEmail.trim())
      .is('user_id', null)
  }

  const getTags = async (userId, userEmail) => {
    loading.value = true
    error.value = null
    try {
      await claimPendingMemberships(userId, userEmail)

      const { data: memberRows, error: memberErr } = await supabase
        .from('calendar_tag_members')
        .select('tag_id')
        .or(`user_id.eq.${userId},user_email.ilike.${userEmail}`)

      if (memberErr) throw memberErr

      const tagIds = [...new Set((memberRows || []).map(r => r.tag_id))]
      if (tagIds.length === 0) {
        tags.value = []
        return []
      }

      const { data, error: err } = await supabase
        .from('calendar_tags')
        .select('*')
        .in('id', tagIds)
        .order('name')

      if (err) throw err
      tags.value = data || []
      return tags.value
    } catch (err) {
      error.value = err.message
      console.error('Error fetching calendar tags:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createTag = async (userId, userEmail, name, color) => {
    const { data, error: err } = await supabase
      .from('calendar_tags')
      .insert({
        name: name.trim(),
        color: color || TAG_COLORS[tags.value.length % TAG_COLORS.length],
        owner_id: userId,
        owner_email: userEmail
      })
      .select()
      .single()

    if (err) throw err
    tags.value = [...tags.value, data].sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  const updateTag = async (tagId, updates) => {
    const { data, error: err } = await supabase
      .from('calendar_tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single()

    if (err) throw err
    const idx = tags.value.findIndex(t => t.id === tagId)
    if (idx >= 0) tags.value[idx] = data
    return data
  }

  const deleteTag = async (tagId) => {
    const { error: err } = await supabase
      .from('calendar_tags')
      .delete()
      .eq('id', tagId)

    if (err) throw err
    tags.value = tags.value.filter(t => t.id !== tagId)
    events.value = events.value.filter(e => e.tag_id !== tagId)
  }

  const getMembers = async (tagId) => {
    const { data, error: err } = await supabase
      .from('calendar_tag_members')
      .select('*')
      .eq('tag_id', tagId)
      .order('created_at')

    if (err) throw err
    members.value = data || []
    return members.value
  }

  const inviteMember = async (tagId, email, role = 'editor') => {
    const normalized = email.trim().toLowerCase()
    if (!normalized) throw new Error('Email is required')

    const { data, error: err } = await supabase
      .from('calendar_tag_members')
      .insert({
        tag_id: tagId,
        user_email: normalized,
        role,
        user_id: null
      })
      .select()
      .single()

    if (err) {
      if (err.code === '23505') {
        const { data: existing } = await supabase
          .from('calendar_tag_members')
          .select('*')
          .eq('tag_id', tagId)
          .eq('user_email', normalized)
          .single()
        return existing
      }
      throw err
    }
    return data
  }

  const removeMember = async (memberId) => {
    const { error: err } = await supabase
      .from('calendar_tag_members')
      .delete()
      .eq('id', memberId)

    if (err) throw err
    members.value = members.value.filter(m => m.id !== memberId)
  }

  const getEvents = async (tagIds) => {
    if (!tagIds?.length) {
      events.value = []
      return []
    }

    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('calendar_events')
        .select('*, calendar_tags(name, color)')
        .in('tag_id', tagIds)
        .order('start_at')

      if (err) throw err
      events.value = data || []
      return events.value
    } catch (err) {
      error.value = err.message
      console.error('Error fetching calendar events:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (userId, userEmail, displayName, event) => {
    const row = {
      tag_id: event.tagId,
      title: event.title.trim(),
      description: event.description || '',
      location: event.location || '',
      start_at: event.startAt,
      end_at: event.endAt,
      all_day: event.allDay || false,
      created_by: userId,
      creator_email: userEmail,
      creator_name: displayName || '',
      updated_at: new Date().toISOString()
    }

    const { data, error: err } = await supabase
      .from('calendar_events')
      .insert(row)
      .select('*, calendar_tags(name, color)')
      .single()

    if (err) throw err
    events.value = [...events.value, data]
    return data
  }

  const updateEvent = async (eventId, updates) => {
    const { data, error: err } = await supabase
      .from('calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('*, calendar_tags(name, color)')
      .single()

    if (err) throw err
    const idx = events.value.findIndex(e => e.id === eventId)
    if (idx >= 0) events.value[idx] = data
    return data
  }

  const deleteEvent = async (eventId) => {
    const { error: err } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (err) throw err
    events.value = events.value.filter(e => e.id !== eventId)
  }

  const toQalendarEvents = (dbEvents) => {
    return (dbEvents || []).map(ev => {
      const tag = ev.calendar_tags || tags.value.find(t => t.id === ev.tag_id)
      const scheme = slugifyTag(tag?.name || 'default')
      return {
        id: ev.id,
        title: ev.title,
        description: ev.description || '',
        location: ev.location || '',
        with: ev.creator_name || ev.creator_email || '',
        time: {
          start: toQalendarTime(ev.start_at, ev.all_day),
          end: toQalendarTime(ev.end_at, ev.all_day)
        },
        colorScheme: scheme,
        isEditable: true,
        topic: tag?.name || ''
      }
    })
  }

  const buildColorSchemes = (tagList) => {
    const schemes = {}
    for (const tag of tagList || []) {
      schemes[slugifyTag(tag.name)] = {
        color: '#fff',
        backgroundColor: tag.color || '#667eea'
      }
    }
    return schemes
  }

  const parseQalendarTime = (s) => {
    if (!s) return new Date()
    if (!s.includes(' ')) return new Date(s + 'T00:00:00')
    const [date, time] = s.split(' ')
    return new Date(`${date}T${time}:00`)
  }

  const fromQalendarDrag = (qEvent) => {
    const start = qEvent.time?.start || ''
    const end = qEvent.time?.end || start
    const allDay = !start.includes(' ')
    return {
      start_at: parseQalendarTime(start).toISOString(),
      end_at: parseQalendarTime(end).toISOString(),
      all_day: allDay
    }
  }

  const subscribeToEvents = (onChange) => {
    const channel = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => onChange()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  return {
    loading,
    error,
    tags,
    events,
    members,
    TAG_COLORS,
    getTags,
    createTag,
    updateTag,
    deleteTag,
    getMembers,
    inviteMember,
    removeMember,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    toQalendarEvents,
    buildColorSchemes,
    fromQalendarDrag,
    parseQalendarTime,
    snapTo15Minutes,
    formatQalendarDateTime,
    subscribeToEvents,
    slugifyTag
  }
}
