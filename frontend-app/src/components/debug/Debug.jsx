import React, { useState } from 'react'

import AgentManager from './DebugAgentManager.jsx'
import DebugConsole from './DebugConsole.jsx'
import DraggableComponent from '../DraggableComponent.jsx'
import DebugMenu from './DebugMenu.jsx'
import { useStackedPositions } from '../../hooks/useStackPosition.js'

/** @typedef {'agent-manager' | 'debug-console'} DraggableId */
/** @typedef {{id: DraggableId, visible: boolean, index: number, selected: boolean}} DebugItem */
/** @typedef {React.Dispatch<React.SetStateAction<DraggableId>>} SelectDispatcher */
/** @typedef {React.Dispatch<React.SetStateAction<DebugItem[]>>} DebugDispatcher */

/** @type {DraggableId[]} */
const ITEMS = ['agent-manager', 'debug-console']
const COMPONENTS = [AgentManager, DebugConsole]

export default function Debug() {
  /** @type {[DebugItem[], DebugDispatcher]} */
  const [debugItems, setDebugItems] = useState(
    ITEMS.map((item, i) => ({
      index: i,
      id: item,
      visible: true,
      selected: i === 0,
    })),
  )

  const { positions, getRef } = useStackedPositions(debugItems, {
    rightMargin: 100,
    itemMargin: 15,
  })

  const render = () => {
    return debugItems.map((item) => {
      return (
        <DraggableComponent
          key={item.id}
          item={item}
          select={setDebugItems}
          stack={{
            position: positions[item.index],
            ref: getRef(item.index),
          }}
        >
          {React.createElement(COMPONENTS[item.index])}
        </DraggableComponent>
      )
    })
  }

  return (
    <>
      <DebugMenu items={debugItems} toggle={setDebugItems} />
      {render()}
    </>
  )
}
