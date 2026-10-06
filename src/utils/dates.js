// P6 wall times use UTC internally to avoid browser timezone shifts.
export function toTime(value) {
  if (value instanceof Date) return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes())
  if (!value) return null
  const text = String(value).trim().replace(/\s*[A*]\s*$/, '')
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?$/)
  let year, month, day, hour = 0, minute = 0
  if (match) {
    year = Number(match[1]); month = Number(match[2]); day = Number(match[3])
    hour = Number(match[4] || 0); minute = Number(match[5] || 0)
  } else {
    match = text.match(/^(\d{1,2})-([a-z]{3})-(\d{2}|\d{4})$/i)
    if (!match) return null
    day = Number(match[1])
    month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(match[2].toLowerCase()) + 1
    year = Number(match[3]) + (match[3].length === 2 ? 2000 : 0)
  }
  if (!month || hour > 23 || minute > 59) return null
  const time = Date.UTC(year, month - 1, day, hour, minute)
  const date = new Date(time)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null
}

export function dateText(value, short = false) {
  const time = typeof value === 'number' ? value : toTime(value)
  if (time === null || !Number.isFinite(time)) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', ...(short ? {} : { year: 'numeric' }) }).format(time)
}

export function inputDate(value) {
  const time = toTime(value)
  return time === null ? '' : new Date(time).toISOString().slice(0, 16)
}
