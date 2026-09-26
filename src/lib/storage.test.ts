import { readTodos, writeTodos } from './storage'
import type { Todo } from '../types'

const KEY = 'hng15.todos.v1'

const sample: Todo = {
  id: 'a',
  title: 'Buy milk',
  completed: false,
  dueDate: null,
  createdAt: 1,
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('readTodos', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(readTodos()).toEqual([])
  })

  it('round-trips what writeTodos stored', () => {
    writeTodos([sample])
    expect(readTodos()).toEqual([sample])
  })

  it('keeps titles with markup characters verbatim', () => {
    const risky = { ...sample, title: '<img src=x onerror=alert(1)>' }
    writeTodos([risky])
    expect(readTodos()[0]?.title).toBe('<img src=x onerror=alert(1)>')
  })

  it('throws on malformed JSON so the caller can surface it', () => {
    window.localStorage.setItem(KEY, '{not json')
    expect(() => readTodos()).toThrow(SyntaxError)
  })

  it('throws when the payload is not an array', () => {
    window.localStorage.setItem(KEY, '{"todos":[]}')
    expect(() => readTodos()).toThrow(/array of todos/)
  })

  it('drops entries that do not match the Todo shape', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        sample,
        { id: 5 },
        null,
        'nope',
        { ...sample, id: 'b', title: 'ok', dueDate: '2030-01-01' },
        { ...sample, id: 'c', completed: 'yes' },
      ]),
    )
    expect(readTodos().map((todo) => todo.id)).toEqual(['a', 'b'])
  })
})

describe('writeTodos', () => {
  it('serialises the list under a single key', () => {
    writeTodos([sample])
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify([sample]))
  })

  it('propagates quota failures instead of hiding them', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => writeTodos([sample])).toThrow('QuotaExceededError')
    setItem.mockRestore()
  })
})
