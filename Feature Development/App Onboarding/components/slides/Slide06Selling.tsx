'use client'
import { StepProps } from '@/lib/types'

export default function Slide06Selling({ onNext, onBack }: StepProps) {
  const pick = (isSelling: boolean) => {
    setTimeout(() => onNext({ isSelling }), 260)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-4 gap-5">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage)' }}>
          Situasimu sekarang
        </p>

        {/* Chat bubble style question */}
        <div className="anim d1 flex items-start gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full"
            style={{ background: 'color-mix(in oklch, var(--rose) 20%, var(--card))', border: '1.5px solid var(--rose)', position: 'relative' }}
          >
            <span style={{ position: 'absolute', inset: '28%', borderRadius: '50%', background: 'var(--rose)', display: 'block' }} />
          </div>
          <div
            className="font-display text-[24px] leading-[1.12] px-4 py-3 max-w-[88%]"
            style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '6px 18px 18px 18px', letterSpacing: '-0.01em', fontWeight: 400 }}
          >
            Apakah sekarang kamu sedang berjualan (online/offline)?
          </div>
        </div>

        {/* Reply buttons */}
        <div className="flex flex-col items-end gap-3 anim d2">
          <button
            onClick={() => pick(true)}
            className="px-5 py-3 text-[15px] transition-all active:scale-[.97] hover:opacity-80"
            style={{ border: '1.5px solid var(--rose)', borderRadius: '18px 18px 6px 18px', color: 'var(--rose)', background: 'transparent', maxWidth: '86%', cursor: 'pointer' }}
          >
            Ya, saya sedang jualan 🙌
          </button>
          <button
            onClick={() => pick(false)}
            className="px-5 py-3 text-[15px] transition-all active:scale-[.97] hover:opacity-80"
            style={{ border: '1.5px solid var(--rose)', borderRadius: '18px 18px 6px 18px', color: 'var(--rose)', background: 'transparent', maxWidth: '86%', cursor: 'pointer' }}
          >
            Belum, masih rencana
          </button>
        </div>
      </div>

      <div className="flex-none h-10" />
    </div>
  )
}
