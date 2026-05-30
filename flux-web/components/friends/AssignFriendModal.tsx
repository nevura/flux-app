'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { getMyPeopleUnlinked, createLinkedPerson, linkPersonToUser } from '@/actions/friends'

interface Props {
  linkedUserId: string
  linkedUserName: string
  onClose: () => void
}

export default function AssignFriendModal({ linkedUserId, linkedUserName, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [people, setPeople] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    setMounted(true)
    getMyPeopleUnlinked().then(({ people }) => {
      setPeople(people)
      setLoading(false)
    })
  }, [])

  function handleLink(personId: string, personName: string) {
    startTransition(async () => {
      const res = await linkPersonToUser(personId, linkedUserId)
      if (res.error) { toast.error(res.error); return }
      toast.success(`${personName} vinculado con ${linkedUserName}`)
      onClose()
    })
  }

  function handleCreate() {
    const name = (newName.trim() || linkedUserName).trim()
    startTransition(async () => {
      const res = await createLinkedPerson(name, linkedUserId)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Contacto "${name}" creado`)
      onClose()
    })
  }

  const filtered = filter.trim()
    ? people.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    : people

  if (!mounted) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <div>
            <h2 className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>Asignar a contacto</h2>
            <p className="text-[14px] font-semibold mt-0.5" style={{ color: 'var(--f-text-4)' }}>
              ¿A quién conoces como <span style={{ color: 'var(--f-text)' }}>{linkedUserName}</span>?
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Create new */}
        {!creating ? (
          <button
            onClick={() => { setCreating(true); setNewName(linkedUserName) }}
            className="w-full flex items-center gap-3 px-5 py-3 active:opacity-70"
            style={{ borderBottom: '1px solid var(--f-line)' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--f-accent-bg)' }}>
              <i className="fa-solid fa-plus text-[14px]" style={{ color: 'var(--f-blue)' }} />
            </div>
            <p className="text-[16px] font-bold" style={{ color: 'var(--f-blue)' }}>Crear nuevo contacto</p>
          </button>
        ) : (
          <div className="px-5 py-3 flex gap-2" style={{ borderBottom: '1px solid var(--f-line)' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              placeholder={linkedUserName}
              className="flex-1 rounded-[12px] px-3 py-2.5 text-[16px] font-semibold outline-none"
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)' }}
            />
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-2 rounded-[12px] text-[14px] font-bold"
              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="px-3 py-2 rounded-[12px] text-[14px] font-bold text-white disabled:opacity-50 active:scale-95"
              style={{ background: 'var(--f-blue)' }}
            >
              {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Crear'}
            </button>
          </div>
        )}

        {/* Existing people list */}
        <div className="max-h-[50dvh] overflow-y-auto">
          {loading ? (
            <div className="py-10 flex justify-center">
              <i className="fa-solid fa-spinner fa-spin text-xl" style={{ color: 'var(--f-text-4)' }} />
            </div>
          ) : (
            <>
              {people.length > 4 && (
                <div className="px-5 pt-3 pb-2">
                  <input
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filtrar contactos..."
                    className="w-full rounded-[12px] px-3 py-2 text-[15px] font-semibold outline-none"
                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text)' }}
                  />
                </div>
              )}
              {filtered.length === 0 && !loading && (
                <p className="text-[15px] font-semibold text-center py-8" style={{ color: 'var(--f-text-4)' }}>
                  {filter ? 'No hay coincidencias' : 'Sin contactos existentes sin asignar'}
                </p>
              )}
              {filtered.map(person => (
                <button
                  key={person.id}
                  onClick={() => handleLink(person.id, person.name)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left active:opacity-70 disabled:opacity-50"
                  style={{ borderBottom: '1px solid var(--f-line)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                  >
                    {person.name[0].toUpperCase()}
                  </div>
                  <p className="flex-1 text-[16px] font-bold truncate" style={{ color: 'var(--f-text)' }}>
                    {person.name}
                  </p>
                  <i className="fa-solid fa-link text-sm" style={{ color: 'var(--f-text-4)' }} />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Skip */}
        <div className="px-5 pt-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[14px] text-[15px] font-bold"
            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-4)' }}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
