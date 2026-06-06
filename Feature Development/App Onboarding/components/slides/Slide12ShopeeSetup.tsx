'use client'
import { useState } from 'react'
import { ShopeeSellerType, StepProps } from '@/lib/types'

const SELLER_TYPES: { id: ShopeeSellerType; label: string; sub: string }[] = [
  { id: 'nonStar', label: 'Regular',  sub: 'Non-Star' },
  { id: 'star',    label: 'Star',     sub: 'Star Seller' },
  { id: 'mall',    label: 'Mall',     sub: 'Toko Oren Mall' },
]

export default function Slide12ShopeeSetup({ data, onNext, onBack }: StepProps) {
  const [sellerType, setSellerType]   = useState<ShopeeSellerType>(data.shopeeSellerType)
  const [gratisOngkir, setGratisOngkir] = useState(data.shopeeGratisOngkir)
  const [promoXtra, setPromoXtra]     = useState(data.shopeePromoXtra)

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
          Setup di Toko Oren
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Mari kita hitung, misalnya kamu jual barang ini di Toko Oren, kamu akan pilih toko tipe apa dan ikut program yang mana?
        </h2>

        {/* Seller type */}
        <div className="grid grid-cols-3 gap-2.5 anim d2">
          {SELLER_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setSellerType(t.id)}
              className="flex flex-col items-center py-3 px-2 rounded-[16px] text-center transition-all active:scale-[.97]"
              style={{
                border: '1.5px solid',
                borderColor: sellerType === t.id ? '#f97316' : 'var(--line)',
                background: sellerType === t.id ? '#fff7ed' : 'transparent',
                color: sellerType === t.id ? '#c2410c' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <span className="text-[14px] font-semibold">{t.label}</span>
              <span className="font-code text-[10px] mt-0.5 opacity-70">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Service fee toggles */}
        <div className="space-y-2.5 anim d3">
          <p className="font-code text-[11px] tracking-[0.1em] uppercase" style={{ color: 'var(--muted)' }}>Program aktif</p>
          {([
            { label: 'Gratis Ongkir XTRA', sub: '+4,0% dari harga produk', value: gratisOngkir, toggle: () => setGratisOngkir(v => !v) },
            { label: 'Promo XTRA',         sub: '+1,4% dari harga produk', value: promoXtra,    toggle: () => setPromoXtra(v => !v) },
          ] as const).map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-[14px]" style={{ border: '1px solid var(--line)' }}>
              <div>
                <p className="text-[14px] font-medium">{item.label}</p>
                <p className="font-code text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{item.sub}</p>
              </div>
              <button
                onClick={item.toggle}
                className="relative flex-shrink-0 rounded-full transition-colors"
                style={{ width: 44, height: 26, background: item.value ? 'var(--sage)' : 'var(--chrome)', border: 'none', cursor: 'pointer' }}
              >
                <span
                  className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: item.value ? 20 : 3, transition: 'left 0.2s ease' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 pb-6 pt-3">
        <p className="font-code text-[11px] mb-4 text-center" style={{ color: 'var(--muted)' }}>
          Kalau kamu ragu, kamu bisa langsung lanjut. Kita asumsikan kamu pakai setup yang <em>paling murah</em>.
        </p>
        <button
          onClick={() => onNext({ shopeeSellerType: sellerType, shopeeGratisOngkir: gratisOngkir, shopeePromoXtra: promoXtra })}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d4"
          style={{ background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
