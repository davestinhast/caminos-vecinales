import { useEffect, useRef, useState } from 'react'
import { AYUDA, VehIcon } from './art'
import Ruta from './Ruta'

const VEH = ['Auto', 'Camioneta', 'Combi', 'Micro', 'Bus', 'Camión chico', 'Camión grande', 'Semi tráiler', 'Tráiler']

const SESIONES = [
  { id: 's1', fecha: '2026-09-26', dia: 'Sáb', hora: '10:00 a 10:30 am', quien: 'Fabrizio y Néstor' },
  { id: 's2', fecha: '2026-09-29', dia: 'Mar', hora: '3:00 a 3:30 pm', quien: 'Alessandra y Alondra' },
  { id: 's3', fecha: '2026-10-01', dia: 'Jue', hora: '4:30 a 5:00 pm', quien: 'Gustavo' },
  { id: 's4', fecha: '2026-10-03', dia: 'Sáb', hora: '10:00 a 10:30 am', quien: 'Fabrizio y Néstor' },
  { id: 's5', fecha: '2026-10-06', dia: 'Mar', hora: '3:00 a 3:30 pm', quien: 'Alessandra y Alondra' },
  { id: 's6', fecha: '2026-10-08', dia: 'Jue', hora: '4:30 a 5:00 pm', quien: 'Gustavo' },
]
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const corta = (f: string) => {
  const [, m, d] = f.split('-')
  return `${+d} ${MES[+m - 1]}`
}
const sum = (a: number[] = []) => a.reduce((x, y) => x + y, 0)

type Datos = Record<string, number[]>
type Pend = Record<string, number> // "s1:0" -> cambios que aún no llegaron al servidor
const KEY = 'cv-servidor'
const KEYP = 'cv-pendiente'

const vacio = (): Datos => Object.fromEntries(SESIONES.map((x) => [x.id, VEH.map(() => 0)]))

function leer<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k)
    return v ? { ...def, ...JSON.parse(v) } : def
  } catch { return def }
}
function escribir(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* */ }
}

// valor mostrado = servidor + cambios pendientes (nunca menor que 0)
function mezclar(srv: Datos, pend: Pend): Datos {
  const out: Datos = {}
  for (const x of SESIONES) out[x.id] = VEH.map((_, k) => Math.max(0, (srv[x.id]?.[k] ?? 0) + (pend[`${x.id}:${k}`] ?? 0)))
  return out
}

const hoyStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [srv, setSrv] = useState<Datos>(() => ({ ...vacio(), ...leer<Datos>(KEY, {}) }))
  const [pend, setPend] = useState<Pend>(() => leer<Pend>(KEYP, {}))
  const [enLinea, setEnLinea] = useState(true)
  const srvRef = useRef(srv)
  const pendRef = useRef(pend)
  const enVuelo = useRef(false)
  const version = useRef(0)
  const datos = mezclar(srv, pend)
  const hoy = hoyStr()
  const [id, setId] = useState((SESIONES.find((x) => x.fecha >= hoy) ?? SESIONES[SESIONES.length - 1]).id)
  const [aviso, setAviso] = useState('')
  const [vista, setVista] = useState<'conteo' | 'ruta'>(location.hash === '#ruta' ? 'ruta' : 'conteo')

  const fijarSrv = (d: Datos) => { srvRef.current = d; setSrv(d); escribir(KEY, d) }
  const fijarPend = (p: Pend) => { pendRef.current = p; setPend(p); escribir(KEYP, p) }

  // envía los cambios pendientes al servidor (cada uno es un +1 o -1, así nadie pisa a nadie)
  const enviar = async () => {
    if (enVuelo.current) return
    enVuelo.current = true
    try {
      for (const [clave, delta] of Object.entries(pendRef.current)) {
        if (!delta) continue
        const [sesion, tipo] = clave.split(':')
        const r = await fetch('/api/conteo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sesion, tipo: +tipo, delta }) })
        if (!r.ok) throw new Error('fallo')
        const { valor } = (await r.json()) as { valor: number }
        const nuevo = { ...pendRef.current }
        nuevo[clave] = (nuevo[clave] ?? 0) - delta
        if (!nuevo[clave]) delete nuevo[clave]
        version.current++
        const s2 = { ...srvRef.current, [sesion]: (srvRef.current[sesion] ?? VEH.map(() => 0)).map((v, k) => (k === +tipo ? valor : v)) }
        fijarSrv(s2)
        fijarPend(nuevo)
      }
      setEnLinea(true)
    } catch {
      setEnLinea(false)
    } finally {
      enVuelo.current = false
    }
  }

  // pide el conteo al servidor cada 2 segundos (así se ve lo de los demás casi al instante)
  const traer = async () => {
    const v0 = version.current
    try {
      const r = await fetch('/api/conteo', { cache: 'no-store' })
      if (!r.ok) throw new Error('fallo')
      const d = (await r.json()) as Datos
      if (!enVuelo.current && v0 === version.current && !Object.keys(pendRef.current).length) fijarSrv({ ...vacio(), ...d })
      setEnLinea(true)
    } catch {
      setEnLinea(false)
    }
  }

  useEffect(() => {
    try { navigator.storage?.persist?.() } catch { /* */ }
    traer()
    enviar()
    const t = setInterval(() => { if (document.visibilityState === 'visible') { enviar(); traer() } }, 2000)
    const v = () => { if (document.visibilityState === 'visible') { enviar(); traer() } }
    document.addEventListener('visibilitychange', v)
    window.addEventListener('online', v)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); window.removeEventListener('online', v) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ses = SESIONES.find((x) => x.id === id)!
  const cur = datos[id] ?? VEH.map(() => 0)

  const cambiar = (i: number, d: number) => {
    if (d < 0 && cur[i] <= 0) return
    const clave = `${id}:${i}`
    const nuevo = { ...pendRef.current, [clave]: (pendRef.current[clave] ?? 0) + d }
    if (!nuevo[clave]) delete nuevo[clave]
    fijarPend(nuevo)
    if (d > 0) navigator.vibrate?.(15)
    enviar()
  }

  const resumen = () => {
    const linea = (arr: number[] = []) => VEH.map((v, k) => `${v}: ${arr[k] ?? 0}`).join('\n')
    const hechas = SESIONES.filter((x) => sum(datos[x.id]) > 0)
    const porTipo = VEH.map((_, k) => SESIONES.reduce((a, x) => a + (datos[x.id]?.[k] ?? 0), 0))
    const dias = hechas
      .map((x) => `${x.dia} ${corta(x.fecha)}, ${x.hora} (${x.quien})\n${linea(datos[x.id])}\nTotal del día: ${sum(datos[x.id])}`)
      .join('\n\n')
    return `CONTEO DE CARROS\n\n${dias}${hechas.length ? '\n\n' : ''}TOTAL DE TODOS LOS DÍAS\n${linea(porTipo)}\nTOTAL: ${sum(porTipo)}`
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(resumen())
      setAviso('Copiado. Pégalo en WhatsApp')
    } catch {
      setAviso('No se pudo copiar')
    }
    setTimeout(() => setAviso(''), 2500)
  }

  return (
    <div className="app">
      <header>
        <div className="tag">Camino vecinal</div>
        <h1>Conteo de carros</h1>
        <p>Toca <b>+1</b> cada vez que pase un carro. Todos ven lo mismo, en vivo.</p>
        <p className={enLinea ? 'est ok' : 'est mal'}>{enLinea ? 'En vivo' : 'Sin internet: se enviará al volver'}{Object.keys(pend).length ? ' (enviando…)' : ''}</p>
      </header>

      <div className="vistas" role="tablist">
        <button className={vista === 'conteo' ? 'on' : ''} onClick={() => setVista('conteo')}>Conteo</button>
        <button className={vista === 'ruta' ? 'on' : ''} onClick={() => setVista('ruta')}>Ruta</button>
      </div>

      {vista === 'ruta' ? (
        <Ruta />
      ) : (
        <>
      <nav className="sess" aria-label="Horarios">
        {SESIONES.map((x) => (
          <button key={x.id} className={x.id === id ? 'on' : ''} onClick={() => setId(x.id)}>
            <b>{x.dia} {corta(x.fecha)}</b>
            <span>{sum(datos[x.id])} carros{x.fecha === hoy ? ' (hoy)' : ''}</span>
          </button>
        ))}
      </nav>

      <div className="info">
        <b>{ses.dia} {corta(ses.fecha)}, {ses.hora}</b>
        <span>{ses.quien}</span>
      </div>

      <main className="big">
        {VEH.map((v, i) => (
          <div key={v} className="row">
            <span className="ic"><VehIcon i={i} /></span>
            <span className="nm">{v}<small>{AYUDA[i]}</small></span>
            <div className="ctrl">
              <button className="minus" onClick={() => cambiar(i, -1)} aria-label={`Quitar uno a ${v}`}>−1</button>
              <b className="n">{cur[i]}</b>
              <button className="plus" onClick={() => cambiar(i, 1)} aria-label={`Sumar uno a ${v}`}>+1</button>
            </div>
          </div>
        ))}
      </main>

      <footer className="bar">
        <div><span>Este día</span><b>{sum(cur)}</b></div>
        <div><span>Total</span><b>{SESIONES.reduce((a, s) => a + sum(datos[s.id]), 0)}</b></div>
        <button onClick={copiar}>Copiar</button>
      </footer>
        </>
      )}
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  )
}
