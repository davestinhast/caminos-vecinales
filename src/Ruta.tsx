import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Punto = [number, number]
// Plaza Mayor de Nuevo Chimbote
const PLAZA: Punto = [-9.12219, -78.53114]
const KEY = 'cv-ruta2'

const km = (m: number) => (m / 1000).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const redondear = (p: Punto): Punto => [+p[0].toFixed(6), +p[1].toFixed(6)]

// Número cada "cuadra" a lo largo de la línea (por defecto cada 100 m)
function marcasCuadras(linea: Punto[], paso: number): Punto[] {
  const out: Punto[] = []
  let recorrido = 0
  let siguiente = paso
  for (let i = 1; i < linea.length; i++) {
    const a = L.latLng(linea[i - 1])
    const b = L.latLng(linea[i])
    const d = a.distanceTo(b)
    while (d > 0 && recorrido + d >= siguiente) {
      const f = (siguiente - recorrido) / d
      out.push([a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f])
      siguiente += paso
    }
    recorrido += d
  }
  return out
}

// Pega el punto a la calle más cercana para que no quede "flotando"
async function pegarACalle(p: Punto): Promise<Punto> {
  try {
    const r = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${p[1]},${p[0]}`)
    const j = await r.json()
    const loc = j.waypoints?.[0]?.location as number[] | undefined
    if (loc && L.latLng(p).distanceTo(L.latLng(loc[1], loc[0])) < 60) return redondear([loc[1], loc[0]])
  } catch { /* usar el punto tal cual */ }
  return redondear(p)
}

// Sigue las calles reales entre A y B
async function porCalles(a: Punto, b: Punto): Promise<{ linea: Punto[]; metros: number } | null> {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson&continue_straight=true`)
    const j = await r.json()
    const ruta = j.routes?.[0]
    if (!ruta) return null
    return { linea: ruta.geometry.coordinates.map(([lo, la]: number[]) => [la, lo] as Punto), metros: ruta.distance }
  } catch { return null }
}

const icono = (letra: 'A' | 'B', prueba = false) =>
  L.divIcon({ className: 'pin', html: `<span class="${letra === 'A' ? 'ini' : 'fin'}${prueba ? ' prueba' : ''}">${letra}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })

interface Guardado { a: Punto | null; b: Punto | null; otra: boolean }

export default function Ruta() {
  const mapaDiv = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capaPuntos = useRef<L.LayerGroup | null>(null)
  const capaRuta = useRef<L.LayerGroup | null>(null)
  const capaPrueba = useRef<L.LayerGroup | null>(null)

  const [g, setG] = useState<Guardado>(() => {
    try { return { a: null, b: null, otra: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return { a: null, b: null, otra: false } }
  })
  const gRef = useRef(g)
  const subiendo = useRef(false)
  const [prueba, setPrueba] = useState<Punto | null>(null) // punto tocado que espera confirmación
  const [buscando, setBuscando] = useState(false)
  const [metros, setMetros] = useState(0)
  const [cuadras, setCuadras] = useState(0)
  const [porLasCalles, setPorLasCalles] = useState(false)
  const [paso, setPaso] = useState(100)
  const [aviso, setAviso] = useState('')

  const pasoActual: 'A' | 'B' | 'listo' = !g.a ? 'A' : !g.b ? 'B' : 'listo'
  const pasoRef = useRef(pasoActual)
  pasoRef.current = pasoActual

  const decir = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 2600) }

  const fijar = (n: Guardado, subir = true) => {
    gRef.current = n
    setG(n)
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* */ }
    if (subir) enviar(n)
  }
  const enviar = async (n: Guardado) => {
    subiendo.current = true
    try {
      const puntos = [n.a, n.b].filter(Boolean) as Punto[]
      const r = await fetch('/api/ruta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ puntos, otra: n.otra }) })
      if (!r.ok) throw new Error('fallo')
    } catch { decir('Sin internet: la ruta no se compartió') }
    subiendo.current = false
  }

  // crear el mapa una sola vez
  useEffect(() => {
    if (!mapaDiv.current || mapa.current) return
    const m = L.map(mapaDiv.current).setView(gRef.current.a ?? PLAZA, 16)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    capaRuta.current = L.layerGroup().addTo(m)
    capaPuntos.current = L.layerGroup().addTo(m)
    capaPrueba.current = L.layerGroup().addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (pasoRef.current === 'listo') return // ya hay A y B: para cambiar, "Empezar de nuevo"
      setPrueba([e.latlng.lat, e.latlng.lng])
    })
    const ajustarZoom = () => mapaDiv.current?.classList.toggle('z-bajo', m.getZoom() < 17)
    m.on('zoomend', ajustarZoom)
    ajustarZoom()
    mapa.current = m
    setTimeout(() => m.invalidateSize(), 200)
    return () => { m.remove(); mapa.current = null }
  }, [])

  // recibir lo que marcaron los demás
  useEffect(() => {
    const traer = async () => {
      if (subiendo.current) return
      try {
        const r = await fetch('/api/ruta', { cache: 'no-store' })
        const j = (await r.json()) as { puntos: Punto[] | null; otra?: boolean }
        if (!j.puntos) return
        const n: Guardado = { a: j.puntos[0] ?? null, b: j.puntos[1] ?? null, otra: !!j.otra }
        const ahora = gRef.current
        if (JSON.stringify(n) !== JSON.stringify(ahora)) {
          fijar(n, false)
          setPrueba(null)
          if (n.a && !ahora.a) mapa.current?.setView(n.a, 16)
        }
      } catch { /* sin internet */ }
    }
    traer()
    const t = setInterval(() => { if (document.visibilityState === 'visible') traer() }, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // punto de prueba (antes de confirmar)
  useEffect(() => {
    const c = capaPrueba.current
    if (!c) return
    c.clearLayers()
    if (prueba) L.marker(prueba, { icon: icono(pasoRef.current === 'B' ? 'B' : 'A', true), interactive: false }).addTo(c)
  }, [prueba])

  // dibujar A, B, línea y cuadras
  useEffect(() => {
    const cp = capaPuntos.current
    const cr = capaRuta.current
    if (!cp || !cr) return
    cp.clearLayers()
    cr.clearLayers()
    if (g.a) L.marker(g.a, { icon: icono('A'), interactive: false }).addTo(cp)
    if (g.b) L.marker(g.b, { icon: icono('B'), interactive: false }).addTo(cp)
    if (!g.a || !g.b) { setMetros(0); setCuadras(0); return }
    let vivo = true
    const desde = g.otra ? g.b : g.a
    const hasta = g.otra ? g.a : g.b
    const dibujar = (linea: Punto[], recta: boolean) => {
      cr.clearLayers()
      if (recta) L.polyline(linea, { color: '#c8402b', weight: 4, dashArray: '8 8' }).addTo(cr)
      else {
        L.polyline(linea, { color: '#1b1d20', weight: 9, opacity: 0.9 }).addTo(cr)
        L.polyline(linea, { color: '#ffc61a', weight: 5 }).addTo(cr)
      }
      const marcas = marcasCuadras(linea, paso)
      marcas.forEach((p, k) => {
        const n = k + 1
        L.marker(p, { interactive: false, icon: L.divIcon({ className: 'cuad', html: `<span class="${n % 5 === 0 || n === 1 ? 'c5' : ''}">${n}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(cr)
      })
      setCuadras(marcas.length)
    }
    dibujar([desde, hasta], true)
    setMetros(L.latLng(desde).distanceTo(L.latLng(hasta)))
    setPorLasCalles(false)
    porCalles(desde, hasta).then((r) => {
      if (!vivo) return
      if (!r) { decir('No se pudo seguir las calles. Se muestra una línea recta.'); return }
      dibujar(r.linea, false)
      setMetros(r.metros)
      setPorLasCalles(true)
      mapa.current?.fitBounds(L.latLngBounds(r.linea), { padding: [30, 30], maxZoom: 17 })
    })
    return () => { vivo = false }
  }, [g.a, g.b, g.otra, paso])

  const confirmar = async () => {
    if (!prueba) return
    setBuscando(true)
    const p = await pegarACalle(prueba)
    setBuscando(false)
    setPrueba(null)
    if (pasoRef.current === 'A') {
      fijar({ ...gRef.current, a: p })
      mapa.current?.setView(p, Math.max(mapa.current.getZoom(), 16))
    } else fijar({ ...gRef.current, b: p })
  }

  const irAPlaza = () => mapa.current?.setView(PLAZA, 16)
  const miUbicacion = () => {
    if (!navigator.geolocation) return decir('Tu celular no da ubicación')
    navigator.geolocation.getCurrentPosition(
      (p) => mapa.current?.setView([p.coords.latitude, p.coords.longitude], 17),
      () => decir('No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  const empezar = () => {
    if (confirm('¿Empezar de nuevo? Se borra la ruta para todos.')) {
      setPrueba(null)
      fijar({ a: null, b: null, otra: false })
    }
  }

  const letra = pasoActual === 'A' ? 'A' : 'B'

  return (
    <div className="ruta">
      <div className={`guia ${pasoActual === 'listo' ? 'ok' : ''}`}>
        {pasoActual === 'listo' ? (
          <>
            <b>Ruta lista</b>
            <span>
              {cuadras} cuadras · {km(metros)} km · {g.otra ? 'contando de B hacia A (la otra pista)' : 'contando de A hacia B'}
            </span>
          </>
        ) : prueba ? (
          <>
            <b>¿Marcar este punto como {letra}?</b>
            <span>{letra === 'A' ? 'Será el INICIO de la ruta.' : 'Será el FINAL de la ruta.'} El punto que ves en el mapa es el que se guardará.</span>
            <div className="si-no">
              <button className="si" onClick={confirmar} disabled={buscando}>{buscando ? 'Marcando…' : `Sí, marcar ${letra}`}</button>
              <button onClick={() => setPrueba(null)} disabled={buscando}>No, elegir otro</button>
            </div>
          </>
        ) : pasoActual === 'A' ? (
          <>
            <b>Paso 1 de 2: ¿dónde EMPIEZA la ruta?</b>
            <span>Toca en el mapa el lugar de inicio (punto A). Ejemplo: la Plaza Mayor.</span>
          </>
        ) : (
          <>
            <b>Paso 2 de 2: ¿dónde TERMINA la ruta?</b>
            <span>Toca en el mapa el lugar donde quieres el punto B. Puedes acercar o mover el mapa antes.</span>
          </>
        )}
      </div>

      <div ref={mapaDiv} className="mapa" />

      {pasoActual === 'listo' && (
        <div className="ruta-datos">
          <div><span>Cuadras</span><b>{cuadras}</b></div>
          <div><span>Largo</span><b>{km(metros)} km</b></div>
          <div className="quien">{porLasCalles ? 'Siguiendo las calles' : 'Buscando calles…'}</div>
        </div>
      )}

      <div className="ruta-btns">
        {pasoActual === 'listo' && (
          <button className="grande" onClick={() => fijar({ ...gRef.current, otra: !gRef.current.otra })}>
            Contar por la otra pista ({g.otra ? 'ahora: de B a A' : 'ahora: de A a B'})
          </button>
        )}
        <button onClick={irAPlaza}>Ir a Plaza Mayor</button>
        <button onClick={miUbicacion}>Mi ubicación</button>
        {pasoActual === 'B' && !prueba && <button onClick={() => fijar({ ...gRef.current, a: null })}>Cambiar punto A</button>}
        {pasoActual !== 'A' && <button className="peligro" onClick={empezar}>Empezar de nuevo</button>}
      </div>

      <label className="paso">
        Largo de una cuadra
        <select value={paso} onChange={(e) => setPaso(+e.target.value)}>
          {[80, 100, 120, 150].map((m) => <option key={m} value={m}>{m} metros</option>)}
        </select>
      </label>
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  )
}
