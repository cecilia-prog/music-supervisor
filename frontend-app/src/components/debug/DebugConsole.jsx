import { useEffect, useState, useRef } from 'react'
import { Hook, Unhook, Console } from 'console-feed'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function DebugConsole({ maxLogs = 200 }) {
  const [logs, setLogs] = useState([])
  const [follow, setFollow] = useState(true)
  const containerRef = useRef(null)

  const shouldLog = (log) => {
    const msg = log.data.join(' ')
    if (msg.startsWith('[vite]')) return false
    if (!msg.includes('[logger]')) return false
    return true
  }

  const onClear = () => {
    setLogs([])
  }

  const pushLog = (log) => {
    if (!shouldLog(log)) return

    setLogs((curr) => {
      const next = [...curr, log]
      if (next.length > maxLogs) {
        next.splice(0, next.length - maxLogs)
      }
      return next
    })
  }

  // autoScroll
  useEffect(() => {
    console.log('follow:', follow)
    if (!follow || !containerRef.current) return

    const el = containerRef.current
    el.scrollTop = el.scrollHeight
  }, [logs, follow])

  useEffect(() => {
    const hookedConsole = Hook(window.console, (log) => pushLog(log), false)

    return () => {
      Unhook(hookedConsole)
    }
  }, [])

  return (
    <section className='bg-white rounded-md shadow-md px-4 pb-4 w-[690px] h-64 overflow-auto flex flex-col gap-4'>
      <div className='sticky top-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur px-3 py-2 border-b border-gray-200'>
        <div className='text-md font-medium'>Debug Console</div>
        <div className='flex items-center gap-3'>
          <Label className='flex items-center gap-1 text-xs'>
            <Checkbox
              type='checkbox'
              size='sm'
              checked={follow}
              className=''
              onCheckedChange={/** @param {boolean} checked */( checked) => {
                setFollow(checked)
              }}
            />
            {follow}
            Follow
          </Label>
          <Button
            onClick={onClear}
            variant='outline'
            size='sm'
            className='text-xs'
          >
            Clear
          </Button>
          <span className='text-[11px] text-gray-500'>
            {logs.length}/{maxLogs}
          </span>
        </div>
      </div>

      {logs.length === 0 && (
        <p className='text-xs font-thin text-gray-400 font-mono pl-6'>
          No logs yet...
        </p>
      )}

      <div
        ref={containerRef}
        className='h-[calc(16rem-40px)] overflow-auto py-1'
      >
        <Console logs={logs} variant='light' />
      </div>
    </section>
  )
}
