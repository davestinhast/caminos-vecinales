import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const SESIONES = ['s1', 's2', 's3', 's4', 's5', 's6']
const TIPOS = 18 // 9 tipos de vehículo x 2 sentidos (A y B)
const HASH = 'conteo-carros'

function redis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Falta configurar la base de datos')
  return new Redis({ url, token })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const db = redis()

    if (req.method === 'GET') {
      const h = (await db.hgetall<Record<string, number>>(HASH)) ?? {}
      const out: Record<string, number[]> = {}
      for (const s of SESIONES) out[s] = Array.from({ length: TIPOS }, (_, k) => Number(h[`${s}:${k}`] ?? 0))
      return res.status(200).json(out)
    }

    if (req.method === 'POST') {
      const { sesion, tipo, delta } = req.body ?? {}
      if (!SESIONES.includes(sesion) || !Number.isInteger(tipo) || tipo < 0 || tipo >= TIPOS || !Number.isInteger(delta) || Math.abs(delta) > 50) {
        return res.status(400).json({ error: 'datos inválidos' })
      }
      const campo = `${sesion}:${tipo}`
      let valor = await db.hincrby(HASH, campo, delta)
      if (valor < 0) valor = await db.hincrby(HASH, campo, -valor) // nunca bajar de 0
      return res.status(200).json({ valor })
    }

    return res.status(405).json({ error: 'método no permitido' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
