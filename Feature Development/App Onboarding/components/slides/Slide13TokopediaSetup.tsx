'use client'
import { useState } from 'react'
import { TokopediaSellerType, StepProps } from '@/lib/types'

const SELLER_TYPES: { id: TokopediaSellerType; label: string; sub: string }[] = [
  { id: 'marketplace', label: 'Marketplace',     sub: 'Regular seller' },
  { id: 'mall',        label: 'Official Store',   sub: 'Toko Ijo Mall' },
]

export default function Slide13TokopediaSetup({ data, onNext, onBack }: StepProps) {
  const [sellerType, setSellerType] = useState<TokopediaSellerType>(data.tokopediaSellerType)
  const [isPreOrder, setIsPreOrder] = useState(data.tokopediaIsPreOrder)

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
          Setup di Toko Ijo
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Satu lagi — di Toko Ijo, statusmu apa dan ada pre-order?
        </h2>

        {/* Seller type */}
        <div className="grid grid-cols-2 gap-3 anim d2">
          {SELLER_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSellerType(t.id)}
              className="flex flex-col items-center py-4 px-3 rounded-[16px] text-center transition-all active:scale-[.97]"
              style={{
                border: '1.5px solid',
                borderColor: sellerType === t.id ? '#16a34a' : 'var(--line)',
                background: sellerType === t.id ? '#f0fdf4' : 'transparent',
                color: sellerType === t.id ? '#15803d' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <span className="text-[14px] font-semibold">{t.label}</span>
              <span className="font-code text-[10px] mt-0.5 opacity-70">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Pre-order toggle */}
        <div className="anim d3">
          <p className="font-code text-[11px] tracking-[0.1em] uppercase mb-2.5" style={{ color: 'var(--muted)' }}>Layanan aktif</p>
          <div className="flex items-center justify-between p-3 rounded-[14px]" style={{ border: '1px solid var(--line)' }}>
            <div>
              <p className="text-[14px] font-medium">Pre-Order</p>
              <p className="font-code text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>+3,0% biaya layanan pre-order</p>
            </div>
            <button
              onClick={() => setIsPreOrder(v => !v)}
              className="relative flex-shrink-0 rounded-full transition-colors"
              style={{ width: 44, height: 26, background: isPreOrder ? '#16a34a' : 'var(--chrome)', border: 'none', cursor: 'pointer' }}
            >
              <span
                className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow"
                style={{ left: isPreOrder ? 20 : 3, transition: 'left 0.2s ease' }}
              />
            </button>
          </div>
          <p className="font-code text-[11px] mt-2" style={{ color: 'var(--muted)' }}>
            Biaya pemrosesan Rp1.250 selalu diterapkan · Maks komisi Rp650.000/item
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 pb-6 pt-3">
        <p className="font-code text-[11px] mb-4 text-center" style={{ color: 'var(--muted)' }}>
          Kalau kamu ragu, kamu bisa langsung lanjut. Kita asumsikan kamu pakai setup yang <em>paling murah</em>.
        </p>
        <button
          onClick={() => onNext({ tokopediaSellerType: sellerType, tokopediaIsPreOrder: isPreOrder })}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d4"
          style={{ background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer' }}
        >
          Lihat simulasi biaya →
        </button>
      </div>
    </div>
  )
}
