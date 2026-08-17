const STORAGE = 's3m-multiview'
const MAX = 4

export function useMultiView() {
  const ids = useState<string[]>('multiview-ids', () => [])

  if (import.meta.client) {
    ids.value = readStoredJSON(STORAGE, ids.value)
  }

  watch(ids, (v) => {
    writeStoredJSON(STORAGE, v)
  }, { deep: true })

  function add(id: string) {
    if (ids.value.includes(id) || ids.value.length >= MAX) return
    ids.value = [...ids.value, id]
  }

  function remove(id: string) {
    ids.value = ids.value.filter(m => m !== id)
  }

  function toggle(id: string) {
    if (ids.value.includes(id)) {
      remove(id)
    } else {
      add(id)
    }
  }

  function clear() {
    ids.value = []
  }

  return {
    ids,
    add,
    remove,
    toggle,
    clear,
    max: MAX
  }
}
