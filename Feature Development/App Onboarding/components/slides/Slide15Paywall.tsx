'use client'
import { computeMonthlyFees, formatRupiah, StepProps } from '@/lib/types'

const STARTER_PLAN_PRICE = 249000

export default function Slide15Paywall({ data, onNext, onBack }: StepProps) {
  const fees = computeMonthlyFees(data)
  const lowestMonthlyFee = Math.min(fees.monthlyShopee, fees.monthlyTokopedia)
  const isHighFee = lowestMonthlyFee >= STARTER_PLAN_PRICE

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
      {/* Back */}
      <div className="flex-none px-6 pt-6">
        <button onClick={onBack} className="font-code text-[11px] tracking-[0.1em]" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← KEMBALI
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-2 gap-5">
        <p className="font-code anim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--rose)' }}>
          Transparansi
        </p>

        <h2
          className="font-display anim d1"
          style={{ fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.01em', margin: 0 }}
        >
          Well, kami harus jujur... 🙏
        </h2>

        <div className="space-y-3 anim d2">
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Fee 0% e-Talase cuma buat yang <strong style={{ color: 'var(--ink)' }}>berlangganan</strong>...
          </p>

          {isHighFee ? (
            <div className="p-4 rounded-[16px]" style={{ background: 'color-mix(in oklch, var(--sage) 12%, var(--card))', border: '1px solid var(--sage)' }}>
              <p className="text-[15px] leading-relaxed">
                Tapi <strong style={{ color: 'var(--sage)' }}>{formatRupiah(lowestMonthlyFee)} itu udah lebih mahal</strong> dari paket Starter kami!
                {' '}Dengan berlangganan, kamu langsung hemat lebih dari biaya keanggotaan setiap bulannya.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[16px]" style={{ background: 'color-mix(in oklch, var(--butter) 20%, var(--card))', border: '1px solid var(--butter)' }}>
              <p className="text-[15px] leading-relaxed">
                Kami memang ada biaya transaksi untuk FREE plan, tapi cuma{' '}
                <strong>Rp2.500 <em>flat</em></strong> per transaksi!
                {' '}Dan dari simulasi kami, ini setara fee untuk produk senilai Rp25.000 saja~
              </p>
            </div>
          )}

          <div className="p-4 rounded-[16px] flex items-start gap-3" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
            <span className="text-xl flex-shrink-0">🎁</span>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Dan sesuai janji, kami langsung tambah{' '}
              <strong style={{ color: 'var(--ink)' }}>Rp25.000 credit</strong>{' '}
              ke akun kamu setelah login 👍
            </p>
          </div>
        </div>
      </div>

      {/* Two CTAs */}
      <div className="flex-none px-6 py-6 space-y-2.5 anim d3">
        <button
          onClick={() => { /* TODO: redirect to billing/dashboard */ onNext() }}
          className="w-full py-4 rounded-[18px] text-[15px] font-semibold transition-all active:scale-[.97]"
          style={{ background: 'var(--sage)', color: 'var(--paper)', cursor: 'pointer' }}
        >
          Buka toko sekarang! 🚀
        </button>
        <button
          onClick={() => onNext()}
          className="w-full py-3 rounded-[18px] text-[14px] transition-all active:scale-[.97]"
          style={{ background: 'transparent', color: 'var(--muted)', cursor: 'pointer', border: 'none' }}
        >
          Ada fitur apa lagi? →
        </button>
      </div>
    </div>
  )
}
