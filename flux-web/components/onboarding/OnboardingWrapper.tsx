'use client'

import { useState } from 'react'
import OnboardingModal from './OnboardingModal'

export default function OnboardingWrapper() {
  const [show, setShow] = useState(true)
  if (!show) return null
  return <OnboardingModal onDone={() => setShow(false)} />
}
