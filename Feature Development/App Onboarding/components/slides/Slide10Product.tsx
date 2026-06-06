'use client'
import { useState } from 'react'
import { PRODUCT_CATEGORIES, StepProps } from '@/lib/types'

export default function Slide10Product({ data, onNext, onBack }: StepProps) {
  const [productName, setProductName] = useState(data.topProductName)
  const [categoryId, setCategoryId] = useState(data.topProductCategory || data.productCategory)

  const canContinue = productName.trim().length > 0 && categoryId.length > 0

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-2 gap-6">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Produk unggulanmu
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          {data.isSelling
            ? 'Produk apa yang saat ini paling laku di toko kamu?'
            : 'Produk apa yang kamu rencana jual pertama kali?'}
        </h2>

        <div className="space-y-4 anim d2">
          {/* Product name */}
          <div>
            <label className="font-code block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>
              Nama produk
            </label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder={data.isSelling ? 'Misal: Hijab Segiempat Premium' : 'Misal: Kue Lapis Surabaya'}
              className="w-full text-[16px] bg-transparent outline-none border-b-2 py-2"
              style={{
                borderColor: productName ? 'var(--sage)' : 'var(--line)',
                color: 'var(--ink)',
                caretColor: 'var(--sage)',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Category dropdown */}
          <div>
            <label className="font-code block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>
              Kategori
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full text-[16px] bg-transparent outline-none border-b-2 py-2 pr-6 appearance-none"
                style={{
                  borderColor: categoryId ? 'var(--sage)' : 'var(--line)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <option value="">Pilih kategori...</option>
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', fontSize: 12 }}>▾</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => { if (canContinue) onNext({ topProductName: productName.trim(), topProductCategory: categoryId }) }}
          disabled={!canContinue}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{
            background: canContinue ? 'var(--ink)' : 'var(--chrome)',
            color: canContinue ? 'var(--paper)' : 'var(--muted)',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
