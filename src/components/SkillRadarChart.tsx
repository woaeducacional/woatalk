'use client'

export interface SkillData {
  name: string
  value: number   // 0-100
  completed: number
  total: number
}

interface SkillRadarChartProps {
  skills: SkillData[]
}

const CX = 150
const CY = 155
const R_MAX = 105   // outer pentagon radius
const RINGS = 4     // concentric rings

// Pentagon: 5 vertices, starting from top (-90°), clockwise
function pentagonPoint(index: number, radius: number): [number, number] {
  const angle = (Math.PI / 180) * (-90 + index * 72)
  return [
    CX + radius * Math.cos(angle),
    CY + radius * Math.sin(angle),
  ]
}

function toPolygonPoints(radii: number[]): string {
  return radii
    .map((r, i) => pentagonPoint(i, r).join(','))
    .join(' ')
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
  if (skills.length !== 5) return null

  // Label positions — slightly outside the pentagon
  const LABEL_OFFSET = 28
  const labelPositions = skills.map((_, i) => {
    const [x, y] = pentagonPoint(i, R_MAX + LABEL_OFFSET)
    const aligns: ('middle' | 'start' | 'end')[] = [
      'middle', // top
      'start',  // top-right
      'start',  // bottom-right
      'end',    // bottom-left
      'end',    // top-left
    ]
    return { x, y, anchor: aligns[i] }
  })

  // Data polygon (filled area)
  const dataRadii = skills.map((s) => (s.value / 100) * R_MAX)
  const dataPoints = toPolygonPoints(dataRadii)

  // Ring polygons
  const rings = Array.from({ length: RINGS }, (_, i) => {
    const r = R_MAX * ((i + 1) / RINGS)
    return toPolygonPoints([r, r, r, r, r])
  })

  // Axis lines (center → vertex)
  const axes = skills.map((_, i) => {
    const [x2, y2] = pentagonPoint(i, R_MAX)
    return { x2, y2 }
  })

  return (
    <svg
      viewBox="0 0 300 310"
      width="100%"
      style={{ maxWidth: 340, display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      <defs>
        {/* Gold glow filter */}
        <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Filled area gradient */}
        <radialGradient id="skill-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#B8860B" stopOpacity="0.15" />
        </radialGradient>
        <filter id="data-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rings */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(0,212,255,0.12)"
          strokeWidth={i === RINGS - 1 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {axes.map((axis, i) => (
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={axis.x2}
          y2={axis.y2}
          stroke="rgba(0,212,255,0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Filled data area */}
      <polygon
        points={dataPoints}
        fill="url(#skill-fill)"
        stroke="#FFD700"
        strokeWidth="2"
        filter="url(#data-glow)"
        opacity="0.95"
      />

      {/* Data vertex dots */}
      {dataRadii.map((r, i) => {
        const [x, y] = pentagonPoint(i, r)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill="#FFD700"
            stroke="#fff"
            strokeWidth="1.5"
            filter="url(#gold-glow)"
          />
        )
      })}

      {/* Labels and values */}
      {skills.map((skill, i) => {
        const { x, y, anchor } = labelPositions[i]
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 2}
              textAnchor={anchor}
              fill="rgba(255,255,255,0.85)"
              fontSize="10"
              fontWeight="800"
              fontFamily="sans-serif"
              letterSpacing="1"
              style={{ textTransform: 'uppercase' }}
            >
              {skill.name}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor={anchor}
              fill="#FFD700"
              fontSize="11"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              {skill.value}%
            </text>
          </g>
        )
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={3} fill="rgba(0,212,255,0.5)" />
    </svg>
  )
}
