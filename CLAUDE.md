# CLAUDE.md

ไฟล์นี้ให้คำแนะนำแก่ Claude Code (claude.ai/code) เมื่อทำงานกับโค้ดในรีโพนี้

## ภาษาที่ใช้สนทนา

ให้ Claude Code ตอบกลับและสนทนากับผู้ใช้เป็น **ภาษาไทยเสมอ** ในทุกข้อความ (ไม่ใช่แค่เนื้อหาเอกสารที่แก้ไข) เว้นแต่ผู้ใช้จะพิมพ์ขอให้ตอบเป็นภาษาอื่นในข้อความนั้นๆ

## รีโพนี้คืออะไร

รีโพนี้ **ไม่ใช่ codebase ของซอฟต์แวร์** แต่เป็น vault ของ [Obsidian](https://obsidian.md) ที่ใช้เป็นระบบเอกสารของโปรเจกต์ชื่อ **Grade Runway** ไม่มีซอร์สโค้ด ไม่มี package manager ไม่มีคำสั่ง build, lint หรือ test งานทั้งหมดในรีโพนี้คือการอ่านและเขียนไฟล์ Markdown ภายใต้ `docs/`

เนื้อหาเอกสารทั้งหมดเขียนเป็น **ภาษาไทย** ให้ใช้ภาษาเดียวกันเมื่อแก้ไขหรือเพิ่มเติมเอกสารเดิม เว้นแต่ผู้ใช้จะขอเป็นอย่างอื่น

## โครงสร้างและลำดับการทำงาน

ทุกโฟลเดอร์ภายใต้ `docs/` จะมีไฟล์ `index.md` ที่อธิบายจุดประสงค์ของโฟลเดอร์ และลิงก์ไปยังโฟลเดอร์ลูก/โฟลเดอร์ข้างเคียงด้วย syntax wikilink ของ Obsidian (`[[relative/path/index|Label]]`) เมื่อเพิ่มเอกสารใหม่ ให้เพิ่มลิงก์จาก `index.md` ที่เกี่ยวข้องด้วย เพื่อให้ยังค้นหาเอกสารนั้นเจอจากโครงสร้างต้นไม้

เอกสารถูกจัดวางตามลำดับการไหลของงานแบบเชิงเส้น และเลขนำหน้าโฟลเดอร์สะท้อนลำดับนั้น:

```
01-requirements → 02-design → 03-testing → 04-retrospectives
                                   ↑
                                05-log (บันทึกคู่ขนานตลอดทั้งโปรเจกต์ ไม่ผูกกับ phase ใด phase หนึ่ง)
```

ลำดับด้านบนเป็นภาพรวม แต่มีข้อยกเว้นหนึ่งจุด: เอกสารใน `02-design/02-technical/` **อ่านย้อนจาก `03-testing/01-test-plan/`** (acceptance criteria และ test case) ด้วย เพราะ detailed design ต้องรองรับ edge case ที่ test case ระบุ ส่วน `01-prototypes/` (features list, user journey) เป็น input ของ `02-technical/` ตามปกติ — การอ่านย้อนนี้ไม่ใช่การแก้เอกสาร test plan และไม่ทำให้ลำดับ forward-reference เปลี่ยน

- **`docs/01-requirements/`** — จุดเริ่มต้นของทุกฟีเจอร์/โปรเจกต์ใหม่
  - `01-spec/` — ข้อกำหนดต้นทาง (source of truth): ฟีเจอร์, user stories, business rules, ขอบเขตงาน
  - `02-plan/` — roadmap/timeline/milestone ที่แตกมาจาก spec
  - `03-task/` — งานย่อยที่ลงมือทำได้จริง แตกมาจากแผนงาน
- **`docs/02-design/`** — การออกแบบที่ต่อยอดจากความต้องการ
  - `01-prototypes/` — wireframe/mockup ของ UI/UX, user flow, พื้นฐาน design system
  - `02-technical/` — architecture, database schema, API/data contract, detailed design, การเลือกเทคโนโลยีพร้อมเหตุผล โดยมีลำดับการอ่าน/สร้างคือ `high-level-architecture` → `database-spec` + `api-spec` → `detailed-design` (ดู "Agent และ Skill ของโปรเจกต์")
- **`docs/03-testing/`** — การทดสอบที่ต่อยอดจากการออกแบบ
  - `01-test-plan/` — test case/scenario, test data, ขอบเขตที่ทดสอบและไม่ทดสอบ
  - `02-test-result/` — ผล pass/fail จริง, บั๊กที่พบ, สถานะการแก้ไข
- **`docs/04-retrospectives/`** — บทเรียนที่ได้หลังจบแต่ละ phase/sprint/milestone โดยอ้างอิงจากผลทดสอบและ log
- **`docs/05-log/`** — changelog/decision log/เหตุการณ์สำคัญแบบเรียงตามเวลา บันทึกคู่ขนานไปกับทุก phase อย่างต่อเนื่อง (ไม่ใช่ลำดับตายตัวเหมือน phase อื่น)
- **`docs/00-archived/`** — เอกสารที่ถูกแทนที่หรือยกเลิกแล้ว **ห้ามลบเอกสารออกจากโปรเจกต์ ให้ย้ายมาไว้ที่นี่แทน** เพื่อรักษาประวัติการตัดสินใจ

## Agent และ Skill ของโปรเจกต์

งานสร้าง/ปรับปรุงเอกสารหลักทำผ่าน skill ใน `.claude/skills/` ซึ่งแต่ละตัวเรียก subagent คู่กันใน `.claude/agents/` (เปิดดูรายละเอียดได้ที่ไฟล์นั้นๆ)

| Skill | Agent คู่กัน | Phase | ไฟล์ที่ผลิต/ปรับปรุง |
|---|---|---|---|
| `/requirement-to-backlog` | `requirement-analyst` | 01-requirements | `01-spec/{YYYYMMDD}-{NN}-*.md`, `backlog.md` |
| `/spec-to-journey` | `journey-designer` | 02-design | features list + user journey ใน `01-prototypes/` |
| `/prototype-creation` | `prototype-designer` | 02-design | wireframe และ HTML prototype ใน `01-prototypes/prototypes/` |
| `/sync-architecture` | `architecture-writer` | 02-design | `02-technical/high-level-architecture.md` |
| `/sync-api-db` | `api-db-writer` | 02-design | `02-technical/database-spec.md`, `02-technical/api-spec.md` |
| `/sync-detailed-design` | `detailed-design-writer` | 02-design | `02-technical/detailed-design.md` |
| `/spec-to-test-plan` | `test-designer` | 03-testing | acceptance criteria และ test plan ใน `01-test-plan/` |

**ลำดับพึ่งพากันของเอกสารใน `02-technical/`:** `/sync-architecture` → `/sync-api-db` → `/sync-detailed-design` แต่ละ skill ตรวจเอกสารต้นทางก่อนเริ่ม ถ้าขาดจะ **หยุดและแจ้งให้รัน skill ก่อนหน้า** (เช่น ไม่มี `api-spec.md` หรือ `database-spec.md` ให้รัน `/sync-api-db` ก่อน) ไม่เดาหรือสร้างเอกสารต้นทางเอง

**วิธีทำงานร่วมกันของ skill และ agent**
- subagent มี tool แค่ `Read, Glob, Grep` และคืนผลเป็นข้อความ การเขียนไฟล์ การอัปเดต `index.md` และการบันทึก log `docs/05-log/{YYYYMMDD}-log.md` เป็นหน้าที่ของ skill
- **การถามผู้ใช้:** `/spec-to-journey` และ `/spec-to-test-plan` **ตัดสินใจเอง** เมื่อข้อมูลไม่ชัดเจนแล้วรายงานสมมติฐานตอนจบ ส่วนอีก 5 ตัว **ถามผู้ใช้** ด้วย AskUserQuestion: `/requirement-to-backlog` ถามเมื่อไม่แน่ใจโดยบังคับทางเลือก ≥3 ข้อ, `/prototype-creation` ต้องเสนอแผนให้ยืนยันก่อนเขียนไฟล์, และ 3 skill `sync-*` ถามเมื่อพบจุดไม่ชัดเจนที่กระทบรูปทรงของระบบ โดย agent คืน `openQuestions` และ skill เป็นฝ่ายถาม ทุกคำถามมีทางเลือกอย่างน้อย 3 ข้อพร้อมข้อดีและข้อเสีย และใช้ fallback assumption ถ้าผู้ใช้ไม่ตอบ
- **สถานะใน `backlog.md`:** `requirement-to-backlog` สร้างแถวใหม่ (สถานะ `New`; กรณี supersede จะตั้งแถวเดิมเป็น `Superseded`), `spec-to-journey` และ `prototype-creation` เลื่อน `New` → `Designed` (`prototype-creation` ปรับหมายเหตุ prototype ด้วย), `spec-to-test-plan` เลื่อน `New`/`Designed` → `Test Planned` กฎ **"สถานะเลื่อนขึ้นได้อย่างเดียว ห้ามลดลง"** ใช้กับ 3 skill หลัง (ไม่ใช่ `requirement-to-backlog` ซึ่งแค่สร้างแถว) และ **ยังไม่มี skill ใดตั้งสถานะ `Tested`** ต้องแก้มือเมื่อมีผลการทดสอบจริง ส่วน 3 skill `sync-*` **ไม่แตะ backlog** เพราะเอกสารคร่อมหลาย requirement ไม่ใช่ผลลัพธ์ของ requirement ใดฉบับหนึ่ง

## ธรรมเนียมในการแก้ไขเอกสาร

- ให้ `index.md` แต่ละไฟล์เป็นสรุปสั้นๆ ของจุดประสงค์โฟลเดอร์พร้อม wikilink ไปยังโฟลเดอร์ลูก/ที่เกี่ยวข้องเท่านั้น — มันคือหน้าทางเดิน (navigation) ไม่ใช่เนื้อหาเอง ส่วนเนื้อหาจริงให้สร้างเป็นไฟล์ใหม่ในโฟลเดอร์ย่อยที่เหมาะสม
- รักษารูปแบบการอ้างอิงไปข้างหน้า (forward-reference) ที่ใช้อยู่ทั่วทั้งเอกสาร: `index.md` ของแต่ละขั้นตอนจะบอกว่าผลลัพธ์ของมันถูกส่งต่อไปที่ไหน (เช่น spec → plan → task → design → testing → retrospectives) และแต่ละไฟล์จะลิงก์กลับไปยังต้นทางของข้อมูลด้วย เมื่อเพิ่มเอกสารใหม่ให้รักษาห่วงโซ่นี้ไว้
- ใช้รูปแบบการตั้งชื่อ `NN-kebab-case` แบบมีเลขนำหน้าตามที่มีอยู่เดิม หากในอนาคตมีการเพิ่ม phase ใหม่ในระดับบนสุดหรือระดับที่สอง
- **ข้อยกเว้นการตั้งชื่อและการแก้ไข — living document ใน `02-technical/`:** `high-level-architecture.md`, `database-spec.md`, `api-spec.md` และ `detailed-design.md` ใช้ชื่อไฟล์คงที่ ไม่มีเลขวันที่/running number (ต่างจากเอกสารใน `01-prototypes/` และ `03-testing/` ที่ขึ้นต้นด้วย `YYYYMMDD-NN-`) และ **แก้ไขตรงในไฟล์เดิม ไม่ย้ายไป `00-archived`** ประวัติการเปลี่ยนแปลงเก็บไว้ในตาราง "การตัดสินใจที่ยืนยันแล้ว" ของแต่ละไฟล์ (พร้อมวันที่) และใน log ประจำวัน
- **เอกสารใน `02-technical/` ต้องเป็น conceptual:** ห้ามระบุ technical stack (ภาษาโปรแกรม, framework, ชนิดฐานข้อมูลหรือชนิดข้อมูลเฉพาะ engine, HTTP method/path, ชื่อ cloud หรือ library) ใช้คำกลางแทน เช่น "ที่เก็บข้อมูลถาวร" เทคโนโลยีที่ requirement ระบุไว้เองให้บันทึกในหัวข้อ "ข้อจำกัดจาก Requirement" ส่วนการเลือก stack จริงให้ทำเป็นเอกสารแยกที่ผู้ใช้สั่งภายหลัง
- **ห้ามแก้เอกสารต้นทางของชั้นก่อนหน้า:** ลำดับชั้นคือ architecture ← database/api spec ← detailed design เอกสารชั้นหลังห้ามแก้เอกสารชั้นก่อน ถ้าพบว่าขัดกันหรือขาดข้อมูล ให้รายงานเป็น delta แล้วถามผู้ใช้ว่าจะจัดการอย่างไร สิ่งเดียวที่เพิ่มได้คือบรรทัดลิงก์เดียวท้ายไฟล์ต้นทาง (ตามที่ skill ระบุ)
- **ห้าม agent และ skill แก้ไขไฟล์ใน `.claude/` (agent, skill) และ `CLAUDE.md` เอง** ถ้าเห็นว่าควรเปลี่ยน ให้เสนอผู้ใช้ก่อนเสมอ พร้อมเหตุผลและตัวอย่างข้อความที่จะแก้ แล้วรอผู้ใช้อนุมัติจึงแก้
- **Mermaid:** node id เป็นอังกฤษล้วน, label ภาษาไทยที่มีอักขระพิเศษ (วงเล็บ `?` เครื่องหมายคำพูด) ครอบด้วย `"..."`, `erDiagram` ใช้ชนิดข้อมูลเชิงแนวคิด (`string`, `int`, `decimal`, `boolean`, `date`, `datetime`) ไม่ใช้ชนิดของ engine ใด และ diagram ที่ยาวเกินราว 15 node ให้แยกเป็นหลาย diagram
