'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getTransactionModalData } from '@/actions/transactions'
import TransactionModal from '@/components/transactions/TransactionModal'
import type { AccountWithBalance, Category, Person } from '@/lib/types'

interface ModalData { accounts: AccountWithBalance[]; categories: Category[]; people: Person[] }

export default function GlobalFAB() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ModalData | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!data) {
      setLoading(true)
      const result = await getTransactionModalData()
      setData(result)
      setLoading(false)
    }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed z-[55] flex items-center justify-center rounded-full active:scale-90 transition-transform"
        style={{
          width: 56,
          height: 56,
          right: '0.75rem',
          bottom: 'calc(1rem + var(--safe-bottom))',
          background: 'var(--f-blue)',
          boxShadow: 'var(--f-shadow-accent)',
        }}
      >
        {loading
          ? <i className="fa-solid fa-spinner fa-spin text-white text-lg" />
          : <i className="fa-solid fa-plus text-white text-lg" />}
      </button>
      {open && data && createPortal(
        <TransactionModal
          transaction={null}
          accounts={data.accounts}
          categories={data.categories}
          people={data.people}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  )
}
