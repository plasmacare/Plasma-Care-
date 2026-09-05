import ReactDOM from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Checked here, BEFORE importing anything else, and deliberately using
// a dynamic import() below rather than a static one — a static
// `import App from './App'` gets evaluated before this file's own code
// runs, so by the time we could check anything, App's whole dependency
// chain (which includes the Supabase client) would already have thrown
// and left the page completely blank with nothing on screen, only a
// console error invisible on a phone with no devtools. Deferring the
// import lets us show a real, visible message instead.
const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

if (missingEnv) {
  root.render(
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif', color: '#5C6B7A' }}>
      <h1 style={{ color: '#0B2545', fontSize: 20 }}>Site configuration missing</h1>
      <p style={{ lineHeight: 1.5 }}>
        This deployment is missing its Supabase configuration
        (<code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>).
      </p>
      <p style={{ lineHeight: 1.5 }}>
        If you're the site owner: this build wasn't given those environment
        variables. Check your hosting/CI setup — see <code>.env.example</code> and
        the README for what's needed, then rebuild and redeploy.
      </p>
    </div>,
  )
} else {
  // Supabase invite/recovery links land here as
  // "#access_token=...&refresh_token=...&type=invite" — a hash that
  // looks nothing like our own routes (which always start "#/"). If we
  // let HashRouter see this first, it tries to route to a page called
  // "access_token=..." and the tokens are never picked up. So: catch it
  // here, establish the session manually, rewrite the URL to a clean
  // route, THEN mount the router.
  async function consumeAuthHashIfPresent() {
    const hash = window.location.hash
    if (!hash.startsWith('#access_token=')) return
    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const type = params.get('type')
    if (access_token && refresh_token) {
      const { supabase } = await import('./lib/supabase')
      await supabase.auth.setSession({ access_token, refresh_token })
      const dest = type === 'invite' || type === 'recovery' ? '#/portal/accept-invite' : '#/'
      window.history.replaceState(null, '', window.location.pathname + window.location.search + dest)
    }
  }

  consumeAuthHashIfPresent().finally(() => {
    import('./AppRoot').then(({ default: AppRoot }) => {
      root.render(<AppRoot />)
    })
  })
}
