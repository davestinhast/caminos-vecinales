// Ilustraciones SVG (imágenes) de la aplicación
export function Hero() {
  return (
    <svg viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid slice" className="hero-img" role="img" aria-label="Camino vecinal en la sierra">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6b26b" />
          <stop offset=".6" stopColor="#fce5cd" />
          <stop offset="1" stopColor="#fff8ee" />
        </linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a8fa6" />
          <stop offset="1" stopColor="#a9b8c7" />
        </linearGradient>
      </defs>
      <rect width="1200" height="320" fill="url(#sky)" />
      <circle cx="930" cy="90" r="46" fill="#ffd966" opacity=".9" />
      <path d="M0 220 L140 110 L230 170 L360 70 L500 190 L620 120 L760 200 L900 100 L1050 180 L1200 130 L1200 320 L0 320Z" fill="url(#m1)" />
      <path d="M0 250 L120 190 L260 240 L420 170 L560 245 L720 185 L880 250 L1040 200 L1200 245 L1200 320 L0 320Z" fill="#6b8f5e" />
      <path d="M0 290 Q300 250 520 270 T1200 240 L1200 320 L0 320Z" fill="#4f7443" />
      <path d="M470 320 Q560 270 640 262 Q760 250 900 238 Q1020 228 1200 222 L1200 240 Q1020 246 900 258 Q760 272 690 282 Q610 292 590 320Z" fill="#8d6e4f" />
      <path d="M690 268 Q800 256 940 244 Q1040 236 1200 230" stroke="#f3e5c8" strokeWidth="3" strokeDasharray="14 12" fill="none" />
      <g transform="translate(770 236)">
        <rect width="46" height="18" rx="4" fill="#c0392b" />
        <rect x="8" y="-9" width="26" height="11" rx="3" fill="#e74c3c" />
        <circle cx="11" cy="19" r="5" fill="#222" />
        <circle cx="35" cy="19" r="5" fill="#222" />
      </g>
      <g fill="#3d5a34">
        <path d="M120 300 l14 -46 l14 46z" />
        <path d="M170 305 l12 -38 l12 38z" />
        <path d="M1060 300 l14 -46 l14 46z" />
      </g>
    </svg>
  )
}

const c = { stroke: 'currentColor', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function VehIcon({ i }: { i: number }) {
  const wheel = (x: number) => <circle key={x} cx={x} cy="34" r="4" fill="currentColor" />
  const body = [
    <>
      <path d="M6 32 v-8 l7 -2 l6 -8 h14 l7 8 l6 2 v8z" {...c} />
      {wheel(16)}
      {wheel(46)}
    </>,
    <>
      <path d="M6 32 v-10 h20 l6 -10 h16 l4 10 v10z" {...c} />
      {wheel(16)}
      {wheel(46)}
    </>,
    <>
      <path d="M6 32 v-16 h44 l6 10 v6z M14 16 v8 M26 16 v8 M38 16 v8" {...c} />
      {wheel(16)}
      {wheel(46)}
    </>,
    <>
      <path d="M4 32 v-16 h50 v16z M12 20 h8 M26 20 h8 M40 20 h8" {...c} />
      {wheel(14)}
      {wheel(46)}
    </>,
    <>
      <path d="M2 32 v-20 h58 v20z M10 18 h8 M24 18 h8 M38 18 h8" {...c} />
      {wheel(12)}
      {wheel(50)}
    </>,
    <>
      <path d="M4 32 v-16 h30 v16 M34 32 v-10 h10 l6 6 v4z" {...c} />
      {wheel(12)}
      {wheel(26)}
      {wheel(46)}
    </>,
    <>
      <path d="M2 32 v-16 h34 v16 M36 32 v-10 h10 l6 6 v4z" {...c} />
      {wheel(9)}
      {wheel(21)}
      {wheel(30)}
      {wheel(46)}
    </>,
  ]
  return (
    <svg viewBox="0 0 64 44" width="46" height="32" aria-hidden>
      {body[i]}
    </svg>
  )
}

export function RoadSection({ ancho, berma }: { ancho: number; berma: number }) {
  const sc = 30, cx = 200, a = (ancho * sc) / 2, b = berma * sc
  return (
    <svg viewBox="0 0 400 150" className="fig" role="img" aria-label="Sección transversal del camino">
      <rect width="400" height="150" fill="#eaf3fb" />
      <path d={`M0 110 L${cx - a - b - 80} 92 L${cx - a - b} 100 L${cx + a + b} 100 L${cx + a + b + 80} 92 L400 110 L400 150 L0 150Z`} fill="#8bb174" />
      <rect x={cx - a - b} y="96" width={b} height="6" fill="#b08d57" />
      <rect x={cx + a} y="96" width={b} height="6" fill="#b08d57" />
      <path d={`M${cx - a} 96 Q${cx} 91 ${cx + a} 96 L${cx + a} 102 L${cx - a} 102Z`} fill="#6d5a45" />
      <text x={cx} y="120" textAnchor="middle" fontSize="12" fill="#222">Calzada {ancho} m</text>
      <text x={cx - a - b / 2} y="136" textAnchor="middle" fontSize="10" fill="#222">berma {berma}</text>
      <text x={cx + a + b / 2} y="136" textAnchor="middle" fontSize="10" fill="#222">berma {berma}</text>
      <text x="200" y="28" textAnchor="middle" fontSize="12" fill="#345">Sección típica (esquemática)</text>
    </svg>
  )
}

export interface Serie { name: string; color: string; data: number[] }

export function LineChart({ series, labels, height = 220 }: { series: Serie[]; labels: string[]; height?: number }) {
  const W = 640, H = height, pad = 36
  const max = Math.max(1, ...series.flatMap((s) => s.data)) * 1.1
  const x = (i: number) => pad + (i * (W - pad * 1.5)) / Math.max(1, labels.length - 1)
  const y = (v: number) => H - pad - (v / max) * (H - pad * 1.6)
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="chart" role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={pad} x2={W - 8} y1={y(max * t)} y2={y(max * t)} stroke="#d8dee6" />
          <text x={pad - 6} y={y(max * t) + 4} fontSize="10" textAnchor="end" fill="#667">{Math.round(max * t)}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - pad + 16} fontSize="10" textAnchor="middle" fill="#667">{l}</text>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />)}
        </g>
      ))}
      {series.map((s, i) => (
        <g key={s.name} transform={`translate(${pad + i * 170} ${H + 12})`}>
          <rect width="12" height="4" y="-2" fill={s.color} />
          <text x="18" y="4" fontSize="11" fill="#333">{s.name}</text>
        </g>
      ))}
    </svg>
  )
}

export function BarChart({ labels, data, color = '#2f80ed', neg = '#e05252', height = 220 }: { labels: string[]; data: number[]; color?: string; neg?: string; height?: number }) {
  const W = 640, H = height, pad = 44
  const minV = Math.min(0, ...data), maxV = Math.max(0, ...data)
  const y = (v: number) => 12 + ((maxV - v) / (maxV - minV || 1)) * (H - pad - 12)
  const bw = (W - pad - 10) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
      <line x1={pad} x2={W - 6} y1={y(0)} y2={y(0)} stroke="#889" />
      {data.map((v, i) => (
        <g key={i}>
          <rect x={pad + i * bw + 4} y={Math.min(y(v), y(0))} width={bw - 8} height={Math.abs(y(v) - y(0))} fill={v < 0 ? neg : color} rx="3" />
          <text x={pad + i * bw + bw / 2} y={H - pad + 16} fontSize="10" textAnchor="middle" fill="#667">{labels[i]}</text>
        </g>
      ))}
      <text x="4" y="14" fontSize="10" fill="#667">S/ {Math.round(maxV / 1000)}k</text>
    </svg>
  )
}

export function Donut({ parts }: { parts: { name: string; v: number; color: string }[] }) {
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1
  const R = 60, C = 2 * Math.PI * R
  let acc = 0
  return (
    <svg viewBox="0 0 330 170" className="chart" role="img">
      <g transform="translate(85 85) rotate(-90)">
        {parts.map((p) => {
          const len = (p.v / tot) * C
          const el = <circle key={p.name} r={R} fill="none" stroke={p.color} strokeWidth="28" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />
          acc += len
          return el
        })}
      </g>
      {parts.map((p, i) => (
        <g key={p.name} transform={`translate(175 ${18 + i * 20})`}>
          <rect width="10" height="10" fill={p.color} />
          <text x="16" y="9" fontSize="11" fill="#333">{p.name} {((p.v / tot) * 100).toFixed(0)}%</text>
        </g>
      ))}
    </svg>
  )
}
