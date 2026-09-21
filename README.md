# VocabFlow 🌿

**VocabFlow** เป็นเว็บแอปพลิเคชันเรียนรู้คำศัพท์ภาษาอังกฤษด้วยบัตรคำ (Flashcard) และระบบทบทวนแบบเว้นระยะ (Spaced Repetition System - SM-2) ออกแบบเพื่อการเรียนรู้ที่มีประสิทธิภาพ ใช้งานง่ายบนมือถือ มีระบบเสียงอ่านสองสำเนียง (US/UK) รูปภาพประกอบเชื่อมโยงความจำ และระบบสิทธิ์ผู้ใช้ (RBAC) ระดับองค์กร

---

## 📋 สารบัญ (Table of Contents)
1. [คุณสมบัติเด่น (Features)](#-คุณสมบัติเด่น-features)
2. [วิธีติดตั้งและเริ่มต้นใช้งาน (Installation & Getting Started)](#-วิธีติดตั้งและเริ่มต้นใช้งาน-installation--getting-started)
3. [การตั้งค่า Supabase และฐานข้อมูล (Supabase Setup)](#-การตั้งค่า-supabase-และฐานข้อมูล-supabase-setup)
4. [ตัวแปรสภาพแวดล้อม (Environment Variables)](#-ตัวแปรสภาพแวดล้อม-environment-variables)
5. [การนำเข้าชุดคำศัพท์ CSV / JSON (Import Pipeline)](#-การนำเข้าชุดคำศัพท์-csv--json-import-pipeline)
6. [ระบบรูปภาพและเสียงอ่าน (Image & Audio Providers)](#-ระบบรูปภาพและเสียงอ่าน-image--audio-providers)
7. [ข้อจำกัดด้านลิขสิทธิ์ (Copyright & Licensing Disclosures)](#-ข้อจำกัดด้านลิขสิทธิ์-copyright--licensing-disclosures)
8. [สรุปโครงสร้างไฟล์และคำสั่งระบบ (File Structure & Commands)](#-สรุปโครงสร้างไฟล์และคำสั่งระบบ-file-structure--commands)

---

## ✨ คุณสมบัติเด่น (Features)

- **Spaced Repetition System (SRS SM-2)**: อัลกอริทึม SM-2 คำนวณช่วงเวลาทบทวนคำศัพท์อัตโนมัติ พร้อมปุ่มประเมิน 4 ระดับ: `Again (1)`, `Hard (2)`, `Good (3)`, `Easy (4)` และปุ่มย้อนกลับ (Undo)
- **Streak นับต่อเนื่อง**: เริ่มต้นที่ `0` วัน และเริ่มนับ `1` ในวันถัดไปเมื่อเข้าเรียนติดต่อกัน พร้อมระบบรักษาสถิติ
- **Dual Pronunciation (US/UK)**: เสียงอ่านเจ้าของภาษา 2 สำเนียง พร้อมระบบสำรอง 4 ขั้น (Stored URL → Server TTS → Web Speech API → ข้อความแจ้งเตือน)
- **Zero Broken Images**: ระบบจับคู่รูปภาพอัตโนมัติตามความหมาย พร้อมภาพสำรอง Category Gradient สวยงาม ไม่มีภาพเสีย
- **Role-Based Access Control (RBAC)**:
  - **User**: ทบทวนคำศัพท์, ดูคลังคำศัพท์แบบ Read-Only, บันทึกประวัติและบุ๊กมาร์กส่วนตัว
  - **Admin**: จัดการคำศัพท์ส่วนกลาง (CRUD), นำเข้า CSV/JSON, จัดการรูปภาพ, ดู Audit Logs ป้องกันด้วยการบังคับใส่รหัสผ่าน
- **Accessibility & Keyboard Navigation**:
  - `Space` / `Enter`: พลิกบัตรคำ (Flip Card)
  - `1`, `2`, `3`, `4`: ให้คะแนนความจำ (Again, Hard, Good, Easy)
  - `←` / `→`: ย้อนกลับ / ข้ามคำศัพท์
  - `U`: ย้อนกลับการตัดสินใจล่าสุด (Undo)
  - มี Skip to Content Link และ ARIA ครบถ้วนตามมาตรฐาน Lighthouse 90+
- **Responsive & PWA Ready**: รองรับหน้าจอ 320px, 768px, 1024px, 1440px พร้อม Web App Manifest และไอคอน

---

## 🚀 วิธีติดตั้งและเริ่มต้นใช้งาน (Installation & Getting Started)

### ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชัน 18.18.0 หรือ 20.x ขึ้นไป
- `npm` เวอร์ชัน 9.x ขึ้นไป

### ขั้นตอนการติดตั้ง
```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd "c:/Users/wanch/Desktop/AI/Flash Card"

# 2. ติดตั้ง Dependencies ทั้งหมด
npm install

# 3. คัดลอกไฟล์ Environment Variables
cp .env.example .env.local

# 4. เริ่มต้นเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🗄️ การตั้งค่า Supabase และฐานข้อมูล (Supabase Setup)

VocabFlow รองรับทั้ง **โหมด Guest** (ใช้ LocalStorage โดยไม่ต้องต่อฐานข้อมูล) และ **โหมดสมาชิกออนไลน์** (ใช้ Supabase Auth + PostgreSQL RLS)

### ขั้นตอนการสร้างและเชื่อมต่อ Supabase:
1. สมัครหรือเข้าสู่ระบบที่ [Supabase](https://supabase.com/) แล้วสร้างโปรเจกต์ใหม่ (New Project)
2. ไปที่ **Project Settings $\rightarrow$ API** แล้วคัดลอกค่า:
   - `Project URL` $\rightarrow$ ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` $\rightarrow$ ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` $\rightarrow$ ใส่ใน `SUPABASE_SERVICE_ROLE_KEY` (ห้ามเปิดเผยต่อผู้ใช้ภายนอก)
3. ไปที่เมนู **SQL Editor** ใน Supabase Dashboard แล้วรันสคริปต์ Migration ตามลำดับ:
   - รันไฟล์ [`supabase/migrations/0001_initial_schema.sql`](file:///c:/Users/wanch/Desktop/AI/Flash%20Card/supabase/migrations/0001_initial_schema.sql): สร้างตาราง `vocabularies`, `profiles`, `user_word_progress`, และ RLS พื้นฐาน
   - รันไฟล์ [`supabase/migrations/0002_fix_rls_policies.sql`](file:///c:/Users/wanch/Desktop/AI/Flash%20Card/supabase/migrations/0002_fix_rls_policies.sql): ปรับแต่งสิทธิ์การอ่านข้อมูลคำศัพท์
   - รันไฟล์ [`supabase/migrations/0003_auth_roles_and_permissions.sql`](file:///c:/Users/wanch/Desktop/AI/Flash%20Card/supabase/migrations/0003_auth_roles_and_permissions.sql): เพิ่มระบบ RBAC (คอลัมน์ `role`, ตาราง `admin_audit_logs`, `bookmarks`, และฟังก์ชัน `is_admin()`)

### การแต่งตั้งผู้ดูแลระบบคนแรก (First Admin Setup):
- **วิธีที่ 1 (ผ่านสคริปต์ Node.js)**:
  ```bash
  node scripts/set-admin.mjs your-email@example.com
  ```
- **วิธีที่ 2 (ผ่าน SQL Editor)**:
  ```sql
  select public.promote_user_to_admin('your-email@example.com');
  ```

---

## ⚙️ ตัวแปรสภาพแวดล้อม (Environment Variables)

ตั้งค่าในไฟล์ `.env.local`:

| ตัวแปร | ความจำเป็น | คำอธิบาย | ตัวอย่างค่า |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | แนะนำ | URL โปรเจกต์ Supabase สำหรับเชื่อมต่อฐานข้อมูล | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | แนะนำ | Public Anonymous Key สำหรับเรียก API ฝั่ง Client | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server เท่านั้น | Service Role Key สำหรับงาน Admin และ Audit Logs (ห้ามใส่ NEXT_PUBLIC_) | `eyJhbGciOi...` |
| `ADMIN_EMAIL` | แนะนำ | อีเมลของผู้ดูแลระบบหลัก | `admin@vocabflow.local` |
| `ADMIN_PASSWORD` | แนะนำ | **รหัสผ่านสำหรับเข้าสู่ระบบ Admin** (กำหนดและแก้ไขได้ที่นี่) | `admin123456` |
| `NEXT_PUBLIC_ADMIN_PASSKEY` | ทางเลือก | รหัสผ่านสำรองสำหรับการเข้าหน้า Portal Admin | `admin123456` |
| `NEXT_PUBLIC_ALLOW_GUEST_MODE` | ทางเลือก | อนุญาตให้ใช้งานโหมดผู้เยี่ยมชมโดยไม่ต้องล็อกอิน (`true`/`false`) | `true` |
| `UNSPLASH_ACCESS_KEY` | ทางเลือก | API Key สำหรับค้นหาภาพประกอบความละเอียดสูงจาก Unsplash | `your-unsplash-key` |
| `PEXELS_API_KEY` | ทางเลือก | API Key สำหรับค้นหาภาพประกอบจาก Pexels | `your-pexels-key` |

---

## 📥 การนำเข้าชุดคำศัพท์ CSV / JSON (Import Pipeline)

เฉพาะผู้ใช้ที่มีสิทธิ์ **Admin** เท่านั้นที่สามารถเข้าหน้า `/admin/import` เพื่อนำเข้าชุดคำศัพท์ได้

### 1. ฟอร์แมตของไฟล์ CSV (RFC 4180 Compliant)
ไฟล์ CSV ต้องมีหัวตาราง (Headers) ดังนี้:
- **คอลัมน์จำเป็น**: `word`, `part_of_speech`, `definition`, `translation_th`, `cefr_level`
- **คอลัมน์เพิ่มเติม (Optional)**: `category`, `example_sentence`, `example_translation_th`, `image_url`, `audio_us_url`, `audio_uk_url`, `tags`

*ตัวอย่างแถว CSV:*
```csv
word,part_of_speech,definition,translation_th,cefr_level,category,example_sentence,example_translation_th
resilience,noun,"The capacity to recover quickly from difficulties; toughness.",ความสามารถในการฟื้นตัวจากความยากลำบาก,B2,"Mindset & Growth","Courage and resilience helped her succeed.","ความกล้าหาญและความยืดหยุ่นช่วยให้เธอประสบความสำเร็จ"
```

### 2. ฟอร์แมตของไฟล์ JSON
```json
[
  {
    "word": "resilience",
    "part_of_speech": "noun",
    "definition": "The capacity to recover quickly from difficulties; toughness.",
    "translation_th": "ความสามารถในการฟื้นตัวจากความยากลำบาก",
    "cefr_level": "B2",
    "category": "Mindset & Growth",
    "example_sentence": "Courage and resilience helped her succeed.",
    "example_translation_th": "ความกล้าหาญและความยืดหยุ่นช่วยให้เธอประสบความสำเร็จ",
    "is_locked": false
  }
]
```

### 3. กลยุทธ์การจัดการคำศัพท์ซ้ำ (Duplicate Resolution Strategies)
- **`skip` (ข้ามคำซ้ำ)**: หากพบคำศัพท์เดิมอยู่ในระบบแล้ว จะคงข้อมูลเดิมไว้และข้ามการนำเข้า
- **`update` (เขียนทับ)**: อัปเดตความหมาย คำแปล และรูปภาพของคำเดิม
- **`merge` (ผสานข้อมูล)**: นำแท็กใหม่มารวมกับแท็กเดิม และเติมข้อมูลในช่องที่ว่างอยู่
- **ระบบป้องกันคำที่ถูกล็อค (`is_locked`)**: หากคำศัพท์ถูกทำเครื่องหมายว่าล็อคไว้ ระบบจะไม่เขียนทับหรือลบคำนั้นเด็ดขาดไม่ว่าจะเลือกกลยุทธ์ใด

---

## 🎨 ระบบรูปภาพและเสียงอ่าน (Image & Audio Providers)

### ระบบสำรองรูปภาพ 4 ขั้น (4-Stage Image Cascade)
1. **Stage 1 (Database URL)**: ใช้ URL รูปภาพที่ระบุไว้ในฐานข้อมูล
2. **Stage 2 (Verified CDN Images)**: ใช้ภาพคุณภาพสูงที่คัดสรรจากคลังภาพ Unsplash/Pexels CDN
3. **Stage 3 (Semantic Auto-Matcher)**: อัลกอริทึมวิเคราะห์ประเภทคำและบริบท เพื่อเลือกภาพสัญลักษณ์เปรียบเทียบที่ตรงกับความหมาย
4. **Stage 4 (Category Gradient & Icon Fallback)**: หากไม่มีภาพหรือโหลดไม่สำเร็จ จะแสดงการ์ดสี Gradient สวยงามตามหมวดหมู่ พร้อมไอคอน Lucide ทำให้ไม่มีภาพแตกหรือหน้าจอกระตุก 100%

### ระบบสำรองเสียงอ่าน 4 ขั้น (4-Stage Audio Cascade)
1. **Stage 1 (Database Audio URL)**: เล่นไฟล์เสียง MP3/WAV คุณภาพสูงที่บันทึกไว้
2. **Stage 2 (Server-Side TTS Route)**: ดึงเสียงสังเคราะห์ผ่าน `/api/audio/tts` พร้อมระบบแคช LRU ภายในเซิร์ฟเวอร์
3. **Stage 3 (Client Web Speech API)**: สังเคราะห์เสียงพูดผ่านเบราว์เซอร์ของผู้ใช้โดยตรง แยกสำเนียง `en-US` และ `en-GB` ชัดเจน
4. **Stage 4 (Accessible Polite Notification)**: แสดงข้อความแจ้งเตือนภาษาไทยอย่างสุภาพหากระบบเสียงทั้งหมดไม่พร้อมใช้งาน

---

## ⚖️ ข้อจำกัดด้านลิขสิทธิ์ (Copyright & Licensing Disclosures)

1. **นโยบายไม่ละเมิดลิขสิทธิ์คำศัพท์ (No Proprietary Scraping)**:
   - VocabFlow **ไม่คัดลอก ไม่ดูดข้อมูล (Scrape) และไม่แจกจ่าย** ชุดคำศัพท์ที่มีลิขสิทธิ์เชิงพาณิชย์ของบุคคลภายนอก (เช่น Oxford 3000™, Cambridge Advanced Learner's Dictionary™)
   - ข้อมูลคำศัพท์เริ่มต้นในระบบจัดทำขึ้นภายใต้สัญญาอนุญาต **Creative Commons Attribution 4.0 International (CC-BY-4.0)**
   - ผู้ใช้งานหรือหน่วยงานที่นำเข้าชุดคำศัพท์ของตนเอง เป็นผู้รับผิดชอบต่อความถูกต้องและสิทธิ์ในการใช้งานชุดข้อมูลนั้น
2. **สัญญาอนุญาตของรูปภาพ (Image Licenses)**:
   - รูปภาพประกอบที่ค้นหาผ่านระบบอ้างอิงจาก Unsplash License และ Pexels License ซึ่งอนุญาตให้ใช้งานเพื่อการศึกษาและเชิงพาณิชย์ได้โดยไม่เสียค่าใช้จ่าย
3. **ข้อตกลงการใช้เสียงสังเคราะห์ (TTS Audio Usage)**:
   - เสียงอ่านสังเคราะห์จาก Web Speech API เป็นไปตามเงื่อนไขของระบบปฏิบัติการและเบราว์เซอร์ของผู้ใช้งาน

---

## 🗂️ สรุปโครงสร้างไฟล์และคำสั่งระบบ (File Structure & Commands)

### โครงสร้างไฟล์สำคัญ
```text
c:/Users/wanch/Desktop/AI/Flash Card/
├── .env.local                            # การกำหนดค่ารหัสผ่าน Admin และ Supabase
├── package.json                          # สคริปต์และรายการ dependencies
├── tests/                                # ชุดการทดสอบครอบคลุม 77 การทดสอบ
│   ├── component_flashcard.test.mjs      # การทดสอบคอมโพเนนต์ Flashcard และ Swipe
│   ├── component_pronunciation.test.mjs  # การทดสอบปุ่มเสียงอ่านและ ARIA
│   ├── e2e_learning_flows.test.mjs       # การทดสอบโฟลว์ Guest, Login, Import, Review
│   ├── edge_cases.test.mjs               # การทดสอบเน็ตช้า, รูปเสีย, เสียงเสีย, DB ว่าง
│   ├── srs.test.mjs                      # การทดสอบอัลกอริทึม SM-2 และ Streak
│   ├── auth_roles.test.mjs               # การทดสอบ RBAC, RLS, และรหัสผ่าน Admin
│   ├── audio_tts.test.mjs                # การทดสอบระบบเสียง 4-stage cascade
│   ├── image_provider.test.mjs           # การทดสอบระบบรูปภาพและ fallback
│   ├── import_duplicates.test.mjs        # การทดสอบการจัดการคำซ้ำ
│   ├── import_parser.test.mjs            # การทดสอบการแยกส่วน CSV/JSON
│   └── import_validator.test.mjs         # การทดสอบความถูกต้องของข้อมูล
├── src/
│   ├── app/                              # Next.js App Router (27 หน้า)
│   │   ├── page.tsx                      # Dashboard หน้าแรก
│   │   ├── learn/page.tsx                # โหมดเรียนคำศัพท์ใหม่
│   │   ├── review/page.tsx               # โหมดทบทวนแบบเว้นระยะ (SRS)
│   │   ├── vocabulary/page.tsx           # คลังคำศัพท์สำหรับผู้ใช้ทั่วไป (Read-Only)
│   │   ├── progress/page.tsx             # สถิติและประวัติความก้าวหน้า
│   │   ├── settings/page.tsx             # การตั้งค่าแอปและสิทธิ์
│   │   ├── privacy/page.tsx              # ประกาศความเป็นส่วนตัว
│   │   ├── login/page.tsx                # หน้าเข้าสู่ระบบ (บังคับรหัสผ่าน Admin)
│   │   ├── register/page.tsx             # หน้าลงทะเบียนผู้ใช้ใหม่
│   │   └── admin/                        # ส่วนของผู้ดูแลระบบ (Admin Portal)
│   │       ├── vocabulary/page.tsx       # การจัดการคำศัพท์ส่วนกลาง (CRUD)
│   │       ├── import/page.tsx           # ระบบนำเข้าไฟล์ CSV/JSON
│   │       └── images/page.tsx           # การตรวจสอบรูปภาพ
│   ├── components/
│   │   ├── flashcards/                   # บัตรคำ 3 มิติ (Flashcard)
│   │   ├── audio/                        # ปุ่มเล่นเสียงอ่านสำเนียง US/UK
│   │   ├── images/                       # จัดการรูปภาพและ Category Fallback
│   │   ├── auth/                         # ตัวจัดการ Session และ Auth State
│   │   └── navigation/                   # แถบเมนูด้านบนและด้านล่าง (MobileNav)
│   ├── lib/
│   │   ├── srs/sm2.ts                    # อัลกอริทึม SM-2 และการคำนวณ Streak
│   │   ├── audio/speech.ts               # ตัวควบคุมการเล่นเสียง
│   │   └── supabase/                     # ไคลเอนต์และตัวจัดการสิทธิ์ Supabase
```

### คำสั่งสำหรับรันระบบ (CLI Commands)

| คำสั่ง | วัตถุประสงค์ |
| :--- | :--- |
| `npm run dev` | เริ่มต้นเซิร์ฟเวอร์ทดสอบ (Local Development Server: http://localhost:3000) |
| `npm test` | รันชุดการทดสอบทั้งหมด (77 unit, component, E2E, และ edge-case tests) |
| `npm run lint` | ตรวจสอบคุณภาพโค้ดด้วย ESLint (ผลการตรวจสอบ: 0 errors, 0 warnings) |
| `npm run typecheck` | ตรวจสอบความถูกต้องของประเภทข้อมูล TypeScript แบบ Strict Mode |
| `npm run build` | คอมไพล์โปรเจกต์เป็น Production Bundle ด้วย Turbopack |
| `npm run start` | เริ่มต้นรันเซิร์ฟเวอร์ระดับ Production หลังการ build |
