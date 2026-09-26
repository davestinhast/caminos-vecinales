export const VEH = ['Automovil', 'Camioneta', 'C.R.', 'Micro', 'Bus Grande', 'Camión 2E', 'Camión 3E'] as const
export const CARGA = [5, 6] // índices de vehículos de carga
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export interface Inputs {
  nombre: string; depto: string; prov: string; dist: string; zona: string; horizonte: number
  mes: string; conteo: number[][] // [veh][dia]
  fceLig: number; fcePes: number
  rvp: number; rvc: number; pctGenerado: number; anioGenera: number
  censoA: number; poblA: number; censoB: number; poblB: number; anioBase: number
  longitud: number
  costos: number[] // 7 partidas directas
  gg: number; util: number; igv: number; superv: number; estudio: number
  tc: number; fcInv: number; fcMant: number; tasa: number; residual: number
  mantSinRut: number; mantSinPer: number; mantConRut: number; mantConPer: number; pctOper: number
}

export const defaults: Inputs = {
  nombre: 'Rehabilitación del Camino Vecinal Tarucani - Toloyo', depto: 'Arequipa', prov: 'Arequipa',
  dist: 'San Juan de Tarucani', zona: 'Sierra', horizonte: 10, mes: 'Agosto',
  conteo: [
    [25, 25, 25, 26, 26, 27, 27], [20, 20, 20, 21, 21, 22, 22], [8, 8, 8, 10, 10, 11, 11],
    [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 3, 3, 3], [0, 0, 0, 0, 0, 0, 0],
  ],
  fceLig: 1.1446904964760405, fcePes: 1.1446904964760405,
  rvp: 1.3, rvc: 0.2, pctGenerado: 10, anioGenera: 2,
  censoA: 1993, poblA: 9767, censoB: 2007, poblB: 11817, anioBase: 4,
  longitud: 35,
  costos: [50567.5, 1250652.19, 700303.28, 225959.48, 8689.24, 72890, 87574.31],
  gg: 0.1, util: 0.05, igv: 0.18, superv: 0.05, estudio: 0.06,
  tc: 2.87, fcInv: 0.79, fcMant: 0.75, tasa: 0.1, residual: 0.1,
  mantSinRut: 1144.06, mantSinPer: 1724.98, mantConRut: 2288.12, mantConPer: 3449.96, pctOper: 0.1,
}

export const PARTIDAS = ['Obras preliminares', 'Movimiento de tierras', 'Pavimentos', 'Obras de arte y drenaje', 'Señalización', 'Transporte', 'Impacto ambiental']

// Excel ROUND: half away from zero
const rnd = (x: number) => Math.sign(x) * Math.round(Math.abs(x) + 1e-9)

export function calcular(p: Inputs) {
  const N = p.horizonte
  const anios = Array.from({ length: N + 1 }, (_, i) => i)
  // 1. IMD actual
  const tot = p.conteo.map((f) => f.reduce((a, b) => a + b, 0))
  const imds = tot.map((t) => t / 7)
  const fc = VEH.map((_, i) => (CARGA.includes(i) ? p.fcePes : p.fceLig))
  const imdaRaw = imds.map((v, i) => v * fc[i])
  const imda = imdaRaw.map(rnd)
  const imdTot = imda.reduce((a, b) => a + b, 0)
  const totDia = DIAS.map((_, d) => p.conteo.reduce((a, f) => a + f[d], 0))
  // 2. proyección
  const proy = imdaRaw.map((base, i) => {
    const r = (CARGA.includes(i) ? p.rvc : p.rvp) / 100
    return anios.map((n) => rnd(base * Math.pow(1 + r, n)))
  })
  const normal = anios.map((n) => proy.reduce((a, f) => a + f[n], 0))
  const gen = proy.map((f) => anios.map((n) => (n >= p.anioGenera ? rnd((f[n] * p.pctGenerado) / 100) : 0)))
  const generado = anios.map((n) => gen.reduce((a, f) => a + f[n], 0))
  const imdCon = anios.map((n) => normal[n] + generado[n])
  // población
  const tasaCenso = (Math.pow(p.poblB / p.poblA, 1 / (p.censoB - p.censoA)) - 1) * 100
  const pobl = anios.map((n) => p.poblB * Math.pow(1 + p.rvp / 100, p.anioBase + n))
  const poblProm = pobl.slice(1).reduce((a, b) => a + b, 0) / N
  // costos
  const cd = p.costos.reduce((a, b) => a + b, 0)
  const gg = cd * p.gg, ut = cd * p.util, sub = cd + gg + ut, igv = sub * p.igv
  const obra = sub + igv, sup = cd * p.superv, est = cd * p.estudio
  const inversion = obra + sup + est
  const usd = inversion / p.tc
  // mantenimiento a precios de mercado (S/)
  const k = p.longitud * p.tc, op = 1 + p.pctOper
  const sin = anios.map((n) => {
    if (n === 0) return 0
    return (n % 3 === 1 ? p.mantSinPer * op : p.mantSinRut * op) * k
  })
  const con = anios.map((n) => {
    if (n === 0) return 0
    return (n % 3 === 0 ? p.mantConPer + p.mantConRut * (op - 1 + 0.01) : p.mantConRut * op) * k
  })
  const sinS = sin.map((v) => v * p.fcMant)
  const conS = con.map((v) => v * p.fcMant)
  const invS = inversion * p.fcInv
  const incMant = anios.map((n) => conS[n] - sinS[n])
  const incInv = anios.map((n) => (n === 0 ? invS : n === N ? -invS * p.residual : 0))
  const flujo = anios.map((n) => incInv[n] + incMant[n])
  const vact = flujo.reduce((a, c, n) => a + c / Math.pow(1 + p.tasa, n), 0)
  const ce = vact / poblProm
  return { tot, totDia, imds, imda, imdTot, fc, proy, normal, gen, generado, imdCon, tasaCenso, pobl, poblProm,
    cd, gg, ut, sub, igv, obra, sup, est, inversion, usd, usdKm: usd / p.longitud,
    sin, con, sinS, conS, invS, incMant, incInv, flujo, vact, ce, ceUsd: ce / p.tc, anios }
}
