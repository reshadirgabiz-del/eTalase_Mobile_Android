'use client'
import { useState } from 'react'
import { PRODUCT_CATEGORIES, StepProps } from '@/lib/types'

export default function Slide08Category({ data, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState(data.productCategory)

  const pick = (id: string) => {
    setSelected(id)
    setTimeout(() => onNext({ productCategory: id, topProductCategory: id }), 260)
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
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* Illustration strip */}
        <div
          className="rounded-[18px] mb-5 mt-3 flex items-end p-4 anim"
          style={{ background: 'color-mix(in oklch, var(--butter) 28%, var(--paper))', border: '1px solid var(--line)', minHeight: 80 }}
        >
          <span className="font-code text-[10px] tracking-[0.14em] rounded-full px-3 py-1.5" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
            PILIH KATEGORI
          </span>
        </div>

        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 12 }}>
          Tentang produkmu
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', marginBottom: 20 }}
        >
          {data.isSelling ? 'Apa barang/jasa yang kamu jual?' : 'Apa barang/jasa yang kamu rencana jual?'}
        </h2>

        <div className="flex flex-wrap gap-2.5 anim d2 pb-4">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => pick(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] transition-all active:scale-[.97]"
              style={{
                border: '1.5px solid',
                borderColor: selected === cat.id ? 'var(--ink)' : 'var(--line)',
                background: selected === cat.id ? 'var(--ink)' : 'transparent',
                color: selected === cat.id ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
