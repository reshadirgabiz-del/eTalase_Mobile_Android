'use client'
import { StepProps } from '@/lib/types'

export default function Slide21Conclusion({ data, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--terra)', color: 'var(--paper)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'rgba(244,237,224,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 gap-5">
        <div className="anim">
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(32px, 9vw, 46px)', fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.01em', color: 'var(--paper)' }}
          >
            {data.name ? `${data.name},` : 'Kamu'} siap buka toko? 🚀
          </h1>
        </div>

        <p className="text-[15px] leading-relaxed anim d1" style={{ color: 'rgba(244,237,224,0.85)' }}>
          Kamu sudah lihat sendiri potensinya. Saatnya stop buang margin ke marketplace — buka toko e-Talase sekarang dan mulai ambil keuntungan penuh dari tiap transaksi.
        </p>

        {/* Summary bullets */}
        <div className="space-y-2 anim d2">
          {[
            'Potongan 0% untuk semua transaksi',
            'Link pesanan yang bisa dibagikan di mana saja',
            'Kelola produk, stok & pengiriman dalam satu tempat',
            'Rp25.000 credit sudah menunggumu 🎁',
          ].map(item => (
            <div key={item} className="flex items-start gap-2.5">
              <span style={{ color: 'var(--butter)', fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span className="text-[14px]" style={{ color: 'rgba(244,237,224,0.9)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-none px-6 pb-10 space-y-2.5 anim d3">
        <button
          onClick={() => { /* TODO: redirect to billing page */ }}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97]"
          style={{ background: 'var(--paper)', color: 'var(--terra)', cursor: 'pointer' }}
        >
          Buka Toko Sekarang →
        </button>
        <button
          onClick={() => { /* TODO: redirect to contact/consultation */ }}
          className="w-full py-3 rounded-[18px] text-[14px] transition-all active:scale-[.97]"
          style={{ background: 'rgba(244,237,224,0.15)', color: 'rgba(244,237,224,0.85)', border: '1px solid rgba(244,237,224,0.2)', cursor: 'pointer' }}
        >
          Tanya Dulu ke Tim Kami
        </button>
      </div>
    </div>
  )
}
