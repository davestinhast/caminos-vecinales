import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const CLAVE = 'ruta-puntos'

function redis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Falta configurar la base de datos')
  return new Redis({ url, token })
}

const ok = (p: unknown): p is [number, number][] =>
  Array.isArray(p) &&
  p.length <= 25 &&
  p.every((x) => Array.isArray(x) && x.length === 2 && x.every((n) => typeof n === 'number' && Number.isFinite(n)) && x[0] > -19 && x[0] < 0 && x[1] > -82 && x[1] < -68)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const db = redis()
    if (req.method === 'GET') {
      const p = await db.get<[number, number][]>(CLAVE)
      const otra = (await db.get<boolean>(CLAVE + '-otra')) ?? false
      return res.status(200).json({ puntos: p ?? null, otra })
    }
    if (req.method === 'POST') {
      const { puntos, otra } = req.body ?? {}
      if (!ok(puntos)) return res.status(400).json({ error: 'puntos inválidos' })
      await db.set(CLAVE, puntos)
      await db.set(CLAVE + '-otra', otra === true)
      return res.status(200).json({ puntos, otra: otra === true })
    }
    return res.status(405).json({ error: 'método no permitido' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
