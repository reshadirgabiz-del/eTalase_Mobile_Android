'use client'
import { useState } from 'react'
import { StepProps } from '@/lib/types'

export default function Slide04Name({ data, onNext, onBack }: StepProps) {
  const [name, setName] = useState(data.name)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-6">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Kenalan
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Pertama-tama, kita kenalan dulu yuk :)
        </h2>

        <div className="anim d2 space-y-2">
          <label className="block font-code text-[11px] tracking-[0.1em] uppercase" style={{ color: 'var(--muted)' }}>
            What should we call you?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onNext({ name: name.trim() }) }}
            placeholder="Nama panggilanmu"
            autoFocus
            className="w-full text-[17px] font-medium bg-transparent outline-none border-b-2 py-2"
            style={{
              borderColor: name ? 'var(--sage)' : 'var(--line)',
              color: 'var(--ink)',
              caretColor: 'var(--sage)',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => { if (name.trim()) onNext({ name: name.trim() }) }}
          disabled={!name.trim()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{
            background: name.trim() ? 'var(--ink)' : 'var(--chrome)',
            color: name.trim() ? 'var(--paper)' : 'var(--muted)',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
