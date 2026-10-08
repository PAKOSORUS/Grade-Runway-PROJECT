---
name: sync-api-db
description: สร้างหรืออัปเดตเอกสาร API Spec และ Database Spec แบบ conceptual (ยังไม่ผูกกับ technical stack) โดยใช้ high-level-architecture.md เป็น input หลักร่วมกับ features list, user journey และ acceptance criteria ลงใน docs/02-design/02-technical/ (ER Diagram ขยายจาก data concept, รายละเอียดแต่ละตาราง, endpoint แต่ละตัวอ้างอิง feature/user story) พร้อมถามผู้ใช้เมื่อมีจุดไม่ชัดเจน (ทางเลือก ≥3 ข้อ พร้อมข้อดี/ข้อเสีย) อัปเดต index.md และบันทึก log ประจำวัน ใช้เมื่อผู้ใช้ต้องการร่างหรือ sync API spec / database schema ให้ตรงกับ architecture และ requirement ล่าสุด หรือพิมพ์ /sync-api-db
---

Skill นี้ทำหน้าที่สร้างหรือปรับปรุง **เอกสาร Database Spec และ API Spec แบบ conceptual** สองฉบับ (living document) ที่ `docs/02-design/02-technical/database-spec.md` และ `docs/02-design/02-technical/api-spec.md` โดยต่อยอดจาก [[high-level-architecture]] ที่ `docs/02-design/02-technical/high-level-architecture.md` ไม่ระบุ technical stack ทำตามธรรมเนียมใน [CLAUDE.md](../../../CLAUDE.md) ที่ root ของ repo (ภาษาไทย, wikilink, ห้ามลบเอกสาร ฯลฯ)

เช่นเดียวกับ `/sync-architecture` skill นี้ **ต้องถามผู้ใช้เมื่อพบความไม่ชัดเจนที่กระทบรูปทรงข้อมูลหรือ API** (ดูขั้นตอนที่ 4) เพราะ schema และสัญญา API ผิดทางส่งผลลามไปถึงงาน implement และ test ทั้งหมด

ลำดับของงานในโฟลเดอร์ `02-technical` คือ `/sync-architecture` → `/sync-api-db` ตัว skill นี้ **ไม่แก้ `high-level-architecture.md`** ถ้า schema ต้องการเพิ่ม/เปลี่ยน entity ให้รายงานผู้ใช้และแนะนำให้รัน `/sync-architecture` อีกรอบ

ทำตามขั้นตอนตามลำดับ **ห้ามข้ามขั้นตอนใด**:

## ขั้นตอนที่ 1 — ตรวจ input หลักและกำหนดขอบเขต

1. ตรวจด้วย Glob ว่ามี `docs/02-design/02-technical/high-level-architecture.md` หรือไม่
   - **ไม่มี → แจ้งผู้ใช้ให้รัน `/sync-architecture` ก่อน แล้วหยุด** (hard blocker: ER Diagram ต้องขยายจาก data concept ใน architecture ห้ามสร้างขึ้นเองจนอาจขัดกันภายหลัง)
2. กำหนดขอบเขต spec: ถ้าผู้ใช้ระบุ topic ไว้ชัดเจนใช้เฉพาะที่ระบุ ถ้าไม่ระบุใช้ **ทุก spec** ใน `docs/01-requirements/01-spec/*.md` (ไม่นับ `index.md`) ที่ไม่ใช่สถานะ `Superseded` ใน `docs/01-requirements/backlog.md`
3. รวบรวม path ของเอกสารประกอบในขอบเขต ด้วย Glob + Grep (หา wikilink ที่ชี้กลับไปยัง spec แต่ละฉบับ):
   - features list และ user journey ใน `docs/02-design/01-prototypes/*.md`
   - acceptance criteria ใน `docs/03-testing/01-test-plan/*acceptance-criteria*.md`
4. ตรวจความครบ ถ้าขาดส่วนใดให้ **ทำต่อได้** แต่ต้องจดไว้แจ้งในสรุปท้ายว่าควรรัน skill ใดก่อน: ไม่มี journey → `/spec-to-journey`, ไม่มี acceptance criteria → `/spec-to-test-plan` (subagent จะใช้ User Stories + Business Rules แทน)
5. ตรวจ `high-level-architecture.md` ว่าครอบคลุม spec ในขอบเขตครบหรือไม่ (ดูหัวข้อ 1) ถ้ามี spec ที่ architecture ยังไม่ครอบคลุม ให้แจ้งผู้ใช้ในสรุปท้ายว่าควรรัน `/sync-architecture` ก่อน แต่ทำต่อได้เฉพาะ spec ที่ครอบคลุมแล้ว

## ขั้นตอนที่ 2 — วิเคราะห์และร่างเนื้อหา

เรียก subagent ชื่อ `api-db-writer` (ผ่าน Agent tool, `run_in_background: false`) ส่ง path ของ `high-level-architecture.md`, รายการเอกสารประกอบจากขั้นตอนที่ 1 และ path ของ `database-spec.md` / `api-spec.md` เดิมถ้ามี (ตรวจด้วย Glob) ให้ subagent คืน `relationship` (แยกต่อไฟล์), `coverage`, `architectureDeltas`, `openQuestions`, `assumptions`, `changeSummary`, `databaseSpecMarkdown` และ `apiSpecMarkdown`

ถ้า subagent ตอบ `blocked` ให้แจ้งเหตุผลแก่ผู้ใช้แล้วหยุด

## ขั้นตอนที่ 3 — ตรวจ architectureDeltas

ถ้า `architectureDeltas` ไม่ว่าง แปลว่า schema ต้องการ entity/relationship ที่ไม่มีใน data concept ของ architecture ให้ถือเป็นหนึ่งใน `openQuestions` ที่ต้องถามผู้ใช้ในขั้นตอนถัดไปด้วย โดยมีทางเลือกอย่างน้อย 3 ข้อ เช่น (ก) เก็บเป็นรายละเอียดระดับ schema ใน Database Spec เท่านั้น ไม่กระทบ architecture, (ข) ให้ผู้ใช้ย้อนไปรัน `/sync-architecture` เพื่อเพิ่ม entity ใน data concept ก่อนแล้วค่อยรัน skill นี้ซ้ำ, (ค) ตัดส่วนนั้นออกจาก schema รอบนี้ — พร้อมข้อดี/ข้อเสียที่เฉพาะกับกรณีจริง ห้ามเลือกเองเงียบๆ

## ขั้นตอนที่ 4 — ถามผู้ใช้เมื่อมีจุดไม่ชัดเจน

ถ้า `openQuestions` (รวมข้อจากขั้นตอนที่ 3) ว่าง ข้ามไปขั้นตอนที่ 5

ถ้ามี ให้ถามผู้ใช้ด้วย AskUserQuestion โดยปฏิบัติตามนี้:

- ถามทีละไม่เกิน 4 คำถามต่อครั้ง เรียงตามความสำคัญที่ subagent จัดมา ถ้ามีเกิน 4 ให้ถามรอบละ 4 ต่อเนื่องกันจนครบ
- **ทุกคำถามต้องมีตัวเลือกจริงอย่างน้อย 3 ข้อ** (ไม่นับ "Other" ที่ระบบเติมให้) ถ้า subagent ส่งมาน้อยกว่า 3 ข้อ ให้เติมทางเลือกที่สมเหตุสมผลเองจนครบ ห้ามถามด้วยตัวเลือกไม่ถึง 3 ข้อ
- ใน `description` ของแต่ละตัวเลือกใส่ **ข้อดี** และ **ข้อเสีย** ที่เฉพาะเจาะจงกับ Grade Runway รูปแบบ `ดี: … | เสีย: …`
- ตัวเลือกที่แนะนำวางเป็นข้อแรก และต่อท้าย label ด้วย `(Recommended)`
- `header` สั้นไม่เกิน 12 ตัวอักษร (อาจใช้ `target` เป็นคำนำ เช่น `DB: …`, `API: …`) ตัวเลือกต้องเป็นระดับ conceptual ไม่ใช่การเลือกเทคโนโลยี
- ถ้าผู้ใช้ตอบ "Other" ให้ตีความเป็นการตัดสินใจและใช้ตามนั้น ถ้าคลุมเครือเกินตีความให้ถามซ้ำเฉพาะข้อนั้นอีกครั้ง
- ถ้าผู้ใช้ปฏิเสธที่จะตอบข้อใด ใช้ `fallbackAssumption` ของข้อนั้นและบันทึกเป็นสมมติฐาน

เมื่อได้คำตอบครบ ให้เรียก subagent `api-db-writer` **อีกครั้ง** พร้อมแนบคำตอบทั้งหมดเป็นการตัดสินใจที่ยืนยันแล้ว เพื่อให้ได้ markdown ฉบับที่สะท้อนคำตอบ (ถ้าเกิดคำถามใหม่ที่สำคัญจริงให้วนถามได้ แต่ไม่เกิน 2 รอบรวม ที่เหลือใช้ fallback assumption)

ถ้าคำตอบที่เลือกคือ "ย้อนไปปรับ architecture ก่อน" ให้หยุด flow แจ้งผู้ใช้ให้รัน `/sync-architecture` แล้วจึงรัน `/sync-api-db` ใหม่ (ไม่เขียนไฟล์ใดในรอบนี้)

## ขั้นตอนที่ 5 — สรุปการตัดสินใจต่อไฟล์

ตัดสินแยกกันสำหรับ `database-spec.md` และ `api-spec.md`:

- **new**: สร้างไฟล์ใหม่ในขั้นตอนที่ 6
- **update**: แก้ไฟล์เดิมโดยตรง (living document ไม่ต้องย้ายไป `00-archived`) แต่ถ้าเนื้อหาเดิมถูกแทนที่ด้วยการตัดสินใจใหม่อย่างมีนัยสำคัญ ให้คงร่องรอยไว้ในหัวข้อ "การตัดสินใจที่ยืนยันแล้ว" (ใส่วันที่และสิ่งที่เปลี่ยน) เพื่อรักษาประวัติ
- **up-to-date**: ห้ามแก้ไฟล์นั้น แจ้งผู้ใช้ว่าครอบคลุมแล้ว (ถ้าทั้งสองฉบับเป็น up-to-date ให้จบ flow ข้ามขั้นตอนที่ 6-8 ยกเว้นคำตอบของผู้ใช้ทำให้การตัดสินใจเปลี่ยนเป็น update)

## ขั้นตอนที่ 6 — เขียนเอกสาร

1. หาวันที่ปัจจุบัน `YYYY-MM-DD` ใส่ในบรรทัด "อัปเดตล่าสุด" และคอลัมน์วันที่ของการตัดสินใจ
2. **ตรวจก่อนเขียนไฟล์** (ถ้าตรวจไม่ผ่านให้แก้ markdown เองก่อน):
   - **ER สอดคล้อง architecture**: เปิด `high-level-architecture.md` หัวข้อ Data Concept แล้วตรวจว่าทุก entity ปรากฏใน ER Diagram และตาราง "ความสอดคล้องกับ Data Concept" ของ Database Spec ด้วยชื่อเดียวกัน, ความสัมพันธ์และ cardinality เดิมไม่ถูกเปลี่ยนเงียบๆ
   - **traceability สองทาง**: ทุก operation ใน API Spec มี feature และ user story อ้างอิง และระบุตารางที่อ่าน/เขียน, ทุกตารางที่ถูกอ้างมีอยู่จริงใน Database Spec, ทุกตารางมี requirement/feature อ้างอิง
   - **ลำดับ journey สอดคล้อง architecture**: sequence diagram ในหัวข้อ "ลำดับการเรียกตาม User Journey" ไม่ขัดกับ data flow ในหัวข้อ 4 ของ architecture
   - wikilink ทุกอันชี้ไปยังไฟล์ที่มีอยู่จริง (ตรวจด้วย Glob) path สัมพัทธ์จาก `docs/02-design/02-technical/`
   - ไม่มีชื่อเทคโนโลยี/ผลิตภัณฑ์/ชนิดข้อมูลเฉพาะ engine/HTTP method/path ปนในเนื้อหาหลัก (ยกเว้นหัวข้อ "ข้อจำกัดจาก Requirement") ถ้าพบให้แทนด้วยคำกลาง
   - Mermaid แต่ละบล็อก syntax ถูกต้อง (id เป็นอังกฤษ, label ไทยที่มีอักขระพิเศษครอบด้วย `"..."`)
   - หัวข้อ "การตัดสินใจที่ยืนยันแล้ว" มีคำตอบของผู้ใช้ครบ และ "คำถามค้างและสมมติฐาน" มีเฉพาะสิ่งที่ยังไม่ยืนยัน
3. เขียนไฟล์ที่ต้อง new/update เท่านั้น (ชื่อไฟล์คงที่ ไม่มีเลข running number): เขียน `database-spec.md` ก่อน แล้วจึงเขียน `api-spec.md`
4. เพิ่มรายการใน `docs/02-design/02-technical/index.md` เป็น bullet ต่อท้าย (ถ้ายังไม่มี ห้ามลบเนื้อหาเดิม):
   - `- [[database-spec|Database Spec (Conceptual)]] — ER Diagram และรายละเอียดแต่ละตาราง ยังไม่ผูกกับ technical stack`
   - `- [[api-spec|API Spec (Conceptual)]] — operation ของระบบ อ้างอิงกลับไปยัง feature/user story ยังไม่ผูกกับ technical stack`
5. เพิ่มลิงก์ไปยังสองเอกสารนี้ท้ายไฟล์ `high-level-architecture.md` **ได้เฉพาะบรรทัดลิงก์เดียวถ้ายังไม่มี** (เช่น `> รายละเอียดข้อมูลและ API ที่ต่อยอดจากเอกสารนี้: [[database-spec|Database Spec]], [[api-spec|API Spec]]`) ห้ามแก้เนื้อหาเดิมของ architecture นอกจากเพิ่มลิงก์นี้

## ขั้นตอนที่ 7 — backlog

skill นี้ **ไม่เปลี่ยนสถานะใน `docs/01-requirements/backlog.md`** เพราะเอกสาร API/DB เป็นภาพรวมข้ามหลาย requirement ไม่ใช่ผลลัพธ์ของ requirement ใด requirement หนึ่ง ข้ามขั้นตอนนี้ และห้ามแตะ backlog

## ขั้นตอนที่ 8 — บันทึก log ประจำวัน

เปิด (หรือสร้างถ้ายังไม่มี) `docs/05-log/{YYYYMMDD}-log.md` — ถ้าเพิ่งสร้างใหม่ใส่หัวเรื่อง `# Log {YYYY-MM-DD}` ก่อน แล้วต่อท้ายไฟล์ (ไม่เขียนทับ) ด้วย:

```markdown
## {HH:MM}
- {สร้าง|อัปเดต} database spec: [[../02-design/02-technical/database-spec|Database Spec]] ({จำนวน} ตาราง) ต่อยอดจาก [[../02-design/02-technical/high-level-architecture|High Level Architecture]]
- {สร้าง|อัปเดต} api spec: [[../02-design/02-technical/api-spec|API Spec]] ({จำนวน} operation) จาก spec {จำนวน} ฉบับ
- ตัดสินใจเชิงข้อมูล/API ร่วมกับผู้ใช้: {หัวข้อ → ตัวเลือกที่เลือก} (หนึ่งบรรทัดต่อข้อ ถ้ามี)
- {ถ้า update} สิ่งที่เปลี่ยน: {สรุปจาก changeSummary}
- {ถ้ามี architectureDeltas} ส่วนที่ต่างจาก data concept: {สรุป} และวิธีที่ผู้ใช้เลือกจัดการ
```

ถ้าไม่ทราบเวลาแน่นอนใช้ลำดับเหตุการณ์แทนได้ ถ้า `docs/05-log/index.md` ยังไม่ลิงก์วันที่นี้ ให้เพิ่มลิงก์ด้วย

## ขั้นตอนที่ 9 — สรุปให้ผู้ใช้

สรุปเป็นข้อความภาษาไทยในคำตอบเดียว ใช้ markdown link `[label](path)` (ไม่ใช่ wikilink) ประกอบด้วย:

1. ไฟล์ที่สร้าง/แก้ (แยก database-spec / api-spec) พร้อมผลการวิเคราะห์ new/update/up-to-date จำนวนตารางและ operation
2. **ผลการตรวจ coverage** — entity ใน data concept ที่ครอบคลุมครบหรือไม่, feature ที่ยังไม่มี operation รองรับพร้อมเหตุผล
3. **การตัดสินใจที่ผู้ใช้ยืนยันในรอบนี้** — ตารางสั้น หัวข้อ → ตัวเลือกที่เลือก
4. **ส่วนที่ต่างจาก data concept ใน architecture** (ถ้ามี) และสิ่งที่ผู้ใช้เลือกทำ
5. **ข้อสันนิษฐานที่ยังไม่ได้ยืนยัน** — bullet list (ถ้าไม่มีให้ระบุว่าไม่มี)
6. **สิ่งที่ควรทำต่อ** — เช่น spec ที่ยังไม่มี journey/acceptance criteria, ควรรัน `/sync-architecture` อีกรอบหรือไม่, และเมื่อพร้อมเลือก technical stack ให้สั่งทำเอกสารถัดไปแยกต่างหาก
