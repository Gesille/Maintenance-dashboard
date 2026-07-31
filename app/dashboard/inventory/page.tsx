import { PartListPanel } from '@/component/PartListPanel'
import { Part } from '@/types/Part'
import React from 'react'

const page = () => {
  return (
    <div>
      <PartListPanel parts={[]} selectedId={null} onSelect={function (part: Part): void {
        throw new Error('Function not implemented.')
      } } onNew={function (): void {
        throw new Error('Function not implemented.')
      } } />
    </div>
  )
}

export default page
