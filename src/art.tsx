export const AYUDA = [
  'Carro normal de 4 puertas',
  'Pickup o camioneta 4x4',
  'Van chica con pasajeros',
  'Bus chico de pasajeros',
  'Bus largo de pasajeros',
  '2 ejes: 1 adelante, 1 atrás',
  '3 ejes: 1 adelante, 2 atrás juntos',
  'Cabina que jala una caja larga de 1 pieza',
  'Camión que jala otro remolque aparte',
]

const Rueda = ({ x }: { x: number }) => (
  <g>
    <circle cx={x} cy="45" r="7" fill="#222" />
    <circle cx={x} cy="45" r="3" fill="#bbb" />
  </g>
)
const Vent = ({ x, w, y = 16, h = 10 }: { x: number; w: number; y?: number; h?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx="2" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
)

export function VehIcon({ i }: { i: number }) {
  const cuerpos = [
    // Auto
    <>
      <path d="M8 44 v-10 q0 -3 4 -4 l14 -3 l12 -11 h32 l14 11 l14 3 q4 1 4 4 v10z" fill="#3b82c4" stroke="#123" strokeWidth="1" />
      <path d="M40 20 h28 l10 10 h-38z" fill="#cfe8f7" stroke="#123" strokeWidth=".8" />
      <line x1="59" y1="20" x2="59" y2="30" stroke="#123" strokeWidth=".8" />
      <Rueda x={30} />
      <Rueda x={92} />
    </>,
    // Camioneta pickup
    <>
      <path d="M6 44 v-12 h50 v-12 h22 l8 10 h6 v14z" fill="#c0392b" stroke="#123" strokeWidth="1" />
      <path d="M8 44 v-12 h44 v12z" fill="none" />
      <path d="M60 22 h16 l6 8 h-22z" fill="#cfe8f7" stroke="#123" strokeWidth=".8" />
      <rect x="6" y="26" width="46" height="6" fill="#922b21" />
      <Rueda x={24} />
      <Rueda x={92} />
    </>,
    // Combi
    <>
      <path d="M6 44 v-26 q0 -4 4 -4 h70 q6 0 10 6 l14 14 v10z" fill="#f2c94c" stroke="#123" strokeWidth="1" />
      <Vent x={14} w={14} />
      <Vent x={32} w={14} />
      <Vent x={50} w={14} />
      <path d="M84 16 l10 12 h-14z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <Rueda x={26} />
      <Rueda x={88} />
    </>,
    // Micro
    <>
      <path d="M4 44 v-30 q0 -4 4 -4 h84 q8 0 12 8 l6 12 v14z" fill="#27ae60" stroke="#123" strokeWidth="1" />
      <Vent x={10} w={12} y={16} />
      <Vent x={26} w={12} y={16} />
      <Vent x={42} w={12} y={16} />
      <Vent x={58} w={12} y={16} />
      <path d="M92 16 l10 12 h-14z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <Rueda x={24} />
      <Rueda x={94} />
    </>,
    // Bus grande
    <>
      <path d="M2 44 v-34 q0 -4 4 -4 h100 q6 0 8 6 l4 14 v18z" fill="#e67e22" stroke="#123" strokeWidth="1" />
      <Vent x={8} w={11} y={12} h={12} />
      <Vent x={22} w={11} y={12} h={12} />
      <Vent x={36} w={11} y={12} h={12} />
      <Vent x={50} w={11} y={12} h={12} />
      <Vent x={64} w={11} y={12} h={12} />
      <Vent x={78} w={11} y={12} h={12} />
      <path d="M96 12 h10 l6 14 h-16z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <Rueda x={24} />
      <Rueda x={88} />
    </>,
    // Camión 2 ejes
    <>
      <path d="M4 44 v-30 h58 v30z" fill="#95a5a6" stroke="#123" strokeWidth="1" />
      <path d="M64 44 v-20 h14 l10 10 v10z" fill="#2980b9" stroke="#123" strokeWidth="1" />
      <path d="M68 26 h9 l6 8 h-15z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <Rueda x={40} />
      <Rueda x={78} />
    </>,
    // Camión 3 ejes
    <>
      <path d="M2 44 v-32 h62 v32z" fill="#95a5a6" stroke="#123" strokeWidth="1" />
      <path d="M66 44 v-20 h14 l10 10 v10z" fill="#8e44ad" stroke="#123" strokeWidth="1" />
      <path d="M70 26 h9 l6 8 h-15z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <Rueda x={22} />
      <Rueda x={38} />
      <Rueda x={80} />
    </>,
    // Semi tráiler
    <>
      <path d="M2 44 v-18 h10 l8 -8 h12 v26z" fill="#c0392b" stroke="#123" strokeWidth="1" />
      <path d="M22 20 h9 v8 h-15z" fill="#cfe8f7" stroke="#345" strokeWidth=".8" />
      <path d="M32 44 v-30 h86 v30z" fill="#ecf0f1" stroke="#123" strokeWidth="1" />
      <Rueda x={14} />
      <Rueda x={36} />
      <Rueda x={96} />
      <Rueda x={108} />
    </>,
    // Tráiler (camión con remolque)
    <>
      <path d="M2 44 v-20 h8 l6 -8 h10 v28z" fill="#2980b9" stroke="#123" strokeWidth="1" />
      <path d="M26 44 v-24 h34 v24z" fill="#95a5a6" stroke="#123" strokeWidth="1" />
      <line x1="60" y1="38" x2="68" y2="38" stroke="#123" strokeWidth="2" />
      <path d="M68 44 v-24 h50 v24z" fill="#bdc3c7" stroke="#123" strokeWidth="1" />
      <Rueda x={14} />
      <Rueda x={46} />
      <Rueda x={82} />
      <Rueda x={104} />
    </>,
  ]
  return (
    <svg viewBox="0 0 120 56" width="96" height="45" role="img" aria-label="Dibujo del vehículo">
      <line x1="0" y1="52" x2="120" y2="52" stroke="#b8c2cc" strokeWidth="2" />
      {cuerpos[i]}
    </svg>
  )
}
