import { useEffect, useMemo, useState } from 'react'
import ref from './data/ref.json'
import { calcular, defaults, DIAS, Inputs, PARTIDAS, VEH } from './calc'
import { BarChart, Donut, Hero, LineChart, RoadSection, VehIcon } from './art'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']
const fmt = (n: number, d = 0) => n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })
const S = (n: number) => 'S/ ' + fmt(n, 2)

type Pairs = [string, string][]
const OFERTA: Pairs = [
  ['Superficie', 'Afirmado'], ['Tipología', 'Accidentado'], ['Longitud (km)', '35'], ['Tipo de material de superficie', 'Tierra'],
  ['Ancho de calzada (m)', '3.6'], ['Estado de conservación', 'Malo'], ['Tipo de daño', 'Encalaminado'], ['Pendiente (%)', '8'],
  ['Bombeo', 'No'], ['N° de canteras', '01'], ['N° de plazoletas de paso', '02'], ['Señalización', 'No'],
  ['Puentes y luz (m)', '-'], ['Pontones y luz (m)', '02 - (8m)'], ['Badenes', '02 (Regular)'], ['Muros de sostenimiento (h<4m)', '04 (Malo)'],
  ['Alcantarillas TMC 24"', '05 (Regular)'], ['Tajeas', '04 (Malo)'], ['Cunetas sin revestir', 'Sí, sin mantenimiento'],
  ['Canaleta de coronación', 'No'], ['Zona de botaderos', 'Sí'],
]
const BALANCE: Pairs = [
  ['Longitud (km)', '35'], ['IMD (veh./día)', '25'], ['Velocidad de diseño (km/h)', '40'], ['Material de superficie', 'Afirmado e = 0.15 m'],
  ['Ancho de calzada (m)', '4.0'], ['Ancho de berma (m)', '0.6'], ['Radio mínimo (m)', '50'], ['Peralte máximo (%)', '8'],
  ['Pendiente máxima (%)', '9'], ['Bombeo (%)', '3'], ['Plazoletas', 'c/500 m (mín.)'], ['Taludes', 'H 1 : V 3'], ['Señalización (unid.)', '16'],
  ['Pontones', 'Madera'], ['Badenes', "C°F'c=175 kg/cm2"], ['Muros de sostenimiento (h<4.50 m)', 'Mampostería de piedra'],
  ['Alcantarillas', "Losa C°F'c=175 kg/cm2 — Rectangular 0.40×0.60"], ['Tajeas', 'Madera — Rectangular 0.40×0.40'],
  ['Cunetas', 'Tierra — Triangular 0.30×0.60'], ['Canaleta de coronación', 'Tierra — Rectangular 0.40×0.40'],
  ['Campamento', 'Sí'], ['Patio de maquinaria', 'Sí'], ['Zona de botaderos', 'Sí'],
]
const ANCHO = [
  ['Sin afirmar (SAF) — lastrado', '< 15 veh./día', '3.50 - 4.00', 12000, 15000],
  ['Sin afirmar (SAF) — lastrado', '15 – 30 veh./día', '3.50 - 5.00', 15000, 18000],
  ['Sin afirmar (SAF) — lastrado', '30 – 50 veh./día', '3.50 - 6.00', 20000, 25000],
  ['Afirmada (AF) — rehabilitación', '< 20 veh./día', '3.50 - 4.00', 15000, 20000],
  ['Afirmada (AF) — rehabilitación', '20 – 40 veh./día', '3.50 - 4.00', 20000, 25000],
  ['Afirmada (AF) — rehabilitación', '40 – 60 veh./día', '3.50 - 5.50', 25000, 35000],
  ['Afirmada (AF) — rehabilitación', '60 – 80 veh./día', '3.50 - 5.50', 35000, 50000],
  ['Afirmada (AF) — rehabilitación', '80 – 100 veh./día', '3.50 - 5.50', 50000, 65000],
  ['Afirmada (AF) — rehabilitación', '100 – 150 veh./día', '3.50 - 5.50', 65000, 100000],
  ['Afirmada (AF) — rehabilitación', '150 – 200 veh./día', '3.50 - 5.50', 100000, 125000],
  ['Afirmada (AF) — mejoramiento', '< 50 veh./día', '3.50 - 4.50', 45000, 60000],
  ['Afirmada (AF) — mejoramiento', '50 – 100 veh./día', '3.50 - 5.50', 60000, 75000],
  ['Afirmada (AF) — mejoramiento', '100 – 150 veh./día', '3.50 - 5.50', 75000, 125000],
  ['Afirmada (AF) — mejoramiento', '150 – 200 veh./día', '3.50 - 5.50', 125000, 145000],
] as const

const TABS = ['Inicio', 'Demanda', 'Población', 'Oferta', 'Balance', 'Costos', 'Precios sociales', 'Evaluación', 'Anexos'] as const
type Tab = (typeof TABS)[number]

function load<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k)
    return v ? { ...d, ...JSON.parse(v) } : d
  } catch { return d }
}

function Num({ v, on, step = 'any', w }: { v: number; on: (n: number) => void; step?: string; w?: number }) {
  return <input className="in" type="number" step={step} value={Number.isFinite(v) ? v : ''} style={w ? { width: w } : undefined} onChange={(e) => on(parseFloat(e.target.value))} />
}
function Cnt({ v, on }: { v: number; on: (n: number) => void }) {
  return (
    <span className="cnt">
      <button type="button" aria-label="restar uno" onClick={() => on(Math.max(0, (v || 0) - 1))}>−</button>
      <b>{v || 0}</b>
      <button type="button" aria-label="sumar uno" className="plus" onClick={() => on((v || 0) + 1)}>+</button>
    </span>
  )
}
function Txt({ v, on }: { v: string; on: (s: string) => void }) {
  return <input className="in txt" value={v} onChange={(e) => on(e.target.value)} />
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Inicio')
  const [p, setP] = useState<Inputs>(() => load('cv-inputs', defaults))
  const [oferta, setOferta] = useState<Pairs>(() => load('cv-oferta', { v: OFERTA } as any).v)
  const [balance, setBalance] = useState<Pairs>(() => load('cv-balance', { v: BALANCE } as any).v)
  useEffect(() => { try { localStorage.setItem('cv-inputs', JSON.stringify(p)); localStorage.setItem('cv-oferta', JSON.stringify({ v: oferta })); localStorage.setItem('cv-balance', JSON.stringify({ v: balance })) } catch { /* */ } }, [p, oferta, balance])
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setP((o) => ({ ...o, [k]: v }))
  const r = useMemo(() => calcular(p), [p])
  const N = p.horizonte
  const yl = r.anios.map((a) => 'A' + a)

  const reset = () => { if (confirm('¿Restablecer todos los datos al ejemplo original?')) { setP(defaults); setOferta(OFERTA); setBalance(BALANCE) } }
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ inputs: p, oferta, balance, resultados: { vact: r.vact, ce: r.ce, ceUsd: r.ceUsd, inversion: r.inversion } }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'proyecto-camino-vecinal.json'; a.click()
  }

  const setConteo = (i: number, d: number, v: number) => set('conteo', p.conteo.map((f, x) => (x === i ? f.map((c, y) => (y === d ? (v || 0) : c)) : f)))
  const sel = (k: 'fceLig' | 'fcePes', tabla: typeof ref.fcLig, mes: number) => (peaje: string) => {
    const f = tabla.find((t) => t.c === peaje); const val = f?.m[mes]
    if (val) set(k, val)
  }
  const mesIdx = MESES.indexOf(p.mes)
  const tcpDep = (ref.tcp as { d: string; v: number[] }[]).find((t) => t.d.toLowerCase() === p.depto.toLowerCase())
  const pbiDep = (ref.pbi as { d: string; v: number }[]).find((t) => t.d.toLowerCase() === p.depto.toLowerCase())

  return (
    <div className="app">
      <header className="hero">
        <Hero />
        <div className="hero-txt">
          <h1>Aplicativo Guía Simplificada Caminos Vecinales</h1>
          <p>Análisis Costo – Efectividad · {p.nombre}</p>
        </div>
      </header>
      <nav className="tabs">
        {TABS.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </nav>
      <div className="kpis">
        <div><span>IMD actual</span><b>{r.imdTot}</b></div>
        <div><span>Inversión total</span><b>{S(r.inversion)}</b></div>
        <div><span>VACT (precios sociales)</span><b>{S(r.vact)}</b></div>
        <div><span>C/E</span><b>S/ {fmt(r.ce, 2)}</b> <small>US$ {fmt(r.ceUsd, 2)} / hab.</small></div>
      </div>

      <main>
        {tab === 'Inicio' && (
          <section className="card">
            <h2>Presentación del aplicativo</h2>
            <p>Herramienta que orienta de forma práctica la formulación y evaluación de Proyectos de Inversión Pública (PIP) de caminos vecinales con la metodología <b>costo-efectividad</b>. Utiliza los parámetros de los Anexos SNIP 09 y SNIP 10, datos referenciales y tiene fines didácticos.</p>
            <p>Incluye anexos: factores de corrección estacional (ligeros y pesados), PBI, tasa de crecimiento poblacional, ancho de calzada según tráfico, estructura funcional programática, formatos de tráfico y glosario. En el conteo de tránsito usa los botones <b>+</b> / <b>−</b> para subir el contador de uno en uno. Los <span className="ley">campos amarillos</span> son datos a ingresar; todo lo demás se calcula automáticamente. Sus datos se guardan en este navegador.</p>
            <h3>1. Generalidades</h3>
            <div className="grid2">
              <label>Nombre del proyecto<Txt v={p.nombre} on={(v) => set('nombre', v)} /></label>
              <label>Departamento<Txt v={p.depto} on={(v) => set('depto', v)} /></label>
              <label>Provincia<Txt v={p.prov} on={(v) => set('prov', v)} /></label>
              <label>Distrito<Txt v={p.dist} on={(v) => set('dist', v)} /></label>
              <label>Zona geográfica
                <select className="in" value={p.zona} onChange={(e) => set('zona', e.target.value)}>{['Costa', 'Sierra', 'Selva'].map((z) => <option key={z}>{z}</option>)}</select>
              </label>
              <label>Horizonte (años)<Num v={p.horizonte} on={(v) => set('horizonte', Math.min(20, Math.max(2, v || 10)))} step="1" /></label>
            </div>
            <div className="btns"><button onClick={exportar}>Exportar JSON</button><button onClick={() => window.print()}>Imprimir / PDF</button><button className="warn" onClick={reset}>Restablecer ejemplo</button></div>
          </section>
        )}

        {tab === 'Demanda' && (
          <>
            <section className="card">
              <h2>1. Determinación del tránsito actual</h2>
              <h3>i) Conteos de tránsito por día y tipo de vehículo — mes: <select className="in" value={p.mes} onChange={(e) => set('mes', e.target.value)}>{MESES.map((m) => <option key={m}>{m}</option>)}</select></h3>
              <div className="scroll"><table>
                <thead><tr><th>Tipo de vehículo</th>{DIAS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
                <tbody>
                  {VEH.map((v, i) => <tr key={v}><td className="l"><span className="vi"><VehIcon i={i} /></span>{v}</td>{DIAS.map((_, d) => <td key={d}><Cnt v={p.conteo[i][d]} on={(x) => setConteo(i, d, x)} /></td>)}</tr>)}
                  <tr className="tot"><td className="l">TOTAL</td>{r.totDia.map((t, i) => <td key={i}>{t}</td>)}</tr>
                </tbody>
              </table></div>
              <p className="note">Conteo de 7 días de 24 horas para proyectos a nivel de perfil.</p>

              <h3>ii) Factores de corrección estacional (peaje cercano, Anexo 3)</h3>
              <div className="grid2">
                <label>Peaje – vehículos ligeros
                  <select className="in" defaultValue="" onChange={(e) => sel('fceLig', ref.fcLig, mesIdx)(e.target.value)}>
                    <option value="">Elegir peaje…</option>{ref.fcLig.filter((f) => f.m[mesIdx]).map((f) => <option key={f.c} value={f.c}>{f.n} ({fmt(f.m[mesIdx]!, 3)})</option>)}
                  </select>
                </label>
                <label>Peaje – vehículos pesados
                  <select className="in" defaultValue="" onChange={(e) => sel('fcePes', ref.fcPes, mesIdx)(e.target.value)}>
                    <option value="">Elegir peaje…</option>{ref.fcPes.filter((f) => f.m[mesIdx]).map((f) => <option key={f.c} value={f.c}>{f.n} ({fmt(f.m[mesIdx]!, 3)})</option>)}
                  </select>
                </label>
                <label>F.C.E. ligeros<Num v={p.fceLig} on={(v) => set('fceLig', v)} /></label>
                <label>F.C.E. pesados<Num v={p.fcePes} on={(v) => set('fcePes', v)} /></label>
              </div>

              <h3>iii) IMDa = IMDS × FC &nbsp; <small>IMDS = ΣVi / 7</small></h3>
              <div className="scroll"><table>
                <thead><tr><th>Tipo</th><th>Total semana</th><th>IMDS</th><th>FC</th><th>IMDa</th></tr></thead>
                <tbody>
                  {VEH.map((v, i) => <tr key={v}><td className="l">{v}</td><td>{r.tot[i]}</td><td>{fmt(r.imds[i], 2)}</td><td>{fmt(r.fc[i], 4)}</td><td><b>{r.imda[i]}</b></td></tr>)}
                  <tr className="tot"><td className="l">TOTAL</td><td>{r.tot.reduce((a, b) => a + b, 0)}</td><td>{fmt(r.imds.reduce((a, b) => a + b, 0), 2)}</td><td></td><td>{r.imdTot}</td></tr>
                </tbody>
              </table></div>
            </section>

            <section className="card">
              <h2>2. Análisis de la demanda</h2>
              <h3>2.1 Demanda actual — distribución</h3>
              <div className="row">
                <Donut parts={VEH.map((v, i) => ({ name: v, v: r.imda[i], color: ['#2f80ed', '#27ae60', '#f2994a', '#9b51e0', '#eb5757', '#56ccf2', '#828282'][i] })).filter((x) => x.v > 0)} />
                <table><thead><tr><th>Vehículo</th><th>IMD</th><th>%</th></tr></thead><tbody>
                  {VEH.map((v, i) => <tr key={v}><td className="l">{v}</td><td>{r.imda[i]}</td><td>{fmt(r.imdTot ? (r.imda[i] / r.imdTot) * 100 : 0, 1)}</td></tr>)}
                </tbody></table>
              </div>
              <h3>2.2 Demanda proyectada — Tn = T0 (1 + r)ⁿ</h3>
              <div className="grid2">
                <label>rvp – crecimiento población (%) (pasajeros){tcpDep && <small> Sugerido {p.depto}: {tcpDep.v[3]}%</small>}<Num v={p.rvp} on={(v) => set('rvp', v)} /></label>
                <label>rvc – crecimiento PBI regional (%) (carga){pbiDep && <small> Sugerido {p.depto}: {pbiDep.v}%</small>}<Num v={p.rvc} on={(v) => set('rvc', v)} /></label>
              </div>
              <h3>Proyección sin proyecto</h3>
              <ProyTabla labels={yl} filas={VEH.map((v, i) => [v, r.proy[i]] as [string, number[]])} total={['Tráfico normal', r.normal]} />
              <h3>2.3 Con proyecto — tráfico generado</h3>
              <div className="grid2">
                <label>% tráfico generado (mejoramiento)<Num v={p.pctGenerado} on={(v) => set('pctGenerado', v)} /></label>
                <label>Se genera desde el año<Num v={p.anioGenera} on={(v) => set('anioGenera', v)} step="1" /></label>
              </div>
              <ProyTabla labels={yl} filas={VEH.map((v, i) => [v, r.gen[i]] as [string, number[]])} total={['Tráfico generado', r.generado]} />
              <div className="scroll"><table className="tot-row"><tbody><tr><td className="l">IMD TOTAL con proyecto</td>{r.imdCon.map((v, i) => <td key={i}><b>{v}</b></td>)}</tr></tbody></table></div>
              <LineChart labels={yl} series={[{ name: 'Sin proyecto', color: '#828282', data: r.normal }, { name: 'Con proyecto', color: '#2f80ed', data: r.imdCon }]} />
            </section>
          </>
        )}

        {tab === 'Población' && (
          <section className="card">
            <h2>Proyecciones de población</h2>
            <div className="grid2">
              <label>Año censo 1<Num v={p.censoA} on={(v) => set('censoA', v)} step="1" /></label>
              <label>Población censo 1<Num v={p.poblA} on={(v) => set('poblA', v)} step="1" /></label>
              <label>Año censo 2<Num v={p.censoB} on={(v) => set('censoB', v)} step="1" /></label>
              <label>Población censo 2<Num v={p.poblB} on={(v) => set('poblB', v)} step="1" /></label>
              <label>Años transcurridos censo 2 → año 0<Num v={p.anioBase} on={(v) => set('anioBase', v)} step="1" /></label>
            </div>
            <p>Tasa intercensal calculada: <b>{fmt(r.tasaCenso, 2)}%</b> anual. Tasa usada en la proyección (rvp): <b>{p.rvp}%</b>. Población beneficiaria (promedio años 1–{N}): <b>{fmt(r.poblProm, 1)}</b>.</p>
            <BarChart labels={yl} data={r.pobl} color="#27ae60" />
            <div className="scroll"><table><thead><tr><th>Año</th>{yl.map((y) => <th key={y}>{y}</th>)}</tr></thead><tbody><tr><td className="l">Población</td>{r.pobl.map((v, i) => <td key={i}>{fmt(v)}</td>)}</tr></tbody></table></div>
          </section>
        )}

        {tab === 'Oferta' && <ParesCard titulo="3. Análisis de oferta — situación actual (visita de campo)" datos={oferta} on={setOferta} fuente="Fuente: Ministerio de Transportes y Comunicaciones – MTC" />}
        {tab === 'Balance' && (
          <>
            <ParesCard titulo="4. Balance oferta – demanda — propuesta técnica de la alternativa" datos={balance} on={setBalance} />
            <section className="card"><h3>Sección típica propuesta</h3><RoadSection ancho={parseFloat(balance[4][1]) || 4} berma={parseFloat(balance[5][1]) || 0.6} /></section>
          </>
        )}

        {tab === 'Costos' && (
          <section className="card">
            <h2>Costos en la situación «Con proyecto»</h2>
            <h3>Presupuesto de obra de la alternativa (S/)</h3>
            <div className="scroll"><table className="w">
              <tbody>
                {PARTIDAS.map((n, i) => <tr key={n}><td className="l">{n}</td><td></td><td><Num v={p.costos[i]} on={(v) => set('costos', p.costos.map((c, x) => (x === i ? v || 0 : c)))} w={140} /></td></tr>)}
                <tr className="tot"><td className="l">Costos directos</td><td></td><td>{S(r.cd)}</td></tr>
                <tr><td className="l">Gastos generales</td><td><Num v={p.gg} on={(v) => set('gg', v)} w={70} step="0.01" /></td><td>{S(r.gg)}</td></tr>
                <tr><td className="l">Utilidad</td><td><Num v={p.util} on={(v) => set('util', v)} w={70} step="0.01" /></td><td>{S(r.ut)}</td></tr>
                <tr className="tot"><td className="l">Sub total general</td><td></td><td>{S(r.sub)}</td></tr>
                <tr><td className="l">IGV</td><td><Num v={p.igv} on={(v) => set('igv', v)} w={70} step="0.01" /></td><td>{S(r.igv)}</td></tr>
                <tr className="tot"><td className="l">Presupuesto de obra</td><td></td><td>{S(r.obra)}</td></tr>
                <tr><td className="l">Supervisión de obra</td><td><Num v={p.superv} on={(v) => set('superv', v)} w={70} step="0.01" /></td><td>{S(r.sup)}</td></tr>
                <tr><td className="l">Estudio definitivo</td><td><Num v={p.estudio} on={(v) => set('estudio', v)} w={70} step="0.01" /></td><td>{S(r.est)}</td></tr>
                <tr className="tot big"><td className="l">Total de inversión</td><td></td><td>{S(r.inversion)}</td></tr>
                <tr><td className="l">Costo US$</td><td></td><td>US$ {fmt(r.usd, 2)}</td></tr>
                <tr><td className="l">Costo US$/km</td><td></td><td>US$ {fmt(r.usdKm, 2)}</td></tr>
              </tbody>
            </table></div>
            <div className="row">
              <Donut parts={PARTIDAS.map((n, i) => ({ name: n, v: p.costos[i], color: ['#2f80ed', '#eb5757', '#f2994a', '#27ae60', '#9b51e0', '#56ccf2', '#828282'][i] }))} />
              <div className="grid1">
                <label>Longitud (km)<Num v={p.longitud} on={(v) => set('longitud', v)} /></label>
                <label>Tipo de cambio (S/ por US$)<Num v={p.tc} on={(v) => set('tc', v)} /></label>
              </div>
            </div>
            <h3>Costos de mantenimiento (US$/km)</h3>
            <table className="w"><thead><tr><th></th><th>Precios de mercado</th></tr></thead><tbody>
              <tr><td className="l"><b>Sin proyecto</b></td><td></td></tr>
              <tr><td className="l">Mant. rutinario</td><td><Num v={p.mantSinRut} on={(v) => set('mantSinRut', v)} /></td></tr>
              <tr><td className="l">Mant. periódico</td><td><Num v={p.mantSinPer} on={(v) => set('mantSinPer', v)} /></td></tr>
              <tr><td className="l"><b>Con proyecto</b></td><td></td></tr>
              <tr><td className="l">Mant. rutinario</td><td><Num v={p.mantConRut} on={(v) => set('mantConRut', v)} /></td></tr>
              <tr><td className="l">Mant. periódico</td><td><Num v={p.mantConPer} on={(v) => set('mantConPer', v)} /></td></tr>
              <tr><td className="l">Operación (% del rutinario)</td><td><Num v={p.pctOper} on={(v) => set('pctOper', v)} step="0.01" /></td></tr>
            </tbody></table>
            <p className="note">Fuente: MTC. Ejemplo original del Excel.</p>
          </section>
        )}

        {tab === 'Precios sociales' && (
          <section className="card">
            <h2>5. Precios sociales</h2>
            <div className="grid2">
              <label>Factor de conversión – inversión<Num v={p.fcInv} on={(v) => set('fcInv', v)} step="0.01" /></label>
              <label>Factor – mantenimiento y operación<Num v={p.fcMant} on={(v) => set('fcMant', v)} step="0.01" /></label>
            </div>
            <h3>Costos a precios de mercado y sociales (S/)</h3>
            <div className="scroll"><table>
              <thead><tr><th>Año</th><th>Mant. sin proy. (mercado)</th><th>Inversión (mercado)</th><th>Mant. con proy. (mercado)</th><th>Mant. sin proy. (social)</th><th>Inversión (social)</th><th>Mant. con proy. (social)</th></tr></thead>
              <tbody>{r.anios.map((a) => <tr key={a}><td>{a}</td><td>{a ? fmt(r.sin[a], 2) : ''}</td><td>{a === 0 ? fmt(r.inversion, 2) : ''}</td><td>{a ? fmt(r.con[a], 2) : ''}</td><td>{a ? fmt(r.sinS[a], 2) : ''}</td><td>{a === 0 ? fmt(r.invS, 2) : ''}</td><td>{a ? fmt(r.conS[a], 2) : ''}</td></tr>)}</tbody>
            </table></div>
            <p className="note">* Incluye costo de operación (10% del mantenimiento rutinario). Sin proyecto: periódico en años 1, 4, 7…; con proyecto: periódico en años 3, 6, 9… (igual que el Excel original).</p>
            <h3>Costos incrementales a precios sociales</h3>
            <BarChart labels={yl} data={r.flujo} />
          </section>
        )}

        {tab === 'Evaluación' && (
          <section className="card">
            <h2>Evaluación económica</h2>
            <p>Metodología para PIP de rehabilitación: <b>COSTO / EFECTIVIDAD</b>.</p>
            <div className="grid2">
              <label>Tasa de descuento<Num v={p.tasa} on={(v) => set('tasa', v)} step="0.01" /></label>
              <label>Valor residual (% de la inversión, último año)<Num v={p.residual} on={(v) => set('residual', v)} step="0.01" /></label>
            </div>
            <div className="scroll"><table>
              <thead><tr><th>Año</th><th>Inversión</th><th>Costo O&amp;M</th><th>Flujo de costos</th></tr></thead>
              <tbody>{r.anios.map((a) => <tr key={a}><td>{a}</td><td>{r.incInv[a] ? fmt(r.incInv[a], 2) : ''}</td><td>{a ? fmt(r.incMant[a], 2) : ''}</td><td>{fmt(r.flujo[a], 2)}</td></tr>)}</tbody>
            </table></div>
            <div className="result">
              <div><span>VACT</span><b>{S(r.vact)}</b></div>
              <div><span>Población beneficiaria</span><b>{fmt(r.poblProm, 1)}</b></div>
              <div><span>C/E (S/ por hab.)</span><b>{fmt(r.ce, 2)}</b></div>
              <div><span>C/E (US$ por hab.)</span><b>{fmt(r.ceUsd, 2)}</b></div>
            </div>
            <BarChart labels={yl} data={r.flujo} />
          </section>
        )}

        {tab === 'Anexos' && <Anexos />}
      </main>
      <footer>Aplicativo didáctico basado en la Guía Simplificada Caminos Vecinales – Costo Efectividad.</footer>
    </div>
  )
}

function ProyTabla({ labels, filas, total }: { labels: string[]; filas: [string, number[]][]; total: [string, number[]] }) {
  return (
    <div className="scroll"><table>
      <thead><tr><th>Tipo</th>{labels.map((l) => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>
        {filas.map(([n, d]) => <tr key={n}><td className="l">{n}</td>{d.map((v, i) => <td key={i}>{v}</td>)}</tr>)}
        <tr className="tot"><td className="l">{total[0]}</td>{total[1].map((v, i) => <td key={i}>{v}</td>)}</tr>
      </tbody>
    </table></div>
  )
}

function ParesCard({ titulo, datos, on, fuente }: { titulo: string; datos: Pairs; on: (p: Pairs) => void; fuente?: string }) {
  return (
    <section className="card">
      <h2>{titulo}</h2>
      <table className="w"><tbody>
        {datos.map(([k, v], i) => <tr key={k + i}><td className="l">{k}</td><td><Txt v={v} on={(s) => on(datos.map((d, x) => (x === i ? [d[0], s] : d)) as Pairs)} /></td></tr>)}
      </tbody></table>
      {fuente && <p className="note">{fuente}</p>}
    </section>
  )
}

function Anexos() {
  const [a, setA] = useState('Ancho')
  const [q, setQ] = useState('')
  const [mes, setMes] = useState(7)
  const lista = ['Ancho', 'FC ligeros', 'FC pesados', 'Crecimiento poblacional', 'PBI', 'Estructura programática', 'Formatos de tráfico', 'Glosario']
  const fcTabla = (t: typeof ref.fcLig) => (
    <div className="scroll"><table>
      <thead><tr><th>Peaje</th>{MESES.map((m) => <th key={m}>{m.slice(0, 3)}</th>)}</tr></thead>
      <tbody>{t.map((f) => <tr key={f.c}><td className="l">{f.n}</td>{f.m.map((v, i) => <td key={i} className={i === mes ? 'hl' : ''}>{v ? fmt(v, 3) : '–'}</td>)}</tr>)}</tbody>
    </table></div>
  )
  return (
    <section className="card">
      <h2>Anexos</h2>
      <div className="chips">{lista.map((l) => <button key={l} className={l === a ? 'on' : ''} onClick={() => setA(l)}>{l}</button>)}</div>
      {a === 'Ancho' && (
        <>
          <p>Ancho de calzada según el tráfico vehicular por día (IMD) y costo máximo referencial de inversión (US$/km). Fuente: PROVIAS Descentralizado. Costos al año 2010, solo caminos vecinales/departamentales.</p>
          <div className="scroll"><table><thead><tr><th>Tipo de intervención</th><th>IMD</th><th>Ancho calzada (m)</th><th>Costa/Sierra US$/km</th><th>Selva US$/km</th></tr></thead>
            <tbody>{ANCHO.map((f, i) => <tr key={i}><td className="l">{f[0]}</td><td>{f[1]}</td><td>{f[2]}</td><td>{fmt(f[3])}</td><td>{fmt(f[4])}</td></tr>)}</tbody></table></div>
        </>
      )}
      {(a === 'FC ligeros' || a === 'FC pesados') && (
        <>
          <label className="inl">Resaltar mes <select className="in" value={mes} onChange={(e) => setMes(+e.target.value)}>{MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label>
          <p>Factores de corrección promedio para vehículos {a === 'FC ligeros' ? 'ligeros' : 'pesados'} (2000-2010). Fuente: Unidades de Peaje PVN – OGPP.</p>
          {fcTabla(a === 'FC ligeros' ? ref.fcLig : ref.fcPes)}
        </>
      )}
      {a === 'Crecimiento poblacional' && (
        <div className="scroll"><table><thead><tr><th>Departamento</th><th>Región</th><th>1995-2000</th><th>2000-2005</th><th>2005-2010</th><th>2010-2015</th></tr></thead>
          <tbody>{(ref.tcp as { d: string; r: string; v: number[] }[]).map((t) => <tr key={t.d}><td className="l">{t.d}</td><td>{t.r}</td>{t.v.map((v, i) => <td key={i}>{v}%</td>)}</tr>)}</tbody></table>
          <p className="note">Fuente: INEI.</p></div>
      )}
      {a === 'PBI' && (
        <>
          <p>Tasa anual departamental del PBI 2009/2008 (%). Fuente: INEI, Informe Técnico N° 01 – Agosto 2010.</p>
          <BarChart labels={(ref.pbi as { d: string }[]).map((x) => x.d.slice(0, 4))} data={(ref.pbi as { v: number }[]).map((x) => x.v)} color="#f2994a" height={260} />
          <div className="scroll"><table><thead><tr><th>Departamento</th><th>2009/2008 (%)</th></tr></thead><tbody>{(ref.pbi as { d: string; v: number }[]).map((x) => <tr key={x.d}><td className="l">{x.d}</td><td>{x.v}</td></tr>)}</tbody></table></div>
        </>
      )}
      {a === 'Estructura programática' && (
        <table className="w"><tbody>
          <tr><td className="l">Función</td><td>15 – Transporte</td></tr>
          <tr><td className="l">Programa</td><td>33 – Transporte Terrestre</td></tr>
          <tr><td className="l">Sub programa</td><td>66 – Vías Vecinales</td></tr>
          <tr><td className="l">Responsable funcional</td><td>Transporte y Comunicaciones</td></tr>
        </tbody></table>
      )}
      {a === 'Formatos de tráfico' && <Formatos />}
      {a === 'Glosario' && (
        <>
          <input className="in txt" placeholder="Buscar término…" value={q} onChange={(e) => setQ(e.target.value)} />
          <dl>{(ref.glos as string[]).filter((g) => g.toLowerCase().includes(q.toLowerCase())).map((g, i) => {
            const j = g.search(/\s*\.?-\s/)
            return <div key={i} className="gl"><dt>{j > 0 ? g.slice(0, j).replace(/\s*\.$/, '') : g}</dt><dd>{j > 0 ? g.slice(j).replace(/^\s*\.?-\s*/, '') : ''}</dd></div>
          })}</dl>
        </>
      )}
    </section>
  )
}

function Formatos() {
  const cols = ['Auto', 'Station wagon', 'Pick up', 'Panel', 'Rural/Combi', 'Micro', 'Bus 2E', 'Bus ≥3E', 'Camión 2E', 'Camión 3E', 'Camión 4E', 'Semi-tráiler', 'Tráiler']
  const [fmtSel, setF] = useState(1)
  const horas = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}-${String(h + 1).padStart(2, '0')}`)
  const [d, setD] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem('cv-formato1') || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem('cv-formato1', JSON.stringify(d)) } catch { /* */ } }, [d])
  const tot = cols.map((_, c) => horas.reduce((a, _h, h) => a + (d[`${h}-${c}`] || 0), 0))
  return (
    <>
      <div className="chips">
        <button className={fmtSel === 1 ? 'on' : ''} onClick={() => setF(1)}>N° 1 Clasificación vehicular</button>
        <button className={fmtSel === 3 ? 'on' : ''} onClick={() => setF(3)}>N° 3 Origen y destino</button>
      </div>
      {fmtSel === 1 ? (
        <>
          <p>Formato de clasificación vehicular por hora (el resumen del día, Formato N° 2, se calcula abajo). Usa + / − para subir el contador de uno en uno; se guarda automáticamente en este navegador. <button onClick={() => { if (confirm('¿Borrar el conteo del formato?')) setD({}) }}>Borrar conteo</button></p>
          <div className="scroll"><table className="sm">
            <thead><tr><th>Hora</th>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {horas.map((h, hi) => <tr key={h}><td>{h}</td>{cols.map((_, c) => <td key={c}><Cnt v={d[`${hi}-${c}`] || 0} on={(x) => setD({ ...d, [`${hi}-${c}`]: x })} /></td>)}</tr>)}
              <tr className="tot"><td>TOTAL DÍA</td>{tot.map((t, i) => <td key={i}>{t}</td>)}</tr>
            </tbody>
          </table></div>
          <p><b>Total del día: {tot.reduce((a, b) => a + b, 0)} vehículos</b></p>
        </>
      ) : (
        <div className="scroll"><table className="sm">
          <thead><tr><th>Fecha</th><th>Hora</th><th>Placa</th><th>Tipo veh.</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Combustible</th><th>N° asientos</th><th>N° pasajeros</th><th>Origen</th><th>Destino</th><th>Motivo</th></tr></thead>
          <tbody>{Array.from({ length: 6 }, (_, i) => <tr key={i}>{Array.from({ length: 13 }, (_, j) => <td key={j}><input className="in mini" style={{ width: 80 }} /></td>)}</tr>)}</tbody>
        </table></div>
      )}
    </>
  )
}
