import { ref } from 'vue'
import { supabase } from '../supabase'
import { useNotifications } from './useNotifications'
import { TAG_COLOR_VALUES } from '../constants/tagColorPalette'

const TAG_COLORS = TAG_COLOR_VALUES.slice(0, 8)

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

function parseQalendarDateTime(s) {
  if (!s) return new Date()
  if (!s.includes(' ')) return new Date(s + 'T00:00:00')
  const [date, time] = s.split(' ')
  return new Date(`${date}T${time}:00`)
}

/** Ensure timed events span at least 15 minutes for week grid display. */
export function enforceMinTimedDuration(startStr, endStr, minMinutes = 15) {
  if (!startStr?.includes(' ')) return { start: startStr, end: endStr }
  const start = parseQalendarDateTime(startStr)
  let end = parseQalendarDateTime(endStr)
  const minMs = minMinutes * 60 * 1000
  if (end.getTime() - start.getTime() < minMs) {
    end = new Date(start.getTime() + minMs)
  }
  return {
    start: startStr,
    end: formatQalendarDateTime(end)
  }
}

export function snapTo15Minutes(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return d
  return new Date(Math.round(d.getTime() / INTERVAL_MS) * INTERVAL_MS)
}

export function formatQalendarDateTime(date) {
  const d = snapTo15Minutes(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Escape user input for PostgREST ilike patterns (* is the % alias in filters). */
function escapeIlikePattern(input) {
  return String(input)
    .replace(/\\/g, '\\\\')
    .replace(/[%_*]/g, (c) => `\\${c}`)
}

function postgrestIlikeOr(columns, query) {
  const pattern = `*${escapeIlikePattern(query)}*`
  return columns.map((col) => `${col}.ilike.${pattern}`).join(',')
}

function userMatchesQuery(user, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  const name = (user.display_name || '').toLowerCase()
  const email = (user.email || '').toLowerCase()
  return name.includes(q) || email.includes(q)
}

/** Visual styles for RSVP state on calendar blocks */
export function memberInviteStatus(member) {
  const status = member?.invite_status
  if (status === 'pending' || status === 'accepted' || status === 'rejected') return status
  return 'accepted'
}

export function isPendingCalendarMember(member) {
  return memberInviteStatus(member) === 'pending'
}

function sortMembersForDisplay(rows) {
  return [...rows].sort((a, b) => {
    const rank = (m) => {
      if (m.role === 'owner') return 0
      if (isPendingCalendarMember(m)) return 2
      return 1
    }
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return (a.user_email || '').localeCompare(b.user_email || '')
  })
}

export function eventResponseStyle(baseColor) {
  return {
    '--event-accent': baseColor || '#667eea'
  }
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

function mergeUserResults(...lists) {
  const byKey = new Map()
  for (const list of lists) {
    for (const row of list || []) {
      const email = (row.email || row.user_email || '').trim().toLowerCase()
      const id = row.id || row.user_id
      if (!email && !id) continue
      const key = id || email
      if (byKey.has(key)) continue
      byKey.set(key, {
        id,
        email,
        display_name: (row.display_name || email.split('@')[0] || '').trim()
      })
    }
  }
  return [...byKey.values()]
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
      .or('invite_status.eq.accepted,invite_status.is.null')
  }

  const upsertUserProfile = async (userId, userEmail, displayName) => {
    if (!userId || !userEmail) return
    const email = userEmail.trim().toLowerCase()
    await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email,
        display_name: (displayName || email.split('@')[0] || '').trim(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
  }

  const searchUserProfiles = async (q, excludeUserId) => {
    let request = supabase
      .from('user_profiles')
      .select('id, email, display_name')
      .order('display_name')
      .limit(50)

    if (excludeUserId) request = request.neq('id', excludeUserId)
    if (q) request = request.or(postgrestIlikeOr(['display_name', 'email'], q))

    const { data, error: err } = await request
    if (err) {
      if (err.code === '42P01') return []
      throw err
    }
    return data || []
  }

  const searchPublicDocAuthors = async (q, excludeUserId) => {
    let request = supabase
      .from('public_documents')
      .select('user_id, user_email, display_name')
      .not('user_id', 'is', null)
      .limit(100)

    if (excludeUserId) request = request.neq('user_id', excludeUserId)
    if (q) request = request.or(postgrestIlikeOr(['display_name', 'user_email'], q))

    const { data, error: pubErr } = await request
    if (pubErr) return []

    const seen = new Set()
    const authors = []
    for (const row of data || []) {
      const email = (row.user_email || '').trim().toLowerCase()
      if (!email || seen.has(email)) continue
      seen.add(email)
      authors.push({
        id: row.user_id,
        email,
        display_name: (row.display_name || email.split('@')[0] || '').trim()
      })
    }
    return authors
  }

  const searchUsers = async (query, excludeUserId) => {
    const q = (query || '').trim()
    let profiles = []
    try {
      profiles = await searchUserProfiles(q, excludeUserId)
    } catch (err) {
      if (err?.code !== '42P01') console.warn('user_profiles search failed', err)
    }

    let authors = []
    try {
      authors = await searchPublicDocAuthors(q, excludeUserId)
    } catch (err) {
      console.warn('public_documents user search failed', err)
    }

    return mergeUserResults(profiles, authors)
      .filter((user) => userMatchesQuery(user, q))
      .sort((a, b) =>
        (a.display_name || a.email).localeCompare(b.display_name || b.email)
      )
      .slice(0, 50)
  }

  const getTags = async (userId, userEmail) => {
    loading.value = true
    error.value = null
    try {
      await claimPendingMemberships(userId, userEmail)

      const { data: memberRows, error: memberErr } = await supabase
        .from('calendar_tag_members')
        .select('tag_id, sort_order, role, invite_status')
        .or(`user_id.eq.${userId},user_email.ilike.${userEmail}`)

      if (memberErr) throw memberErr

      const activeRows = (memberRows || []).filter((row) => {
        const status = row.invite_status
        return !status || status === 'accepted'
      })

      const sortByTag = {}
      const roleByTag = {}
      for (const row of activeRows) {
        sortByTag[row.tag_id] = row.sort_order ?? 0
        roleByTag[row.tag_id] = row.role
      }

      const tagIds = [...new Set(activeRows.map(r => r.tag_id))]
      if (tagIds.length === 0) {
        tags.value = []
        return []
      }

      const { data, error: err } = await supabase
        .from('calendar_tags')
        .select('*')
        .in('id', tagIds)

      if (err) throw err
      tags.value = (data || []).map((tag) => ({
        ...tag,
        my_role: roleByTag[tag.id] || (tag.owner_id === userId ? 'owner' : null),
        is_shared: String(tag.owner_id) !== String(userId)
      })).sort((a, b) => {
        const orderA = sortByTag[a.id] ?? 0
        const orderB = sortByTag[b.id] ?? 0
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })
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
    const owned = {
      ...data,
      my_role: 'owner',
      is_shared: false
    }
    tags.value = [...tags.value, owned]
    return owned
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
    if (idx >= 0) {
      tags.value[idx] = {
        ...data,
        my_role: tags.value[idx].my_role,
        is_shared: tags.value[idx].is_shared
      }
    }
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
    members.value = sortMembersForDisplay(data || [])
    return members.value
  }

  const updateTagOrder = async (userId, userEmail, orderedTagIds) => {
    const updates = orderedTagIds.map((tagId, index) =>
      supabase
        .from('calendar_tag_members')
        .update({ sort_order: index })
        .eq('tag_id', tagId)
        .or(`user_id.eq.${userId},user_email.ilike.${userEmail}`)
    )
    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)
    if (failed?.error) throw failed.error

    const orderMap = Object.fromEntries(orderedTagIds.map((id, i) => [id, i]))
    tags.value = [...tags.value].sort((a, b) => {
      const orderA = orderMap[a.id] ?? 0
      const orderB = orderMap[b.id] ?? 0
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }

  const inviteMembers = async (tagId, emails, role = 'editor') => {
    const normalized = [...new Set(
      emails.map(e => e.trim().toLowerCase()).filter(Boolean)
    )]
    const results = []
    for (const email of normalized) {
      results.push(await inviteMember(tagId, email, role))
    }
    return results
  }

  const inviteMember = async (tagId, email, role = 'editor') => {
    const normalized = email.trim().toLowerCase()
    if (!normalized) throw new Error('Email is required')

    let payload = {
      tag_id: tagId,
      user_email: normalized,
      role,
      user_id: null,
      invite_status: 'pending'
    }

    let { data, error: err } = await supabase
      .from('calendar_tag_members')
      .insert(payload)
      .select()
      .single()

    if (err?.code === '42703' || /invite_status/i.test(err?.message || '')) {
      delete payload.invite_status
      ;({ data, error: err } = await supabase
        .from('calendar_tag_members')
        .insert(payload)
        .select()
        .single())
    }

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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { syncNotifications } = useNotifications()
        await syncNotifications(user.id, user.email)
      }
    } catch (syncErr) {
      console.warn('Notification sync after invite failed:', syncErr)
    }

    return data
  }

  const removeMember = async (memberId) => {
    const { data: memberRow, error: fetchErr } = await supabase
      .from('calendar_tag_members')
      .select('id, user_id, user_email, tag_id, role, calendar_tags(name)')
      .eq('id', memberId)
      .single()

    if (fetchErr) throw fetchErr

    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase
      .from('calendar_tag_members')
      .delete()
      .eq('id', memberId)

    if (err) throw err

    if (memberRow && user && memberRow.role !== 'owner') {
      const targetEmail = normalizeEmail(memberRow.user_email)
      const actorEmail = normalizeEmail(user.email)
      const isSelf =
        (memberRow.user_id && memberRow.user_id === user.id) ||
        (targetEmail && actorEmail && targetEmail === actorEmail)

      if (!isSelf) {
        try {
          const { error: noticeErr } = await supabase
            .from('calendar_member_removals')
            .insert({
              tag_id: memberRow.tag_id,
              user_id: memberRow.user_id || null,
              user_email: memberRow.user_email,
              calendar_name: memberRow.calendar_tags?.name || 'Calendar',
              removed_by_user_id: user.id,
              removed_by_email: user.email || null
            })
          if (noticeErr && noticeErr.code !== '42P01') {
            console.warn('Could not record calendar removal notice:', noticeErr)
          }
        } catch (noticeErr) {
          console.warn('Calendar removal notice skipped:', noticeErr)
        }
      }
    }

    members.value = members.value.filter(m => m.id !== memberId)

    if (user) {
      try {
        const { syncNotifications } = useNotifications()
        await syncNotifications(user.id, user.email)
      } catch (syncErr) {
        console.warn('Notification sync after member remove failed:', syncErr)
      }
    }
  }

  const acceptMemberInvite = async (memberId, userId, userEmail) => {
    if (!memberId || !userId) {
      throw new Error('Missing member or user')
    }

    const email = normalizeEmail(userEmail)
    let updateQuery = supabase
      .from('calendar_tag_members')
      .update({ invite_status: 'accepted', user_id: userId })
      .eq('id', memberId)

    if (email) {
      updateQuery = updateQuery.or(`user_id.eq.${userId},user_email.ilike.${email}`)
    } else {
      updateQuery = updateQuery.eq('user_id', userId)
    }

    let { data, error: err } = await updateQuery.select('tag_id').single()

    if (err?.code === '42703' || /invite_status/i.test(err?.message || '')) {
      let fallback = supabase
        .from('calendar_tag_members')
        .update({ user_id: userId })
        .eq('id', memberId)
      if (email) {
        fallback = fallback.or(`user_id.eq.${userId},user_email.ilike.${email}`)
      } else {
        fallback = fallback.eq('user_id', userId)
      }
      ({ data, error: err } = await fallback.select('tag_id').single())
    }

    if (err) throw err

    await getTags(userId, userEmail)
    return data?.tag_id || true
  }

  const rejectMemberInvite = async (memberId, userId, userEmail) => {
    if (!memberId) throw new Error('Missing member')

    const email = normalizeEmail(userEmail)
    let query = supabase
      .from('calendar_tag_members')
      .delete()
      .eq('id', memberId)

    if (userId && email) {
      query = query.or(`user_id.eq.${userId},user_email.ilike.${email}`)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.ilike('user_email', email)
    }

    const { error: err } = await query
    if (err) throw err

    if (userId && userEmail) {
      await getTags(userId, userEmail)
    }
    return true
  }

  const fetchResponsesForEvents = async (eventIds) => {
    if (!eventIds?.length) return []
    const { data, error: err } = await supabase
      .from('calendar_event_responses')
      .select('id, event_id, user_id, user_email, response_status, responded_at')
      .in('event_id', eventIds)

    if (err) {
      if (err.code === '42P01') return []
      throw err
    }
    return data || []
  }

  const attachMyResponseToEvents = (eventList, responseRows, userId, userEmail) => {
    const email = normalizeEmail(userEmail)
    const byEvent = new Map()
    for (const row of responseRows || []) {
      if (!byEvent.has(row.event_id)) byEvent.set(row.event_id, [])
      byEvent.get(row.event_id).push(row)
    }

    return (eventList || []).map((ev) => {
      const rows = byEvent.get(ev.id) || []
      const mine = rows.find((r) =>
        (userId && r.user_id === userId) ||
        normalizeEmail(r.user_email) === email
      )
      const memberCount = rows.length
      const needsRsvp = memberCount > 1
      return {
        ...ev,
        my_response_status: mine?.response_status || (needsRsvp ? null : 'accepted'),
        my_response_id: mine?.id || null,
        response_count: rows.length,
        accepted_count: rows.filter((r) => r.response_status === 'accepted').length,
        pending_count: rows.filter((r) => r.response_status === 'pending').length,
        rejected_count: rows.filter((r) => r.response_status === 'rejected').length
      }
    })
  }

  const getEvents = async (tagIds, userId = null, userEmail = '', { silent = false } = {}) => {
    if (!tagIds?.length) {
      events.value = []
      return []
    }

    if (!silent) loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('calendar_events')
        .select('*, calendar_tags(name, color)')
        .in('tag_id', tagIds)
        .order('start_at')

      if (err) throw err
      const list = data || []
      let withResponses = list
      try {
        const responseRows = await fetchResponsesForEvents(list.map((e) => e.id))
        withResponses = attachMyResponseToEvents(list, responseRows, userId, userEmail)
      } catch (respErr) {
        if (respErr?.code !== '42P01') console.warn('Event responses unavailable:', respErr)
      }
      events.value = withResponses
      return events.value
    } catch (err) {
      error.value = err.message
      console.error('Error fetching calendar events:', err)
      return []
    } finally {
      if (!silent) loading.value = false
    }
  }

  const seedEventResponses = async (eventId, tagId, creatorUserId, creatorEmail) => {
    const creatorNorm = normalizeEmail(creatorEmail)
    const { data: memberRows, error: memberErr } = await supabase
      .from('calendar_tag_members')
      .select('user_id, user_email, invite_status, role')
      .eq('tag_id', tagId)

    if (memberErr) throw memberErr

    const activeMembers = (memberRows || []).filter((m) => {
      const status = m.invite_status
      return !status || status === 'accepted'
    })

    if (activeMembers.length <= 1) return

    const rows = []
    const seen = new Set()
    for (const m of activeMembers) {
      const email = normalizeEmail(m.user_email)
      if (!email || seen.has(email)) continue
      seen.add(email)
      const isCreator =
        (creatorUserId && m.user_id === creatorUserId) ||
        email === creatorNorm
      rows.push({
        event_id: eventId,
        user_email: email,
        user_id: m.user_id || null,
        response_status: isCreator ? 'accepted' : 'pending',
        responded_at: isCreator ? new Date().toISOString() : null
      })
    }

    if (!rows.length) return

    const { error: insertErr } = await supabase
      .from('calendar_event_responses')
      .insert(rows)

    if (insertErr && insertErr.code !== '42P01') throw insertErr
  }

  const respondToEvent = async (eventId, userId, userEmail, status) => {
    const email = normalizeEmail(userEmail)
    if (!eventId || !email) throw new Error('Missing event or user')
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      throw new Error('Invalid response status')
    }

    const payload = {
      response_status: status,
      responded_at: status === 'pending' ? null : new Date().toISOString(),
      user_id: userId || null
    }

    let { data, error: err } = await supabase
      .from('calendar_event_responses')
      .update(payload)
      .eq('event_id', eventId)
      .ilike('user_email', email)
      .select()
      .single()

    if (err?.code === 'PGRST116') {
      ({ data, error: err } = await supabase
        .from('calendar_event_responses')
        .insert({
          event_id: eventId,
          user_email: email,
          user_id: userId || null,
          ...payload
        })
        .select()
        .single())
    }

    if (err) throw err

    const idx = events.value.findIndex((e) => e.id === eventId)
    if (idx >= 0) {
      events.value[idx] = {
        ...events.value[idx],
        my_response_status: status,
        my_response_id: data?.id || events.value[idx].my_response_id
      }
    }

    try {
      const { syncNotifications } = useNotifications()
      await syncNotifications(userId, userEmail)
    } catch (syncErr) {
      console.warn('Notification sync after RSVP failed:', syncErr)
    }

    return data
  }

  const acceptEventInvite = async (eventId, userId, userEmail) =>
    respondToEvent(eventId, userId, userEmail, 'accepted')

  const rejectEventInvite = async (eventId, userId, userEmail) =>
    respondToEvent(eventId, userId, userEmail, 'rejected')

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

    let created = {
      ...data,
      my_response_status: 'accepted',
      response_count: 1
    }
    try {
      await seedEventResponses(data.id, event.tagId, userId, userEmail)
      const responseRows = await fetchResponsesForEvents([data.id])
      ;[created] = attachMyResponseToEvents([data], responseRows, userId, userEmail)
    } catch (seedErr) {
      if (seedErr?.code !== '42P01') console.warn('Event response seed failed:', seedErr)
    }
    events.value = [...events.value, created]

    try {
      const { syncNotifications } = useNotifications()
      await syncNotifications(userId, userEmail)
    } catch (syncErr) {
      console.warn('Notification sync after event create failed:', syncErr)
    }

    return created
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
    if (idx >= 0) {
      const prev = events.value[idx]
      events.value = events.value.map((e, i) =>
        i === idx ? { ...prev, ...data } : e
      )
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { syncNotifications } = useNotifications()
        setTimeout(() => {
          syncNotifications(user.id, user.email).catch((syncErr) => {
            console.warn('Notification sync after event update failed:', syncErr)
          })
        }, 1500)
      }
    } catch (syncErr) {
      console.warn('Notification sync after event update failed:', syncErr)
    }

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

  const toQalendarEvents = (dbEvents, options = {}) => {
    const { userId = null } = options
    return (dbEvents || []).map(ev => {
      const tag = ev.calendar_tags || tags.value.find(t => t.id === ev.tag_id)
      const scheme = slugifyTag(tag?.name || 'default')
      const allDay = !!ev.all_day
      let start = toQalendarTime(ev.start_at, allDay)
      let end = toQalendarTime(ev.end_at, allDay)
      let originalTime = null
      if (!allDay) {
        originalTime = { start, end }
        const adjusted = enforceMinTimedDuration(start, end)
        start = adjusted.start
        end = adjusted.end
      }
      const isCreator = userId && ev.created_by === userId
      const responseStatus = isCreator
        ? 'accepted'
        : (ev.my_response_status || (ev.response_count > 1 ? 'pending' : 'accepted'))
      const tagColor = tag?.color || '#667eea'
      return {
        id: ev.id,
        title: ev.title,
        description: ev.description || '',
        location: ev.location || '',
        with: ev.creator_name || ev.creator_email || '',
        time: { start, end },
        originalTime,
        colorScheme: scheme,
        tagColor,
        responseStatus,
        isEditable: true,
        isCustom: allDay ? false : ['week'],
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

  const parseQalendarTime = parseQalendarDateTime

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
    upsertUserProfile,
    searchUsers,
    createTag,
    updateTag,
    deleteTag,
    updateTagOrder,
    getMembers,
    inviteMember,
    inviteMembers,
    removeMember,
    acceptMemberInvite,
    rejectMemberInvite,
    getEvents,
    seedEventResponses,
    respondToEvent,
    acceptEventInvite,
    rejectEventInvite,
    createEvent,
    updateEvent,
    deleteEvent,
    toQalendarEvents,
    eventResponseStyle,
    buildColorSchemes,
    fromQalendarDrag,
    parseQalendarTime,
    snapTo15Minutes,
    enforceMinTimedDuration,
    formatQalendarDateTime,
    subscribeToEvents,
    slugifyTag
  }
}
