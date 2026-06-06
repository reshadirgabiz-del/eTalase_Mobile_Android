'use client'
import { useEffect, useState } from 'react'
import { StepProps } from '@/lib/types'

const PROBLEM_LINES = [
  { text: 'Kamu ga sendirian.' },
  { text: 'Banyak penjual yang merasa sama kayak kamu — baik yang baru mulai maupun yang sudah bertahun-tahun jualan.' },
]

const SOLUTION_BULLETS = [
  { icon: '💸', text: 'Penjualan sampai duit masuk kantong dengan potongan 0%' },
  { icon: '💬', text: 'Dari chat di WA, IG, atau media sosial lain langsung ke platform' },
  { icon: '📦', text: 'Atur produk, stok, dan pengiriman langsung di satu tempat' },
]

export default function Slide02Problem({ onNext, onBack }: StepProps) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    // Problem lines first, then solution bullets after a short pause
    const timers = [
      ...PROBLEM_LINES.map((_, i) => setTimeout(() => setVisible(v => Math.max(v, i + 1)), 900 + i * 1100)),
      ...SOLUTION_BULLETS.map((_, i) => setTimeout(() => setVisible(v => Math.max(v, PROBLEM_LINES.length + i + 1)), 3200 + i * 700)),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const totalLines = PROBLEM_LINES.length + SOLUTION_BULLETS.length

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'rgba(244,237,224,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-2 gap-5">

        {/* ── Problem section ── */}
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--butter)' }}>
          Cerita yang familiar
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 36px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Apa kamu merasa makin susah untung di Marketplace? Khawatir buat toko online karena ribet dan ga worth it?
        </h2>

        <div className="space-y-3">
          {PROBLEM_LINES.map((line, i) => (
            <p
              key={i}
              className="text-[15px] leading-relaxed"
              style={{
                color: i === 0 ? 'var(--paper)' : 'rgba(244,237,224,0.7)',
                fontWeight: i === 0 ? 600 : 400,
                opacity: visible > i ? 1 : 0,
                transition: 'opacity 0.45s ease',
              }}
            >
              {line.text}
            </p>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            height: 1,
            background: 'rgba(244,237,224,0.12)',
            opacity: visible >= PROBLEM_LINES.length ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* ── Solution section ── */}
        <div
          style={{
            opacity: visible >= PROBLEM_LINES.length ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <p className="font-code mb-4" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
            Solusinya?
          </p>

          <div className="anim d1 mb-4">
            <p className="font-display" style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 400, lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              <span className="inline-block align-middle" style={{ width: '5.5em', verticalAlign: 'baseline', position: 'relative', top: '-0.05em' }}>
                <svg viewBox="0 0 580 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
                  <text x="45" y="110" fontFamily="'Instrument Serif','Times New Roman',serif" fontSize="120" letterSpacing="-2">
                    <tspan fill="rgba(244,237,224,0.9)" fontWeight="300">[</tspan>
                    <tspan fill="rgba(244,237,224,0.9)" fontStyle="italic">e</tspan>
                    <tspan fill="rgba(244,237,224,0.9)" fontWeight="300">]</tspan>
                  </text>
                  <circle cx="248" cy="80" r="8" fill="rgba(244,237,224,0.9)" />
                  <text x="270" y="115" fontFamily="'Instrument Serif','Times New Roman',serif" fontSize="120" letterSpacing="-2" fill="rgba(244,237,224,0.9)">talase</text>
                </svg>
              </span>
              {' '}kami buat buat kamu yang{' '}
              <span style={{ borderBottom: '2px solid var(--sage)' }}>
                udah capek kehilangan untung ke biaya marketplace
              </span>
            </p>
          </div>

          <div className="space-y-3 pb-1">
            {SOLUTION_BULLETS.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3"
                style={{
                  opacity: visible > PROBLEM_LINES.length + i ? 1 : 0,
                  transition: 'opacity 0.45s ease',
                }}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{b.icon}</span>
                <p className="text-[15px] leading-snug" style={{ color: 'rgba(244,237,224,0.85)' }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — shows once all bullets are visible */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97]"
          style={{
            background: visible >= totalLines ? 'var(--butter)' : 'rgba(244,237,224,0.15)',
            color: visible >= totalLines ? 'var(--ink)' : 'rgba(244,237,224,0.4)',
            cursor: visible >= totalLines ? 'pointer' : 'default',
            transition: 'background 0.4s ease, color 0.4s ease',
          }}
          disabled={visible < totalLines}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
