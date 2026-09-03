import { supabase } from '../../../lib/supabase'

export async function fetchRecentLogs({ severity, source, limit = 200 } = {}) {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (severity) query = query.eq('severity', severity)
  if (source) query = query.eq('source', source)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchLogCounts() {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const [{ count: errorsToday }, { count: actionsToday }, { count: totalLogs }] = await Promise.all([
    supabase.from('activity_logs').select('id', { count: 'exact', head: true })
      .eq('severity', 'error').gte('created_at', since.toISOString()),
    supabase.from('activity_logs').select('id', { count: 'exact', head: true })
      .gte('created_at', since.toISOString()),
    supabase.from('activity_logs').select('id', { count: 'exact', head: true }),
  ])

  return { errorsToday: errorsToday || 0, actionsToday: actionsToday || 0, totalLogs: totalLogs || 0 }
}

/** Live feed — new rows stream in as they're written, anywhere on the site. */
export function subscribeToLogs(onInsert) {
  const channel = supabase
    .channel('activity-logs-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
      onInsert(payload.new)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
