'use client'
import { StepProps } from '@/lib/types'

export default function Slide19Stock({ onNext, onBack }: StepProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'rgba(244,237,224,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Illustration: product dashboard mock */}
      <div
        className="flex-none mx-6 mt-3 rounded-[20px] p-4 anim"
        style={{ background: 'rgba(244,237,224,0.06)', border: '1px solid rgba(244,237,224,0.12)', minHeight: 140 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-code text-[11px] tracking-[0.1em] uppercase" style={{ color: 'rgba(244,237,224,0.5)' }}>Stok Produk</p>
          <span className="font-code text-[10px] px-2 py-1 rounded-full" style={{ background: '#ef4444', color: 'white' }}>2 hampir habis</span>
        </div>
        {[
          { name: 'Hijab Segiempat Premium', stock: 3,  alert: true  },
          { name: 'Kaos Polos Oversize',     stock: 24, alert: false },
          { name: 'Tas Selempang Mini',      stock: 1,  alert: true  },
        ].map(item => (
          <div key={item.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(244,237,224,0.08)' }}>
            <div className="flex items-center gap-2">
              {item.alert && <span className="text-[12px]">⚠️</span>}
              <span className="text-[13px]" style={{ color: item.alert ? '#fbbf24' : 'rgba(244,237,224,0.8)' }}>{item.name}</span>
            </div>
            <span className="font-code text-[12px]" style={{ color: item.alert ? '#fbbf24' : 'rgba(244,237,224,0.5)' }}>{item.stock} pcs</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-4">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--butter)' }}>
          Fitur: Manajemen Produk
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(26px, 7.5vw, 34px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0, color: 'var(--paper)' }}
        >
          Kelola produk & stok dari HP kamu
        </h2>

        <div className="space-y-2.5 anim d2">
          {[
            { icon: '🔔', text: 'Notifikasi otomatis saat stok hampir habis' },
            { icon: '✏️', text: 'Ubah harga dan promo langsung dari mobile' },
            { icon: '📋', text: 'Semua produk tersinkron di satu dashboard' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-[17px]">{item.icon}</span>
              <span className="text-[14px]" style={{ color: 'rgba(244,237,224,0.8)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 py-6">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{ background: 'var(--butter)', color: 'var(--ink)', cursor: 'pointer' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
