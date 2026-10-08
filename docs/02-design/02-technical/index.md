# 02 - Technical

เก็บเอกสาร **การออกแบบเชิงเทคนิค (Technical Design)** เช่น

- System architecture / โครงสร้างระบบโดยรวม
- Database schema
- API design / data contract
- Detailed design (ขั้นตอนการทำงานภายใน, business logic, exception handling, security เฉพาะจุด)
- เทคโนโลยีและไลบรารีที่เลือกใช้ พร้อมเหตุผล

เอกสารในโฟลเดอร์นี้คือพิมพ์เขียวที่ทีมพัฒนาใช้อ้างอิงตอนลงมือเขียนโค้ด และเป็นฐานในการวางแผนทดสอบใน [[../../03-testing/01-test-plan/index|01-test-plan]]

> การ implement ค่าสี ฟอนต์ spacing และคอมโพเนนต์ (เช่น CSS variables, theme config) ให้อ้างอิงตาม token ที่กำหนดไว้ใน [[../DESIGN|DESIGN.md]]

## ลำดับการอ่านและการสร้างเอกสาร

เอกสารในโฟลเดอร์นี้เป็น **living document ชื่อไฟล์คงที่** ที่ต่อยอดกันเป็นชั้น และเขียนแบบ **conceptual** (ยังไม่ระบุ technical stack) แต่ละชั้นใช้ชั้นก่อนหน้าเป็นต้นทางและไม่แก้ไขชั้นก่อนหน้า:

1. **High Level Architecture** — ภาพรวมระบบ, component, data flow ตาม user journey, data concept (สร้างด้วย `/sync-architecture`)
2. **Database Spec** และ **API Spec** — ER Diagram/รายละเอียดตาราง และ operation ที่อ้างอิงกลับไปยัง feature/user story (สร้างด้วย `/sync-api-db`)
3. **Detailed Design** — ขั้นตอนภายในของแต่ละ operation, validation, exception handling, security (สร้างด้วย `/sync-detailed-design`)

input จากโฟลเดอร์อื่น: features list และ user journey จาก [[../01-prototypes/index|01-prototypes]] และ acceptance criteria/test case จาก [[../../03-testing/01-test-plan/index|01-test-plan]]

## เอกสารในโฟลเดอร์นี้

_(รายการด้านล่างจะถูกเพิ่มโดย skill เมื่อสร้างเอกสารแต่ละฉบับ)_

- [[high-level-architecture|High Level Architecture (Conceptual)]] — ภาพรวมระบบเชิงแนวคิด ยังไม่ผูกกับ technical stack
