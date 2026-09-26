import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Armchair,
  BadgeInfo,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  House,
  Layers3,
  Minus,
  Plus,
  RotateCw,
  Ruler,
  Sofa,
  Trash2,
  X,
} from 'lucide-react'

type FurnitureStatus = 'candidate' | 'owned'
type TabKey = 'furniture' | 'selection' | 'layouts' | 'info'

type Product = {
  id: string
  name: string
  category: string
  widthMm: number
  depthMm: number
  heightMm?: number
  price?: number
  url?: string
  status: FurnitureStatus
}

type Placement = {
  id: string
  productId: string
  x: number
  y: number
  rotation: 0 | 90
  roomId: string
}

type Layout = {
  id: string
  name: string
  placements: Placement[]
}

type PlannerState = {
  schemaVersion: 4
  products: Product[]
  layouts: Layout[]
  activeLayoutId: string
  measuredReferenceMm: number
}

type Room = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  tone: string
}

type FixedFixture = {
  id: string
  name: string
  roomId: string
  x: number
  y: number
  width: number
  height: number
  verifiedBy: string
}

type Passage = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  kind: 'main' | 'branch'
}

const PLAN_WIDTH = 10200
const PLAN_HEIGHT = 10150
const DRAWING_REFERENCE_MM = 3800
const STORAGE_KEY = 'mokgam-85a1-planner-v4'

const rooms: Room[] = [
  { id: 'room3', name: '침실 3', x: 0, y: 0, width: 2900, height: 3690, tone: 'bedroom' },
  { id: 'balcony2', name: '발코니 2', x: 2900, y: 0, width: 3500, height: 1350, tone: 'balcony' },
  { id: 'kitchen', name: '주방 · 식당', x: 2900, y: 1350, width: 3500, height: 4000, tone: 'kitchen' },
  { id: 'master-bath', name: '부부 욕실', x: 0, y: 3690, width: 1700, height: 2240, tone: 'bath' },
  { id: 'master', name: '침실 1', x: 0, y: 5930, width: 3500, height: 2440, tone: 'master' },
  { id: 'living', name: '거실', x: 3500, y: 5350, width: 3800, height: 3020, tone: 'living' },
  { id: 'entry', name: '현관', x: 6400, y: 3070, width: 1600, height: 2280, tone: 'entry' },
  { id: 'bath', name: '공용 욕실', x: 8000, y: 3640, width: 2200, height: 2290, tone: 'bath' },
  { id: 'room2', name: '침실 2', x: 7300, y: 5930, width: 2900, height: 2870, tone: 'bedroom' },
  { id: 'balcony1', name: '발코니 1', x: 7300, y: 8800, width: 2900, height: 1350, tone: 'balcony' },
]

const fixedFixtures: FixedFixture[] = [
  {
    id: 'bedroom3-wardrobe',
    name: '기본 붙박이장',
    roomId: 'room3',
    x: 120,
    y: 3040,
    width: 1700,
    height: 530,
    verifiedBy: '59A1 실세대 사전점검 사진',
  },
  {
    id: 'kitchen-sink-wall',
    name: '기본 싱크대 · 벽면',
    roomId: 'kitchen',
    x: 5740,
    y: 1470,
    width: 540,
    height: 2700,
    verifiedBy: '59A1 평면도 및 실세대 사진',
  },
  {
    id: 'kitchen-sink-return',
    name: '기본 싱크대 · ㄱ자',
    roomId: 'kitchen',
    x: 4980,
    y: 3650,
    width: 1300,
    height: 520,
    verifiedBy: '59A1 실세대 사전점검 사진',
  },
]

const passages: Passage[] = [
  { id: 'entry-main', name: '현관 진입 통로', x: 6570, y: 3900, width: 920, height: 1900, kind: 'main' },
  { id: 'central-hall', name: '집 안 중앙 통로', x: 2050, y: 5000, width: 5900, height: 900, kind: 'main' },
  { id: 'living-route', name: '거실 통로', x: 6350, y: 5450, width: 800, height: 2420, kind: 'main' },
  { id: 'kitchen-route', name: '주방 통로', x: 3900, y: 2700, width: 950, height: 2800, kind: 'branch' },
  { id: 'room3-route', name: '침실 3 통로', x: 2250, y: 3150, width: 850, height: 2350, kind: 'branch' },
  { id: 'master-route', name: '침실 1 통로', x: 2850, y: 5350, width: 850, height: 1650, kind: 'branch' },
  { id: 'room2-route', name: '침실 2 통로', x: 7000, y: 5350, width: 850, height: 1650, kind: 'branch' },
]

const initialProducts: Product[] = [
  { id: 'sofa-4', name: '4인 소파', category: '소파', widthMm: 2800, depthMm: 950, heightMm: 720, price: 1890000, status: 'candidate' },
  { id: 'tv-console', name: 'TV장', category: '수납', widthMm: 1800, depthMm: 420, heightMm: 500, status: 'owned' },
  { id: 'dining-table', name: '4인 식탁', category: '식탁', widthMm: 1400, depthMm: 800, heightMm: 740, price: 790000, status: 'candidate' },
  { id: 'queen-bed', name: '퀸 침대', category: '침대', widthMm: 1600, depthMm: 2100, heightMm: 550, price: 1250000, status: 'candidate' },
]

const initialState: PlannerState = {
  schemaVersion: 4,
  products: initialProducts,
  layouts: [
    {
      id: 'layout-a',
      name: 'A안 · 기본',
      placements: [
        { id: 'p-sofa', productId: 'sofa-4', x: 3500, y: 7050, rotation: 0, roomId: 'living' },
        { id: 'p-tv', productId: 'tv-console', x: 3900, y: 6000, rotation: 0, roomId: 'living' },
        { id: 'p-table', productId: 'dining-table', x: 3100, y: 2800, rotation: 90, roomId: 'kitchen' },
        { id: 'p-bed', productId: 'queen-bed', x: 350, y: 6150, rotation: 0, roomId: 'master' },
      ],
    },
  ],
  activeLayoutId: 'layout-a',
  measuredReferenceMm: 3800,
}

function loadState(): PlannerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as PlannerState
    if (parsed.schemaVersion !== 4 || !Array.isArray(parsed.layouts) || !Array.isArray(parsed.products)) return initialState
    return parsed
  } catch {
    return initialState
  }
}

function formatWon(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function pointInRoom(x: number, y: number) {
  return rooms.find((room) => x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height)
}

function App() {
  const [planner, setPlanner] = useState<PlannerState>(loadState)
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>('p-sofa')
  const [activeTab, setActiveTab] = useState<TabKey>('selection')
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved')
  const [showAdd, setShowAdd] = useState(false)
  const [noticeVisible, setNoticeVisible] = useState(() => !sessionStorage.getItem('mokgam-notice-seen'))
  const [viewBox, setViewBox] = useState({ x: -320, y: -320, width: 10840, height: 10790 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<null | { id: string; startX: number; startY: number; originX: number; originY: number }>(null)
  const panRef = useRef<null | { startClientX: number; startClientY: number; originX: number; originY: number }>(null)

  const activeLayout = planner.layouts.find((layout) => layout.id === planner.activeLayoutId) ?? planner.layouts[0]
  const metric = planner.measuredReferenceMm / DRAWING_REFERENCE_MM
  const selectedPlacement = activeLayout.placements.find((placement) => placement.id === selectedPlacementId) ?? null
  const selectedProduct = selectedPlacement ? planner.products.find((product) => product.id === selectedPlacement.productId) ?? null : null

  useEffect(() => {
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [planner])

  useEffect(() => {
    if (selectedPlacementId && !activeLayout.placements.some((item) => item.id === selectedPlacementId)) {
      setSelectedPlacementId(null)
      setActiveTab('furniture')
    } else if (!selectedPlacementId && activeTab === 'selection') {
      setActiveTab('furniture')
    }
  }, [activeLayout, selectedPlacementId, activeTab])

  const productById = useMemo(() => new Map(planner.products.map((product) => [product.id, product])), [planner.products])

  const geometryFor = (placement: Placement) => {
    const product = productById.get(placement.productId)!
    const rawWidth = placement.rotation === 0 ? product.widthMm : product.depthMm
    const rawHeight = placement.rotation === 0 ? product.depthMm : product.widthMm
    return { width: rawWidth / metric, height: rawHeight / metric }
  }

  const placementStatus = (placement: Placement) => {
    const geometry = geometryFor(placement)
    const room = rooms.find((item) => item.id === placement.roomId) ?? pointInRoom(placement.x + geometry.width / 2, placement.y + geometry.height / 2)
    const outside = !room || placement.x < room.x || placement.y < room.y || placement.x + geometry.width > room.x + room.width || placement.y + geometry.height > room.y + room.height
    const furnitureOverlap = activeLayout.placements.some((other) => {
      if (other.id === placement.id) return false
      const otherGeometry = geometryFor(other)
      return (
        placement.x < other.x + otherGeometry.width &&
        placement.x + geometry.width > other.x &&
        placement.y < other.y + otherGeometry.height &&
        placement.y + geometry.height > other.y
      )
    })
    const fixtureCollision = fixedFixtures.find((fixture) => (
      placement.x < fixture.x + fixture.width &&
      placement.x + geometry.width > fixture.x &&
      placement.y < fixture.y + fixture.height &&
      placement.y + geometry.height > fixture.y
    ))
    const passageCollision = passages.find((passage) => (
      placement.x < passage.x + passage.width &&
      placement.x + geometry.width > passage.x &&
      placement.y < passage.y + passage.height &&
      placement.y + geometry.height > passage.y
    ))
    return {
      outside,
      overlap: furnitureOverlap || Boolean(fixtureCollision),
      room,
      fixtureCollision,
      passageCollision,
    }
  }

  const distanceSummary = (placement: Placement) => {
    const geometry = geometryFor(placement)
    const status = placementStatus(placement)
    let wallDistance: number | null = null
    if (status.room) {
      wallDistance = Math.max(
        0,
        Math.min(
          placement.x - status.room.x,
          status.room.x + status.room.width - (placement.x + geometry.width),
          placement.y - status.room.y,
          status.room.y + status.room.height - (placement.y + geometry.height),
        ) * metric,
      )
    }

    let furnitureDistance: number | null = null
    for (const other of activeLayout.placements) {
      if (other.id === placement.id) continue
      const otherGeometry = geometryFor(other)
      const dx = Math.max(other.x - (placement.x + geometry.width), placement.x - (other.x + otherGeometry.width), 0)
      const dy = Math.max(other.y - (placement.y + geometry.height), placement.y - (other.y + otherGeometry.height), 0)
      const distance = Math.hypot(dx, dy) * metric
      furnitureDistance = furnitureDistance === null ? distance : Math.min(furnitureDistance, distance)
    }
    for (const fixture of fixedFixtures) {
      const dx = Math.max(fixture.x - (placement.x + geometry.width), placement.x - (fixture.x + fixture.width), 0)
      const dy = Math.max(fixture.y - (placement.y + geometry.height), placement.y - (fixture.y + fixture.height), 0)
      const distance = Math.hypot(dx, dy) * metric
      furnitureDistance = furnitureDistance === null ? distance : Math.min(furnitureDistance, distance)
    }
    return { wallDistance, furnitureDistance }
  }

  const updateActivePlacements = (updater: (placements: Placement[]) => Placement[]) => {
    setPlanner((current) => ({
      ...current,
      layouts: current.layouts.map((layout) =>
        layout.id === current.activeLayoutId ? { ...layout, placements: updater(layout.placements) } : layout,
      ),
    }))
  }

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse())
    return { x: transformed.x, y: transformed.y }
  }

  const handleFurniturePointerDown = (event: ReactPointerEvent<SVGGElement>, placement: Placement) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = toSvgPoint(event.clientX, event.clientY)
    dragRef.current = { id: placement.id, startX: point.x, startY: point.y, originX: placement.x, originY: placement.y }
    setSelectedPlacementId(placement.id)
    setActiveTab('selection')
  }

  const handleSvgPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = { startClientX: event.clientX, startClientY: event.clientY, originX: viewBox.x, originY: viewBox.y }
    setSelectedPlacementId(null)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      const point = toSvgPoint(event.clientX, event.clientY)
      const nextX = Math.round((dragRef.current.originX + point.x - dragRef.current.startX) / 20) * 20
      const nextY = Math.round((dragRef.current.originY + point.y - dragRef.current.startY) / 20) * 20
      updateActivePlacements((placements) =>
        placements.map((placement) => {
          if (placement.id !== dragRef.current?.id) return placement
          const geometry = geometryFor(placement)
          const room = pointInRoom(nextX + geometry.width / 2, nextY + geometry.height / 2)
          return { ...placement, x: nextX, y: nextY, roomId: room?.id ?? placement.roomId }
        }),
      )
      return
    }
    if (panRef.current) {
      const svg = svgRef.current
      if (!svg) return
      const factorX = viewBox.width / svg.clientWidth
      const factorY = viewBox.height / svg.clientHeight
      setViewBox((current) => ({
        ...current,
        x: panRef.current!.originX - (event.clientX - panRef.current!.startClientX) * factorX,
        y: panRef.current!.originY - (event.clientY - panRef.current!.startClientY) * factorY,
      }))
    }
  }

  const endPointerAction = () => {
    dragRef.current = null
    panRef.current = null
  }

  const zoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'fit') {
      setViewBox({ x: -320, y: -320, width: 10840, height: 10790 })
      return
    }
    setViewBox((current) => {
      const factor = direction === 'in' ? 0.82 : 1.22
      const maxWidth = 13500
      const minWidth = 4200
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, current.width * factor))
      const ratio = nextWidth / current.width
      const nextHeight = current.height * ratio
      return {
        x: current.x + (current.width - nextWidth) / 2,
        y: current.y + (current.height - nextHeight) / 2,
        width: nextWidth,
        height: nextHeight,
      }
    })
  }

  const selectTab = (tab: TabKey) => {
    setActiveTab(tab)
    if (tab === 'selection' && !selectedPlacementId) setActiveTab('furniture')
  }

  const rotateSelected = () => {
    if (!selectedPlacement) return
    updateActivePlacements((placements) =>
      placements.map((placement) =>
        placement.id === selectedPlacement.id ? { ...placement, rotation: placement.rotation === 0 ? 90 : 0 } : placement,
      ),
    )
  }

  const deleteSelected = () => {
    if (!selectedPlacement) return
    updateActivePlacements((placements) => placements.filter((placement) => placement.id !== selectedPlacement.id))
    setSelectedPlacementId(null)
    setActiveTab('furniture')
  }

  const placeProduct = (product: Product, roomId = 'living') => {
    const room = rooms.find((item) => item.id === roomId) ?? rooms[4]
    const id = makeId('placement')
    const width = product.widthMm / metric
    const height = product.depthMm / metric
    const placement: Placement = {
      id,
      productId: product.id,
      x: Math.round((room.x + (room.width - width) / 2) / 20) * 20,
      y: Math.round((room.y + (room.height - height) / 2) / 20) * 20,
      rotation: 0,
      roomId: room.id,
    }
    updateActivePlacements((placements) => [...placements, placement])
    setSelectedPlacementId(id)
    setActiveTab('selection')
  }

  const duplicateLayout = () => {
    const id = makeId('layout')
    const nextName = planner.layouts.length === 1 ? 'B안 · 대안' : `${String.fromCharCode(65 + planner.layouts.length)}안`
    const duplicated: Layout = {
      id,
      name: nextName,
      placements: activeLayout.placements.map((placement) => ({ ...placement, id: makeId('placement') })),
    }
    setPlanner((current) => ({ ...current, layouts: [...current.layouts, duplicated], activeLayoutId: id }))
    setSelectedPlacementId(null)
  }

  const layoutBudget = (layout: Layout) =>
    layout.placements.reduce((sum, placement) => {
      const product = productById.get(placement.productId)
      return sum + (product?.status === 'candidate' ? product.price ?? 0 : 0)
    }, 0)

  const selectedStatus = selectedPlacement ? placementStatus(selectedPlacement) : null
  const selectedDistances = selectedPlacement ? distanceSummary(selectedPlacement) : null
  const overallWarning = activeLayout.placements.some((placement) => {
    const status = placementStatus(placement)
    return status.outside || status.overlap || Boolean(status.passageCollision)
  })
  const passageWarning = activeLayout.placements.some((placement) => Boolean(placementStatus(placement).passageCollision))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><House size={19} strokeWidth={2.3} /></span>
          <div>
            <strong>목감 퍼스트리움</strong>
            <span>85A1 가구 배치</span>
          </div>
        </div>
        <div className="header-actions">
          <label className="layout-select">
            <span className="sr-only">배치안 선택</span>
            <select
              value={planner.activeLayoutId}
              onChange={(event) => {
                setPlanner((current) => ({ ...current, activeLayoutId: event.target.value }))
                setSelectedPlacementId(null)
              }}
            >
              {planner.layouts.map((layout) => <option value={layout.id} key={layout.id}>{layout.name}</option>)}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
          <div className={`save-state ${saveState}`} aria-live="polite">
            {saveState === 'saved' ? <Check size={14} /> : saveState === 'error' ? <CircleAlert size={14} /> : <span className="saving-dot" />}
            <span>{saveState === 'saved' ? '저장됨' : saveState === 'error' ? '저장 실패' : '저장 중'}</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="canvas-column" aria-label="85A1 평면도 편집 영역">
          <div className="canvas-meta">
            <div className={`fit-summary ${overallWarning ? 'warning' : 'success'}`}>
              {overallWarning ? <CircleAlert size={17} /> : <Check size={17} />}
              <div>
                <strong>{overallWarning ? '확인이 필요한 배치예요' : '평면상 배치 가능'}</strong>
                <span>{passageWarning ? '가구가 주요 통로를 막고 있어요' : overallWarning ? '겹침 또는 방 경계를 확인하세요' : '주요 통로가 확보된 배치예요'}</span>
              </div>
            </div>
            <div className="drawing-badge"><span>△</span> 1407동 A1 · 방향 확인 필요</div>
          </div>

          <div className="plan-stage">
            <svg
              ref={svgRef}
              className="floorplan"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              role="img"
              aria-label="목감 퍼스트리움 85A1 참고 평면도. 가구를 드래그해 이동할 수 있습니다."
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointerAction}
              onPointerCancel={endPointerAction}
            >
              <defs>
                <pattern id="minorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#dfe4df" strokeWidth="5" />
                </pattern>
                <filter id="furnitureShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="20" stdDeviation="20" floodColor="#142a26" floodOpacity=".16" />
                </filter>
                <pattern id="fixtureHatch" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="80" height="80" fill="#d7ddd8" />
                  <line x1="0" y1="0" x2="0" y2="80" stroke="#9da9a3" strokeWidth="22" />
                </pattern>
              </defs>
              <rect x="-1200" y="-1200" width="12600" height="12550" fill="url(#minorGrid)" />
              <g className="rooms">
                <path className="shared-floor" d="M1700 3690H2900V1350H6400V3070H8000V5930H7300V8370H3500V5930H1700Z" />
                {rooms.map((room) => (
                  <g key={room.id}>
                    <rect className={`room room-${room.tone}`} x={room.x} y={room.y} width={room.width} height={room.height} />
                    <text className="room-label" x={room.x + 120} y={room.y + 250}>{room.name}</text>
                    <text className="room-size" x={room.x + 120} y={room.y + 440}>{Math.round(room.width * metric).toLocaleString()} × {Math.round(room.height * metric).toLocaleString()}</text>
                  </g>
                ))}
                <path className="outer-wall" d={`M0 0H6400V3070H8000V3640H${PLAN_WIDTH}V${PLAN_HEIGHT}H7300V8800H7300V8370H3500V8370H0Z`} />
                <g className="door-lines" aria-hidden="true">
                  <path d="M2900 4900h-720a720 720 0 0 0 720 720" />
                  <path d="M3500 5930v-720a720 720 0 0 0-720 720" />
                  <path d="M7300 5930v-720a720 720 0 0 1 720 720" />
                  <path d="M8000 4200h-720a720 720 0 0 1 720-720" />
                </g>
              </g>
              <g className="passage-layer" aria-label="주요 생활 통로">
                {passages.map((passage) => (
                  <g key={passage.id} className={`passage passage-${passage.kind}`}>
                    <rect x={passage.x} y={passage.y} width={passage.width} height={passage.height} rx="120" />
                    {passage.kind === 'main' && (
                      <text x={passage.x + passage.width / 2} y={passage.y + passage.height / 2} textAnchor="middle" dominantBaseline="central">통로</text>
                    )}
                  </g>
                ))}
              </g>
              <g className="fixed-fixture-layer" aria-label="기본 고정 설비">
                {fixedFixtures.map((fixture) => (
                  <g key={fixture.id} className="fixed-fixture">
                    <rect x={fixture.x} y={fixture.y} width={fixture.width} height={fixture.height} rx="55" />
                    <text className="fixture-kicker" x={fixture.x + fixture.width / 2} y={fixture.y + fixture.height / 2 - 55} textAnchor="middle">고정 · △ 참고</text>
                    <text className="fixture-name" x={fixture.x + fixture.width / 2} y={fixture.y + fixture.height / 2 + 115} textAnchor="middle">{fixture.name}</text>
                  </g>
                ))}
              </g>
              <g className="furniture-layer">
                {activeLayout.placements.map((placement) => {
                  const product = productById.get(placement.productId)
                  if (!product) return null
                  const geometry = geometryFor(placement)
                  const status = placementStatus(placement)
                  const selected = placement.id === selectedPlacementId
                  return (
                    <g
                      key={placement.id}
                      data-furniture="true"
                      className={`furniture ${selected ? 'selected' : ''} ${status.outside || status.overlap || status.passageCollision ? 'invalid' : ''}`}
                      transform={`translate(${placement.x} ${placement.y})`}
                      onPointerDown={(event) => handleFurniturePointerDown(event, placement)}
                      role="button"
                      aria-label={`${product.name}, ${product.widthMm} × ${product.depthMm} mm${status.outside || status.overlap || status.passageCollision ? ', 배치 경고' : ''}`}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedPlacementId(placement.id)
                          setActiveTab('selection')
                        }
                      }}
                    >
                      <rect width={geometry.width} height={geometry.height} rx="100" filter="url(#furnitureShadow)" />
                      <text className="furniture-name" x={geometry.width / 2} y={geometry.height / 2 - 45} textAnchor="middle">{product.name}</text>
                      <text className="furniture-size" x={geometry.width / 2} y={geometry.height / 2 + 125} textAnchor="middle">{product.widthMm} × {product.depthMm}</text>
                      {(status.outside || status.overlap || status.passageCollision) && (
                        <g transform={`translate(${geometry.width - 150} 150)`}>
                          <circle r="145" className="warning-dot" />
                          <text textAnchor="middle" dominantBaseline="central" className="warning-mark">!</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>

            <div className="zoom-controls" aria-label="도면 확대 축소">
              <button type="button" onClick={() => zoom('in')} aria-label="확대"><Plus size={18} /></button>
              <button type="button" onClick={() => zoom('out')} aria-label="축소"><Minus size={18} /></button>
              <button type="button" onClick={() => zoom('fit')} aria-label="전체 보기">맞춤</button>
            </div>
          <div className="plan-hint">빈 공간을 드래그하면 도면이 이동해요</div>
          <div className="plan-legends">
            <div className="fixture-legend"><span /> 고정 설비</div>
            <div className="passage-legend"><span /> 확보할 통로</div>
          </div>
          </div>

          {selectedPlacement && selectedProduct && (
            <div className="floating-selection-bar" aria-label="선택 가구 빠른 작업">
              <div>
                <span>선택됨</span>
                <strong>{selectedProduct.name}</strong>
              </div>
              <button type="button" onClick={rotateSelected}><RotateCw size={18} /><span>90°</span></button>
              <button type="button" className="danger-quiet" onClick={deleteSelected}><Trash2 size={18} /><span>삭제</span></button>
            </div>
          )}
        </section>

        <aside className="control-panel" aria-label="가구와 배치 도구">
          <nav className="panel-tabs" aria-label="편집 도구">
            <TabButton active={activeTab === 'furniture'} onClick={() => selectTab('furniture')} icon={<Armchair size={18} />} label="가구" />
            <TabButton active={activeTab === 'selection'} onClick={() => selectTab('selection')} icon={<Ruler size={18} />} label="선택" disabled={!selectedPlacement} />
            <TabButton active={activeTab === 'layouts'} onClick={() => selectTab('layouts')} icon={<Layers3 size={18} />} label="배치안" />
            <TabButton active={activeTab === 'info'} onClick={() => selectTab('info')} icon={<BadgeInfo size={18} />} label="도면 정보" />
          </nav>

          <div className="panel-content">
            {activeTab === 'furniture' && (
              <FurniturePanel products={planner.products} onPlace={placeProduct} onAdd={() => setShowAdd(true)} />
            )}
            {activeTab === 'selection' && selectedPlacement && selectedProduct && selectedStatus && selectedDistances && (
              <SelectionPanel
                product={selectedProduct}
                placement={selectedPlacement}
                status={selectedStatus}
                distances={selectedDistances}
                onRotate={rotateSelected}
                onDelete={deleteSelected}
              />
            )}
            {activeTab === 'layouts' && (
              <LayoutsPanel
                planner={planner}
                activeLayout={activeLayout}
                budgetFor={layoutBudget}
                onSelect={(id) => setPlanner((current) => ({ ...current, activeLayoutId: id }))}
                onDuplicate={duplicateLayout}
                onRename={(name) => setPlanner((current) => ({
                  ...current,
                  layouts: current.layouts.map((layout) => layout.id === current.activeLayoutId ? { ...layout, name } : layout),
                }))}
                onDelete={() => {
                  if (planner.layouts.length === 1) return
                  const remaining = planner.layouts.filter((layout) => layout.id !== activeLayout.id)
                  setPlanner((current) => ({ ...current, layouts: remaining, activeLayoutId: remaining[0].id }))
                  setSelectedPlacementId(null)
                }}
              />
            )}
            {activeTab === 'info' && (
              <InfoPanel
                measured={planner.measuredReferenceMm}
                onMeasuredChange={(value) => setPlanner((current) => ({ ...current, measuredReferenceMm: value }))}
              />
            )}
          </div>
        </aside>
      </main>

      {noticeVisible && (
        <div className="first-notice" role="status">
          <div className="notice-icon"><Ruler size={21} /></div>
          <div>
            <strong>이 도면은 배치 검토용 참고 도면이에요</strong>
            <p>실제 구매 전 설치 위치, 문폭, 엘리베이터와 반입 경로를 직접 확인해주세요.</p>
          </div>
          <button
            type="button"
            aria-label="안내 닫기"
            onClick={() => {
              sessionStorage.setItem('mokgam-notice-seen', '1')
              setNoticeVisible(false)
            }}
          ><X size={18} /></button>
        </div>
      )}

      {showAdd && (
        <AddFurnitureDialog
          onClose={() => setShowAdd(false)}
          onSubmit={(product, roomId) => {
            setPlanner((current) => ({ ...current, products: [...current.products, product] }))
            window.setTimeout(() => placeProduct(product, roomId), 0)
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick} disabled={disabled}>
      {icon}<span>{label}</span>
    </button>
  )
}

function FurniturePanel({ products, onPlace, onAdd }: { products: Product[]; onPlace: (product: Product) => void; onAdd: () => void }) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <div><span className="eyebrow">내 가구</span><h2>배치할 가구</h2></div>
        <button className="primary compact" type="button" onClick={onAdd}><Plus size={17} /> 추가</button>
      </div>
      <p className="section-intro">가구를 선택하면 거실 중앙에 실제 크기로 놓여요.</p>
      <div className="product-list">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className={`product-icon category-${product.category}`}><Sofa size={20} /></div>
            <div className="product-copy">
              <div className="product-title-row">
                <strong>{product.name}</strong>
                <span className={`status-chip ${product.status}`}>{product.status === 'candidate' ? '구매 후보' : '보유 중'}</span>
              </div>
              <span>{product.widthMm.toLocaleString()} × {product.depthMm.toLocaleString()} mm</span>
              {product.price ? <b>{formatWon(product.price)}</b> : <b className="muted">가격 미입력</b>}
            </div>
            <button type="button" className="outline compact" onClick={() => onPlace(product)}>배치</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function SelectionPanel({
  product,
  placement,
  status,
  distances,
  onRotate,
  onDelete,
}: {
  product: Product
  placement: Placement
  status: { outside: boolean; overlap: boolean; room?: Room; fixtureCollision?: FixedFixture; passageCollision?: Passage }
  distances: { wallDistance: number | null; furnitureDistance: number | null }
  onRotate: () => void
  onDelete: () => void
}) {
  const safe = !status.outside && !status.overlap && !status.passageCollision
  return (
    <section className="panel-section">
      <span className="eyebrow">선택한 가구</span>
      <h2>{product.name}</h2>
      <div className={`placement-result ${safe ? 'safe' : 'unsafe'}`}>
        {safe ? <Check size={20} /> : <CircleAlert size={20} />}
        <div>
          <strong>{safe ? '평면상 배치 가능' : '배치를 확인해주세요'}</strong>
          <span>{status.outside ? '가구가 방 경계를 벗어났어요.' : status.fixtureCollision ? `${status.fixtureCollision.name}과 겹쳐 있어요.` : status.passageCollision ? `${status.passageCollision.name}를 막고 있어요.` : status.overlap ? '다른 가구와 겹쳐 있어요.' : `${status.room?.name ?? '공간'} 안에서 통로를 확보했어요.`}</span>
        </div>
      </div>
      <div className="metric-grid">
        <div><span>크기</span><strong>{product.widthMm.toLocaleString()} × {product.depthMm.toLocaleString()}</strong><small>mm</small></div>
        <div><span>회전</span><strong>{placement.rotation}°</strong><small>현재 방향</small></div>
        <div><span>가까운 벽</span><strong>{distances.wallDistance === null ? '—' : Math.round(distances.wallDistance).toLocaleString()}</strong><small>mm 여유</small></div>
        <div><span>가까운 가구·고정물</span><strong>{distances.furnitureDistance === null ? '—' : Math.round(distances.furnitureDistance).toLocaleString()}</strong><small>mm 여유</small></div>
      </div>
      <div className="action-row">
        <button type="button" className="primary" onClick={onRotate}><RotateCw size={18} /> 90° 회전</button>
        <button type="button" className="danger" onClick={onDelete}><Trash2 size={18} /> 삭제</button>
      </div>
      {product.url && <a className="product-link" href={product.url} target="_blank" rel="noreferrer">제품 페이지 열기 <ExternalLink size={15} /></a>}
      <div className="fine-print"><CircleAlert size={15} /> 몰딩, 문 열림, 세대 밖 배송 반입 경로는 판정에 포함되지 않아요.</div>
    </section>
  )
}

function LayoutsPanel({ planner, activeLayout, budgetFor, onSelect, onDuplicate, onRename, onDelete }: {
  planner: PlannerState
  activeLayout: Layout
  budgetFor: (layout: Layout) => number
  onSelect: (id: string) => void
  onDuplicate: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <div><span className="eyebrow">A/B 비교</span><h2>배치안</h2></div>
        <button className="primary compact" type="button" onClick={onDuplicate}><Copy size={16} /> 현재 안 복제</button>
      </div>
      <p className="section-intro">복제한 안은 원본과 별도로 수정돼요.</p>
      <div className="layout-list">
        {planner.layouts.map((layout, index) => (
          <button type="button" className={`layout-card ${layout.id === activeLayout.id ? 'active' : ''}`} key={layout.id} onClick={() => onSelect(layout.id)}>
            <span className="layout-letter">{String.fromCharCode(65 + index)}</span>
            <div><strong>{layout.name}</strong><span>{layout.placements.length}개 배치 · {formatWon(budgetFor(layout))}</span></div>
            {layout.id === activeLayout.id && <Check size={18} />}
          </button>
        ))}
      </div>
      <label className="field-label">
        <span>현재 배치안 이름</span>
        <input value={activeLayout.name} onChange={(event) => onRename(event.target.value)} />
      </label>
      <div className="budget-card">
        <span>구매 후보 예상 비용</span>
        <strong>{formatWon(budgetFor(activeLayout))}</strong>
        <small>이 배치안에 놓인 구매 후보만 합산</small>
      </div>
      <button className="text-danger" type="button" disabled={planner.layouts.length === 1} onClick={onDelete}><Trash2 size={16} /> 현재 배치안 삭제</button>
    </section>
  )
}

function InfoPanel({ measured, onMeasuredChange }: { measured: number; onMeasuredChange: (value: number) => void }) {
  const difference = measured - DRAWING_REFERENCE_MM
  return (
    <section className="panel-section">
      <span className="eyebrow">도면 신뢰도</span>
      <h2>기준과 실측</h2>
      <div className="source-card">
        <div><span className="source-symbol">△</span><div><strong>1407동 59.80A1 구조 확인</strong><span>2015년 1407동 실세대 사전점검 도면 기준</span></div></div>
        <p>방·욕실·주방·현관·발코니와 중앙 통로 구조는 확인했습니다. 공개 글은 방문한 호수를 밝히지 않아 1호 라인의 좌우 방향은 아직 확정하지 않았습니다.</p>
      </div>
      <div className="passage-info-card">
        <div><Ruler size={18} /><strong>통로 검사 적용</strong></div>
        <p>현관 진입, 중앙 연결부, 거실, 주방과 각 침실 출입부를 통행 영역으로 표시합니다. 가구가 영역을 침범하면 배치 경고가 표시됩니다.</p>
        <small>통로 폭은 공개 도면을 바탕으로 잡은 참고 영역이며 실제 유효 폭은 현장 실측이 필요합니다.</small>
      </div>
      <div className="fixture-source-card">
        <div className="fixture-source-heading"><Check size={18} /><strong>기본 고정 설비 확인</strong></div>
        {fixedFixtures.map((fixture) => (
          <div className="fixture-source-row" key={fixture.id}>
            <div><strong>{fixture.name}</strong><span>{fixture.verifiedBy}</span></div>
            <span className="reference-chip">치수 △ 참고</span>
          </div>
        ))}
        <a href="https://apt2you.tistory.com/56" target="_blank" rel="noreferrer">59A1 사전점검 근거 보기 <ExternalLink size={14} /></a>
        <p>설치 여부는 확인했지만 정확한 위치와 깊이는 실측 전까지 참고값으로 적용합니다.</p>
      </div>
      <div className="calibration-card">
        <div className="calibration-heading"><Ruler size={18} /><strong>거실 기준 벽 축척 보정</strong></div>
        <div className="compare-values">
          <div><span>도면값</span><strong>{DRAWING_REFERENCE_MM.toLocaleString()} mm</strong><small>△ 도면</small></div>
          <div className="compare-arrow">→</div>
          <label><span>실측값</span><div className="number-input"><input type="number" min="1000" max="10000" value={measured} onChange={(event) => onMeasuredChange(Math.max(1000, Number(event.target.value) || DRAWING_REFERENCE_MM))} /><b>mm</b></div><small>✓ 실측</small></label>
        </div>
        <p>전체 도면의 거리 계산에 {difference === 0 ? '변경 없이' : `${Math.abs(difference).toLocaleString()} mm ${difference > 0 ? '늘려' : '줄여'}`} 적용돼요. 개별 벽 모양은 바뀌지 않아요.</p>
      </div>
      <div className="data-note">
        <BadgeInfo size={18} />
        <div><strong>이 기기에 자동 저장돼요</strong><p>브라우저 데이터를 지우거나 다른 기기에서 열면 배치가 보이지 않을 수 있습니다.</p></div>
      </div>
      <div className="limits-list">
        <strong>결과에 포함되지 않는 항목</strong>
        <ul>
          <li>현관·방문·엘리베이터 크기와 배송 반입 동선</li>
          <li>몰딩, 걸레받이, 문 열림, 콘센트 위치</li>
          <li>실제 세대별 시공 오차와 옵션 차이</li>
        </ul>
      </div>
    </section>
  )
}

function AddFurnitureDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (product: Product, roomId: string) => void }) {
  const [error, setError] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const widthMm = Number(data.get('widthMm'))
    const depthMm = Number(data.get('depthMm'))
    if (!name || widthMm <= 0 || depthMm <= 0) {
      setError('제품명, 가로, 깊이를 올바르게 입력해주세요.')
      return
    }
    onSubmit({
      id: makeId('product'),
      name,
      category: String(data.get('category') ?? '기타'),
      widthMm,
      depthMm,
      heightMm: Number(data.get('heightMm')) || undefined,
      price: Number(data.get('price')) || undefined,
      url: String(data.get('url') ?? '').trim() || undefined,
      status: data.get('status') as FurnitureStatus,
    }, String(data.get('roomId') ?? 'living'))
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog-sheet" role="dialog" aria-modal="true" aria-labelledby="add-title">
        <div className="dialog-heading"><div><span className="eyebrow">직접 입력</span><h2 id="add-title">새 가구 추가</h2></div><button type="button" aria-label="닫기" onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={submit}>
          <label className="field-label full"><span>제품명 *</span><input name="name" placeholder="예: 3인 패브릭 소파" autoFocus /></label>
          <div className="field-row three">
            <label className="field-label"><span>가로 *</span><div className="number-input"><input name="widthMm" type="number" min="1" inputMode="numeric" placeholder="2400" /><b>mm</b></div></label>
            <label className="field-label"><span>깊이 *</span><div className="number-input"><input name="depthMm" type="number" min="1" inputMode="numeric" placeholder="950" /><b>mm</b></div></label>
            <label className="field-label"><span>높이</span><div className="number-input"><input name="heightMm" type="number" min="1" inputMode="numeric" placeholder="720" /><b>mm</b></div></label>
          </div>
          <div className="field-row">
            <label className="field-label"><span>카테고리</span><select name="category"><option>소파</option><option>침대</option><option>식탁</option><option>책상</option><option>수납</option><option>가전</option><option>기타</option></select></label>
            <label className="field-label"><span>상태</span><select name="status"><option value="candidate">구매 후보</option><option value="owned">보유 중</option></select></label>
          </div>
          <div className="field-row">
            <label className="field-label"><span>가격</span><div className="number-input"><input name="price" type="number" min="0" inputMode="numeric" placeholder="0" /><b>원</b></div></label>
            <label className="field-label"><span>처음 놓을 공간</span><select name="roomId">{rooms.filter((room) => room.id !== 'balcony').map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
          </div>
          <label className="field-label full"><span>제품 URL</span><input name="url" type="url" inputMode="url" placeholder="https://" /></label>
          {error && <div className="form-error"><CircleAlert size={16} /> {error}</div>}
          <div className="dialog-actions"><button type="button" className="outline" onClick={onClose}>취소</button><button type="submit" className="primary"><Plus size={18} /> 추가하고 배치</button></div>
        </form>
      </section>
    </div>
  )
}

export default App
