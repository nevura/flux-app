'use client'

import { useState, useEffect } from 'react'
import OnboardingModal from './OnboardingModal'

export default function OnboardingWrapper() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    localStorage.setItem('flux_onboarding_open', '1')
    return () => localStorage.removeItem('flux_onboarding_open')
  }, [])

  if (!show) return null
  return (
    <OnboardingModal
      onDone={() => {
        localStorage.removeItem('flux_onboarding_open')
        setShow(false)
      }}
    />
  )
}
