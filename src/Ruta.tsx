import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Punto = [number, number]
// Plaza Mayor de Nuevo Chimbote (punto de partida sugerido)
const PLAZA: Punto = [-9.12219, -78.53114]
const KEY = 'cv-ruta'

const km = (m: number) => (m / 1000).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function distanciaRecta(p: Punto[]) {
  let t = 0
  for (let i = 1; i < p.length; i++) t += L.latLng(p[i - 1]).distanceTo(L.latLng(p[i]))
  return t
}

// Marca un número cada "cuadra" (por defecto 100 m) a lo largo de la línea
function marcasCuadras(linea: Punto[], paso: number): Punto[] {
  const out: Punto[] = []
  let recorrido = 0
  let siguiente = paso
  for (let i = 1; i < linea.length; i++) {
    const a = L.latLng(linea[i - 1])
    const b = L.latLng(linea[i])
    const d = a.distanceTo(b)
    while (recorrido + d >= siguiente && d > 0) {
      const f = (siguiente - recorrido) / d
      out.push([a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f])
      siguiente += paso
    }
    recorrido += d
  }
  return out
}

// Pide a OSRM que siga las calles reales entre los puntos marcados
async function porCalles(p: Punto[]): Promise<{ linea: Punto[]; metros: number } | null> {
  if (p.length < 2) return null
  try {
    const c = p.map(([la, lo]) => `${lo},${la}`).join(';')
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${c}?overview=full&geometries=geojson`)
    const j = await r.json()
    const ruta = j.routes?.[0]
    if (!ruta) return null
    return { linea: ruta.geometry.coordinates.map(([lo, la]: number[]) => [la, lo] as Punto), metros: ruta.distance }
  } catch { return null }
}

export default function Ruta() {
  const mapaDiv = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const capaRuta = useRef<L.LayerGroup | null>(null)
  const [puntos, setPuntos] = useState<Punto[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  })
  const ref = useRef(puntos)
  const guardando = useRef(false)
  const [metros, setMetros] = useState(0)
  const [porLasCalles, setPorLasCalles] = useState(false)
  const [aviso, setAviso] = useState('')
  const [paso, setPaso] = useState(100)
  const [cuadras, setCuadras] = useState(0)

  const fijar = (p: Punto[]) => {
    ref.current = p
    setPuntos(p)
    try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* */ }
  }

  const subir = async (p: Punto[]) => {
    guardando.current = true
    try {
      await fetch('/api/ruta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ puntos: p }) })
    } catch { setAviso('Sin internet: la ruta no se compartió') }
    guardando.current = false
  }

  const cambiar = (p: Punto[]) => { fijar(p); subir(p) }

  // crear el mapa una sola vez
  useEffect(() => {
    if (!mapaDiv.current || mapa.current) return
    const m = L.map(mapaDiv.current, { zoomControl: true }).setView(ref.current[0] ?? PLAZA, 15)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    capaRuta.current = L.layerGroup().addTo(m)
    capa.current = L.layerGroup().addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (ref.current.length >= 25) return
      cambiar([...ref.current, [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]])
    })
    mapa.current = m
    setTimeout(() => m.invalidateSize(), 200)
    return () => { m.remove(); mapa.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // recibir la ruta que marcaron los demás
  useEffect(() => {
    const traer = async () => {
      if (guardando.current) return
      try {
        const r = await fetch('/api/ruta', { cache: 'no-store' })
        const { puntos: p } = (await r.json()) as { puntos: Punto[] | null }
        if (p && JSON.stringify(p) !== JSON.stringify(ref.current)) {
          fijar(p)
          if (p.length && mapa.current && !ref.current.length) mapa.current.setView(p[0], 15)
        }
      } catch { /* sin internet */ }
    }
    traer()
    const t = setInterval(() => { if (document.visibilityState === 'visible') traer() }, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // dibujar puntos y línea
  useEffect(() => {
    const g = capa.current
    const gr = capaRuta.current
    if (!g || !gr) return
    g.clearLayers()
    gr.clearLayers()
    puntos.forEach((p, i) => {
      const ult = i === puntos.length - 1 && puntos.length > 1
      const et = i === 0 ? 'Inicio' : ult ? 'Final' : String(i + 1)
      const icono = L.divIcon({ className: 'pin', html: i === 0 || ult ? `<span class="${i === 0 ? 'ini' : 'fin'}">${i === 0 ? 'A' : 'B'}</span>` : '<i class="mid"></i>', iconSize: [30, 30], iconAnchor: [15, 15] })
      L.marker(p, { icon: icono, title: et, draggable: true })
        .on('dragend', (e) => {
          const ll = (e.target as L.Marker).getLatLng()
          cambiar(ref.current.map((q, k) => (k === i ? ([+ll.lat.toFixed(6), +ll.lng.toFixed(6)] as Punto) : q)))
        })
        .addTo(g)
    })
    if (puntos.length < 2) { setMetros(0); setPorLasCalles(false); setCuadras(0); return }
    let vivo = true
    const dibujarCuadras = (linea: Punto[]) => {
      const m = marcasCuadras(linea, paso)
      m.forEach((p, k) => L.marker(p, { interactive: false, icon: L.divIcon({ className: 'cuad', html: `<span>${k + 1}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(gr))
      setCuadras(m.length)
    }
    L.polyline(puntos, { color: '#c8402b', weight: 4, dashArray: '8 8' }).addTo(gr)
    setMetros(distanciaRecta(puntos)); setPorLasCalles(false)
    dibujarCuadras(puntos)
    porCalles(puntos).then((r) => {
      if (!vivo || !r) return
      gr.clearLayers()
      L.polyline(r.linea, { color: '#1b1d20', weight: 8, opacity: 0.9 }).addTo(gr)
      L.polyline(r.linea, { color: '#ffc61a', weight: 4 }).addTo(gr)
      dibujarCuadras(r.linea)
      setMetros(r.metros); setPorLasCalles(true)
    })
    return () => { vivo = false }
  }, [puntos, paso])

  const irAPlaza = () => mapa.current?.setView(PLAZA, 16)
  const miUbicacion = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => mapa.current?.setView([p.coords.latitude, p.coords.longitude], 17),
      () => { setAviso('No se pudo obtener tu ubicación'); setTimeout(() => setAviso(''), 2500) },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  const inicioEnPlaza = () => cambiar([PLAZA, ...ref.current.slice(1)])

  return (
    <div className="ruta">
      <div className="ruta-info">
        <b>Ruta a contar</b>
        <span>Toca el mapa: primero el inicio (A) y luego el final (B). La página numera cada cuadra sola.</span>
      </div>
      <div ref={mapaDiv} className="mapa" />
      <div className="ruta-datos">
        <div><span>Largo</span><b>{km(metros)} km</b></div>
        <div><span>Cuadras</span><b>{cuadras}</b></div>
        <div className="quien">{puntos.length < 2 ? 'Marca al menos 2 puntos' : porLasCalles ? 'Siguiendo las calles' : 'Línea recta (sin calles)'}</div>
      </div>
      <label className="paso">
        Largo de una cuadra
        <select value={paso} onChange={(e) => setPaso(+e.target.value)}>
          {[50, 80, 100, 120, 150].map((m) => <option key={m} value={m}>{m} metros</option>)}
        </select>
      </label>
      <div className="ruta-btns">
        <button onClick={irAPlaza}>Ir a Plaza Mayor</button>
        <button onClick={inicioEnPlaza}>Poner inicio en Plaza Mayor</button>
        <button onClick={miUbicacion}>Mi ubicación</button>
        <button onClick={() => cambiar(ref.current.slice(0, -1))} disabled={!puntos.length}>Quitar último</button>
        <button className="peligro" onClick={() => { if (confirm('¿Borrar toda la ruta para todos?')) cambiar([]) }} disabled={!puntos.length}>Borrar ruta</button>
      </div>
      {aviso && <div className="toast">{aviso}</div>}
    </div>
  )
}
