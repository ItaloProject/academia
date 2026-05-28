const noop = () => mockClient
const resolved = Promise.resolve({ data: null, error: null, count: 0 })

const mockClient: any = new Proxy(
  {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target]
      return () =>
        new Proxy(resolved, {
          get(t, p) {
            if (p === 'then' || p === 'catch' || p === 'finally') return t[p as keyof typeof t].bind(t)
            return () =>
              new Proxy(resolved, {
                get(t2, p2) {
                  if (p2 === 'then' || p2 === 'catch' || p2 === 'finally') return t2[p2 as keyof typeof t2].bind(t2)
                  return noop
                },
              })
          },
        })
    },
  }
)

export function createMockClient() {
  return mockClient
}
