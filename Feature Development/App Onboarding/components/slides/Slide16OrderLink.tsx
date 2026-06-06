'use client'
import { StepProps } from '@/lib/types'

export default function Slide16OrderLink({ onNext, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Illustration */}
      <div
        className="flex-none mx-6 mt-4 rounded-[20px] flex flex-col items-center justify-center gap-3 anim"
        style={{ background: 'color-mix(in oklch, var(--sage) 12%, var(--paper))', border: '1px solid var(--line)', minHeight: 130 }}
      >
        <div className="flex items-center gap-2 px-5 py-3 rounded-full" style={{ background: 'var(--sage)', color: 'var(--paper)' }}>
          <span className="font-code text-[12px] tracking-[0.08em]">etalase.co/toko-kamu/order</span>
        </div>
        <p className="font-code text-[11px] tracking-[0.14em]" style={{ color: 'var(--muted)' }}>LINK PESANAN PERSONALMU</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-4">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Fitur: Link Pesanan
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Kenalin: Link Pesanan e-Talase
        </h2>

        <p className="text-[15px] leading-relaxed anim d2" style={{ color: 'var(--muted)' }}>
          Satu link unik untuk tokomu yang bisa dibagikan di mana saja — WhatsApp, Instagram, TikTok, atau langsung di chat. Pelanggan tinggal klik, pilih produk, bayar. Selesai.
        </p>

        <div className="space-y-2.5 anim d3">
          {[
            { icon: '💸', text: 'Tanpa biaya transaksi marketplace' },
            { icon: '🔗', text: 'Bisa dikirim di chat atau bio media sosial' },
            { icon: '📊', text: 'Pesanan masuk langsung ke dashboardmu' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-[18px]">{item.icon}</span>
              <span className="text-[14px]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d4"
          style={{ background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
