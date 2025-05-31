import { supabase } from '../lib/supabase'

describe('supabase', () => {
  it('módulo existe', () => {
    expect(typeof supabase).toBe('object')
  })
})
