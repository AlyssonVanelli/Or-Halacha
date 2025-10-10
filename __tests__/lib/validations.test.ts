import {
  loginSchema,
  signupSchema,
  bookSchema,
  chapterSchema,
  subscriptionSchema,
  bookPurchaseSchema,
} from '@/lib/validations'

describe('loginSchema', () => {
  it('valida login válido', () => {
    expect(() => loginSchema.parse({ email: 'a@a.com', password: '123456' })).not.toThrow()
  })
  it('rejeita email inválido', () => {
    expect(() => loginSchema.parse({ email: 'a', password: '123456' })).toThrow('Email inválido')
  })
  it('rejeita senha curta', () => {
    expect(() => loginSchema.parse({ email: 'a@a.com', password: '123' })).toThrow(
      'A senha deve ter no mínimo 6 caracteres'
    )
  })
})

describe('signupSchema', () => {
  it('valida cadastro válido', () => {
    expect(() =>
      signupSchema.parse({ name: 'João', email: 'a@a.com', password: 'Senha1' })
    ).not.toThrow()
  })
  it('rejeita nome curto', () => {
    expect(() => signupSchema.parse({ name: 'Jo', email: 'a@a.com', password: 'Senha1' })).toThrow(
      'O nome deve ter no mínimo 3 caracteres'
    )
  })
  it('rejeita senha sem maiúscula', () => {
    expect(() =>
      signupSchema.parse({ name: 'João', email: 'a@a.com', password: 'senha1' })
    ).toThrow('A senha deve conter pelo menos uma letra maiúscula')
  })
  it('rejeita senha sem número', () => {
    expect(() => signupSchema.parse({ name: 'João', email: 'a@a.com', password: 'Senha' })).toThrow(
      'A senha deve conter pelo menos um número'
    )
  })
})

describe('bookSchema', () => {
  it('valida livro válido', () => {
    expect(() =>
      bookSchema.parse({
        title: 'Livro',
        slug: 'livro',
        description: 'Descrição longa',
        author: 'Autor',
        is_published: true,
      })
    ).not.toThrow()
  })
  it('rejeita título curto', () => {
    expect(() =>
      bookSchema.parse({
        title: 'Li',
        slug: 'livro',
        description: 'Descrição longa',
        author: 'Autor',
        is_published: true,
      })
    ).toThrow('O título deve ter no mínimo 3 caracteres')
  })
})

describe('chapterSchema', () => {
  it('valida capítulo válido', () => {
    expect(() =>
      chapterSchema.parse({
        title: 'Capítulo',
        slug: 'capitulo',
        position: 1,
        content: 'Conteúdo longo',
        is_published: false,
      })
    ).not.toThrow()
  })
  it('rejeita posição inválida', () => {
    expect(() =>
      chapterSchema.parse({
        title: 'Capítulo',
        slug: 'capitulo',
        position: 0,
        content: 'Conteúdo longo',
        is_published: false,
      })
    ).toThrow('A posição deve ser maior que 0')
  })
})

describe('subscriptionSchema', () => {
  it('valida assinatura válida', () => {
    expect(() =>
      subscriptionSchema.parse({
        priceId: '1',
        userId: '2',
        successUrl: 'http://a.com',
        cancelUrl: 'http://b.com',
      })
    ).not.toThrow()
  })
  it('rejeita url inválida', () => {
    expect(() =>
      subscriptionSchema.parse({ priceId: '1', userId: '2', successUrl: 'a', cancelUrl: 'b' })
    ).toThrow('URL de sucesso inválida')
  })
})

describe('bookPurchaseSchema', () => {
  it('valida compra válida', () => {
    expect(() =>
      bookPurchaseSchema.parse({
        bookId: '1',
        userId: '2',
        priceId: '3',
        successUrl: 'http://a.com',
        cancelUrl: 'http://b.com',
      })
    ).not.toThrow()
  })
  it('rejeita falta de bookId', () => {
    expect(() =>
      bookPurchaseSchema.parse({
        bookId: '',
        userId: '2',
        priceId: '3',
        successUrl: 'http://a.com',
        cancelUrl: 'http://b.com',
      })
    ).toThrow('ID do livro é obrigatório')
  })
})
