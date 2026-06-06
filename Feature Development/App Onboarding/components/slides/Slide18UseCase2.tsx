'use client'
import { StepProps } from '@/lib/types'

export default function Slide18UseCase2({ onNext, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Illustration: video description mock */}
      <div
        className="flex-none mx-6 mt-3 rounded-[20px] overflow-hidden anim"
        style={{ border: '1px solid var(--line)' }}
      >
        {/* Video thumbnail placeholder */}
        <div className="relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2d1b00 0%, #5c3000 100%)', minHeight: 100 }}>
          <span className="text-5xl">🎥</span>
          <div className="absolute bottom-3 left-3">
            <p className="text-white text-[13px] font-semibold">Resep Rendang Padang Asli 🔥</p>
            <p className="text-white text-[11px] opacity-70">Dapur Mak Tari • 1.2rb penonton</p>
          </div>
        </div>
        {/* Description */}
        <div className="px-3 py-3" style={{ background: '#f9f9f9' }}>
          <p className="text-[12px] leading-relaxed" style={{ color: '#333' }}>
            📌 Semua bahan masakan di video ini bisa kamu beli langsung:{' '}
            <span className="font-semibold" style={{ color: '#075e54' }}>etalase.co/dapurmaktari</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-4">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Use Case 2
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Video masak? Tempel link bahan di deskripsi
        </h2>

        <p className="text-[15px] leading-relaxed anim d2" style={{ color: 'var(--muted)' }}>
          Content creator bisa monetisasi langsung. Penonton klik link di deskripsi, beli semua bahan dari tokomu — tanpa perlu keluar dari aplikasi.
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
