'use client'
import { StepProps, SELLING_DURATIONS, PRODUCT_CATEGORIES } from '@/lib/types'

function getPersonalizedText(data: StepProps['data']): string {
  const catLabel = PRODUCT_CATEGORIES.find(c => c.id === data.productCategory)?.label ?? 'produk pilihanmu'
  const durLabel = SELLING_DURATIONS.find(d => d.id === data.sellingDuration)?.label

  if (data.isSelling && durLabel) {
    return `Sudah ${durLabel.toLowerCase()} jualan ${catLabel.toLowerCase()} — berarti kamu tahu betul perjuangannya. Sekarang waktunya kerja lebih cerdas dan ambil lebih banyak keuntungan dari tiap transaksi.`
  }
  if (data.isSelling) {
    return `Mantap! Kamu udah punya pengalaman jualan ${catLabel.toLowerCase()}. Saatnya kelola bisnis lebih efisien dan untung lebih banyak di tiap transaksi.`
  }
  return `Selamat, kamu sudah berani mengambil langkah awal untuk sukses! Kalau kamu mulai dengan cepat dan untung di tiap transaksi, e-Talase pas banget buat kamu.`
}

export default function Slide09Chapter({ data, onNext, onBack }: StepProps) {
  const bodyText = getPersonalizedText(data)

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
            style={{ fontSize: 'clamp(36px, 10vw, 52px)', fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.01em', margin: 0, color: 'var(--paper)' }}
          >
            Hi {data.name}! 👋
          </h1>
        </div>

        <p className="anim d1 text-[16px] leading-relaxed" style={{ color: 'rgba(244,237,224,0.85)', maxWidth: '34ch' }}>
          {bodyText}
        </p>

        <p className="font-display anim d2 text-[22px]" style={{ fontWeight: 400, color: 'var(--paper)', letterSpacing: '-0.01em' }}>
          Gini caranya kami bantu kamu...
        </p>
      </div>

      {/* CTA */}
      <div className="flex-none px-6 pb-10">
        <button
          onClick={() => onNext()}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97] anim d3"
          style={{ background: 'var(--paper)', color: 'var(--terra)' }}
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}
