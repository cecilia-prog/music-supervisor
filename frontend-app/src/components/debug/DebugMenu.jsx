import { Button } from '@/components/ui/button'
import { HatGlasses, Logs } from 'lucide-react'

/** @typedef {import('./Debug').DebugItem} DebugMenuItem */
/** @typedef {import('./Debug').DebugDispatcher} VisibilityDispatcher */

/** @param {{items: DebugMenuItem[], toggle: VisibilityDispatcher}} props */
export default function DebugMenu({ items, toggle }) {
  /** @param {DebugMenuItem} item */
  const handleClick = (item) => () => {
    toggle((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, visible: !item.visible } : i,
      ),
    )
  }

  const render = () => {
    return items.map((item) => {
      return (
        <Button
          key={item.index}
          size='icon'
          variant={item.visible ? 'outline' : 'secondary'}
          onClick={handleClick(item)}
          className
        >
          {item.id === 'agent-manager' && <HatGlasses />}
          {item.id === 'debug-console' && <Logs />}
        </Button>
      )
    })
  }

  return (
    <div className='fixed right-6 top-3 flex rounded-md flex-col p-1.5 gap-1.5 z-60 bg-white border border-gray-200 shadow-sm'>
      {render()}
    </div>
  )
}
