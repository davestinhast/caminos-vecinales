import { useEffect, useState } from 'react'
import { AYUDA, VehIcon } from './art'

const VEH = ['Auto', 'Camioneta', 'Combi', 'Micro', 'Bus', 'Camión chico', 'Camión grande']

const SESIONES = [
  { id: 's1', fecha: '2026-09-26', dia: 'Sáb', hora: '10:00 a 10:30 pm', quien: 'Néstor y Fabrizio' },
  { id: 's2', fecha: '2026-09-29', dia: 'Mar', hora: '3:00 a 3:30 pm', quien: 'Alondra y Néstor' },
  { id: 's3', fecha: '2026-10-01', dia: 'Jue', hora: '4:30 a 5:00 pm', quien: 'Gustavo' },
  { id: 's4', fecha: '2026-10-03', dia: 'Sáb', hora: '10:00 a 10:30 pm', quien: 'Néstor y Fabrizio' },
  { id: 's5', fecha: '2026-10-06', dia: 'Mar', hora: '3:00 a 3:30 pm', quien: 'Alondra y Néstor' },
  { id: 's6', fecha: '2026-10-08', dia: 'Jue', hora: '4:30 a 5:00 pm', quien: 'Gustavo' },
]
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const corta = (f: string) => {
  const [, m, d] = f.split('-')
  return `${+d} ${MES[+m - 1]}`
}
const sum = (a: number[] = []) => a.reduce((x, y) => x + y, 0)

type Datos = Record<string, number[]>
const KEY = 'cv-conteo'

function leer(): Datos {
  for (const k of [KEY, KEY + '-respaldo']) {
    try {
      const v = localStorage.getItem(k)
      if (v) return JSON.parse(v)
    } catch { /* probar respaldo */ }
  }
  return {}
}

const total = (d: Datos) => Object.values(d).reduce((a, v) => a + sum(v), 0)

function idb(): Promise<IDBDatabase> {
  return new Promise((ok, mal) => {
    const q = indexedDB.open('cv-conteo-db', 1)
    q.onupgradeneeded = () => q.result.createObjectStore('k')
    q.onsuccess = () => ok(q.result)
    q.onerror = () => mal(q.error)
  })
}
async function idbGuardar(d: Datos) {
  try {
    const db = await idb()
    db.transaction('k', 'readwrite').objectStore('k').put(d, 'datos')
  } catch { /* */ }
}
async function idbLeer(): Promise<Datos | null> {
  try {
    const db = await idb()
    return await new Promise((ok) => {
      const q = db.transaction('k').objectStore('k').get('datos')
      q.onsuccess = () => ok((q.result as Datos) ?? null)
      q.onerror = () => ok(null)
    })
  } catch { return null }
}

function guardar(d: Datos) {
  idbGuardar(d)
  try {
    const s = JSON.stringify(d)
    localStorage.setItem(KEY + '-respaldo', localStorage.getItem(KEY) ?? s)
    localStorage.setItem(KEY, s)
  } catch { /* sin almacenamiento */ }
}

const hoyStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const [datos, setDatos] = useState<Datos>(leer)
  const hoy = hoyStr()
  const [id, setId] = useState((SESIONES.find((x) => x.fecha >= hoy) ?? SESIONES[SESIONES.length - 1]).id)
  const [aviso, setAviso] = useState('')
  useEffect(() => {
    try { navigator.storage?.persist?.() } catch { /* */ }
    // recuperar la copia de IndexedDB si tiene más conteo que la principal
    idbLeer().then((c) => {
      if (c && total(c) > total(leer())) { setDatos(c); guardar(c) }
    })
  }, [])

  const ses = SESIONES.find((x) => x.id === id)!
  const cur = datos[id] ?? VEH.map(() => 0)

  const cambiar = (i: number, d: number) => {
    const nuevo = { ...datos, [id]: cur.map((v, x) => (x === i ? Math.max(0, v + d) : v)) }
    setDatos(nuevo)
    guardar(nuevo)
    if (d > 0) navigator.vibrate?.(15)
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
        <p>Toca <b>+1</b> cada vez que pase un carro. Se guarda solo.</p>
      </header>

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
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  )
}
