import { kv } from '@vercel/kv'

export const KEYS = {
  servicos:      'marc:servicos',
  orcamentos:    'marc:orcamentos',
  caixa:         'marc:caixa',
  compromissos:  'marc:compromissos',
}

export async function getList(key) {
  try {
    const data = await kv.get(key)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function setList(key, data) {
  await kv.set(key, data)
}
