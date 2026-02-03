import { useState, useEffect } from 'react'

/** @typedef {{width: number, height: number}} Viewport */
/** @typedef {React.Dispatch<React.SetStateAction<Viewport>>} ViewportDispatcher */

/** Custom hook to get the current viewport size and update on resize
 * @return {Viewport} The current viewport dimensions
 * */

export function useViewport() {
  /** @type {[Viewport, ViewportDispatcher]} */
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}
