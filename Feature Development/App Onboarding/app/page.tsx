'use client'

import { useState } from 'react'
import { defaultOnboardingData, OnboardingData } from '@/lib/types'
import Slide01Welcome       from '@/components/slides/Slide01Welcome'
import Slide02Problem       from '@/components/slides/Slide02Problem'
import Slide04Name          from '@/components/slides/Slide04Name'
import Slide05Age           from '@/components/slides/Slide05Age'
import Slide06Selling       from '@/components/slides/Slide06Selling'
import Slide07Duration      from '@/components/slides/Slide07Duration'
import Slide08Category      from '@/components/slides/Slide08Category'
import Slide09Chapter       from '@/components/slides/Slide09Chapter'
import Slide10Product       from '@/components/slides/Slide10Product'
import Slide11Revenue       from '@/components/slides/Slide11Revenue'
import Slide12ShopeeSetup   from '@/components/slides/Slide12ShopeeSetup'
import Slide13TokopediaSetup from '@/components/slides/Slide13TokopediaSetup'
import Slide14FeeResult     from '@/components/slides/Slide14FeeResult'
import Slide15Paywall       from '@/components/slides/Slide15Paywall'
import Slide16OrderLink     from '@/components/slides/Slide16OrderLink'
import Slide17UseCase1      from '@/components/slides/Slide17UseCase1'
import Slide18UseCase2      from '@/components/slides/Slide18UseCase2'
import Slide19Stock         from '@/components/slides/Slide19Stock'
import Slide20Shipment      from '@/components/slides/Slide20Shipment'
import Slide21Conclusion    from '@/components/slides/Slide21Conclusion'

type SlideId =
  | 'welcome' | 'problem'
  | 'name' | 'age' | 'selling' | 'duration' | 'category'
  | 'chapter'
  | 'product' | 'revenue'
  | 'shopee-setup' | 'tokopedia-setup'
  | 'fee-result' | 'paywall'
  | 'order-link' | 'use-case-1' | 'use-case-2'
  | 'stock' | 'shipment'
  | 'conclusion'

function getSlides(data: OnboardingData): SlideId[] {
  return [
    'welcome', 'problem',
    'name', 'age', 'selling',
    ...(data.isSelling ? ['duration' as SlideId] : []),
    'category',
    'chapter',
    'product', 'revenue',
    ...(data.isSelling ? ['shopee-setup' as SlideId, 'tokopedia-setup' as SlideId] : []),
    'fee-result', 'paywall',
    'order-link', 'use-case-1', 'use-case-2',
    'stock', 'shipment',
    'conclusion',
  ]
}

export default function OnboardingPage() {
  const [currentSlideId, setCurrentSlideId] = useState<SlideId>('welcome')
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData)

  const handleNext = (update?: Partial<OnboardingData>) => {
    let newData = data
    if (update) {
      newData = { ...data, ...update }
      setData(newData)
    }
    const slides = getSlides(newData)
    const idx = slides.indexOf(currentSlideId)
    if (idx < slides.length - 1) setCurrentSlideId(slides[idx + 1])
  }

  const handleBack = () => {
    const slides = getSlides(data)
    const idx = slides.indexOf(currentSlideId)
    if (idx > 0) setCurrentSlideId(slides[idx - 1])
  }

  const slides = getSlides(data)
  const currentIdx = slides.indexOf(currentSlideId)
  const progress = currentIdx > 0 ? (currentIdx / (slides.length - 1)) * 100 : 0

  const props = { data, onNext: handleNext, onBack: handleBack }

  const slideMap: Record<SlideId, React.ReactNode> = {
    'welcome':        <Slide01Welcome        {...props} />,
    'problem':        <Slide02Problem        {...props} />,
    'name':           <Slide04Name           {...props} />,
    'age':            <Slide05Age            {...props} />,
    'selling':        <Slide06Selling        {...props} />,
    'duration':       <Slide07Duration       {...props} />,
    'category':       <Slide08Category       {...props} />,
    'chapter':        <Slide09Chapter        {...props} />,
    'product':        <Slide10Product        {...props} />,
    'revenue':        <Slide11Revenue        {...props} />,
    'shopee-setup':   <Slide12ShopeeSetup    {...props} />,
    'tokopedia-setup':<Slide13TokopediaSetup {...props} />,
    'fee-result':     <Slide14FeeResult      {...props} />,
    'paywall':        <Slide15Paywall        {...props} />,
    'order-link':     <Slide16OrderLink      {...props} />,
    'use-case-1':     <Slide17UseCase1       {...props} />,
    'use-case-2':     <Slide18UseCase2       {...props} />,
    'stock':          <Slide19Stock          {...props} />,
    'shipment':       <Slide20Shipment       {...props} />,
    'conclusion':     <Slide21Conclusion     {...props} />,
  }

  return (
    <main className="ob-stage">
      <div className="ob-device">
        {/* Progress bar — hidden on welcome */}
        {currentSlideId !== 'welcome' && (
          <div className="flex-none h-[3px]" style={{ background: 'var(--chrome)' }}>
            <div
              className="h-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%`, background: 'var(--sage)' }}
            />
          </div>
        )}

        {/* Slide — keyed by id to force fresh mount + animations on each navigation */}
        <div key={currentSlideId} className="flex-1 overflow-hidden">
          {slideMap[currentSlideId]}
        </div>
      </div>
    </main>
  )
}
