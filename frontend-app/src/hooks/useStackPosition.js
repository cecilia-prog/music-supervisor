import { useState, useEffect, useRef } from 'react'

/**
 * @typedef {Object} StackedPositionsOptions
 * @property {number} [rightMargin=20] - Left margin from screen edge
 * @property {number} [topMargin=20] - Top margin from screen top
 * @property {number} [itemMargin=10] - Margin between stacked items
 * @property {boolean} [recalcOnResize=true] - Whether to recalculate on resize
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/** @typedef {React.Dispatch<React.SetStateAction<Position>>} PositionDispatcher */
/** @typedef {(index: number) => React.Ref<HTMLElement>} GetRef */

/** @typedef {{positions: Position[], getRef: GetRef}} StackedPositionsResult */

/**
 * Hook for calculating stacked absolute positions of elements
 * @template T
 * @param {T[]} items - Array of items to stack
 * @param {StackedPositionsOptions} [options={}] - Configuration options
 * @returns {StackedPositionsResult} - Positions and ref callback
 */
export function useStackedPositions(items, options = {}) {
  const {
    rightMargin = 20,
    topMargin = 20,
    itemMargin = 10,
    recalcOnResize = true,
  } = options

  const [viewport, setViewport] = useState({ width: window.innerWidth })
  const [positions, setPositions] = useState([])

  const elementRefs = items.map(() => useRef(null))

  useEffect(() => {
    if (!recalcOnResize) return

    const handleResize = () => setViewport({ width: window.innerWidth })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [recalcOnResize])

  useEffect(() => {
    const newPositions = []
    let currentY = topMargin

    elementRefs.forEach((ref, index) => {
      if (ref) {
        const height = ref.current.getBoundingClientRect().height
        const rect = ref.current.getBoundingClientRect()

        newPositions[index] = {
          x: viewport.width - rightMargin - rect.width,
          y: currentY,
        }

        currentY += height + itemMargin
      }
    })

    setPositions(newPositions)
  }, [items, viewport.width, rightMargin, topMargin, itemMargin])

  /** @param {number} index - Index of the item */
  const getRef = (index) => elementRefs[index]

  return { positions, getRef }
}
