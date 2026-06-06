'use client'
import { useState } from 'react'
import { AGE_RANGES, StepProps } from '@/lib/types'

export default function Slide05Age({ data, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState(data.ageRange)

  const pick = (id: string) => {
    setSelected(id)
    setTimeout(() => onNext({ ageRange: id }), 260)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--terra)', color: 'var(--paper)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'rgba(244,237,224,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-4 gap-6">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(244,237,224,0.6)' }}>
          Tentang kamu
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0, color: 'var(--paper)' }}
        >
          Berapa umur kamu?
        </h2>

        <div className="grid grid-cols-2 gap-3 anim d2">
          {AGE_RANGES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => pick(r.id)}
              className="flex flex-col justify-end py-4 px-4 rounded-[16px] text-left transition-all active:scale-[.97]"
              style={{
                border: '1.5px solid',
                borderColor: selected === r.id ? 'var(--paper)' : 'rgba(244,237,224,0.28)',
                background: selected === r.id ? 'var(--paper)' : 'rgba(244,237,224,0.1)',
                color: selected === r.id ? 'var(--terra)' : 'var(--paper)',
                minHeight: 80,
              }}
            >
              <span className="font-code text-[10px] tracking-[0.12em] opacity-60 mb-2">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[15px] font-medium leading-tight">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-none h-8" />
    </div>
  )
}
