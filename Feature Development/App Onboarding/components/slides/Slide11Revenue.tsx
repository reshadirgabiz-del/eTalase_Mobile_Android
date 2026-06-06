'use client'
import { useState } from 'react'
import { formatCurrencyInput, parseCurrencyInput, StepProps } from '@/lib/types'

function CurrencyInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="font-code block text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: 'var(--muted)' }}>{label}</label>
      <div
        className="flex items-center border-b-2 py-2"
        style={{ borderColor: value ? 'var(--sage)' : 'var(--line)', transition: 'border-color 0.2s' }}
      >
        <span className="text-[15px] mr-2 flex-shrink-0" style={{ color: 'var(--muted)' }}>Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(formatCurrencyInput(e.target.value))}
          placeholder={placeholder}
          className="flex-1 text-[17px] font-medium bg-transparent outline-none"
          style={{ color: 'var(--ink)', caretColor: 'var(--sage)', minWidth: 0 }}
        />
      </div>
    </div>
  )
}

export default function Slide11Revenue({ data, onNext, onBack }: StepProps) {
  const [revenue, setRevenue] = useState(data.monthlyRevenue ? data.monthlyRevenue.toLocaleString('id-ID') : '')
  const [price, setPrice] = useState(data.productPrice ? data.productPrice.toLocaleString('id-ID') : '')

  const monthlyRevenue = parseCurrencyInput(revenue)
  const productPrice   = parseCurrencyInput(price)
  const canContinue    = monthlyRevenue > 0 && productPrice > 0

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
          Estimasi omzet
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(25px, 7vw, 33px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Berapa kira-kira penjualan {data.topProductName || 'produk ini'} per bulannya? Dan berapa harganya?
        </h2>

        <div className="space-y-5 anim d2">
          <CurrencyInput
            label={`Penjualan ${data.topProductName || 'produk'} per bulan`}
            value={revenue}
            onChange={setRevenue}
            placeholder="Misal: 5.000.000"
          />
          <CurrencyInput
            label="Harga per produk"
            value={price}
            onChange={setPrice}
            placeholder="Misal: 150.000"
          />
          {monthlyRevenue > 0 && productPrice > 0 && (
            <p className="font-code text-[11px] tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
              ≈ {Math.round(monthlyRevenue / productPrice).toLocaleString('id-ID')} unit/bulan
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => { if (canContinue) onNext({ monthlyRevenue, productPrice }) }}
          disabled={!canContinue}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{
            background: canContinue ? 'var(--ink)' : 'var(--chrome)',
            color: canContinue ? 'var(--paper)' : 'var(--muted)',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          {data.isSelling ? 'Lanjut →' : 'Lihat simulasi biaya →'}
        </button>
      </div>
    </div>
  )
}
