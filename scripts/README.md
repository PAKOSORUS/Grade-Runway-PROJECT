# scripts

## seed-firestore.js
ใส่ข้อมูลตัวอย่างลง Firestore ตาม [[../docs/02-design/02-technical/database-spec|Database Spec]] §4.3–4.4 ด้วย Firebase Web SDK (ไม่ใช้ service account)
- `courses` 5 เอกสาร (doc ID = `course_id`, `course-ST201` เป็น `is_active: false`)
- `terms` 3 เอกสาร (doc ID = `term_id`, `2569-1` เป็นภาคปัจจุบัน) วันที่เก็บเป็น timestamp 00:00 เวลาไทย

รันซ้ำได้ (doc ID คงที่ จึงเขียนทับ ไม่เกิดข้อมูลซ้ำ) และตรวจชื่อ/ชนิด field, `end_date ≥ start_date`, `is_current = true` พอดี 1 เอกสาร ก่อนเขียน ถ้าไม่ผ่านจะหยุดโดยไม่เขียนอะไร

```bash
npm install firebase
cp scripts/firebase-config.example.js scripts/firebase-config.js   # แล้วใส่ค่า config
node scripts/seed-firestore.js --dry-run   # ดูอย่างเดียว ไม่ต้องมี config
node scripts/seed-firestore.js             # เขียนจริง
```

หมายเหตุ: Firestore แบบ Test mode เปิดให้เขียนได้ประมาณ 30 วันเท่านั้น `firebase-config.js` ถูกกันไว้ใน `.gitignore`
