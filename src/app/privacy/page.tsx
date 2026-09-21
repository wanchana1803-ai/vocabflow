import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, Lock, EyeOff, UserCheck, HardDrive, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "ประกาศความเป็นส่วนตัว (Privacy Notice)",
  description: "นโยบายความเป็นส่วนตัวของ VocabFlow เกี่ยวกับการจัดเก็บข้อมูลบัญชีผู้ใช้และข้อมูลความก้าวหน้าในการเรียนรู้",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2 -ml-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าหลัก
          </Button>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>นโยบายความโปร่งใสและการคุ้มครองข้อมูลส่วนบุคคล</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          ประกาศความเป็นส่วนตัว (Privacy Notice)
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          VocabFlow ให้ความสำคัญสูงสุดกับความเป็นส่วนตัวและความปลอดภัยของข้อมูลผู้ใช้งาน เอกสารนี้ชี้แจงประเภทข้อมูลที่เราจัดเก็บ วิธีการประมวลผล และการควบคุมข้อมูลของคุณทั้งในโหมดผู้เยี่ยมชมและโหมดสมาชิก
        </p>
        <p className="text-xs text-muted-foreground font-mono">ปรับปรุงล่าสุด: กันยายน 2026</p>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border/80 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <EyeOff className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">โหมดผู้เยี่ยมชม (Guest Mode)</CardTitle>
            <CardDescription className="text-xs">
              เรียนรู้ได้ทันทีโดยไม่ต้องลงทะเบียนหรือเปิดเผยตัวตน
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              • ประวัติการเรียนและค่า SRS ถูกบันทึกใน <strong>LocalStorage บนอุปกรณ์ของคุณเท่านั้น</strong>
            </p>
            <p>• ไม่มีการส่งข้อมูลประวัติการเรียนขึ้นสู่เซิร์ฟเวอร์หรือคลาวด์ภายนอก</p>
            <p>• สามารถล้างข้อมูลทั้งหมดได้ทันทีผ่านการล้างแคชของเบราว์เซอร์หรือในหน้าการตั้งค่า</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card/60 backdrop-blur-xs">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">โหมดสมาชิก (Account Mode)</CardTitle>
            <CardDescription className="text-xs">
              ปกป้องข้อมูลด้วยสถาปัตยกรรม Row Level Security (RLS)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              • บัญชีและความก้าวหน้าถูกจัดเก็บบน <strong>PostgreSQL / Supabase</strong> ที่ปลอดภัย
            </p>
            <p>• มีระบบ RLS เข้มงวด ป้องกันไม่ให้ผู้ใช้อื่นหรือบุคคลภายนอกเข้าถึงข้อมูลความก้าวหน้าของคุณได้</p>
            <p>• สิทธิ์ของผู้ดูแลระบบ (Admin) แยกขาดจากผู้ใช้ทั่วไปอย่างชัดเจน</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-6 text-sm text-foreground/90">
        {/* Section 1 */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2>1. ข้อมูลบัญชีผู้ใช้ (Account Data)</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            เมื่อคุณสร้างบัญชีผู้ใช้กับ VocabFlow เราจัดเก็บข้อมูลต่อไปนี้เพื่อการระบุตัวตนและการให้บริการ:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
            <li><strong>อีเมล (Email)</strong>: ใช้เป็นรหัสประจำตัวสำหรับการเข้าสู่ระบบและการกู้คืนรหัสผ่าน</li>
            <li><strong>ชื่อที่แสดง (Display Name)</strong>: ชื่อที่คุณกำหนดสำหรับแสดงผลในระบบ</li>
            <li><strong>รูปโปรไฟล์ (Avatar URL)</strong>: ลิงก์รูปภาพตัวแทน (หากคุณเลือกกำหนด)</li>
            <li><strong>บทบาทในระบบ (Role)</strong>: กำหนดเป็น <code>user</code> โดยค่าเริ่มต้น และเฉพาะผู้ดูแลระบบที่ได้รับการแต่งตั้งเท่านั้นที่จะได้รับสิทธิ์ <code>admin</code></li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <Database className="h-5 w-5 text-primary" />
            <h2>2. ข้อมูลความก้าวหน้าในการเรียนรู้ (Learning & SRS Progress)</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            เพื่อให้ระบบ Spaced Repetition System (SM-2) คำนวณรอบเวลาการทบทวนคำศัพท์ได้อย่างแม่นยำ ระบบจะจัดเก็บข้อมูลเมทริกซ์ดังนี้:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
            <li><strong>สถานะคำศัพท์ (SM-2 State)</strong>: จำนวนครั้งที่ทบทวน (Repetitions), ระยะห่างวัน (Interval), ค่าความง่าย (Ease Factor), และจำนวนครั้งที่ลืม (Lapses)</li>
            <li><strong>ประวัติการตอบ (Review History)</strong>: บันทึกวันเวลาและคะแนนผลการทบทวน (Again, Hard, Good, Easy)</li>
            <li><strong>สถิติการเรียนต่อเนื่อง (Streak)</strong>: คำนวณจากจำนวนวันที่เข้าทบทวนติดต่อกันจริง โดยเริ่มต้นที่ 0 วัน และเริ่มนับเพิ่มในวันถัดไป</li>
            <li><strong>คำศัพท์ที่บุ๊กมาร์ก (Bookmarks)</strong>: รายการคำศัพท์ที่คุณเลือกบันทึกไว้ทบทวนเป็นพิเศษ</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <HardDrive className="h-5 w-5 text-primary" />
            <h2>3. คุกกี้และพื้นที่จัดเก็บบนเบราว์เซอร์ (Storage & Cookies)</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            VocabFlow ไม่ใช้คุกกี้เพื่อการติดตามโฆษณา (Zero Tracking Ads) โดยมีการใช้งานพื้นที่จัดเก็บเฉพาะส่วนที่จำเป็นต่อการทำงานของระบบเท่านั้น:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
            <li><strong>Session Cookies</strong>: คุกกี้ความปลอดภัยสำหรับจดจำสถานะการเข้าสู่ระบบแบบ HttpOnly</li>
            <li><strong>LocalStorage</strong>: บันทึกการตั้งค่าแอปพลิเคชัน เช่น สำเนียงเสียงที่ต้องการ (US/UK), การเล่นเสียงอัตโนมัติ, ธีมสี (Light/Dark), และเป้าหมายคำศัพท์ต่อวัน</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base text-foreground">
            <Lock className="h-5 w-5 text-primary" />
            <h2>4. สิทธิในการควบคุมและลบข้อมูลของคุณ (User Rights & Control)</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            คุณเป็นเจ้าของข้อมูลของคุณโดยสมบูรณ์ และมีสิทธิควบคุมข้อมูลได้ตลอดเวลาผ่านหน้า <Link href="/settings" className="text-primary underline underline-offset-4 font-medium">การตั้งค่า (Settings)</Link>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
            <li><strong>สิทธิในการรีเซ็ตความก้าวหน้า</strong>: ล้างสถิติการเรียนทั้งหมดเพื่อเริ่มต้นใหม่ได้ทุกเมื่อ</li>
            <li><strong>สิทธิในการลบบัญชีอย่างถาวร (Right to Erasure)</strong>: ลบบัญชีผู้ใช้และข้อมูลความก้าวหน้าทั้งหมดออกจากระบบอย่างถาวรโดยไม่สามารถกู้คืนได้</li>
            <li><strong>สิทธิในการส่งออกข้อมูล</strong>: สำรองข้อมูลคำศัพท์ในรูปแบบ JSON/CSV</li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-secondary/50 border border-border/80">
        <div>
          <h3 className="font-semibold text-foreground text-base">ต้องการจัดการข้อมูลของคุณหรือไม่?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            คุณสามารถปรับแต่งการตั้งค่าความเป็นส่วนตัว รีเซ็ตความก้าวหน้า หรือจัดการบัญชีได้ที่หน้าการตั้งค่า
          </p>
        </div>
        <Link href="/settings">
          <Button className="rounded-xl cursor-pointer">
            ไปยังหน้าการตั้งค่า
          </Button>
        </Link>
      </div>
    </div>
  );
}
