import { useRef, useEffect } from 'react'
import Draggable from 'react-draggable'

/** @typedef {import('./debug/Debug.jsx').DebugItem} DebugItem */
/** @typedef {import('./debug/Debug.jsx').DebugDispatcher} Dispatcher */
/** @typedef {import('../hooks/useStackPosition.js').StackedPositionsResult} Stack */

/** @param {{item: DebugItem, select: Dispatcher, stack: Object, children: React.ReactNode}} props */
export default function DraggableComponent({ item, select, stack, children }) {
  const handleMouseDown = () => {
    select((prev) => {
      return prev.map((i) =>
        i.id === item.id ? { ...i, selected: true } : { ...i, selected: false },
      )
    })
  }

  const classes = item.selected
    ? 'border border-neutral-400 z-10 shadow-md transition-shadow duration-200'
    : 'border-0 z-1 shadow-sm transition-shadow duration-200'

  return (
    <Draggable
      defaultPosition={stack.postion}
      key={item.id}
      nodeRef={stack.ref}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={stack.ref}
        style={{ top: stack.position?.y, left: stack.position?.x }}
        className={`${classes} bg-white w-fit absolute rounded-md cursor-move ${item.visible && 'hidden'}`}
      >
        {children}
      </div>
    </Draggable>
  )
}
