'use client'
import { StepProps } from '@/lib/types'

export default function Slide01Welcome({ onNext }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--terra)', color: 'var(--paper)' }}>
      {/* Brand mark */}
      <div className="flex-none px-6 pt-8">
        <span className="font-code text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(244,237,224,0.6)' }}>
          e-Talase
        </span>
      </div>

      {/* Logo + headline */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="anim w-52 max-w-[70vw]">
          <svg viewBox="0 0 580 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <text x="45" y="110" fontFamily="'Instrument Serif', 'Times New Roman', serif" fontSize="120" letterSpacing="-2" fill="rgba(244,237,224,0.9)">
              <tspan fill="rgba(244,237,224,0.9)" fontWeight="300">[</tspan>
              <tspan fill="rgba(244,237,224,0.9)" fontStyle="italic">e</tspan>
              <tspan fill="rgba(244,237,224,0.9)" fontWeight="300">]</tspan>
            </text>
            <circle cx="248" cy="80" r="8" fill="rgba(244,237,224,0.9)" />
            <text x="270" y="115" fontFamily="'Instrument Serif', 'Times New Roman', serif" fontSize="120" letterSpacing="-2" fill="rgba(244,237,224,0.9)">talase</text>
          </svg>
        </div>

        <div className="anim d1">
          <h1
            className="font-display leading-[1.04]"
            style={{ fontSize: 'clamp(30px, 9vw, 40px)', fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--paper)' }}
          >
            Hey! Selamat datang<br />di e-Talase 🛍️
          </h1>
        </div>

        <p className="font-code anim d2" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,237,224,0.6)' }}>
          Teman baru untuk bisnismu
        </p>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 pb-10">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{ background: 'var(--paper)', color: 'var(--terra)' }}
        >
          Mulai →
        </button>
      </div>
    </div>
  )
}
