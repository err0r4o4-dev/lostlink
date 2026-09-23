# LostLink AI — Frontend Prototype

เว็บไซต์ต้นแบบระบบแจ้งและจับคู่ของหายในมหาวิทยาลัยด้วย AI พัฒนาด้วย HTML, CSS และ JavaScript ล้วน ๆ ไม่มี Backend และไม่ต้องติดตั้งแพ็กเกจใดเพิ่ม

## วิธีเปิดใช้งาน

### วิธีที่ 1 — เปิดทันที

ดับเบิลคลิกไฟล์ `dist/index.html`

### วิธีที่ 2 — ใช้ Live Server ใน VS Code

1. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
2. ติดตั้ง Extension ชื่อ Live Server
3. คลิกขวาที่ `dist/index.html`
4. เลือก `Open with Live Server`

### วิธีที่ 3 — รัน Local Server

```bash
cd dist
python3 -m http.server 5500
```

จากนั้นเปิด `http://localhost:5500`

## ฟังก์ชันที่ทำงานใน Prototype

- Dashboard พร้อมสถิติและรายการ AI Match
- ฟอร์มแจ้งของหาย / แจ้งพบของแบบ 3 ขั้นตอน
- อัปโหลดและ Preview รูปจากเครื่อง
- บันทึกรายการตัวอย่างด้วย LocalStorage
- AI Matching cards พร้อมคะแนนและเหตุผลการจับคู่
- Ownership Verification form
- หน้าติดตามสถานะเคสและการแจ้งเตือน
- Search, Filter, Modal, Toast และ Responsive Mobile Menu

## จุดสำหรับต่อ Backend

ข้อมูลตัวอย่างอยู่ใน `dist/app.js` ได้แก่ `sampleMatches` และ `state.reports` ปัจจุบันรายการใหม่ถูกบันทึกใน LocalStorage โดยเพื่อนสามารถแทนที่ส่วนนี้ด้วย API/Firebase/Supabase ได้ทันที

โครงฟังก์ชันหลักที่ควรเชื่อม API ภายหลัง:

- `submitReport()` — ส่งข้อมูลของหาย/ของที่พบ
- `matchesView()` — ดึงผล AI Matching
- `submit` event ของ `verificationForm` — ส่งคำขอยืนยันเจ้าของ
- `casesView()` — ดึงประวัติและสถานะเคส

## หมายเหตุ

Prototype นี้เป็น Frontend เท่านั้น คะแนน AI และข้อมูลตัวอย่างเป็น Mock Data สำหรับสาธิต User Flow
