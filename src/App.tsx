import { useEffect, useState } from 'react'
import { VehIcon } from './art'

const VEH = ['Auto', 'Camioneta', 'Combi / Rural', 'Micro', 'Bus grande', 'Camión 2 ejes', 'Camión 3 ejes']

const SESIONES = [
  { id: 's1', fecha: '2026-09-26', dia: 'Sáb', hora: '10:00 – 10:30 pm', quien: 'Néstor y Fabricio' },
  { id: 's2', fecha: '2026-09-29', dia: 'Mar', hora: '3:00 – 3:30 pm', quien: 'Alessandra y Néstor' },
  { id: 's3', fecha: '2026-10-01', dia: 'Jue', hora: '4:30 – 5:00 pm', quien: 'Gustavo' },
  { id: 's4', fecha: '2026-10-03', dia: 'Sáb', hora: '10:00 – 10:30 pm', quien: 'Néstor y Fabricio' },
  { id: 's5', fecha: '2026-10-06', dia: 'Mar', hora: '3:00 – 3:30 pm', quien: 'Alessandra y Néstor' },
  { id: 's6', fecha: '2026-10-08', dia: 'Jue', hora: '4:30 – 5:00 pm', quien: 'Gustavo' },
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

function guardar(d: Datos) {
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
  }, [])

  const ses = SESIONES.find((x) => x.id === id)!
  const cur = datos[id] ?? VEH.map(() => 0)

  const cambiar = (i: number, d: number) => {
    const nuevo = { ...datos, [id]: cur.map((v, x) => (x === i ? Math.max(0, v + d) : v)) }
    setDatos(nuevo)
    guardar(nuevo)
    if (d > 0) navigator.vibrate?.(15)
  }

  const resumen = () =>
    'Conteo de carros\n' +
    SESIONES.map((s) => {
      const det = VEH.map((v, i) => (datos[s.id]?.[i] ? `${v} ${datos[s.id][i]}` : '')).filter(Boolean).join(', ')
      return `${s.dia} ${corta(s.fecha)} ${s.hora}: ${sum(datos[s.id])}${det ? ` (${det})` : ''}`
    }).join('\n') +
    `\nTOTAL: ${SESIONES.reduce((a, s) => a + sum(datos[s.id]), 0)}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(resumen())
      setAviso('Copiado. Pégalo en WhatsApp.')
    } catch {
      setAviso('No se pudo copiar')
    }
    setTimeout(() => setAviso(''), 2500)
  }

  return (
    <div className="app">
      <header>
        <h1>Conteo de carros</h1>
        <p>Toca <b>+1</b> por cada vehículo. Se guarda solo.</p>
      </header>

      <nav className="sess" aria-label="Horarios">
        {SESIONES.map((x) => (
          <button key={x.id} className={x.id === id ? 'on' : ''} onClick={() => setId(x.id)}>
            <b>{x.dia} {corta(x.fecha)}</b>
            <span>{sum(datos[x.id])} carros{x.fecha === hoy ? ' · HOY' : ''}</span>
          </button>
        ))}
      </nav>

      <div className="info">
        <b>{ses.dia} {corta(ses.fecha)} · {ses.hora}</b>
        <span>{ses.quien}</span>
      </div>

      <main className="big">
        {VEH.map((v, i) => (
          <div key={v} className="row">
            <span className="ic"><VehIcon i={i} /></span>
            <span className="nm">{v}</span>
            <button className="minus" onClick={() => cambiar(i, -1)} aria-label={`Quitar uno a ${v}`}>−1</button>
            <b className="n">{cur[i]}</b>
            <button className="plus" onClick={() => cambiar(i, 1)} aria-label={`Sumar uno a ${v}`}>+1</button>
          </div>
        ))}
      </main>

      <footer className="bar">
        <div><span>Este horario</span><b>{sum(cur)}</b></div>
        <div><span>Total 6 visitas</span><b>{SESIONES.reduce((a, s) => a + sum(datos[s.id]), 0)}</b></div>
        <button onClick={copiar}>Copiar resumen</button>
      </footer>
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  )
}
