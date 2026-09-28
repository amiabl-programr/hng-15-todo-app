import type { Todo } from '../types'
import type { todoStore as TodoStore } from './todoStore'

type Store = typeof TodoStore

/**
 * The store is a module singleton that hydrates on import, so each test gets a
 * fresh instance built from whatever is in localStorage at that moment.
 */
async function freshStore(): Promise<Store> {
  jest.resetModules()
  return (await import('./todoStore')).todoStore
}

const seed = (todos: Todo[]) => {
  window.localStorage.setItem('hng15.todos.v1', JSON.stringify(todos))
}

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'a',
  title: 'Buy milk',
  notes: '',
  completed: false,
  dueDate: null,
  createdAt: 1,
  ...overrides,
})

beforeEach(() => {
  window.localStorage.clear()
})

describe('hydration', () => {
  it('starts empty when nothing is stored', async () => {
    const store = await freshStore()
    expect(store.getSnapshot().todos).toEqual([])
    expect(store.getSnapshot().error).toBeNull()
  })

  it('reads persisted todos', async () => {
    seed([todo(), todo({ id: 'b', title: 'Pay rent' })])
    const store = await freshStore()
    expect(store.getSnapshot().todos.map((entry) => entry.title)).toEqual([
      'Buy milk',
      'Pay rent',
    ])
  })

  it('surfaces corrupt data as an error instead of throwing', async () => {
    window.localStorage.setItem('hng15.todos.v1', '{not json')
    const store = await freshStore()
    expect(store.getSnapshot().todos).toEqual([])
    expect(store.getSnapshot().error).toMatch(/Could not load/)
  })
})

describe('addTodo', () => {
  it('appends an uncompleted todo with a unique id', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'first', dueDate: null })
    store.addTodo({ notes: '', title: 'second', dueDate: '2030-05-05' })

    const { todos } = store.getSnapshot()
    expect(todos).toHaveLength(2)
    expect(todos[0]?.title).toBe('first')
    expect(todos[0]?.completed).toBe(false)
    expect(todos[1]?.dueDate).toBe('2030-05-05')
    expect(todos[0]?.id).not.toBe(todos[1]?.id)
  })

  it('appends after existing todos rather than prepending', async () => {
    seed([todo()])
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'newest', dueDate: null })
    expect(store.getSnapshot().todos.map((entry) => entry.title)).toEqual([
      'Buy milk',
      'newest',
    ])
  })

  it('sanitizes the title before storing it', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: '  Buy\u200B   milk\u0000 ', dueDate: null })
    expect(store.getSnapshot().todos[0]?.title).toBe('Buy milk')
  })

  it('stores notes as an empty string when none are given', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'no notes', dueDate: null })
    expect(store.getSnapshot().todos[0]?.notes).toBe('')
  })

  it('keeps multi-line notes and their line breaks', async () => {
    const store = await freshStore()
    store.addTodo({ notes: 'first line\nsecond line', title: 'with notes', dueDate: null })
    expect(store.getSnapshot().todos[0]?.notes).toBe('first line\nsecond line')
  })

  it('sanitizes notes before storing them', async () => {
    const store = await freshStore()
    store.addTodo({
      notes: '  step  one\u200B \r\n\r\n\r\n step two  ',
      title: 'clean notes',
      dueDate: null,
    })
    expect(store.getSnapshot().todos[0]?.notes).toBe('step one\n\nstep two')
  })

  it('truncates an over-long title', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'x'.repeat(500), dueDate: null })
    expect([...(store.getSnapshot().todos[0]?.title ?? '')]).toHaveLength(120)
  })

  it('throws rather than storing a blank card', async () => {
    const store = await freshStore()
    expect(() => store.addTodo({ notes: '', title: '   \u200B ', dueDate: null })).toThrow(/empty/)
    expect(store.getSnapshot().todos).toEqual([])
  })

  it('persists the new todo', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'persisted', dueDate: null })
    const raw = window.localStorage.getItem('hng15.todos.v1')
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1)
  })
})

describe('updateTodo', () => {
  it('edits the title and due date but keeps id and createdAt', async () => {
    const store = await freshStore()
    store.addTodo({ notes: '', title: 'first', dueDate: null })
    const original = store.getSnapshot().todos[0]

    store.updateTodo(original?.id ?? '', { title: 'renamed', dueDate: '2031-01-01' })

    const updated = store.getSnapshot().todos[0]
    expect(updated?.title).toBe('renamed')
    expect(updated?.dueDate).toBe('2031-01-01')
    expect(updated?.id).toBe(original?.id)
    expect(updated?.createdAt).toBe(original?.createdAt)
  })

  it('leaves other fields untouched when only the title changes', async () => {
    seed([todo({ completed: true, dueDate: '2030-01-01' })])
    const store = await freshStore()
    store.updateTodo('a', { title: 'renamed' })

    const updated = store.getSnapshot().todos[0]
    expect(updated?.completed).toBe(true)
    expect(updated?.dueDate).toBe('2030-01-01')
  })

  it('sanitizes the new title', async () => {
    seed([todo()])
    const store = await freshStore()
    store.updateTodo('a', { title: '  spaced\u200B out  ' })
    expect(store.getSnapshot().todos[0]?.title).toBe('spaced out')
  })

  it('edits notes without touching the title', async () => {
    seed([todo()])
    const store = await freshStore()
    store.updateTodo('a', { notes: 'line one\nline two' })

    const updated = store.getSnapshot().todos[0]
    expect(updated?.notes).toBe('line one\nline two')
    expect(updated?.title).toBe('Buy milk')
  })

  it('sanitizes updated notes', async () => {
    seed([todo()])
    const store = await freshStore()
    store.updateTodo('a', { notes: 'a\u200B\r\n\r\n\r\nb' })
    expect(store.getSnapshot().todos[0]?.notes).toBe('a\n\nb')
  })

  it('can clear notes', async () => {
    seed([todo({ notes: 'existing' })])
    const store = await freshStore()
    store.updateTodo('a', { notes: '' })
    expect(store.getSnapshot().todos[0]?.notes).toBe('')
  })

  it('throws when the new title sanitizes to nothing', async () => {
    seed([todo()])
    const store = await freshStore()
    expect(() => store.updateTodo('a', { title: '\u200B' })).toThrow(/empty/)
  })

  it('ignores an unknown id', async () => {
    seed([todo()])
    const store = await freshStore()
    store.updateTodo('nope', { title: 'renamed' })
    expect(store.getSnapshot().todos[0]?.title).toBe('Buy milk')
  })
})

describe('toggleTodo', () => {
  it('flips completion both ways', async () => {
    seed([todo()])
    const store = await freshStore()

    store.toggleTodo('a')
    expect(store.getSnapshot().todos[0]?.completed).toBe(true)

    store.toggleTodo('a')
    expect(store.getSnapshot().todos[0]?.completed).toBe(false)
  })

  it('ignores an unknown id', async () => {
    seed([todo()])
    const store = await freshStore()
    store.toggleTodo('nope')
    expect(store.getSnapshot().todos[0]?.completed).toBe(false)
  })
})

describe('deleteTodo', () => {
  it('removes only the matching todo', async () => {
    seed([todo(), todo({ id: 'b', title: 'Pay rent' })])
    const store = await freshStore()
    store.deleteTodo('a')
    expect(store.getSnapshot().todos.map((entry) => entry.id)).toEqual(['b'])
  })

  it('is a no-op for an unknown id', async () => {
    seed([todo()])
    const store = await freshStore()
    const before = store.getSnapshot().todos
    store.deleteTodo('nope')
    expect(store.getSnapshot().todos).toBe(before)
  })
})

describe('clearCompleted', () => {
  it('removes only completed todos', async () => {
    seed([todo(), todo({ id: 'b', completed: true })])
    const store = await freshStore()
    store.clearCompleted()
    expect(store.getSnapshot().todos.map((entry) => entry.id)).toEqual(['a'])
  })

  it('does not rewrite state when nothing is completed', async () => {
    seed([todo()])
    const store = await freshStore()
    const before = store.getSnapshot().todos
    store.clearCompleted()
    expect(store.getSnapshot().todos).toBe(before)
  })
})

describe('reorderTodo', () => {
  it('moves the dragged card onto the target slot', async () => {
    seed([todo({ id: 'a', title: 'first' }), todo({ id: 'b', title: 'second' })])
    const store = await freshStore()

    store.reorderTodo('b', 'a')
    expect(store.getSnapshot().todos.map((entry) => entry.title)).toEqual(['second', 'first'])
  })

  it('moves a card backwards through the list', async () => {
    seed([
      todo({ id: 'a', title: 'first' }),
      todo({ id: 'b', title: 'second' }),
      todo({ id: 'c', title: 'third' }),
    ])
    const store = await freshStore()

    store.reorderTodo('c', 'a')
    expect(store.getSnapshot().todos.map((entry) => entry.title)).toEqual([
      'third',
      'first',
      'second',
    ])
  })

  it('is a no-op when the ids match or are unknown', async () => {
    seed([todo({ id: 'a' }), todo({ id: 'b' })])
    const store = await freshStore()
    const before = store.getSnapshot().todos

    store.reorderTodo('a', 'a')
    store.reorderTodo('missing', 'a')
    store.reorderTodo('a', 'missing')

    expect(store.getSnapshot().todos).toBe(before)
  })
})

describe('moveTodoBy', () => {
  const threeSeeded = () =>
    seed([
      todo({ id: 'a', title: 'first' }),
      todo({ id: 'b', title: 'second' }),
      todo({ id: 'c', title: 'third' }),
    ])

  it('shifts a card down one slot', async () => {
    threeSeeded()
    const store = await freshStore()
    store.moveTodoBy('a', 1)
    expect(store.getSnapshot().todos.map((entry) => entry.id)).toEqual(['b', 'a', 'c'])
  })

  it('shifts a card up one slot', async () => {
    threeSeeded()
    const store = await freshStore()
    store.moveTodoBy('c', -1)
    expect(store.getSnapshot().todos.map((entry) => entry.id)).toEqual(['a', 'c', 'b'])
  })

  it('clamps at the first slot', async () => {
    threeSeeded()
    const store = await freshStore()
    const before = store.getSnapshot().todos
    store.moveTodoBy('a', -1)
    expect(store.getSnapshot().todos).toBe(before)
  })

  it('clamps at the last slot', async () => {
    threeSeeded()
    const store = await freshStore()
    const before = store.getSnapshot().todos
    store.moveTodoBy('c', 1)
    expect(store.getSnapshot().todos).toBe(before)
  })

  it('ignores an unknown id', async () => {
    threeSeeded()
    const store = await freshStore()
    const before = store.getSnapshot().todos
    store.moveTodoBy('missing', 1)
    expect(store.getSnapshot().todos).toBe(before)
  })
})

describe('error reporting', () => {
  it('surfaces a failed write and keeps the change in memory', async () => {
    const store = await freshStore()
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    store.addTodo({ notes: '', title: 'will not persist', dueDate: null })

    const { todos, error } = store.getSnapshot()
    expect(todos).toHaveLength(1)
    expect(error).toMatch(/QuotaExceededError/)
  })

  it('clears the error on dismiss', async () => {
    window.localStorage.setItem('hng15.todos.v1', '{not json')
    const store = await freshStore()
    expect(store.getSnapshot().error).not.toBeNull()

    store.dismissError()
    expect(store.getSnapshot().error).toBeNull()
  })

  it('clears a previous error on the next successful write', async () => {
    window.localStorage.setItem('hng15.todos.v1', '{not json')
    const store = await freshStore()

    store.addTodo({ notes: '', title: 'now working', dueDate: null })
    expect(store.getSnapshot().error).toBeNull()
  })
})

describe('subscribe', () => {
  it('notifies subscribers on change', async () => {
    const store = await freshStore()
    const listener = jest.fn()
    store.subscribe(listener)

    store.addTodo({ notes: '', title: 'watched', dueDate: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops notifying after unsubscribe', async () => {
    const store = await freshStore()
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.addTodo({ notes: '', title: 'unwatched', dueDate: null })
    expect(listener).not.toHaveBeenCalled()
  })

  it('does not notify for a no-op', async () => {
    seed([todo()])
    const store = await freshStore()
    const listener = jest.fn()
    store.subscribe(listener)

    store.reorderTodo('a', 'a')
    expect(listener).not.toHaveBeenCalled()
  })
})
