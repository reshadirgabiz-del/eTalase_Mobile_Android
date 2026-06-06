'use client'
import { computeMonthlyFees, formatRupiah, StepProps } from '@/lib/types'

function FeeCell({ label, perUnit, perMonth, accent }: { label: string; perUnit: number; perMonth: number; accent: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 px-2 rounded-[14px] text-center" style={{ background: 'rgba(244,237,224,0.08)', border: '1px solid rgba(244,237,224,0.12)' }}>
      <p className="font-code text-[10px] tracking-[0.12em] uppercase" style={{ color: accent }}>{label}</p>
      <p className="font-display text-[17px]" style={{ color: 'var(--paper)', fontWeight: 400 }}>
        −{formatRupiah(perUnit)}
      </p>
      <p className="font-code text-[10px]" style={{ color: 'rgba(244,237,224,0.5)' }}>
        per unit
      </p>
      <div style={{ height: 1, background: 'rgba(244,237,224,0.1)', margin: '4px 0' }} />
      <p className="text-[14px] font-semibold" style={{ color: 'var(--paper)' }}>
        −{formatRupiah(perMonth)}
      </p>
      <p className="font-code text-[10px]" style={{ color: 'rgba(244,237,224,0.5)' }}>
        /bulan (est.)
      </p>
    </div>
  )
}

export default function Slide14FeeResult({ data, onNext, onBack }: StepProps) {
  const fees = computeMonthlyFees(data)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'rgba(244,237,224,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-2 gap-5">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--butter)' }}>
          Realita potonganmu
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(24px, 6.5vw, 32px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0, color: 'var(--paper)' }}
        >
          Segini kira-kira <em>minimal</em> potongan kalau jualan{' '}
          <em>{data.topProductName || 'produkmu'}</em>{' '}
          di marketplace
        </h2>

        {/* Units info */}
        <p className="font-code anim d2 text-[11px] tracking-[0.08em]" style={{ color: 'rgba(244,237,224,0.5)' }}>
          Berdasarkan ≈{fees.unitsPerMonth.toLocaleString('id-ID')} unit/bulan @ {formatRupiah(data.productPrice)}/unit
        </p>

        {/* Comparison table */}
        <div className="grid grid-cols-3 gap-2 anim d2">
          <FeeCell label="Toko Oren" perUnit={fees.shopeePerUnit}    perMonth={fees.monthlyShopee}    accent="#f97316" />
          <FeeCell label="Toko Ijo"  perUnit={fees.tokopediaPerUnit} perMonth={fees.monthlyTokopedia} accent="#22c55e" />
          <div className="flex flex-col gap-1 py-3 px-2 rounded-[14px] text-center" style={{ background: 'color-mix(in oklch, var(--sage) 20%, rgba(0,0,0,0))', border: '1px solid var(--sage)' }}>
            <p className="font-code text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--sage)' }}>e-Talase</p>
            <p className="font-display text-[17px]" style={{ color: 'var(--paper)', fontWeight: 400 }}>Rp 0</p>
            <p className="font-code text-[10px]" style={{ color: 'rgba(244,237,224,0.5)' }}>per unit</p>
            <div style={{ height: 1, background: 'rgba(244,237,224,0.1)', margin: '4px 0' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--sage)' }}>Rp 0</p>
            <p className="font-code text-[10px]" style={{ color: 'rgba(244,237,224,0.5)' }}>/bulan</p>
          </div>
        </div>

        <p className="anim d3 text-[14px] font-semibold" style={{ color: 'var(--sage)' }}>
          Fee jualan di e-Talase? <strong>Tentu saja 0%!</strong>
        </p>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d4"
          style={{ background: 'var(--butter)', color: 'var(--ink)', cursor: 'pointer' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
