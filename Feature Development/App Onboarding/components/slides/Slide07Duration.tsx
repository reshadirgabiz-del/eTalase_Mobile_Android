'use client'
import { useState } from 'react'
import { SELLING_DURATIONS, StepProps } from '@/lib/types'

export default function Slide07Duration({ data, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState(data.sellingDuration)

  const pick = (id: string) => {
    setSelected(id)
    setTimeout(() => onNext({ sellingDuration: id }), 260)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-4 gap-6">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Pengalaman jualan
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Sudah berapa lama kamu jualan?
        </h2>

        <div className="flex flex-col gap-2.5 anim d2">
          {SELLING_DURATIONS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => pick(d.id)}
              className="flex items-center gap-3 px-[18px] py-[15px] rounded-full text-[15px] text-left transition-all active:scale-[.98]"
              style={{
                border: '1.5px solid',
                borderColor: selected === d.id ? 'var(--sage)' : 'var(--line)',
                background: selected === d.id ? 'var(--sage)' : 'transparent',
                color: selected === d.id ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <span className="font-code text-[10px] w-4 flex-shrink-0" style={{ opacity: selected === d.id ? 0.85 : 0.5 }}>
                {String.fromCharCode(97 + i)}
              </span>
              <span className="flex-1">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-none h-8" />
    </div>
  )
}
