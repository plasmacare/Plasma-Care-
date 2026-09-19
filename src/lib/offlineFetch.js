import { enqueue } from './offlineQueue'

const REST_PATH = '/rest/v1/'

function isMutation(method) {
  return method === 'POST' || method === 'PATCH' || method === 'DELETE'
}

async function headersToObject(headers) {
  const obj = {}
  if (!headers) return obj
  if (headers instanceof Headers) {
    headers.forEach((v, k) => { obj[k] = v })
  } else {
    Object.assign(obj, headers)
  }
  return obj
}

function wantsMinimal(headerObj) {
  const prefer = headerObj['prefer'] || headerObj['Prefer'] || ''
  return /return=minimal/i.test(prefer)
}

/** A response shaped enough like PostgREST's that supabase-js's error/data parsing doesn't choke, without ever having actually reached the server. */
function syntheticResponse(headerObj) {
  if (wantsMinimal(headerObj)) {
    return new Response(null, { status: 204 })
  }
  // Covers both plain .update()/.insert() (data unused) and the rarer
  // .select().single() case (expects exactly one row back).
  return new Response(JSON.stringify([{}]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Pass this as the `fetch` option when creating the Supabase client.
 * Reads/GETs are left completely alone (a service worker may cache
 * those separately — see vite.config.js). Only mutating requests to the
 * Supabase REST API are affected: if the network is down (or the
 * request outright fails to reach the server), the request is queued
 * instead of throwing, and replayed automatically once back online —
 * see offlineQueue.js. Anything else (auth calls, storage, a real 4xx/5xx
 * from a request that DID reach the server) is passed through untouched,
 * so genuine errors (bad input, permission denied) still surface normally.
 */
export async function offlineAwareFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url
  const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase()

  if (!url.includes(REST_PATH) || !isMutation(method)) {
    return fetch(input, init)
  }

  const headerObj = await headersToObject(init.headers || (typeof input === 'object' && input.headers))

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    enqueue({ url, method, headers: headerObj, body: init.body ?? null })
    return syntheticResponse(headerObj)
  }

  try {
    return await fetch(input, init)
  } catch (err) {
    // A thrown fetch (TypeError: Failed to fetch) means the request
    // never reached the server at all — that's "offline", not a real
    // API error, so queue it rather than surfacing a crash.
    enqueue({ url, method, headers: headerObj, body: init.body ?? null })
    return syntheticResponse(headerObj)
  }
}
