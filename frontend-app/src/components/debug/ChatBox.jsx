import { useState, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AgentConnectionContext } from '../../AgentContext'
import { AgentMessage } from '#lib/agent/agentMessages.js'

/**
 * ChatBox component for sending text messages to the agent
 * @returns {JSX.Element} The rendered chat box component
 */
export default function ChatBox() {
  const [message, setMessage] = useState('')
  const { connection } = useContext(AgentConnectionContext)
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || connection.status !== 'open') return

    // Send the text message using the agent connection
    connection?.agentConnRef?.current?.send(AgentMessage.userTextMessage(message))
    setMessage('')
  }

  return (
    <div className="w-[300px] bg-white rounded-lg shadow-lg p-4">
      <form onSubmit={handleSubmit} className="flex flex-row gap-2">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 min-h-20 resize-none"
          disabled={connection.status !== 'open'}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || connection.status !== 'open'}
          variant="default"
          size="default"
          className="self-end"
        >
          Send
        </Button>
      </form>
    </div>
  )
}