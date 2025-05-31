import { cn } from '@/lib/utils'

describe('cn', () => {
  it('deve retornar classes concatenadas corretamente', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('a', false && 'b', 'c')).toBe('a c')
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('deve mesclar classes do tailwind corretamente', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4') // tailwind-merge mantém a última
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('deve lidar com valores vazios', () => {
    expect(cn()).toBe('')
    expect(cn('', null, undefined)).toBe('')
  })
})
