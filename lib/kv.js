import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const KEYS = {
  servicos:     'marc:servicos',
  orcamentos:   'marc:orcamentos',
  caixa:        'marc:caixa',
  compromissos: 'marc:compromissos',
}

export async function getList(key) {
  try {
    const data = await redis.get(key)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function setList(key, data) {
  await redis.set(key, data)
}
