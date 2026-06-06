'use client'
import { useEffect, useState } from 'react'
import { StepProps } from '@/lib/types'

const BULLETS = [
  { icon: '💸', text: 'Penjualan sampai duit masuk kantong dengan potongan 0%' },
  { icon: '💬', text: 'Dari chat di WA, IG, atau media sosial lain langsung ke platform' },
  { icon: '📦', text: 'Atur produk, stok, dan pengiriman langsung di satu tempat' },
]

export default function Slide03Solution({ onNext, onBack }: StepProps) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    BULLETS.forEach((_, i) => {
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 600 + i * 700)
    })
  }, [])

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-5">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Kenalan sama solusinya
        </p>

        {/* Headline with logo inline */}
        <div className="anim d1">
          <p className="font-display" style={{ fontSize: 'clamp(26px, 7.5vw, 36px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em' }}>
            <span className="inline-block align-middle" style={{ width: '6.5em', verticalAlign: 'baseline', position: 'relative', top: '-0.05em' }}>
              <svg viewBox="0 0 580 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
                <text x="45" y="110" fontFamily="'Instrument Serif','Times New Roman',serif" fontSize="120" letterSpacing="-2" fill="#1c1a14">
                  <tspan fill="#5d6b40" fontWeight="300">[</tspan>
                  <tspan fill="#5d6b40" fontStyle="italic">e</tspan>
                  <tspan fill="#5d6b40" fontWeight="300">]</tspan>
                </text>
                <circle cx="248" cy="80" r="8" fill="#5d6b40" />
                <text x="270" y="115" fontFamily="'Instrument Serif','Times New Roman',serif" fontSize="120" letterSpacing="-2" fill="#1c1a14">talase</text>
              </svg>
            </span>
            {' '}kami buat untuk{' '}
            <strong style={{ fontWeight: 400, borderBottom: '2px solid var(--sage)' }}>
              kamu yang udah capek kehilangan untung ke biaya marketplace
            </strong>
            {' '}— jual langsung, simpan margin penuh, dan punya pelanggan sendiri
          </p>
        </div>

        {/* Staggered bullets */}
        <div className="space-y-3 pb-1">
          {BULLETS.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 line-appear"
              style={{
                opacity: visible > i ? 1 : 0,
                animation: visible > i ? 'fadeIn 0.45s ease both' : 'none',
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{b.icon}</span>
              <p className="text-[15px] leading-snug" style={{ color: 'var(--ink)' }}>{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97]"
          style={{ background: 'var(--ink)', color: 'var(--paper)' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
