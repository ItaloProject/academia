/* eslint-disable @typescript-eslint/no-explicit-any */
const resolved: any = Promise.resolve({ data: null, error: null, count: 0 })

const chainable: any = new Proxy(resolved, {
  get(target: any, prop: any) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return target[prop].bind(target)
    }
    return () => chainable
  },
})

const mockClient: any = new Proxy(
  {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as any,
  {
    get(target: any, prop: any) {
      if (prop in target) return target[prop]
      return () => chainable
    },
  }
)

export function createMockClient() {
  return mockClient
}
