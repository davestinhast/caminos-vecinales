const c = { stroke: 'currentColor', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function VehIcon({ i }: { i: number }) {
  const wheel = (x: number) => <circle key={x} cx={x} cy="34" r="4" fill="currentColor" />
  const body = [
    <><path d="M6 32 v-8 l7 -2 l6 -8 h14 l7 8 l6 2 v8z" {...c} />{wheel(16)}{wheel(46)}</>,
    <><path d="M6 32 v-10 h20 l6 -10 h16 l4 10 v10z" {...c} />{wheel(16)}{wheel(46)}</>,
    <><path d="M6 32 v-16 h44 l6 10 v6z M14 16 v8 M26 16 v8 M38 16 v8" {...c} />{wheel(16)}{wheel(46)}</>,
    <><path d="M4 32 v-16 h50 v16z M12 20 h8 M26 20 h8 M40 20 h8" {...c} />{wheel(14)}{wheel(46)}</>,
    <><path d="M2 32 v-20 h58 v20z M10 18 h8 M24 18 h8 M38 18 h8" {...c} />{wheel(12)}{wheel(50)}</>,
    <><path d="M4 32 v-16 h30 v16 M34 32 v-10 h10 l6 6 v4z" {...c} />{wheel(12)}{wheel(26)}{wheel(46)}</>,
    <><path d="M2 32 v-16 h34 v16 M36 32 v-10 h10 l6 6 v4z" {...c} />{wheel(9)}{wheel(21)}{wheel(30)}{wheel(46)}</>,
  ]
  return <svg viewBox="0 0 64 44" width="52" height="36" aria-hidden>{body[i]}</svg>
}
