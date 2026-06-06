'use client'
import { StepProps } from '@/lib/types'

export default function Slide17UseCase1({ onNext, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Illustration: mock WA chat */}
      <div
        className="flex-none mx-6 mt-3 rounded-[20px] overflow-hidden anim"
        style={{ background: '#e5ddd5', border: '1px solid var(--line)', minHeight: 150 }}
      >
        {/* WA header mock */}
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#075e54' }}>
          <div className="w-7 h-7 rounded-full bg-green-300 flex-shrink-0" />
          <p className="text-white text-[13px] font-semibold">Bu Sari ⭐ VIP</p>
        </div>
        {/* Messages */}
        <div className="p-3 space-y-2">
          <div className="flex justify-start">
            <div className="rounded-[12px_12px_12px_4px] px-3 py-2 text-[13px] max-w-[75%]" style={{ background: 'white' }}>
              Kak, mau pesan lagi yang kemarin dong 😊
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-[12px_12px_4px_12px] px-3 py-2 text-[13px] max-w-[80%]" style={{ background: '#dcf8c6' }}>
              Siap Bu! Ini link pesanannya ya 🙌
              <br />
              <span className="font-semibold" style={{ color: '#075e54' }}>etalase.co/toko/order</span>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-[12px_12px_12px_4px] px-3 py-2 text-[13px] max-w-[75%]" style={{ background: 'white' }}>
              Makasih kak, udah kelar bayar! 🎉
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-4">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Use Case 1
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Pelanggan langganan? Cukup kirim link di chat
        </h2>

        <p className="text-[15px] leading-relaxed anim d2" style={{ color: 'var(--muted)' }}>
          Tidak perlu arahkan ke marketplace lagi. Kirim link langsung di WA — pelanggan order ulang dalam hitungan detik, tanpa potongan marketplace.
        </p>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{ background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
