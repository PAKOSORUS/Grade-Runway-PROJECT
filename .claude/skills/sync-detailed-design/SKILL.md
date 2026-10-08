---
name: sync-detailed-design
description: สร้างหรืออัปเดตเอกสาร Detailed Design แบบ conceptual (ยังไม่ผูกกับ technical stack) ที่ขยายแต่ละ operation ของ api-spec เป็นขั้นตอนการทำงานภายในแบบ step-by-step พร้อม business logic & validation rules, exception & error handling และ security เฉพาะจุด โดยใช้ high-level-architecture.md, database-spec.md, api-spec.md เป็น input หลักร่วมกับ user journey และ test case ลงใน docs/02-design/02-technical/ หากพบความขัดแย้งกับเอกสารต้นทางจะรายงานเป็น delta แล้วถามผู้ใช้ (ไม่แก้เอกสารต้นทางเอง) และถามเมื่อมีจุดไม่ชัดเจน (ทางเลือก ≥3 ข้อ พร้อมข้อดี/ข้อเสีย) อัปเดต index.md และบันทึก log ประจำวัน ใช้เมื่อผู้ใช้ต้องการร่างหรือ sync detailed design ให้ตรงกับ architecture, api/db spec ล่าสุด หรือพิมพ์ /sync-detailed-design
---

Skill นี้ทำหน้าที่สร้างหรือปรับปรุง **เอกสาร Detailed Design แบบ conceptual** ฉบับเดียว (living document) ที่ `docs/02-design/02-technical/detailed-design.md` โดยต่อยอดจาก `high-level-architecture.md`, `database-spec.md` และ `api-spec.md` ในโฟลเดอร์เดียวกัน ไม่ระบุ technical stack ทำตามธรรมเนียมใน [CLAUDE.md](../../../CLAUDE.md) ที่ root ของ repo (ภาษาไทย, wikilink, ห้ามลบเอกสาร ฯลฯ)

เอกสารนี้ **ลงลึกกว่า api-spec แต่ไม่ซ้ำ**: ไม่ทำ sequence diagram ตาม journey ซ้ำกับ `api-spec.md` แต่ขยายแต่ละ operation เป็นขั้นตอนภายในแบบ step-by-step (flowchart + ตาราง) พร้อม business logic & validation rules, exception & error handling และ security เฉพาะจุด

เช่นเดียวกับ `/sync-architecture` และ `/sync-api-db` skill นี้ **ต้องถามผู้ใช้เมื่อพบความไม่ชัดเจนที่กระทบพฤติกรรมของระบบ** (ดูขั้นตอนที่ 4) และ **ห้ามแก้เอกสารต้นทางเอง** — ความขัดแย้งทุกกรณีต้องรายงานเป็น delta แล้วถามผู้ใช้

ลำดับของงานในโฟลเดอร์ `02-technical` คือ `/sync-architecture` → `/sync-api-db` → `/sync-detailed-design`

ทำตามขั้นตอนตามลำดับ **ห้ามข้ามขั้นตอนใด**:

## ขั้นตอนที่ 1 — ตรวจ input หลักและกำหนดขอบเขต

1. ตรวจด้วย Glob ว่ามีไฟล์ทั้งสามใน `docs/02-design/02-technical/` หรือไม่: `high-level-architecture.md`, `database-spec.md`, `api-spec.md`
   - **ขาดไฟล์ใดไฟล์หนึ่งหรือมากกว่า → แจ้งผู้ใช้ว่าขาดไฟล์ใด แล้วหยุด** โดยแนะนำ: ขาด `api-spec.md` หรือ `database-spec.md` → ให้รัน `/sync-api-db` ก่อน (ถ้าขาด `high-level-architecture.md` ด้วย ให้รัน `/sync-architecture` ก่อน แล้วจึง `/sync-api-db`) — ห้ามเดาหรือสร้างเอกสารต้นทางขึ้นเอง
2. กำหนดขอบเขต: ถ้าผู้ใช้ระบุ topic หรือกลุ่ม operation ไว้ชัดเจนใช้เฉพาะที่ระบุ ถ้าไม่ระบุใช้ **ทุก operation** ใน `api-spec.md` และ spec ใน `docs/01-requirements/01-spec/*.md` (ไม่นับ `index.md`) ที่ไม่ใช่สถานะ `Superseded` ใน `docs/01-requirements/backlog.md`
3. รวบรวม path ของเอกสารประกอบในขอบเขตด้วย Glob + Grep (หา wikilink ที่ชี้กลับไปยัง spec แต่ละฉบับ):
   - user journey ใน `docs/02-design/01-prototypes/*user-journey*.md`
   - acceptance criteria, test plan และ test spec (ตาราง test case) ใน `docs/03-testing/01-test-plan/*.md` (ไม่นับ `index.md`)
4. ตรวจความครบ ถ้าขาดส่วนใดให้ **ทำต่อได้** แต่จดไว้แจ้งในสรุปท้าย: ไม่มี journey → `/spec-to-journey`, ไม่มี test case/AC → `/spec-to-test-plan` (subagent จะใช้ Business Rules + AC ที่มีแทน)
5. ตรวจว่า `api-spec.md`/`database-spec.md` ครอบคลุม spec ในขอบเขตครบหรือไม่ (ดูหัวข้อ 1 และ Traceability ของเอกสารนั้น) ถ้า spec ใดยังไม่ถูกครอบคลุม ให้แจ้งผู้ใช้ในสรุปท้ายว่าควรรัน `/sync-api-db` ก่อน และทำต่อเฉพาะ operation ที่มีอยู่แล้ว

## ขั้นตอนที่ 2 — วิเคราะห์และร่างเนื้อหา

เรียก subagent ชื่อ `detailed-design-writer` (ผ่าน Agent tool, `run_in_background: false`) ส่ง path ของเอกสารต้นทางทั้งสามฉบับ, รายการเอกสารประกอบจากขั้นตอนที่ 1 และ path ของ `detailed-design.md` เดิมถ้ามี (ตรวจด้วย Glob) ให้ subagent คืน `relationship`, `coverage`, `deltas`, `testGaps`, `openQuestions`, `assumptions`, `changeSummary` และ `detailedDesignMarkdown`

ถ้า subagent ตอบ `blocked` ให้แจ้งเหตุผลแก่ผู้ใช้แล้วหยุด

## ขั้นตอนที่ 3 — ตรวจ delta กับเอกสารต้นทาง

ถ้า `deltas` ว่าง ข้ามไปขั้นตอนที่ 4

ถ้ามี แปลว่า detailed design พบสิ่งที่ต้นทางขาด/ขัดกัน/กำกวม **ห้ามแก้เอกสารต้นทางเองไม่ว่ากรณีใด** ให้ตรวจว่าแต่ละ delta มี `openQuestions` ที่สอดคล้องกัน ถ้ายังไม่มี ให้สร้างคำถามเองโดยมีทางเลือกอย่างน้อย 3 ข้อ ตามแนวนี้ (ปรับให้เฉพาะกับกรณีจริง):

- (ก) **ให้ detailed design ตามเอกสารต้นทางตามเดิม** และบันทึกข้อจำกัดเป็นสมมติฐาน — ไม่ต้องย้อนไปแก้ต้นทาง
- (ข) **ย้อนไปแก้เอกสารต้นทางก่อน** (รัน `/sync-architecture` หรือ `/sync-api-db` ตามที่เกี่ยวข้อง) แล้วจึงรัน skill นี้ซ้ำ
- (ค) **ตัดส่วนที่ขัดแย้งออกจากขอบเขตรอบนี้** ทำเฉพาะส่วนที่ไม่กระทบ

พร้อมข้อดี/ข้อเสียที่เฉพาะกับ delta นั้น (เช่น ผลต่อ test case ที่มีอยู่, ผลต่อ schema ที่ตกลงกันแล้ว)

## ขั้นตอนที่ 4 — ถามผู้ใช้เมื่อมีจุดไม่ชัดเจน

ถ้า `openQuestions` (รวมข้อจากขั้นตอนที่ 3) ว่าง ข้ามไปขั้นตอนที่ 5

ถ้ามี ให้ถามผู้ใช้ด้วย AskUserQuestion โดยปฏิบัติตามนี้:

- ถามทีละไม่เกิน 4 คำถามต่อครั้ง เรียงตามความสำคัญที่ subagent จัดมา โดยให้คำถามที่เกี่ยวกับ delta ก่อนเพราะอาจทำให้ flow หยุด ถ้ามีเกิน 4 ให้ถามรอบละ 4 ต่อเนื่องกันจนครบ
- **ทุกคำถามต้องมีตัวเลือกจริงอย่างน้อย 3 ข้อ** (ไม่นับ "Other" ที่ระบบเติมให้) ถ้า subagent ส่งมาน้อยกว่า 3 ข้อ ให้เติมทางเลือกที่สมเหตุสมผลเองจนครบ ห้ามถามด้วยตัวเลือกไม่ถึง 3 ข้อ
- ใน `description` ของแต่ละตัวเลือกใส่ **ข้อดี** และ **ข้อเสีย** ที่เฉพาะเจาะจงกับ Grade Runway รูปแบบ `ดี: … | เสีย: …`
- ตัวเลือกที่แนะนำวางเป็นข้อแรก และต่อท้าย label ด้วย `(Recommended)`
- `header` สั้นไม่เกิน 12 ตัวอักษร (เช่น `Delta D-01`, `Error: …`, `Security: …`) ตัวเลือกต้องเป็นระดับ conceptual ไม่ใช่การเลือกเทคโนโลยี
- ถ้าผู้ใช้ตอบ "Other" ให้ตีความเป็นการตัดสินใจและใช้ตามนั้น ถ้าคลุมเครือเกินตีความให้ถามซ้ำเฉพาะข้อนั้นอีกครั้ง
- ถ้าผู้ใช้ปฏิเสธที่จะตอบข้อใด ใช้ `fallbackAssumption` ของข้อนั้นและบันทึกเป็นสมมติฐาน (สำหรับ delta ที่ไม่ได้รับคำตอบ ให้ใช้ทางเลือก (ก) และบันทึกใน "Delta ที่พบกับเอกสารต้นทาง" ว่ายังไม่ได้ตัดสิน)

เมื่อได้คำตอบครบ ให้เรียก subagent `detailed-design-writer` **อีกครั้ง** พร้อมแนบคำตอบทั้งหมดเป็นการตัดสินใจที่ยืนยันแล้ว เพื่อให้ได้ markdown ฉบับที่สะท้อนคำตอบ (ถ้าเกิดคำถามใหม่ที่สำคัญจริงให้วนถามได้ แต่ไม่เกิน 2 รอบรวม ที่เหลือใช้ fallback assumption)

ถ้าผู้ใช้เลือก "ย้อนไปแก้เอกสารต้นทางก่อน" ในข้อใดก็ตาม ให้หยุด flow แจ้งผู้ใช้ว่าควรรัน skill ใด (`/sync-architecture` และ/หรือ `/sync-api-db`) พร้อมสรุป delta ที่ต้องแก้ แล้วจึงรัน `/sync-detailed-design` ใหม่ **ไม่เขียนไฟล์ใดในรอบนี้** (ยกเว้นผู้ใช้ตอบข้ออื่นที่ไม่เกี่ยวกัน — ก็ยังไม่เขียน เพื่อไม่ให้เอกสารสะท้อนต้นทางที่กำลังจะเปลี่ยน)

## ขั้นตอนที่ 5 — สรุปการตัดสินใจ new/update/up-to-date

- **new**: สร้างไฟล์ใหม่ในขั้นตอนที่ 6
- **update**: แก้ไฟล์เดิมโดยตรง (living document ไม่ต้องย้ายไป `00-archived`) แต่ถ้าเนื้อหาเดิมถูกแทนที่ด้วยการตัดสินใจใหม่อย่างมีนัยสำคัญ ให้คงร่องรอยไว้ในหัวข้อ "การตัดสินใจที่ยืนยันแล้ว" (ใส่วันที่และสิ่งที่เปลี่ยน) เพื่อรักษาประวัติ
- **up-to-date**: ห้ามแก้ไฟล์ แจ้งผู้ใช้ว่าครอบคลุมแล้วพร้อมสรุปสั้นๆ แล้วจบ flow (ข้ามขั้นตอนที่ 6-8 ยกเว้นคำตอบของผู้ใช้ทำให้การตัดสินใจเปลี่ยนเป็น update)

## ขั้นตอนที่ 6 — เขียนเอกสาร

1. หาวันที่ปัจจุบัน `YYYY-MM-DD` ใส่ในบรรทัด "อัปเดตล่าสุด" และคอลัมน์วันที่ของการตัดสินใจ
2. **ตรวจก่อนเขียนไฟล์** (ถ้าตรวจไม่ผ่านให้แก้ markdown เองก่อน):
   - **ครบทุก operation**: ทุก operation ใน `api-spec.md` ในขอบเขตมีหัวข้อลงลึก หรือมีเหตุผลกำกับในตารางหัวข้อ 3 ว่าทำไมไม่ลงลึก
   - **ไม่เกินต้นทาง**: ตาราง/คอลัมน์/enum ที่อ้างมีอยู่จริงใน `database-spec.md`; input/output/error ของแต่ละ operation ไม่เกินจาก `api-spec.md` (ถ้าเกิน แปลว่าเป็น delta ต้องรายงาน ไม่ใช่เขียนลงเอกสารเฉยๆ)
   - **ไม่ซ้ำ api-spec**: ไม่มี `sequenceDiagram` ที่ซ้ำกับหัวข้อ "ลำดับการเรียกตาม User Journey" ของ api-spec และไม่คัดลอกตาราง input/output มาซ้ำ (ใช้ wikilink อ้างแทน)
   - **มีครบสามมิติ** ในทุก operation ที่ลงลึก: กฎธุรกิจ & validation, exception & error handling (รวม edge case จาก journey/test case และระบุวิธีรับมือ + วิธีแจ้งผู้ใช้), security เฉพาะจุด
   - **traceability**: ทุกกฎ/exception มีแหล่งอ้างอิงจริง (business rule/AC/test case) หรือถูกทำเครื่องหมาย `_(สมมติฐาน: ...)_`; `testGaps` ถูกรายงานในหัวข้อ Traceability
   - wikilink ทุกอันชี้ไปยังไฟล์ที่มีอยู่จริง (ตรวจด้วย Glob) path สัมพัทธ์จาก `docs/02-design/02-technical/`
   - ไม่มีชื่อเทคโนโลยี/ผลิตภัณฑ์/HTTP method/path/ชนิดข้อมูลเฉพาะ engine ปนในเนื้อหาหลัก (ยกเว้นหัวข้อ "ข้อจำกัดจาก Requirement")
   - Mermaid แต่ละบล็อก syntax ถูกต้อง (id เป็นอังกฤษ, label ไทยที่มีอักขระพิเศษครอบด้วย `"..."`, หมายเลขขั้นตอนใน flowchart ตรงกับตาราง)
   - หัวข้อ "การตัดสินใจที่ยืนยันแล้ว" มีคำตอบของผู้ใช้ครบ, "Delta ที่พบกับเอกสารต้นทาง" มีทุก delta พร้อมการตัดสินใจ (หรือระบุว่ายังไม่ได้ตัดสิน), "คำถามค้างและสมมติฐาน" มีเฉพาะสิ่งที่ยังไม่ยืนยัน
3. เขียนไฟล์ `docs/02-design/02-technical/detailed-design.md` (ชื่อไฟล์คงที่ ไม่มีเลข running number)
4. เพิ่มรายการใน `docs/02-design/02-technical/index.md` เป็น bullet ต่อท้าย (ถ้ายังไม่มี ห้ามลบเนื้อหาเดิม): `- [[detailed-design|Detailed Design (Conceptual)]] — ขั้นตอนการทำงานภายในของแต่ละ operation, business logic & validation, exception handling และ security เฉพาะจุด ยังไม่ผูกกับ technical stack`
5. เพิ่มลิงก์ไปยัง `detailed-design` ท้ายไฟล์ `api-spec.md` **ได้เฉพาะบรรทัดลิงก์เดียวถ้ายังไม่มี** (เช่น `> รายละเอียดขั้นตอนภายในของแต่ละ operation: [[detailed-design|Detailed Design]]`) ห้ามแก้เนื้อหาเดิมของ `api-spec.md`, `database-spec.md` และ `high-level-architecture.md` นอกจากเพิ่มลิงก์นี้ (ไม่ต้องเพิ่มลิงก์ในสองไฟล์หลัง)

## ขั้นตอนที่ 7 — backlog

skill นี้ **ไม่เปลี่ยนสถานะใน `docs/01-requirements/backlog.md`** เพราะ detailed design เป็นเอกสารข้ามหลาย requirement ไม่ใช่ผลลัพธ์ของ requirement ใด requirement หนึ่ง ข้ามขั้นตอนนี้ และห้ามแตะ backlog

## ขั้นตอนที่ 8 — บันทึก log ประจำวัน

เปิด (หรือสร้างถ้ายังไม่มี) `docs/05-log/{YYYYMMDD}-log.md` — ถ้าเพิ่งสร้างใหม่ใส่หัวเรื่อง `# Log {YYYY-MM-DD}` ก่อน แล้วต่อท้ายไฟล์ (ไม่เขียนทับ) ด้วย:

```markdown
## {HH:MM}
- {สร้าง|อัปเดต} detailed design: [[../02-design/02-technical/detailed-design|Detailed Design]] ({จำนวน} operation) ต่อยอดจาก [[../02-design/02-technical/api-spec|API Spec]] และ [[../02-design/02-technical/database-spec|Database Spec]]
- ตัดสินใจเชิงพฤติกรรมระบบร่วมกับผู้ใช้: {หัวข้อ → ตัวเลือกที่เลือก} (หนึ่งบรรทัดต่อข้อ ถ้ามี)
- {ถ้ามี delta} Delta กับเอกสารต้นทาง: {รหัส + สรุป} → {วิธีที่ผู้ใช้เลือกจัดการ}
- {ถ้า update} สิ่งที่เปลี่ยน: {สรุปจาก changeSummary}
- {ถ้ามี testGaps} exception ที่ยังไม่มี test case รองรับ: {จำนวน}
```

ถ้าไม่ทราบเวลาแน่นอนใช้ลำดับเหตุการณ์แทนได้ ถ้า `docs/05-log/index.md` ยังไม่ลิงก์วันที่นี้ ให้เพิ่มลิงก์ด้วย

## ขั้นตอนที่ 9 — สรุปให้ผู้ใช้

สรุปเป็นข้อความภาษาไทยในคำตอบเดียว ใช้ markdown link `[label](path)` (ไม่ใช่ wikilink) ประกอบด้วย:

1. ไฟล์ที่สร้าง/แก้ พร้อมผลการวิเคราะห์ new/update/up-to-date และจำนวน operation ที่ลงลึก/ไม่ลงลึก
2. **ผลการตรวจ coverage** — operation ที่ครอบคลุม, test case/AC ที่สะท้อนแล้วและยังไม่สะท้อน
3. **Delta กับเอกสารต้นทาง** (ถ้ามี) — รหัส, เอกสารที่เกี่ยว, และสิ่งที่ผู้ใช้เลือก (เน้นว่ายังไม่มีการแก้เอกสารต้นทาง และต้องรัน skill ใดต่อถ้าเลือกย้อนไปแก้)
4. **การตัดสินใจที่ผู้ใช้ยืนยันในรอบนี้** — ตารางสั้น หัวข้อ → ตัวเลือกที่เลือก
5. **ข้อสันนิษฐานที่ยังไม่ได้ยืนยัน** — bullet list (ถ้าไม่มีให้ระบุว่าไม่มี)
6. **`testGaps`** — exception/edge case ที่ยังไม่มี test case รองรับ แนะนำให้รัน `/spec-to-test-plan` (ถ้าไม่มีให้ระบุว่าไม่มี)
7. **สิ่งที่ควรทำต่อ** — เช่น spec ที่ยังไม่มี journey/test case, ควรรัน skill ต้นทางอีกรอบหรือไม่ และเมื่อพร้อมเลือก technical stack ให้สั่งทำเอกสารถัดไปแยกต่างหาก
