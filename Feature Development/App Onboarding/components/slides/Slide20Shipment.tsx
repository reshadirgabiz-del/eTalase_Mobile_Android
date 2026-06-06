'use client'
import { StepProps } from '@/lib/types'

export default function Slide20Shipment({ onNext, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Illustration: shipment dashboard mock */}
      <div
        className="flex-none mx-6 mt-3 rounded-[20px] p-4 anim"
        style={{ background: 'var(--chrome)', border: '1px solid var(--line)', minHeight: 140 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-code text-[11px] tracking-[0.1em] uppercase" style={{ color: 'var(--muted)' }}>Pengiriman Hari Ini</p>
          <span className="font-code text-[10px] px-2 py-1 rounded-full" style={{ background: 'var(--sage)', color: 'white' }}>12 siap kirim</span>
        </div>
        {[
          { id: '#2841', name: 'Bu Sari — Hijab Premium x2',    status: 'Label dicetak', color: '#16a34a' },
          { id: '#2840', name: 'Pak Budi — Kaos Oversize x1',   status: 'Menunggu pickup', color: '#d97706' },
          { id: '#2839', name: 'Kak Rina — Tas Selempang x3',   status: 'Diserahkan kurir', color: 'var(--muted)' },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--line)' }}>
            <div>
              <p className="text-[12px] font-medium">{item.name}</p>
              <p className="font-code text-[10px]" style={{ color: 'var(--muted)' }}>{item.id}</p>
            </div>
            <span className="font-code text-[10px]" style={{ color: item.color }}>{item.status}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-4">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Fitur: Manajemen Pengiriman
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Pengiriman lebih teratur, bisnis makin lancar
        </h2>

        <div className="space-y-2.5 anim d2">
          {[
            { icon: '🏷️', text: 'Label pengiriman otomatis dibuat dari pesanan' },
            { icon: '👥', text: 'Akses terpisah untuk tim pengiriman' },
            { icon: '📍', text: 'Tracking pesanan real-time untuk kamu dan pembeli' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-[17px]">{item.icon}</span>
              <span className="text-[14px]" style={{ color: 'var(--muted)' }}>{item.text}</span>
            </div>
          ))}
        </div>
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
