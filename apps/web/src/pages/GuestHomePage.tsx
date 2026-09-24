import {
  ArrowRight,
  Backpack,
  Check,
  CupSoda,
  IdCard,
  KeyRound,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { buttonVariants } from '../components/ui'

const steps = [
  {
    number: '01',
    title: 'แจ้งรายละเอียดสิ่งของ',
    description: 'กรอกข้อมูลเกี่ยวกับสิ่งของที่หายหรือพบ เช่น ประเภท สี ลักษณะ และช่วงเวลาที่เกี่ยวข้อง',
  },
  {
    number: '02',
    title: 'ค้นหารายการที่อาจตรงกัน',
    description: 'ระบบจะช่วยเปรียบเทียบข้อมูลและจัดอันดับรายการที่มีรายละเอียดใกล้เคียง เพื่อให้ค้นหาได้ง่ายขึ้น',
  },
  {
    number: '03',
    title: 'ตรวจสอบและรับคืน',
    description: 'เมื่อพบรายการที่อาจเป็นของคุณ ระบบจะพาเข้าสู่ขั้นตอนตรวจสอบความเป็นเจ้าของก่อนดำเนินการรับคืน',
  },
]

const trustItems = [
  {
    icon: LockKeyhole,
    title: 'ข้อมูลส่วนตัวถูกจำกัดการเปิดเผย',
    description: 'ชื่อ ข้อมูลติดต่อ และข้อมูลส่วนตัวจะไม่ถูกแสดงต่อสาธารณะโดยไม่จำเป็น',
  },
  {
    icon: MapPin,
    title: 'ตำแหน่งละเอียดไม่แสดงต่อสาธารณะ',
    description: 'ระบบแสดงข้อมูลสถานที่เฉพาะระดับที่เหมาะสม เพื่อลดการเปิดเผยข้อมูลที่ไม่จำเป็น',
  },
  {
    icon: ShieldCheck,
    title: 'ตรวจสอบก่อนรับของคืน',
    description: 'การพบรายการที่คล้ายกันยังไม่ถือว่าเป็นเจ้าของ ผู้ใช้งานต้องผ่านขั้นตอนตรวจสอบก่อนการรับคืน',
  },
]

function CampusLostItemVisual() {
  return (
    <div
      role="img"
      aria-label="ภาพประกอบกระเป๋า บัตร และแก้วน้ำ ซึ่งเป็นตัวอย่างสิ่งของที่อาจพบในมหาวิทยาลัย"
      className="relative mx-auto w-full max-w-xl px-3 py-6 md:px-8 md:py-10"
    >
      <div aria-hidden="true" className="absolute right-0 top-0 size-36 rounded-full bg-brand-soft opacity-80 blur-sm md:size-48" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 size-32 rounded-full bg-surface-secondary md:size-44" />

      <div className="relative rounded-overlay border border-border bg-surface p-4 shadow-floating md:p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="h-2 w-16 rounded-pill bg-brand/55" />
          <span className="size-3 rounded-pill bg-brand" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-text-secondary md:min-h-36">
            <Backpack aria-hidden="true" className="size-14 md:size-16" strokeWidth={1.5} />
          </div>
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-brand/70 md:min-h-36">
            <IdCard aria-hidden="true" className="size-12 md:size-14" strokeWidth={1.5} />
          </div>
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-text-secondary md:min-h-36">
            <CupSoda aria-hidden="true" className="size-11 md:size-13" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
            <Backpack aria-hidden="true" className="size-5" />
          </span>
          <span className="h-2 flex-1 rounded-pill bg-surface-secondary" />
          <span className="h-2 w-1/4 rounded-pill bg-surface-secondary" />
        </div>

        <div className="mt-4 flex justify-end">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand-soft px-4 py-2 text-label font-semibold text-brand">
            <Search aria-hidden="true" className="size-4" />
            ค้นหารายการที่อาจเกี่ยวข้อง
          </span>
        </div>
      </div>

      <span className="absolute bottom-2 left-0 flex size-12 items-center justify-center rounded-feature border border-border bg-surface text-brand shadow-card md:bottom-8 md:size-14">
        <KeyRound aria-hidden="true" className="size-6" />
      </span>
    </div>
  )
}

function StepCard({ number, title, description, wide = false }: (typeof steps)[number] & { wide?: boolean }) {
  return (
    <li className={`rounded-card border border-border bg-surface-secondary p-5 md:p-6 ${wide ? 'md:col-span-2 lg:col-span-1' : ''}`}>
      <p aria-hidden="true" className="text-page-mobile font-bold leading-none text-brand/20">{number}</p>
      <h3 className="mt-5 text-card font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-caption text-text-secondary">{description}</p>
    </li>
  )
}

export function GuestHomePage() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.key !== 'default') mainRef.current?.focus({ preventScroll: true })
  }, [location.key])

  return (
    <main ref={mainRef} id="main-content" tabIndex={-1} className="focus:outline-none">
      <section aria-labelledby="guest-home-title" className="relative overflow-hidden border-b border-border">
        <div aria-hidden="true" className="absolute -right-24 top-12 size-72 rounded-full bg-brand-soft/70 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 md:px-7 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex rounded-pill bg-brand-soft px-4 py-2 text-label font-semibold text-brand">
              Lost &amp; Found สำหรับมหาวิทยาลัย
            </p>
            <h1 id="guest-home-title" className="mt-6 max-w-3xl text-page-mobile font-bold tracking-tight text-balance text-text-primary md:text-page lg:text-display">
              ของที่หาย<br />อาจกำลังรอให้คุณมาพบ
            </h1>
            <p className="mt-5 max-w-2xl text-body text-text-secondary-strong md:text-lead">
              LostLink ช่วยเชื่อมคนที่ทำของหายกับคนที่พบของภายในมหาวิทยาลัย ให้การค้นหา ตรวจสอบ และรับของคืนเป็นเรื่องที่ง่ายและปลอดภัยมากขึ้น
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/register" className={`${buttonVariants({ variant: 'primary' })} min-h-12 sm:min-w-44`}>
                เริ่มต้นใช้งาน
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link to="/login" className={`${buttonVariants({ variant: 'secondary' })} min-h-12 sm:min-w-36`}>
                เข้าสู่ระบบ
              </Link>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary">
              <span>ใช้งานง่าย</span><span aria-hidden="true">·</span>
              <span>เคารพความเป็นส่วนตัว</span><span aria-hidden="true">·</span>
              <span>มีขั้นตอนตรวจสอบก่อนรับคืน</span>
            </p>
          </div>

          <CampusLostItemVisual />
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className="bg-surface py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-7 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold text-brand">วิธีการใช้งาน</p>
            <h2 id="how-it-works-title" className="mt-2 text-page-mobile font-bold tracking-tight text-text-primary md:text-page">
              ตามหาของได้ง่ายขึ้นใน 3 ขั้นตอน
            </h2>
            <p className="mt-3 text-body text-text-secondary">
              LostLink ช่วยลดเวลาที่ต้องค้นหาด้วยตัวเอง และช่วยนำรายการที่อาจเกี่ยวข้องมาให้คุณตรวจสอบ
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => <StepCard key={step.number} {...step} wide={index === 2} />)}
          </ol>

          <div className="mt-5 flex items-start gap-3 rounded-card border border-brand/10 bg-brand-soft/70 px-4 py-4 text-caption text-brand md:items-center md:px-5">
            <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 md:mt-0" />
            <p>
              <strong className="font-semibold">AI เป็นเพียงเครื่องมือช่วยค้นหาและจัดอันดับความใกล้เคียงของรายการ</strong>{' '}
              ผลการจับคู่ไม่ถือเป็นหลักฐานยืนยันความเป็นเจ้าของ
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-7 lg:px-8">
          <div className="rounded-overlay border border-border bg-surface p-6 shadow-card md:p-10">
            <p className="text-caption font-semibold text-brand">Privacy by design</p>
            <h2 id="privacy-title" className="mt-2 max-w-4xl text-page-mobile font-bold tracking-tight text-text-primary md:text-page">
              ตามหาของ โดยไม่ต้องเปิดเผยข้อมูลเกินความจำเป็น
            </h2>
            <p className="mt-3 max-w-3xl text-body text-text-secondary">
              LostLink ออกแบบให้ข้อมูลที่ใช้ค้นหาแยกออกจากข้อมูลส่วนตัวที่ไม่จำเป็นต้องแสดงต่อสาธารณะ
            </p>

            <div className="mt-9 grid gap-7 md:grid-cols-3 md:gap-6">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <article key={title} className="flex gap-4 md:block">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-feature bg-brand-soft text-brand">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <div className="md:mt-5">
                    <h3 className="text-card font-semibold text-text-primary">{title}</h3>
                    <p className="mt-2 text-caption text-text-secondary">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="final-cta-title" className="pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-5 md:px-7 lg:px-8">
          <div className="relative overflow-hidden rounded-overlay bg-brand px-6 py-10 text-center text-on-brand shadow-floating md:px-10 md:py-12">
            <div aria-hidden="true" className="absolute -left-10 -top-12 size-40 rounded-full bg-on-brand/5" />
            <div aria-hidden="true" className="absolute -bottom-24 -right-12 size-56 rounded-full bg-on-brand/5" />
            <div className="relative mx-auto max-w-3xl">
              <h2 id="final-cta-title" className="text-page-mobile font-bold tracking-tight md:text-page">
                พร้อมตามหาของของคุณหรือยัง?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-body text-on-brand/80">
                สร้างบัญชีเพื่อเริ่มแจ้งข้อมูล ค้นหารายการที่อาจเกี่ยวข้อง และดำเนินการผ่านขั้นตอนตรวจสอบของ LostLink
              </p>
              <div className="mt-7 grid gap-3 sm:flex sm:justify-center">
                <Link to="/register" className={`${buttonVariants({ variant: 'secondary' })} min-h-12 sm:min-w-44`}>
                  สร้างบัญชีฟรี
                </Link>
                <Link
                  to="/login"
                  className="ui-transition inline-flex min-h-12 items-center justify-center rounded-control border border-on-brand/60 px-5 py-3 text-caption font-semibold text-on-brand hover:bg-on-brand/10 sm:min-w-36"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
              <p className="mt-6 inline-flex items-center justify-center gap-2 text-caption text-on-brand/75">
                <Check aria-hidden="true" className="size-4" /> เริ่มต้นได้โดยไม่แสดงข้อมูลส่วนตัวต่อสาธารณะ
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
