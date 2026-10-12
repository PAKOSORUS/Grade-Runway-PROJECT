# scripts

## firestore-schema.js
รวมชื่อ field ชนิด และค่า enum ของทุกคอลเลกชันไว้ที่เดียว (`users`, `courses`, `terms`, `enrollments`, `chatRooms`, `messages`, `mentorRequests`, `mentorCriteria`) พร้อมตารางแปลงเกรดเป็นแต้ม ถ้าจะอ่านเขียน field ในที่อื่น ให้ใช้ชื่อจากไฟล์นี้ ไม่พิมพ์ซ้ำ

## seed-firestore.js
ใส่ข้อมูลตัวอย่าง (ปลอมทั้งหมด) ลง Firestore ด้วย Firebase Web SDK (ไม่ใช้ service account) รวม 44 เอกสาร

| คอลเลกชัน | จำนวน |
|---|---|
| `users` | 6 (แอดมิน 1, นักศึกษา 5 รหัสขึ้นต้น `99`) |
| `courses` | 5 |
| `terms` | 3 (`2569-1` เป็นภาคปัจจุบัน) |
| `enrollments` | 11 (`user-s05` ไม่มีวิชาในภาคปัจจุบัน ไว้ทดสอบ empty state) |
| `chatRooms` | 3 |
| `chatRooms/{id}/messages` | 8 |
| `mentorRequests` | 5 |
| `mentorCriteria` | 3 |

รันซ้ำได้ (doc ID คงที่ จึงเขียนทับ ไม่เกิดข้อมูลซ้ำ ไม่มีคำสั่งลบ) ก่อนเขียนจะตรวจทั้งหมด ถ้าไม่ผ่านจะหยุดโดยไม่เขียนอะไร
- field เกิน/ขาด ชนิด และค่า enum ตาม `firestore-schema.js`
- `user_id`/`course_id`/`term_id` ต้องมีเอกสารจริง และผู้ใช้ต้องลงทะเบียนวิชานั้น
- ค่าที่เก็บซ้ำต้องตรงต้นทาง (`course_code`, `user_name`, `mentor_count`, `last_message_*`, `metric_*`, `criteria_*`, `auto_check`)
- `rejection_reason` ใช้ได้เฉพาะสถานะ `rejected`, `reviewed_*` ต้องมีเมื่อผ่านการตรวจ
- `is_current = true` พอดี 1 ภาค และข้อมูลต้องครอบคลุมทุกสถานะ (pending/approved/rejected)

```bash
npm install firebase
cp scripts/firebase-config.example.js scripts/firebase-config.js   # แล้วใส่ค่า config
node scripts/seed-firestore.js --dry-run   # ตรวจและดูข้อมูล ไม่เขียน ไม่ต้องมี config
node scripts/seed-firestore.js             # เขียนจริง (พิมพ์ projectId ก่อนเขียน)
```

หมายเหตุ
- Firestore แบบ Test mode เปิดให้เขียนได้ประมาณ 30 วันเท่านั้น `firebase-config.js` ถูกกันไว้ใน `.gitignore`
- ชื่อ field ของ `courses`/`terms` (`code`, `name`) ต่างจาก [[../docs/02-design/02-technical/database-spec|Database Spec]] §4.3–4.4 (`course_code`, `term_code`) และ seed รุ่นก่อน ตามร่างโครงสร้างล่าสุด ที่ยังไม่ได้ปรับ spec
- ตารางแปลงเกรด (A=4.0, B+=3.5 ฯลฯ) เป็นสมมติฐานมาตรฐานทั่วไป ต้องยืนยันกับมหาวิทยาลัย
