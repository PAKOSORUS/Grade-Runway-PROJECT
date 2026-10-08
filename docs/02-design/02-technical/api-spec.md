# API Spec (Conceptual)

**อัปเดตล่าสุด:** 2026-10-08
**สถานะ:** Draft
**ขอบเขตของเอกสาร:** conceptual — ยังไม่ระบุ technical stack (ไม่ระบุ HTTP method/path/รูปแบบ payload)
**ต่อยอดจาก:** [[high-level-architecture|High Level Architecture]] และ [[database-spec|Database Spec]]

## 1. วัตถุประสงค์และขอบเขต

เอกสารนี้นิยามความสามารถ (operation) เชิงแนวคิดของ Grade Runway ที่ตามรอยกลับ feature, user story, user journey และ acceptance criteria ได้ และอ่าน/เขียนเฉพาะตารางใน [[database-spec|Database Spec]] รหัสอ้างอิงที่ใช้ (นิยามเต็มดูหัวข้อ 1 ของ [[database-spec|Database Spec]]):

- spec: [[../../01-requirements/01-spec/20260825-01-personalized-learning-reminder|spec 01]] (R-US/R-BR), [[../../01-requirements/01-spec/20260825-02-high-grade-peer-review-chat|spec 02]] (C-US/C-BR), [[../../01-requirements/01-spec/20260825-03-logging-pdpa-compliance|spec 03]] (P-US/P-BR)
- features: F-R# ([[../01-prototypes/20260827-01-features-list-personalized-learning-reminder|list 01]]), F-C# ([[../01-prototypes/20260827-03-features-list-high-grade-peer-review-chat|list 02]])
- journey: [[../01-prototypes/20260827-02-user-journey-student-personalized-learning-reminder|J-R]], [[../01-prototypes/20260827-04-user-journey-mentor-high-grade-peer-review-chat|J-Mentor]], [[../01-prototypes/20260827-05-user-journey-mentee-high-grade-peer-review-chat|J-Mentee]], [[../01-prototypes/20260827-06-user-journey-admin-high-grade-peer-review-chat|J-Admin]]
- AC: AC-R# ([[../../03-testing/01-test-plan/20260907-01-acceptance-criteria-personalized-learning-reminder|AC spec 01]]), AC-C# ([[../../03-testing/01-test-plan/20260912-01-acceptance-criteria-high-grade-peer-review-chat|AC spec 02]]); กรณีขอบอ้าง TS-# จาก [[../../03-testing/01-test-plan/index|test plan]]
- Q# หมายถึงการตัดสินใจที่ยืนยันแล้วในหัวข้อ 10

มี 44 operation ใน 10 กลุ่ม (operation เชิงระบบ/งานตามเวลาระบุ business rule รองรับ)

อยู่นอกขอบเขต: ช่องทางแจ้งเตือนนอก in-app, การเชื่อมระบบทะเบียน/เกรดภายนอก, การให้คะแนน mentor, ห้องข้ามวิชา, รายงานเนื้อหาหลังโพสต์ (F-R8-10, F-C13-16 Won't have), ระบบแจ้งเหตุข้อมูลรั่วไหลอัตโนมัติ (กระบวนการระดับสถาบัน)

## 2. หลักการร่วมของ API (เชิงแนวคิด)

- **การยืนยันตัวตนและบทบาท:** ทุก operation (ยกเว้น `sign-in-with-institution-identity`) ต้องมีตัวตนที่ยืนยันแล้วจากระบบยืนยันตัวตนของสถาบัน บทบาทมี `student`, `admin`, `auditor`, `data_staff`; "mentor" ไม่ใช่บทบาท แต่เป็นสิทธิ์ต่อวิชาที่คำนวณจาก grant ในภาคปัจจุบัน; หลัก least privilege; MFA บัญชีแอดมินเป็นข้อกำหนดจาก spec 03 (จุดที่ทำยังไม่ตัดสิน)
- **Actor ในตาราง:** ผู้เรียน = student (รวม mentor), แอดมิน = admin, ผู้ตรวจสอบ = auditor, บุคลากร = data_staff, ระบบ = ตัวทำงานภายใน (ทริกเกอร์เหตุการณ์/ตามเวลา)
- **สิทธิ์เข้าห้องแชท:** ต้อง (1) ลงทะเบียนวิชานั้นสถานะ enrolled ในภาคปัจจุบัน และ (2) มี consent `chat_participation` เป็นจริงจึงอ่าน/โพสต์ได้; การปฏิเสธต้องแจ้งสาเหตุที่ชัดเจน (AC-C3)
- **ข้อผิดพลาดเชิงธุรกิจ (ตัวระบุเชิงแนวคิด):**

| รหัส | ความหมาย |
|---|---|
| NOT_AUTHENTICATED | ยังไม่ยืนยันตัวตนหรือการยืนยันล้มเหลว |
| FORBIDDEN_ROLE | บทบาทไม่มีสิทธิ์ใช้ operation นี้ |
| NOT_ENROLLED_CURRENT_TERM | ไม่ได้ลงทะเบียนวิชานั้นในภาคปัจจุบัน |
| CONSENT_REQUIRED | ต้องให้ consent ที่เกี่ยวข้องก่อน |
| VALIDATION_FAILED | ข้อมูลนำเข้าไม่ถูกต้อง (ติดลบ ไม่ใช่ตัวเลข ว่าง ฯลฯ) พร้อมรายละเอียดรายช่อง |
| NOT_FOUND | ไม่พบข้อมูลหรือไม่ใช่ของผู้เรียก |
| CONFLICT_STATE | สถานะปัจจุบันไม่อนุญาตการกระทำ (เช่น ตัดสินแล้ว) |
| AUDIT_UNAVAILABLE | บริการ audit log ใช้งานไม่ได้ จึงปฏิเสธการกระทำสำคัญ (ตามการตัดสินใจ Q5) |

- **การบันทึก audit:** operation ที่ระบุผลข้างเคียง "audit" ต้องเรียก `record-audit-event`; เหตุการณ์ที่ต้องบันทึกตาม spec 03: sign in/out/ล้มเหลว, แก้เกรด (ค่าก่อน-หลัง), แอดมินเข้าถึงข้อมูลนักศึกษา, เปลี่ยนสิทธิ์ (approve mentor), export, คำร้อง PDPA และผล; เพิ่มโดยสมมติฐาน: เปลี่ยนค่าเกณฑ์/นโยบาย/ภาคปัจจุบัน, นำเข้าข้อมูล, ผลการตรวจข้อความ, เผยแพร่ notice, purge
- **เมื่อ audit log ใช้งานไม่ได้ (การตัดสินใจ Q5):** แบ่งระดับ — กลุ่ม "สำคัญ" (แก้เกรด, เปลี่ยนสิทธิ์, แอดมินดูข้อมูลนักศึกษา, ผลคำร้อง PDPA, อ่าน audit log) ปฏิเสธด้วย AUDIT_UNAVAILABLE; กลุ่มอื่นทำต่อและส่ง log ซ้ำภายหลัง
- **การแบ่งหน้า:** operation ประเภทดึงรายการรองรับการแบ่งหน้าและตัวกรองตามที่ระบุ; รายการข้อความเรียงเก่า→ใหม่ (AC-C5), รายการอื่นเรียงใหม่→เก่า
- **ความเป็นส่วนตัว:** ผู้เรียนเห็นเฉพาะข้อมูลของตน; ข้อความที่ยังไม่เผยแพร่เห็นเฉพาะผู้ส่งและแอดมิน; ผลการเรียนที่แสดงให้แอดมิน (ในคิว nomination) ต้องบันทึก audit การเข้าถึง
- **การเรียกซ้ำ/ไม่ซ้ำ:** operation นำเข้าและงานตามเวลาต้องทำซ้ำได้ปลอดภัย (upsert ตามคีย์ธรรมชาติ, การแจ้งเตือนกันซ้ำด้วย fingerprint/dedupe_key)
- **ช่องทางแจ้งเตือน:** in-app เท่านั้น (ตรรกะตัดสินใจแยกจากช่องทางส่งออกตาม architecture)

## 3. ภาพรวมกลุ่ม API

### 3.1 กลุ่มฝั่งการเรียนและการตั้งค่า

```mermaid
flowchart LR
    G1["กลุ่มยืนยันตัวตน 2"]
    G2["กลุ่มนำเข้าข้อมูลการเรียน 4"]
    G3["กลุ่มประเมินและคำแนะนำ 3"]
    G4["กลุ่มแจ้งเตือนฝั่งผู้เรียน 4"]
    G5["กลุ่มตั้งค่า 6"]
    CAcc["การยืนยันตัวตนและสิทธิ์"]
    CIn["รับข้อมูลการเรียน"]
    CRisk["ตัวประเมินความเสี่ยง"]
    CAdv["ตัวสร้างคำแนะนำ/สรุป"]
    CNot["ศูนย์แจ้งเตือน"]
    CRule["การตั้งค่าเกณฑ์"]
    XIdp["ระบบยืนยันตัวตนของสถาบัน"]
    G1 --> CAcc
    CAcc <--> XIdp
    G2 --> CIn
    CIn --> CRisk
    G3 --> CRisk
    G3 --> CAdv
    CRisk --> CNot
    CAdv --> CNot
    G4 --> CNot
    G5 --> CRule
    CRule --> CRisk
```

### 3.2 กลุ่มฝั่งแชทและการกำกับ

```mermaid
flowchart LR
    G6["กลุ่ม mentor 4"]
    G7["กลุ่มห้องแชท 5"]
    G8["กลุ่มตรวจข้อความ 3"]
    G9["กลุ่มความยินยอมและสิทธิ PDPA 10"]
    G10["กลุ่ม audit log 3"]
    CNom["ตัวเสนอชื่อ mentor"]
    CRoom["ห้องแชทรายวิชา"]
    CMod["คิวตรวจสอบก่อนเผยแพร่"]
    CCon["จุดควบคุมความยินยอม"]
    CPriv["การใช้สิทธิและ retention"]
    CAud["บริการบันทึก audit log"]
    G6 --> CNom
    G7 --> CRoom
    G7 --> CCon
    G8 --> CMod
    CRoom --> CMod
    G9 --> CCon
    G9 --> CPriv
    G10 --> CAud
    CNom --> CAud
    CMod --> CAud
    CPriv --> CAud
```

### 3.3 สรุป operation

| # | Operation | กลุ่ม | ประเภท | Actor | Feature | User story |
|---|---|---|---|---|---|---|
| 1 | sign-in-with-institution-identity | ยืนยันตัวตน | สั่งงาน | ทุกบทบาท | — | P-BR audit/security |
| 2 | sign-out | ยืนยันตัวตน | สั่งงาน | ทุกบทบาท | — | P-BR audit |
| 3 | import-enrollments | นำเข้า | สร้าง/แก้ไข | data_staff | F-R1, F-C1, F-C2 | R-US1, C-US1, C-US2 |
| 4 | import-academic-records | นำเข้า | สร้าง/แก้ไข | data_staff | F-R1 | R-US1, R-US2 |
| 5 | correct-academic-record | นำเข้า | แก้ไข | data_staff | F-R1 | P-BR audit (แก้/ลบเกรด) |
| 6 | set-current-term | นำเข้า | แก้ไข | admin | F-C2 | C-BR3 |
| 7 | evaluate-learning-risk | ประเมิน | งานตามเวลา | ระบบ | F-R2, F-R3 | R-US1 |
| 8 | generate-personal-recommendation | ประเมิน | งานตามเวลา | ระบบ | F-R4 | R-US2 |
| 9 | generate-weekly-summaries | ประเมิน | งานตามเวลา | ระบบ | F-R5 | R-US3 |
| 10 | list-my-notifications | แจ้งเตือน | ดึงข้อมูล | ทุกบทบาทที่เป็นผู้รับ | F-R3, F-C10, F-C11 | R-US1 |
| 11 | get-notification-detail | แจ้งเตือน | ดึงข้อมูล | ผู้รับ | F-R3 | R-US1 |
| 12 | get-my-recommendation | แจ้งเตือน | ดึงข้อมูล | student | F-R4 | R-US2 |
| 13 | get-my-weekly-summary | แจ้งเตือน | ดึงข้อมูล | student | F-R5 | R-US3 |
| 14 | list-risk-rules | ตั้งค่า | ดึงข้อมูล | admin | F-R6 | R-US4 |
| 15 | save-risk-rule | ตั้งค่า | สร้าง/แก้ไข | admin | F-R2, F-R6 | R-US4 |
| 16 | list-mentor-criteria | ตั้งค่า | ดึงข้อมูล | admin | F-C4 | C-BR1 |
| 17 | save-mentor-criteria | ตั้งค่า | สร้าง/แก้ไข | admin | F-C4 | C-BR1 |
| 18 | list-retention-policies | ตั้งค่า | ดึงข้อมูล | admin | — | P-BR retention |
| 19 | update-retention-policy | ตั้งค่า | แก้ไข | admin | — | P-BR retention/audit |
| 20 | generate-mentor-nominations | mentor | งานตามเวลา | ระบบ | F-C3 | C-US3 |
| 21 | list-mentor-nominations | mentor | ดึงข้อมูล | admin | F-C5 | C-US4 |
| 22 | decide-mentor-nomination | mentor | สั่งงาน | admin | F-C5, F-C6, F-C10 | C-US4 |
| 23 | get-my-mentor-status | mentor | ดึงข้อมูล | student | F-C6, F-C10 | C-US1 |
| 24 | list-my-chat-rooms | ห้องแชท | ดึงข้อมูล | student | F-C1, F-C2 | C-US1, C-US2 |
| 25 | get-chat-room | ห้องแชท | ดึงข้อมูล | student | F-C2 | C-US2 |
| 26 | list-published-messages | ห้องแชท | ดึงข้อมูล | student | F-C8 | C-US2 |
| 27 | post-chat-message | ห้องแชท | สร้าง | student | F-C7, F-C8, F-C9 | C-US1, C-US2 |
| 28 | list-my-messages | ห้องแชท | ดึงข้อมูล | student | F-C10 | C-BR4 |
| 29 | list-moderation-queue | ตรวจข้อความ | ดึงข้อมูล | admin | F-C9 | C-US5 |
| 30 | decide-message-moderation | ตรวจข้อความ | สั่งงาน | admin | F-C9, F-C10 | C-US5 |
| 31 | get-chat-activity-overview | ตรวจข้อความ | ดึงข้อมูล | admin | F-C12 | (อนุมานจาก F-C12) |
| 32 | get-current-privacy-notice | PDPA | ดึงข้อมูล | ทุกบทบาท | — | P-US2 |
| 33 | publish-privacy-notice | PDPA | สร้าง | admin | — | P-BR PDPA |
| 34 | set-consent | PDPA | สร้าง | ผู้เรียน | — | P-US2 |
| 35 | list-my-consents | PDPA | ดึงข้อมูล | ผู้เรียน | — | P-US2 |
| 36 | submit-data-subject-request | PDPA | สร้าง | ผู้เรียน | — | P-US3 |
| 37 | list-my-data-subject-requests | PDPA | ดึงข้อมูล | ผู้เรียน | — | P-US3 |
| 38 | list-data-subject-requests | PDPA | ดึงข้อมูล | admin | — | P-US4 |
| 39 | decide-data-subject-request | PDPA | สั่งงาน | admin | — | P-US4 |
| 40 | fulfil-data-subject-request | PDPA | สั่งงาน | admin | — | P-US3, P-US4 |
| 41 | run-retention-sweep | PDPA | งานตามเวลา | ระบบ | — | P-BR retention |
| 42 | record-audit-event | audit | สร้าง | ระบบ | — | P-US1, P-US5 |
| 43 | search-audit-log | audit | ดึงข้อมูล | auditor | — | P-US1 |
| 44 | purge-expired-audit-log-entries | audit | งานตามเวลา | ระบบ | — | P-BR audit |

## 4. รายละเอียด Operation

รูปแบบ: ตาราง Input/Output ใช้ชนิดเชิงแนวคิด; "จำเป็น?" = ใช่/ไม่; "audit" = เรียก `record-audit-event`; ตารางที่อ้างคือตารางใน [[database-spec|Database Spec]]

### กลุ่ม 4.A: ยืนยันตัวตน

### 4.1 sign-in-with-institution-identity: เข้าสู่ระบบด้วยตัวตนของสถาบัน
- **วัตถุประสงค์:** รับผลยืนยันตัวตนจากระบบของสถาบัน ผูกกับ USER และกำหนดบทบาท
- **อ้างอิง:** P-BR audit (login/ล้มเหลว), architecture Q6; ทุก journey ขั้นแรก
- **Actor/ประเภท:** ทุกบทบาท / สั่งงาน
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ผลยืนยันตัวตนจากสถาบัน | โครงสร้างซ้อน | ใช่ | มี identity_ref และสถานภาพ |

- Output: บทบาท, รายวิชาที่ผู้ใช้เป็น mentor ในภาคปัจจุบัน, รายการ consent ที่ยังไม่ได้ให้
- **เงื่อนไข:** สถานภาพ `ended` ยังเข้าได้เฉพาะสิทธิ์ที่ business rule อนุญาต _(สมมติฐาน: ผู้พ้นสถานภาพเข้าใช้ไม่ได้ ยกเว้นยื่นคำร้องสิทธิ)_
- **ข้อผิดพลาด:** NOT_AUTHENTICATED (ผลยืนยันไม่ผ่าน/ระบบสถาบันล่ม)
- **อ่าน/เขียน:** USER (อ่าน/เขียน `last_sign_in_at`, ผูก identity_ref), USER_CATEGORY (อ่าน)
- **ผลข้างเคียง:** audit `sign_in` หรือ `sign_in_failed`

### 4.2 sign-out: ออกจากระบบ
- **วัตถุประสงค์:** ปิดเซสชันและบันทึกเหตุการณ์
- **อ้างอิง:** P-BR audit (logout)
- **Actor/ประเภท:** ทุกบทบาท / สั่งงาน
- Input/Output: ไม่มี
- **อ่าน/เขียน:** ไม่มี (เขียน audit)
- **ผลข้างเคียง:** audit `sign_out`

### กลุ่ม 4.B: นำเข้าข้อมูลการเรียน

### 4.3 import-enrollments: นำเข้าวิชา ภาค และการลงทะเบียน
- **วัตถุประสงค์:** รับรายวิชา ภาค การลงทะเบียน (และสถานภาพผู้เรียน) จากบุคลากร สร้างห้องแชทของวิชาใหม่อัตโนมัติ
- **อ้างอิง:** F-R1, F-C1, F-C2; R-US1, C-US1, C-US2; J-R ขั้น "เข้าเรียนและส่งงาน", J-Mentee ขั้น "เข้าห้องแชท"; AC-C3; ตามการตัดสินใจ Q8
- **Actor/ประเภท:** data_staff / สร้าง/แก้ไข (ทำซ้ำได้ แบบ upsert; รับหลายรายการต่อครั้ง ผลเป็นรายแถว)
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| รายการลงทะเบียน | รายการของโครงสร้างซ้อน | ใช่ | แต่ละแถว: identity_ref, รหัสวิชา+ชื่อ, รหัสภาค, สถานะ enrolled/dropped |
| สถานภาพผู้เรียน | ค่าจากรายการ | ไม่ | active/ended พร้อมวันที่พ้นสถานภาพ |
| ชุดนำเข้า | ข้อความ | ไม่ | อ้างอิงชุด |

- Output: จำนวนสำเร็จ/ล้มเหลวและเหตุผลรายแถว
- **เงื่อนไข:** ผู้ใช้ที่ไม่เคยพบถูกสร้างเป็น shell (role student); วิชาใหม่ได้ CHAT_ROOM 1 ห้อง; หลังนำเข้าสำเร็จ ระบบเรียก evaluate-learning-risk และ generate-mentor-nominations สำหรับผู้ที่ข้อมูลเปลี่ยน
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED (รายแถว)
- **อ่าน/เขียน:** USER (เขียน), USER_CATEGORY (อ่าน), COURSE (เขียน), TERM (เขียน), ENROLLMENT (เขียน), CHAT_ROOM (เขียน)
- **ผลข้างเคียง:** audit `data_import` (สรุปต่อชุด)

### 4.4 import-academic-records: นำเข้าผลการเรียน การเข้าเรียน การส่งงาน
- **วัตถุประสงค์:** รับเกรด/คะแนน/การเข้าเรียน/การส่งงาน/GPA สะสมเข้าสู่ ACADEMIC_RECORD
- **อ้างอิง:** F-R1; R-US1, R-US2, R-BR1; J-R ขั้น "เข้าเรียนและส่งงาน"; AC-R1, AC-R2, TS-01..TS-04
- **Actor/ประเภท:** data_staff / สร้าง/แก้ไข (หลายรายการต่อครั้ง, upsert ตามคีย์ธรรมชาติ ตาม Q8)
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| รายการข้อมูลการเรียน | รายการของโครงสร้างซ้อน | ใช่ | identity_ref, รหัสวิชา (ว่างได้เฉพาะ GPA สะสม), รหัสภาค, ชนิด, ลำดับช่วงเวลา, ค่า, สถานะส่งงาน |
| ชุดนำเข้า | ข้อความ | ไม่ | |

- Output: จำนวนสร้าง/แก้ไข/ล้มเหลวพร้อมเหตุผลรายแถว
- **เงื่อนไข:** ค่าติดลบ/นอกช่วงถูกปฏิเสธรายแถว; ผู้ใช้/วิชา/ภาคต้องมีอยู่แล้ว; แถวที่ค่าเปลี่ยนจากเดิมต้อง audit ค่าก่อน-หลัง; ผูก retention_policy ตามชนิดข้อมูล; ผลสำเร็จทริกเกอร์ evaluate-learning-risk และ generate-mentor-nominations
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED; NOT_FOUND (ผู้ใช้/วิชา/ภาคที่ไม่รู้จัก)
- **อ่าน/เขียน:** USER, COURSE, TERM, ENROLLMENT, RETENTION_POLICY (อ่าน); ACADEMIC_RECORD (เขียน)
- **ผลข้างเคียง:** audit `grade_create`/`grade_update`; ทริกเกอร์การประเมิน

### 4.5 correct-academic-record: แก้ไขหรือยกเลิกข้อมูลการเรียนรายการเดียว
- **วัตถุประสงค์:** แก้ค่าหรือยกเลิก (void) แถวที่ผิด พร้อมตามรอยค่าก่อน-หลัง
- **อ้างอิง:** F-R1; P-BR audit (สร้าง/แก้ไข/ลบเกรด); P-US1 ("เกรดถูกแก้ไขโดยใคร เมื่อใด"); ตาม Q8
- **Actor/ประเภท:** data_staff / แก้ไข
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ตัวระบุข้อมูลการเรียน | ตัวระบุ (ID) | ใช่ | |
| การกระทำ | ค่าจากรายการ | ใช่ | `update, void` |
| ค่าใหม่ | ทศนิยม | เงื่อนไข | จำเป็นเมื่อ update |
| เหตุผล | ข้อความ | ใช่ | |

- Output: ข้อมูลหลังแก้ไข
- **เงื่อนไข:** ห้ามลบจริง (void เท่านั้น); ต้อง audit สำเร็จก่อนยืนยันการแก้ (กลุ่มสำคัญตาม Q5)
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND; VALIDATION_FAILED; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** ACADEMIC_RECORD (อ่าน/เขียน)
- **ผลข้างเคียง:** audit `grade_update`/`grade_delete` พร้อม before/after; ทริกเกอร์ evaluate-learning-risk

### 4.6 set-current-term: ตั้งภาคการศึกษาปัจจุบัน
- **วัตถุประสงค์:** กำหนดภาคปัจจุบัน (ใช้คุมสิทธิ์เข้าห้องแชทและการเสนอชื่อ)
- **อ้างอิง:** F-C2; C-BR3; AC-C3 (ตามการตัดสินใจ Q1)
- **Actor/ประเภท:** admin / แก้ไข
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ภาคที่ต้องการ | ตัวระบุ (ID) | ใช่ | ต้องมีอยู่แล้ว |

- Output: ภาคปัจจุบันใหม่
- **เงื่อนไข:** มีภาคปัจจุบันได้ภาคเดียว; เปลี่ยนแล้ว MENTOR_GRANT ของภาคเก่าหมดอายุโดยอัตโนมัติ (Q3)
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND
- **อ่าน/เขียน:** TERM (อ่าน/เขียน)
- **ผลข้างเคียง:** audit `config_change`

### กลุ่ม 4.C: ประเมินและคำแนะนำ (เชิงระบบ)

### 4.7 evaluate-learning-risk: ประเมินความเสี่ยงการเรียน
- **วัตถุประสงค์:** ประเมินเงื่อนไขหลายตัวแปร (เกรด ขาดเรียน ไม่ส่งงาน แนวโน้มลดลง) ตามเกณฑ์ปัจจุบัน สร้าง/แทนที่/ปิด ALERT แบบรวมและแจ้งผู้เรียน
- **อ้างอิง:** F-R2, F-R3; R-US1, R-BR1, R-BR2, R-BR4; J-R ขั้น "ตรวจพบความเสี่ยง" / "ได้รับการแจ้งเตือน"; AC-R1 (รวม edge หลายตัวแปร), TS-01..TS-06, TS-12; architecture Q3 (ประเมินทันที + ตามรอบ); ตามการตัดสินใจ Q2
- **Actor/ประเภท:** ระบบ / งานตามเวลา (ทริกเกอร์เมื่อข้อมูลการเรียนเปลี่ยน และรันตามรอบ)
- Input: ทริกเกอร์ (data_change หรือ scheduled) และขอบเขตผู้ใช้ที่เปลี่ยน
- Output: จำนวน ALERT ที่สร้าง/แทนที่/ปิด
- **เงื่อนไข:** ใช้เฉพาะ RISK_RULE ที่ active ของหมวดหมู่ผู้ใช้ (ไม่ hardcode); ถ้าข้อมูลย้อนหลังน้อยกว่า `min_history_periods` ไม่ประเมินเงื่อนไขแนวโน้ม; เงื่อนไขเกิดพร้อมกัน → ALERT เดียว มีหลาย ALERT_CONDITION พร้อม snapshot ค่าจริง/เกณฑ์; ถ้ามี ALERT open ที่ fingerprint เดียวกันอยู่แล้วต้องไม่สร้างซ้ำ (ประเมินทันทีกับตามรอบ); ไม่เข้าเงื่อนไขใดเลย → ไม่แจ้งเตือนและปิด ALERT open (AC-R1/TS-05)
- **ข้อผิดพลาด:** ไม่มี (ความล้มเหลวบันทึกและลองใหม่ตามรอบถัดไป)
- **อ่าน/เขียน:** USER, ENROLLMENT, TERM, RISK_RULE, ACADEMIC_RECORD (อ่าน); ALERT (อ่าน/เขียน), ALERT_CONDITION, NOTIFICATION (เขียน)
- **ผลข้างเคียง:** เรียก generate-personal-recommendation; สร้าง NOTIFICATION `risk_alert`; ปล่อยเหตุการณ์ `learning-risk-detected`

### 4.8 generate-personal-recommendation: สร้างคำแนะนำเฉพาะบุคคล
- **วัตถุประสงค์:** คำนวณคำแนะนำจากข้อมูลย้อนหลังและตัวแปรเสี่ยงของผู้ใช้คนนั้น
- **อ้างอิง:** F-R4; R-US2, R-BR3; J-R ขั้น "เห็นคำแนะนำ"; AC-R2, TS-08, TS-09
- **Actor/ประเภท:** ระบบ / งานตามเวลา (เรียกจาก evaluate-learning-risk และรอบประเมินซ้ำ)
- Input: ผู้ใช้ และ ALERT ที่มาของคำแนะนำ
- Output: RECOMMENDATION ใหม่
- **เงื่อนไข:** ข้อมูลย้อนหลังต่ำกว่า `min_history_periods` → ไม่สร้างคำแนะนำ; เนื้อหาอ้างเฉพาะตัวแปรเสี่ยงของผู้ใช้นั้น ห้ามเป็นข้อความสำเร็จรูปเดียวกัน; ฉบับเดิมเป็น superseded
- **อ่าน/เขียน:** ACADEMIC_RECORD, RISK_RULE, ALERT, ALERT_CONDITION (อ่าน); RECOMMENDATION (เขียน)

### 4.9 generate-weekly-summaries: สร้างสรุปรายสัปดาห์
- **วัตถุประสงค์:** สรุปเกรด/การเข้าเรียน/การส่งงาน/แนวโน้มของสัปดาห์ เทียบสัปดาห์ก่อนหน้าอย่างน้อย 1 ตัวแปร
- **อ้างอิง:** F-R5; R-US3, R-BR4; J-R ขั้น "ดูสรุปรายสัปดาห์"; AC-R3, TS-10, TS-11
- **Actor/ประเภท:** ระบบ / งานตามเวลา
- Input: สัปดาห์เป้าหมาย (ค่าเริ่มต้นคือสัปดาห์ที่ผ่านมา)
- Output: จำนวนสรุปที่สร้าง
- **เงื่อนไข:** 1 สรุปต่อผู้ใช้ต่อสัปดาห์ (ทำซ้ำไม่สร้างซ้ำ); ผู้ใช้ `student` สถานภาพ active ที่ลงทะเบียนภาคปัจจุบัน; ถ้าไม่มีข้อมูลสัปดาห์ก่อนให้ละส่วนเปรียบเทียบ
- **อ่าน/เขียน:** USER, ENROLLMENT, TERM, ACADEMIC_RECORD, WEEKLY_SUMMARY (อ่าน); WEEKLY_SUMMARY, NOTIFICATION (เขียน)
- **ผลข้างเคียง:** NOTIFICATION `weekly_summary_ready`; เหตุการณ์ `weekly-summary-ready`

### กลุ่ม 4.D: แจ้งเตือนและคำแนะนำฝั่งผู้เรียน

### 4.10 list-my-notifications: ดูรายการแจ้งเตือนของฉัน
- **วัตถุประสงค์:** แสดงกล่องแจ้งเตือน in-app (ทั้งผู้เรียนและแอดมินที่เป็นผู้รับ)
- **อ้างอิง:** F-R3, F-C10, F-C11; R-US1; J-R ขั้น "ได้รับการแจ้งเตือน", J-Mentor ขั้น "ได้รับแจ้งสิทธิ์", J-Admin ขั้น "แจ้งงานค้าง"; AC-R1
- **Actor/ประเภท:** ผู้รับ / ดึงข้อมูล
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ตัวกรองสถานะอ่าน | ค่าจากรายการ | ไม่ | ทั้งหมด/ยังไม่อ่าน |
| ตัวกรองชนิด | ค่าจากรายการ | ไม่ | notification_type |
| หน้า | จำนวนเต็ม | ไม่ | |

- Output: รายการ (ตัวระบุ, ชนิด, หัวข้อ, ตัวอย่างเนื้อหา, สถานะอ่าน, เวลา) และจำนวนที่ยังไม่อ่าน
- **เงื่อนไข:** เห็นเฉพาะของตน; เนื้อหาเป็นข้อความ ณ ตอนสร้าง (ไม่เปลี่ยนเมื่อแก้เกณฑ์)
- **ข้อผิดพลาด:** NOT_AUTHENTICATED
- **อ่าน/เขียน:** NOTIFICATION (อ่าน)

### 4.11 get-notification-detail: ดูรายละเอียดการแจ้งเตือน
- **วัตถุประสงค์:** แสดงเงื่อนไขที่ถูกกระตุ้นครบถ้วน พร้อมลิงก์ไปยังคำแนะนำที่เกี่ยวข้อง และทำเครื่องหมายว่าอ่านแล้ว
- **อ้างอิง:** F-R3; R-US1; J-R ขั้น "เปิดดูรายละเอียดการแจ้งเตือน"; AC-R1 (edge รายละเอียด), AC-R4 (edge snapshot), TS-07, TS-14
- **Actor/ประเภท:** ผู้รับ / ดึงข้อมูล
- Input: ตัวระบุการแจ้งเตือน (ตัวระบุ (ID), จำเป็น)
- Output: ชนิด เวลา เนื้อหา; สำหรับ `risk_alert` รายการเงื่อนไข (ชื่อเงื่อนไข ค่าจริง เกณฑ์ ณ ตอนตรวจพบ) และการอ้างถึงคำแนะนำ; สำหรับชนิดอื่นสรุปต้นทาง (ผล approve เหตุผลปฏิเสธ ฯลฯ)
- **ข้อผิดพลาด:** NOT_FOUND (ไม่ใช่ของผู้เรียก)
- **อ่าน/เขียน:** NOTIFICATION (อ่าน/เขียน `read_at`), ALERT, ALERT_CONDITION, RECOMMENDATION, WEEKLY_SUMMARY, MENTOR_NOMINATION, MESSAGE (อ่านเพื่อสรุปต้นทาง)
- **ผลข้างเคียง:** บันทึก `read_at`

### 4.12 get-my-recommendation: ดูคำแนะนำเฉพาะบุคคลของฉัน
- **วัตถุประสงค์:** แสดงคำแนะนำปัจจุบัน หรือข้อความ fallback เมื่อข้อมูลไม่พอ
- **อ้างอิง:** F-R4; R-US2; J-R ขั้น "เห็นคำแนะนำเฉพาะบุคคล"; AC-R2, TS-08, TS-09
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input: ไม่มี (ตัวเลือก: ตัวระบุ ALERT เพื่อดูของรายการนั้น)
- Output: `มีข้อมูลเพียงพอ` (จริง/เท็จ); เมื่อจริง: เนื้อหา ตัวแปรที่อ้างถึง เวลา; เมื่อเท็จ: ข้อความ fallback ("ยังไม่มีข้อมูลเพียงพอสำหรับคำแนะนำเฉพาะบุคคล")
- **เงื่อนไข:** จำนวนช่วงเวลาข้อมูลน้อยกว่า `min_history_periods` → fallback ไม่ใช่หน้าว่าง/ข้อผิดพลาด; ครบพอดีเกณฑ์ถือว่าผ่าน (สมมติฐานจาก TS-09)
- **อ่าน/เขียน:** RECOMMENDATION, ACADEMIC_RECORD, RISK_RULE (อ่าน)

### 4.13 get-my-weekly-summary: ดูสรุปรายสัปดาห์ของฉัน
- **วัตถุประสงค์:** แสดงสรุปของสัปดาห์ที่เลือก (ค่าเริ่มต้นล่าสุด) พร้อมการเปรียบเทียบ
- **อ้างอิง:** F-R5; R-US3; J-R ขั้น "ดูสรุปรายสัปดาห์" / "ประเมินความคืบหน้า"; AC-R3, TS-10, TS-11
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| สัปดาห์ | วันที่ | ไม่ | ค่าเริ่มต้น = สัปดาห์ล่าสุด |

- Output: snapshot (เกรด การเข้าเรียน การส่งงาน แนวโน้ม), comparison, รายการสัปดาห์ที่เลือกได้
- **ข้อผิดพลาด:** NOT_FOUND (ไม่มีสรุปของสัปดาห์นั้น คืนคำอธิบายแทนหน้าว่าง)
- **อ่าน/เขียน:** WEEKLY_SUMMARY (อ่าน)

### กลุ่ม 4.E: ตั้งค่า

### 4.14 list-risk-rules: ดูเกณฑ์แจ้งเตือน
- **อ้างอิง:** F-R6; R-US4; AC-R4 (TS-12 ขั้น 1)
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input: หมวดหมู่ผู้ใช้ (ข้อความ, ไม่จำเป็น, ค่าเริ่มต้นทั้งหมด)
- Output: รายการเกณฑ์ (ชนิด ค่าปัจจุบัน สถานะ ผู้แก้ล่าสุด เวลา)
- **ข้อผิดพลาด:** FORBIDDEN_ROLE
- **อ่าน/เขียน:** RISK_RULE, USER_CATEGORY (อ่าน)

### 4.15 save-risk-rule: บันทึกเกณฑ์แจ้งเตือน
- **วัตถุประสงค์:** สร้าง/แก้ค่าเกณฑ์โดยไม่ต้องแก้โค้ด มีผลรอบประเมินถัดไป
- **อ้างอิง:** F-R2, F-R6, F-R7 (โครงสร้างหมวดหมู่); R-US4, R-BR2; J-R edge "แอดมินปรับเกณฑ์"; AC-R4, AC-R5, TS-12, TS-13, TS-14
- **Actor/ประเภท:** admin / สร้าง/แก้ไข
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| หมวดหมู่ผู้ใช้ | ข้อความ | ใช่ | ต้องมีใน USER_CATEGORY |
| ชนิดเกณฑ์ | ค่าจากรายการ | ใช่ | rule_type |
| ค่าเกณฑ์ | ทศนิยม | ใช่ | เป็นตัวเลข ไม่ติดลบ ไม่ว่าง; อัตราเข้าเรียนอยู่ในช่วง 0-100 |
| ใช้งานอยู่ | จริง/เท็จ | ไม่ | |

- Output: เกณฑ์หลังบันทึก
- **เงื่อนไข:** ค่าใหม่มีผลกับการประเมินรอบถัดไปเท่านั้น; แจ้งเตือนเดิมไม่เปลี่ยน (snapshot); ค่าไม่ถูกต้องไม่กระทบค่าเดิม
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED (ระบุช่อง เช่น "ค่าต้องไม่ติดลบ/ต้องเป็นตัวเลข/ต้องกรอกค่า"); NOT_FOUND (หมวดหมู่)
- **อ่าน/เขียน:** RISK_RULE (อ่าน/เขียน), USER_CATEGORY (อ่าน)
- **ผลข้างเคียง:** audit `config_change` (ค่าก่อน-หลัง)

### 4.16 list-mentor-criteria: ดูเกณฑ์เสนอชื่อ mentor
- **อ้างอิง:** F-C4; C-BR1; AC-C1 (edge เปลี่ยนเกณฑ์)
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input: วิชา (ตัวระบุ (ID), ไม่จำเป็น)
- Output: เกณฑ์ตั้งต้นและเกณฑ์เฉพาะวิชา
- **ข้อผิดพลาด:** FORBIDDEN_ROLE
- **อ่าน/เขียน:** MENTOR_CRITERIA, COURSE (อ่าน)

### 4.17 save-mentor-criteria: บันทึกเกณฑ์เสนอชื่อ mentor
- **วัตถุประสงค์:** ตั้ง/ปรับเกณฑ์เกรด/GPA ต่อวิชา (หรือค่าตั้งต้น)
- **อ้างอิง:** F-C4; C-BR1; AC-C1 (ดึงค่าจากการตั้งค่า ไม่ hardcode)
- **Actor/ประเภท:** admin / สร้าง/แก้ไข
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| วิชา | ตัวระบุ (ID) | ไม่ | ว่าง = เกณฑ์ตั้งต้น |
| ชนิดเกณฑ์ | ค่าจากรายการ | ใช่ | criteria_type |
| ค่าเกณฑ์ | ทศนิยม | ใช่ | ไม่ติดลบ |
| ใช้งานอยู่ | จริง/เท็จ | ไม่ | |

- Output: เกณฑ์หลังบันทึก
- **เงื่อนไข:** มีผลกับรอบเสนอชื่อถัดไป ไม่กระทบสิทธิ์ที่อนุมัติแล้ว (สมมติฐาน AC-C1)
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED; NOT_FOUND (วิชา)
- **อ่าน/เขียน:** MENTOR_CRITERIA (อ่าน/เขียน), COURSE (อ่าน)
- **ผลข้างเคียง:** audit `config_change`

### 4.18 list-retention-policies: ดูนโยบายระยะเวลาเก็บ
- **อ้างอิง:** P-BR retention (ค่า configurable)
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Output: นโยบายทุกประเภท (ระยะเวลา นับจากเมื่อใด การกำจัด ถาวรหรือไม่)
- **ข้อผิดพลาด:** FORBIDDEN_ROLE
- **อ่าน/เขียน:** RETENTION_POLICY (อ่าน)

### 4.19 update-retention-policy: แก้นโยบายระยะเวลาเก็บ
- **อ้างอิง:** P-BR retention, P-BR audit ("ควรเป็นค่า configurable")
- **Actor/ประเภท:** admin / แก้ไข
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ประเภทข้อมูล | ค่าจากรายการ | ใช่ | data_category |
| ระยะเวลา + หน่วย | จำนวนเต็ม + ค่าจากรายการ | เงื่อนไข | > 0; ห้ามระบุเมื่อ is_permanent |

- Output: นโยบายหลังแก้
- **เงื่อนไข:** มีผลกับรอบ sweep/purge ถัดไป; ห้ามเปลี่ยนนโยบายถาวรเป็นมีอายุโดยไม่ audit _(สมมติฐาน)_
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** RETENTION_POLICY (อ่าน/เขียน)
- **ผลข้างเคียง:** audit `config_change`

### กลุ่ม 4.F: เสนอชื่อและอนุมัติ mentor

### 4.20 generate-mentor-nominations: เสนอชื่อ mentor อัตโนมัติ
- **วัตถุประสงค์:** ประเมินผลการเรียนรายวิชา/GPA ตามเกณฑ์ แล้วสร้างรายชื่อรอแอดมินพิจารณา (ไม่ให้สิทธิ์ทันที)
- **อ้างอิง:** F-C3, F-C11; C-US3, C-BR1 ข้อ 1; J-Mentor ขั้น "ระบบประมวลผลและเสนอชื่อ"; AC-C1
- **Actor/ประเภท:** ระบบ / งานตามเวลา (หลังนำเข้าข้อมูล และตามรอบ)
- Input: ขอบเขตวิชา/ผู้ใช้ที่ข้อมูลเปลี่ยน
- Output: จำนวน nomination ที่สร้าง
- **เงื่อนไข:** เฉพาะผู้ที่ลงทะเบียน enrolled ในวิชาและภาคปัจจุบัน; เกณฑ์เฉพาะวิชาใช้แทนเกณฑ์ตั้งต้น; ไม่ถึงเกณฑ์ = ไม่เสนอชื่อ; ไม่สร้างซ้ำในภาคเดียวกัน; เก็บค่าจริงและเกณฑ์ ณ ตอนเสนอชื่อ
- **อ่าน/เขียน:** ENROLLMENT, TERM, ACADEMIC_RECORD, MENTOR_CRITERIA, USER (อ่าน); MENTOR_NOMINATION (อ่าน/เขียน), NOTIFICATION (เขียน)
- **ผลข้างเคียง:** NOTIFICATION `admin_pending_work` (รวมแจ้งต่อวิชา); เหตุการณ์ `mentor-nomination-created`

### 4.21 list-mentor-nominations: ดูคิวอนุมัติ mentor
- **อ้างอิง:** F-C5, F-C12; C-US4; J-Admin ขั้น "เปิดดูรายชื่อที่ระบบเสนอ"; AC-C1, AC-C2
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| วิชา | ตัวระบุ (ID) | ไม่ | กรองตามวิชา |
| สถานะ | ค่าจากรายการ | ไม่ | ค่าเริ่มต้น pending |
| หน้า | จำนวนเต็ม | ไม่ | |

- Output: รายการ (ผู้ถูกเสนอชื่อ วิชา ภาค ค่าจริงเทียบเกณฑ์ สถานะ เหตุผล)
- **เงื่อนไข:** การเปิดดูผลการเรียนของนักศึกษาโดยแอดมินเป็นการเข้าถึงข้อมูลส่วนบุคคล ต้อง audit
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** MENTOR_NOMINATION, USER, COURSE, TERM, MENTOR_CRITERIA (อ่าน)
- **ผลข้างเคียง:** audit `student_data_access`

### 4.22 decide-mentor-nomination: อนุมัติหรือปฏิเสธ mentor
- **วัตถุประสงค์:** แอดมินตัดสิน nomination; ถ้าอนุมัติสร้างสิทธิ์ mentor และแจ้งผล
- **อ้างอิง:** F-C5, F-C6, F-C10; C-US4, C-BR1 ข้อ 2; J-Mentor ขั้น "รอผล/ได้รับแจ้ง", J-Admin ขั้น "ตรวจสอบและยืนยัน"; AC-C2
- **Actor/ประเภท:** admin / สั่งงาน
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ตัวระบุ nomination | ตัวระบุ (ID) | ใช่ | สถานะต้องเป็น pending |
| การตัดสิน | ค่าจากรายการ | ใช่ | `approve, reject` |
| เหตุผล | ข้อความ | เงื่อนไข | จำเป็นเมื่อ reject; แสดงให้นักศึกษาเห็น |

- Output: สถานะใหม่
- **เงื่อนไข:** approve → สร้าง MENTOR_GRANT; mentor active เฉพาะภาคของ nomination (Q3); ตัดสินซ้ำไม่ได้
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND; CONFLICT_STATE; VALIDATION_FAILED (ไม่ระบุเหตุผลเมื่อ reject); AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** MENTOR_NOMINATION (อ่าน/เขียน), MENTOR_GRANT (เขียน), NOTIFICATION (เขียน)
- **ผลข้างเคียง:** audit `role_change`; NOTIFICATION `mentor_decision` ถึงนักศึกษา; เหตุการณ์ `mentor-decision-made`

### 4.23 get-my-mentor-status: ดูสถานะสิทธิ์ mentor ของฉัน
- **อ้างอิง:** F-C6, F-C10; C-US1; J-Mentor ขั้น "รอผลการอนุมัติ"; AC-C2 (กรณียังไม่ถูกเสนอชื่อ)
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input: วิชา (ตัวระบุ (ID), ไม่จำเป็น)
- Output: ต่อวิชาที่ลงทะเบียนภาคปัจจุบัน: `ยังไม่ถูกเสนอชื่อ / รอพิจารณา / ได้รับสิทธิ์ / ถูกปฏิเสธ (พร้อมเหตุผล)` พร้อมคำอธิบาย (ไม่ใช่ผลว่าง)
- **อ่าน/เขียน:** MENTOR_NOMINATION, MENTOR_GRANT, ENROLLMENT, TERM, COURSE (อ่าน)

### กลุ่ม 4.G: ห้องแชท

### 4.24 list-my-chat-rooms: ดูรายการห้องแชทของฉัน
- **อ้างอิง:** F-C1, F-C2; C-US1, C-US2, C-BR2, C-BR3; J-Mentee ขั้น "เข้าห้องแชท"; AC-C3
- **Actor/ประเภท:** student / ดึงข้อมูล
- Output: เฉพาะห้องของวิชาที่ลงทะเบียนภาคปัจจุบัน (ชื่อวิชา, มี consent แล้วหรือไม่, ตนเป็น mentor หรือไม่, ตัวนับ mentor ของห้อง)
- **เงื่อนไข:** ไม่แสดงห้องวิชาที่ไม่ได้ลงทะเบียน
- **อ่าน/เขียน:** ENROLLMENT, TERM, CHAT_ROOM, COURSE, MENTOR_GRANT, MENTOR_NOMINATION, CONSENT_RECORD (อ่าน)

### 4.25 get-chat-room: เข้าห้องแชทรายวิชา
- **วัตถุประสงค์:** ตรวจสิทธิ์เข้าห้อง (ลงทะเบียนภาคปัจจุบัน + consent) และคืนข้อมูลห้อง
- **อ้างอิง:** F-C2; C-US2, C-BR3; J-Mentee ขั้น "ขอเข้าห้อง"; AC-C3 (รวมกรณีวิชายังไม่มี mentor)
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input: ห้อง (ตัวระบุ (ID), ใช่)
- Output: ข้อมูลห้อง, จำนวน mentor, สถานะ "ยังไม่มีผู้แนะนำ" เมื่อไม่มี mentor (ยังตั้งคำถามล่วงหน้าได้)
- **ข้อผิดพลาด:** NOT_ENROLLED_CURRENT_TERM (พร้อมข้อความสาเหตุ); CONSENT_REQUIRED; NOT_FOUND
- **อ่าน/เขียน:** CHAT_ROOM, COURSE, ENROLLMENT, TERM, CONSENT_RECORD, MENTOR_GRANT, MENTOR_NOMINATION (อ่าน)

### 4.26 list-published-messages: อ่านข้อความที่เผยแพร่แล้ว
- **อ้างอิง:** F-C8; C-US2; J-Mentee ขั้น "อ่านข้อความที่เผยแพร่แล้ว"; AC-C4 (badge), AC-C5
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ห้อง | ตัวระบุ (ID) | ใช่ | |
| หน้า | จำนวนเต็ม | ไม่ | |

- Output: ข้อความสถานะ `published` เรียงเก่า→ใหม่ (ผู้เขียน เนื้อหา เวลา badge ผู้แนะนำเมื่อ `posted_as_mentor`)
- **เงื่อนไข:** ไม่แสดงข้อความ pending/rejected ของผู้อื่น; ตรวจลงทะเบียนภาคปัจจุบันและ consent
- **ข้อผิดพลาด:** NOT_ENROLLED_CURRENT_TERM; CONSENT_REQUIRED
- **อ่าน/เขียน:** MESSAGE, USER, ENROLLMENT, TERM, CONSENT_RECORD (อ่าน)

### 4.27 post-chat-message: โพสต์ข้อความหรือคำถาม
- **วัตถุประสงค์:** สร้างข้อความสถานะรอตรวจ (ทั้งคำแนะนำของ mentor และคำถามของนักศึกษาทั่วไป)
- **อ้างอิง:** F-C7, F-C8, F-C9; C-US1, C-US2, C-BR4; J-Mentor ขั้น "โพสต์/รอตรวจ", J-Mentee ขั้น "ตั้งคำถาม"; AC-C4, AC-C5, AC-C6
- **Actor/ประเภท:** student (รวม mentor) / สร้าง
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ห้อง | ตัวระบุ (ID) | ใช่ | |
| เนื้อหา | ข้อความยาว | ใช่ | ไม่ว่าง |

- Output: ข้อความสถานะ `pending` (เห็นเฉพาะผู้ส่ง)
- **เงื่อนไข:** ต้องลงทะเบียนภาคปัจจุบันและมี consent; ทุกข้อความเริ่มที่ `pending`; `posted_as_mentor` ตั้งเป็นจริงเมื่อผู้ส่งมี grant active ของวิชานั้น ณ ตอนโพสต์
- **ข้อผิดพลาด:** NOT_ENROLLED_CURRENT_TERM; CONSENT_REQUIRED; VALIDATION_FAILED
- **อ่าน/เขียน:** ENROLLMENT, TERM, CONSENT_RECORD, MENTOR_GRANT, MENTOR_NOMINATION, CHAT_ROOM (อ่าน); MESSAGE, NOTIFICATION (เขียน)
- **ผลข้างเคียง:** NOTIFICATION `admin_pending_work` (รวมแจ้งต่อวิชา); เหตุการณ์ `message-submitted`

### 4.28 list-my-messages: ดูข้อความของฉันและสถานะ
- **อ้างอิง:** F-C10; C-BR4; J-Mentor ขั้น "รอการตรวจสอบ", J-Mentee ขั้น "รอข้อความผ่านการตรวจ"; AC-C4, AC-C6
- **Actor/ประเภท:** student / ดึงข้อมูล
- Input: ห้อง (ไม่จำเป็น), สถานะ (ไม่จำเป็น), หน้า
- Output: ข้อความของผู้เรียกทุกสถานะ พร้อมเหตุผลเมื่อ rejected
- **อ่าน/เขียน:** MESSAGE, MODERATION_DECISION (อ่าน)

### กลุ่ม 4.H: ตรวจข้อความ

### 4.29 list-moderation-queue: ดูคิวข้อความรอตรวจ
- **อ้างอิง:** F-C9; C-US5, C-BR4; J-Admin ขั้น "เปิดคิวข้อความ"; AC-C6 (รวมกรณีคิวว่างต้องมีข้อความให้กำลังใจ)
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input: วิชา (ไม่จำเป็น), หน้า
- Output: ข้อความ pending เรียงเก่าก่อน พร้อมวิชา ผู้ส่ง เวลา และจำนวนค้าง; คิวว่าง → ผลว่างพร้อมสถานะ "ไม่มีงานค้าง"
- **ข้อผิดพลาด:** FORBIDDEN_ROLE
- **อ่าน/เขียน:** MESSAGE, CHAT_ROOM, COURSE, USER (อ่าน)

### 4.30 decide-message-moderation: อนุมัติหรือปฏิเสธข้อความ
- **อ้างอิง:** F-C9, F-C10; C-US5, C-BR4; J-Admin ขั้น "ตัดสินอนุมัติ/ปฏิเสธ"; AC-C6
- **Actor/ประเภท:** admin / สั่งงาน
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ข้อความ | ตัวระบุ (ID) | ใช่ | สถานะต้องเป็น pending |
| การตัดสิน | ค่าจากรายการ | ใช่ | `approve, reject` |
| เหตุผล | ข้อความ | เงื่อนไข | จำเป็นเมื่อ reject |

- Output: สถานะใหม่ของข้อความ
- **เงื่อนไข:** approve → `published` มองเห็นแก่สมาชิกห้องทันที; reject → ไม่แสดงต่อผู้อื่น ผู้ส่งเห็นเหตุผล; ตัดสินซ้ำไม่ได้
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND; CONFLICT_STATE; VALIDATION_FAILED
- **อ่าน/เขียน:** MESSAGE (อ่าน/เขียน), MODERATION_DECISION (เขียน), NOTIFICATION (เขียน)
- **ผลข้างเคียง:** audit `message_moderation`; NOTIFICATION `message_status` ถึงผู้ส่ง; เหตุการณ์ `message-moderated`

### 4.31 get-chat-activity-overview: ดูภาพรวมกิจกรรมห้องแชท
- **อ้างอิง:** F-C12 (Could have); journey admin (ภาพรวม)
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input: ภาค (ค่าเริ่มต้น = ปัจจุบัน)
- Output: ต่อวิชา: จำนวน mentor active, จำนวน nomination ค้าง, จำนวนข้อความ/ค้างตรวจ
- **อ่าน/เขียน:** CHAT_ROOM, COURSE, MENTOR_GRANT, MENTOR_NOMINATION, MESSAGE, TERM (อ่าน)

### กลุ่ม 4.I: ความยินยอมและสิทธิ PDPA

### 4.32 get-current-privacy-notice: ดู privacy notice ปัจจุบัน
- **อ้างอิง:** P-US2, P-BR PDPA (แจ้งวัตถุประสงค์); architecture §4.5
- **Actor/ประเภท:** ทุกบทบาท / ดึงข้อมูล
- Input: วัตถุประสงค์ (ไม่จำเป็น)
- Output: notice เวอร์ชัน current (วัตถุประสงค์ ฐานกฎหมาย เนื้อหา เวอร์ชัน)
- **อ่าน/เขียน:** PRIVACY_NOTICE (อ่าน)

### 4.33 publish-privacy-notice: เผยแพร่ privacy notice เวอร์ชันใหม่
- **อ้างอิง:** P-BR PDPA (สถาบันกำหนดวัตถุประสงค์); architecture §4.5
- **Actor/ประเภท:** admin (แทนสถาบัน) / สร้าง
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| วัตถุประสงค์ | ค่าจากรายการ | ใช่ | |
| ฐานกฎหมาย | ค่าจากรายการ | ใช่ | educational_mission หรือ consent |
| เนื้อหา | ข้อความยาว | ใช่ | |

- Output: เวอร์ชันใหม่
- **เงื่อนไข:** เวอร์ชันเดิมของวัตถุประสงค์เดียวกันเป็น superseded; ไม่แก้เวอร์ชันเดิม
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; VALIDATION_FAILED
- **อ่าน/เขียน:** PRIVACY_NOTICE (อ่าน/เขียน)
- **ผลข้างเคียง:** audit `notice_publish`

### 4.34 set-consent: ให้หรือถอนความยินยอม
- **วัตถุประสงค์:** บันทึกการให้/ถอน consent ต่อวัตถุประสงค์ มีผลทันทีทั่วระบบผ่านจุดควบคุมกลาง
- **อ้างอิง:** P-US2, P-BR PDPA (สิทธิถอน); architecture Q5; J-Mentee ขั้น "เข้าห้อง" (ตรวจ consent)
- **Actor/ประเภท:** ผู้เรียน / สร้าง
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| วัตถุประสงค์ | ค่าจากรายการ | ใช่ | ต้องเป็นวัตถุประสงค์ที่ฐานเป็น consent |
| ให้ความยินยอม | จริง/เท็จ | ใช่ | |

- Output: สถานะ consent ปัจจุบัน
- **เงื่อนไข:** อ้าง notice เวอร์ชัน current ของวัตถุประสงค์; บันทึกเป็นแถวใหม่ (ไม่แก้แถวเดิม); เมื่อถอน `chat_participation` ผู้ใช้ไม่เข้า/โพสต์ห้องแชทได้ทันที และข้อความของผู้ใช้ถูกจัดการตามการตัดสินใจ Q4 (ลบเนื้อหาที่ยังไม่เผยแพร่ ทำให้ไม่ระบุผู้เขียนข้อความที่เผยแพร่)
- **ข้อผิดพลาด:** VALIDATION_FAILED (วัตถุประสงค์ไม่ใช้ consent); NOT_FOUND (ไม่มี notice)
- **อ่าน/เขียน:** PRIVACY_NOTICE (อ่าน), CONSENT_RECORD (อ่าน/เขียน), MESSAGE (เขียน เมื่อถอน)
- **ผลข้างเคียง:** audit `consent_change`; เหตุการณ์ `consent-changed`

### 4.35 list-my-consents: ดูสถานะ consent ของฉัน
- **อ้างอิง:** P-US2
- **Actor/ประเภท:** ผู้เรียน / ดึงข้อมูล
- Output: ต่อวัตถุประสงค์: สถานะปัจจุบัน, เวอร์ชัน notice ที่อ้าง, เวลา, ประวัติ
- **อ่าน/เขียน:** CONSENT_RECORD, PRIVACY_NOTICE (อ่าน)

### 4.36 submit-data-subject-request: ยื่นคำร้องใช้สิทธิ
- **อ้างอิง:** P-US3, P-BR PDPA (เข้าถึง แก้ไข ลบ คัดค้าน โอนย้าย); architecture §4.5
- **Actor/ประเภท:** ผู้เรียน / สร้าง
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ชนิดคำร้อง | ค่าจากรายการ | ใช่ | `access, rectify, erase, object, portability` (ถอน consent ใช้ set-consent) |
| รายละเอียด | ข้อความยาว | ไม่ | |

- Output: คำร้องสถานะ `submitted`
- **เงื่อนไข:** ผู้ยื่นต้องเป็นเจ้าของข้อมูล; คำร้อง `erase` ที่ขัดกับข้อมูลเก็บถาวรตามระเบียบจะถูกพิจารณาในขั้นตัดสิน
- **ข้อผิดพลาด:** VALIDATION_FAILED; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** USER (อ่าน), DATA_SUBJECT_REQUEST (เขียน)
- **ผลข้างเคียง:** audit `dsr_submit`

### 4.37 list-my-data-subject-requests: ดูคำร้องของฉัน
- **อ้างอิง:** P-US3
- **Actor/ประเภท:** ผู้เรียน / ดึงข้อมูล
- Output: คำร้องของตน (ชนิด สถานะ เหตุผล ผลดำเนินการ เวลา)
- **อ่าน/เขียน:** DATA_SUBJECT_REQUEST (อ่าน)

### 4.38 list-data-subject-requests: ดูคิวคำร้องใช้สิทธิ
- **อ้างอิง:** P-US4
- **Actor/ประเภท:** admin / ดึงข้อมูล
- Input: สถานะ, ชนิด, หน้า (ไม่จำเป็น)
- Output: รายการคำร้องพร้อมตัวตนผู้ยื่น
- **ข้อผิดพลาด:** FORBIDDEN_ROLE
- **อ่าน/เขียน:** DATA_SUBJECT_REQUEST, USER (อ่าน)

### 4.39 decide-data-subject-request: บันทึกผลพิจารณาของสถาบัน
- **อ้างอิง:** P-US4; architecture §4.5 (สถาบันพิจารณา); ตามการตัดสินใจ Q6 (admin บันทึกผลแทนสถาบัน)
- **Actor/ประเภท:** admin (บันทึกแทนสถาบัน) / สั่งงาน
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| คำร้อง | ตัวระบุ (ID) | ใช่ | สถานะ submitted/under_review |
| ผลพิจารณา | ค่าจากรายการ | ใช่ | `under_review, approved, rejected` |
| เหตุผล | ข้อความ | เงื่อนไข | จำเป็นเมื่อ rejected |

- Output: สถานะใหม่
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND; CONFLICT_STATE; VALIDATION_FAILED; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** DATA_SUBJECT_REQUEST (อ่าน/เขียน), NOTIFICATION (เขียน)
- **ผลข้างเคียง:** audit `dsr_decide`; NOTIFICATION `data_subject_request_update`; เหตุการณ์ `data-subject-request-updated`

### 4.40 fulfil-data-subject-request: ดำเนินการตามคำร้องที่อนุมัติ
- **วัตถุประสงค์:** ดำเนินการตามชนิดคำร้องที่ approved (access/portability = รวบรวมชุดข้อมูลของผู้ร้องและส่งมอบ; rectify = แก้ข้อมูลที่ระบบถือครอง; erase/object = ลบ/ทำให้ไม่ระบุตัวตน/หยุดประมวลผลตามที่อนุญาต) แล้วแจ้งผล
- **อ้างอิง:** P-US3, P-US4, P-BR PDPA, P-BR retention; architecture §4.5 ("ดำเนินการตามผล"); ตามการตัดสินใจ Q7 (ระบบรวบรวมและส่งมอบ)
- **Actor/ประเภท:** admin / สั่งงาน
- Input: คำร้อง (ตัวระบุ (ID), ใช่; สถานะต้องเป็น approved)
- Output: สรุปผลการดำเนินการ; สำหรับ access/portability: ชุดข้อมูลส่วนบุคคลของผู้ร้องเท่านั้น (จัดกลุ่มตามประเภทข้อมูล)
- **เงื่อนไข:** ข้อมูลที่ต้องเก็บถาวรตามระเบียบ (ทรานสคริปต์) ไม่ถูกลบ และระบุในผล; ไม่ส่งข้อมูลของบุคคลอื่น; `erase` ใช้กติกา MESSAGE ตาม Q4
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; NOT_FOUND; CONFLICT_STATE; AUDIT_UNAVAILABLE
- **อ่าน/เขียน:** DATA_SUBJECT_REQUEST (อ่าน/เขียน), USER, ACADEMIC_RECORD, ALERT, RECOMMENDATION, MESSAGE (อ่าน/เขียนตามชนิดคำร้อง), NOTIFICATION (เขียน)
- **ผลข้างเคียง:** audit `dsr_fulfil` และ `data_export` (เมื่อส่งมอบชุดข้อมูล); NOTIFICATION `data_subject_request_update`

### 4.41 run-retention-sweep: ตามรอบ retention ข้อมูลนักศึกษา
- **วัตถุประสงค์:** ลบหรือทำให้ไม่ระบุตัวตนข้อมูลที่พ้นระยะเวลาเก็บ (สถานภาพ +5 ปี) ยกเว้นข้อมูลถาวร
- **อ้างอิง:** P-US4, P-BR retention; architecture §4.5 ขั้น "ตามรอบ retention"
- **Actor/ประเภท:** ระบบ / งานตามเวลา
- Input: ไม่มี (อ่านนโยบายปัจจุบัน)
- Output: สรุปจำนวนที่ลบ/ทำให้ไม่ระบุตัวตนต่อประเภทข้อมูล
- **เงื่อนไข:** เลือกผู้ใช้ `status = ended` ที่ `status_ended_at` + ระยะเวลานโยบายผ่านแล้ว; ข้อมูลผูกนโยบายถาวรคงอยู่ (USER เป็น `minimized`); ข้อมูลอื่นลบ/ทำให้ไม่ระบุตัวตน (MESSAGE ตาม Q4); ทำซ้ำได้ปลอดภัย
- **อ่าน/เขียน:** USER, RETENTION_POLICY (อ่าน); USER, ACADEMIC_RECORD, ENROLLMENT, ALERT, ALERT_CONDITION, RECOMMENDATION, WEEKLY_SUMMARY, NOTIFICATION, MENTOR_NOMINATION, MENTOR_GRANT, MESSAGE, DATA_SUBJECT_REQUEST, CONSENT_RECORD (เขียน/ลบ)
- **ผลข้างเคียง:** audit `retention_sweep` (สรุปผล)

### กลุ่ม 4.J: audit log

### 4.42 record-audit-event: บันทึกเหตุการณ์ audit
- **วัตถุประสงค์:** รับเหตุการณ์สำคัญจากทุก operation เก็บแบบเพิ่มต่อท้ายอย่างเดียวในที่เก็บแยก
- **อ้างอิง:** P-US1, P-US5, P-BR audit; architecture §4.6
- **Actor/ประเภท:** ระบบ (เรียกภายใน) / สร้าง
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ผู้กระทำ | ข้อความ + ตัวระบุ (ID) | ใช่ | ระบบหรือผู้ใช้ (ล็อกอินล้มเหลวอาจไม่รู้ตัวตน) |
| การกระทำ | ค่าจากรายการ | ใช่ | audit action |
| เป้าหมาย | ข้อความ | ใช่ | |
| ผลลัพธ์ | ค่าจากรายการ | ใช่ | success/failure |
| ค่าก่อน/หลัง | โครงสร้างซ้อน | ไม่ | สำหรับแก้เกรด/สิทธิ์/เกณฑ์ |

- Output: ตัวระบุเหตุการณ์
- **เงื่อนไข:** เพิ่มต่อท้ายเท่านั้น ไม่มี operation แก้/ลบ; ผูกนโยบาย `audit_log`
- **ข้อผิดพลาด:** AUDIT_UNAVAILABLE (ผู้เรียกใช้ตามกติกา Q5)
- **อ่าน/เขียน:** AUDIT_LOG_ENTRY (เขียน), RETENTION_POLICY (อ่าน)

### 4.43 search-audit-log: ค้นหา audit log
- **อ้างอิง:** P-US1, P-US5, P-BR audit (จำกัดผู้อ่านและ log-of-logs); architecture §4.6
- **Actor/ประเภท:** auditor / ดึงข้อมูล
- Input

| ชื่อ | ชนิด | จำเป็น? | กฎ |
|---|---|---|---|
| ช่วงเวลา | วันเวลา x 2 | ไม่ | |
| ผู้กระทำ / การกระทำ / เป้าหมาย | ข้อความ/ค่าจากรายการ | ไม่ | |
| หน้า | จำนวนเต็ม | ไม่ | |

- Output: รายการเหตุการณ์ (รวมค่าก่อน-หลัง)
- **เงื่อนไข:** เฉพาะ auditor; admin ปกติอ่านไม่ได้; การค้นหาถูกบันทึกก่อนคืนผล
- **ข้อผิดพลาด:** FORBIDDEN_ROLE; AUDIT_UNAVAILABLE (ปฏิเสธเพราะบันทึกการอ่านไม่ได้)
- **อ่าน/เขียน:** AUDIT_LOG_ENTRY (อ่าน)
- **ผลข้างเคียง:** audit `audit_log_read`

### 4.44 purge-expired-audit-log-entries: ลบ audit log ที่พ้นอายุ
- **อ้างอิง:** P-BR audit (เก็บ 1 ปี configurable), P-US5 (ผู้ใช้/แอดมินแก้-ลบไม่ได้ ยกเว้นกลไกอายุของระบบ)
- **Actor/ประเภท:** ระบบ / งานตามเวลา
- **เงื่อนไข:** ลบเฉพาะแถวที่เก่ากว่าระยะเวลานโยบาย `audit_log`; ไม่มี actor มนุษย์เรียกได้
- **อ่าน/เขียน:** RETENTION_POLICY (อ่าน), AUDIT_LOG_ENTRY (ลบ)
- **ผลข้างเคียง:** audit `audit_purge` (สรุปจำนวน)

## 5. ลำดับการเรียกตาม User Journey

### 5.1 J-R: นักเรียนรับรู้ความเสี่ยงและรับคำแนะนำ

```mermaid
sequenceDiagram
    participant Staff as บุคลากร
    participant Sys as ระบบ
    participant Stu as ผู้เรียน
    participant Adm as ผู้ดูแลระบบ
    Staff->>Sys: import-enrollments
    Staff->>Sys: import-academic-records
    Sys->>Sys: evaluate-learning-risk
    Sys->>Sys: generate-personal-recommendation
    Stu->>Sys: list-my-notifications
    Stu->>Sys: get-notification-detail
    Stu->>Sys: get-my-recommendation
    Sys->>Sys: generate-weekly-summaries ตามรอบ
    Stu->>Sys: get-my-weekly-summary
    Adm->>Sys: save-risk-rule
    Sys->>Sys: evaluate-learning-risk รอบถัดไป
```

### 5.2 J-Mentor: ได้รับสิทธิ์และโพสต์คำแนะนำ

```mermaid
sequenceDiagram
    participant Sys as ระบบ
    participant Adm as ผู้ดูแลระบบ
    participant Men as ผู้แนะนำ
    Sys->>Sys: generate-mentor-nominations
    Adm->>Sys: list-mentor-nominations
    Adm->>Sys: decide-mentor-nomination
    Men->>Sys: get-my-mentor-status
    Men->>Sys: list-my-notifications
    Men->>Sys: get-chat-room
    Men->>Sys: post-chat-message
    Men->>Sys: list-my-messages
```

### 5.3 J-Mentee: นักศึกษาทั่วไปขอคำแนะนำ

```mermaid
sequenceDiagram
    participant Stu as นักศึกษาทั่วไป
    participant Sys as ระบบ
    participant Adm as ผู้ดูแลระบบ
    Stu->>Sys: list-my-chat-rooms
    Stu->>Sys: set-consent chat_participation
    Stu->>Sys: get-chat-room
    Stu->>Sys: list-published-messages
    Stu->>Sys: post-chat-message
    Adm->>Sys: decide-message-moderation
    Stu->>Sys: list-my-messages
    Stu->>Sys: list-published-messages
```

### 5.4 J-Admin: ควบคุมคุณภาพ mentor และเนื้อหา

```mermaid
sequenceDiagram
    participant Adm as ผู้ดูแลระบบ
    participant Sys as ระบบ
    Adm->>Sys: list-my-notifications
    Adm->>Sys: list-mentor-nominations
    Adm->>Sys: decide-mentor-nomination
    Adm->>Sys: list-moderation-queue
    Adm->>Sys: decide-message-moderation
    Adm->>Sys: get-chat-activity-overview
    Sys->>Sys: record-audit-event
```

### 5.5 เจ้าของข้อมูล: consent และสิทธิ PDPA (architecture §4.5)

```mermaid
sequenceDiagram
    participant Own as เจ้าของข้อมูล
    participant Sys as ระบบ
    participant Adm as ผู้ดูแลระบบแทนสถาบัน
    Own->>Sys: get-current-privacy-notice
    Own->>Sys: set-consent
    Own->>Sys: submit-data-subject-request
    Adm->>Sys: list-data-subject-requests
    Adm->>Sys: decide-data-subject-request
    Adm->>Sys: fulfil-data-subject-request
    Own->>Sys: list-my-data-subject-requests
    Sys->>Sys: run-retention-sweep ตามรอบ
```

### 5.6 ผู้ตรวจสอบ: audit log (architecture §4.6)

```mermaid
sequenceDiagram
    participant Src as operation ต้นทาง
    participant Aud as ผู้ตรวจสอบ
    participant Sys as ระบบ
    Src->>Sys: record-audit-event
    Aud->>Sys: search-audit-log
    Sys->>Sys: record-audit-event audit_log_read
    Sys->>Sys: purge-expired-audit-log-entries ตามรอบ
```

## 6. Event / การแจ้งเตือนเชิงแนวคิด

| เหตุการณ์ | ทริกเกอร์ | ข้อมูลที่แนบ | ผู้รับ |
|---|---|---|---|
| learning-risk-detected | evaluate-learning-risk สร้าง/เปลี่ยน ALERT | ผู้ใช้, รายการเงื่อนไข | ผู้เรียน (NOTIFICATION `risk_alert`) |
| weekly-summary-ready | generate-weekly-summaries | สัปดาห์ | ผู้เรียน |
| mentor-nomination-created | generate-mentor-nominations | วิชา, จำนวน | แอดมิน (`admin_pending_work`) |
| mentor-decision-made | decide-mentor-nomination | ผล, เหตุผล | นักศึกษาที่ถูกเสนอชื่อ |
| message-submitted | post-chat-message | วิชา | แอดมิน (`admin_pending_work`) |
| message-moderated | decide-message-moderation | ผล, เหตุผล | ผู้ส่ง (`message_status`) |
| consent-changed | set-consent | วัตถุประสงค์, สถานะ | จุดควบคุม consent (ผลทันทีต่อห้องแชท) |
| data-subject-request-updated | decide/fulfil-data-subject-request | สถานะ | ผู้ร้อง |

ช่องทางส่งออกเป็น in-app เท่านั้นในเวอร์ชันนี้

## 7. การเชื่อมต่อระบบภายนอก

| ระบบภายนอก | operation ภายในที่เกี่ยวข้อง | ข้อมูลที่แลกเปลี่ยน | เมื่อระบบนั้นล่ม |
|---|---|---|---|
| ระบบยืนยันตัวตนของสถาบัน | sign-in-with-institution-identity | ตัวตน (identity_ref), สถานภาพ | เข้าระบบไม่ได้ (NOT_AUTHENTICATED) ข้อมูลเดิมไม่เสียหาย; การนำเข้าและงานตามเวลายังทำงาน |
| แหล่งข้อมูลการเรียน (บุคลากรนำเข้าเอง) | import-enrollments, import-academic-records, correct-academic-record | เกรด เข้าเรียน ส่งงาน ลงทะเบียน | ไม่มีข้อมูลใหม่ การเตือน/เสนอชื่อล่าช้า ผู้ใช้ยังดูข้อมูลเดิมได้ |
| หน่วยงานกำกับข้อมูลส่วนบุคคล | (ไม่มี operation) | รายงานเหตุรั่วไหลภายใน 72 ชั่วโมง | เป็นกระบวนการของสถาบัน ไม่ใช่การเชื่อมต่อของระบบ |
| ช่องทางแจ้งเตือนนอกแอป | (ไม่มี — จุดเสียบที่คอลัมน์ `channel` ของ NOTIFICATION) | — | ยังไม่มี อยู่นอกขอบเขต |
| ระบบทะเบียน/ระบบเกรดของสถาบัน | (ไม่มี) | — | ยังไม่มี เป็นจุดขยายในอนาคต |

## 8. Traceability

### (ก) feature / user story → operation

| ที่มา | operation |
|---|---|
| F-R1 / R-US1,2 | import-enrollments, import-academic-records, correct-academic-record |
| F-R2 / R-BR1,2 | evaluate-learning-risk, save-risk-rule |
| F-R3 / R-US1 | evaluate-learning-risk, list-my-notifications, get-notification-detail |
| F-R4 / R-US2 | generate-personal-recommendation, get-my-recommendation |
| F-R5 / R-US3 | generate-weekly-summaries, get-my-weekly-summary |
| F-R6 / R-US4 | list-risk-rules, save-risk-rule |
| F-R7 | (เชิงโครงสร้าง: USER_CATEGORY + `RISK_RULE.category_code`; ไม่มี operation จัดการ ตาม AC-R5) |
| F-C1 / C-BR2 | import-enrollments, list-my-chat-rooms |
| F-C2 / C-BR3 | set-current-term, list-my-chat-rooms, get-chat-room, list-published-messages |
| F-C3 / C-US3 | generate-mentor-nominations |
| F-C4 / C-BR1 | list-mentor-criteria, save-mentor-criteria |
| F-C5 / C-US4 | list-mentor-nominations, decide-mentor-nomination |
| F-C6 / C-US1 | decide-mentor-nomination, get-my-mentor-status |
| F-C7, F-C8 / C-US1,2 | post-chat-message, list-published-messages |
| F-C9 / C-US5, C-BR4 | list-moderation-queue, decide-message-moderation |
| F-C10 | list-my-messages, decide-message-moderation, decide-mentor-nomination (ผ่าน NOTIFICATION) |
| F-C11 | generate-mentor-nominations, post-chat-message (ผ่าน NOTIFICATION), list-my-notifications |
| F-C12 | get-chat-activity-overview |
| P-US1, P-US5 | record-audit-event, search-audit-log, purge-expired-audit-log-entries |
| P-US2 | get-current-privacy-notice, publish-privacy-notice, set-consent, list-my-consents |
| P-US3 | submit-data-subject-request, list-my-data-subject-requests, fulfil-data-subject-request |
| P-US4 | list-data-subject-requests, decide-data-subject-request, run-retention-sweep, list/update-retention-policy |
| P-BR audit (login) | sign-in-with-institution-identity, sign-out |

**ที่ยังไม่มี operation รองรับ:** F-R7 (เชิงโครงสร้างอย่างเดียว); F-R8-10, F-C13-16 (Won't have); ขั้น journey "นำคำแนะนำไปปรับใช้" (ไม่มี feature); ขั้น journey "จัดการปริมาณงาน/SLA การตรวจสอบ" (spec ยังไม่กำหนด SLA — มีเพียงการแจ้งเตือนงานค้างและตัวนับคิว); การแจ้งเหตุข้อมูลรั่วไหลภายใน 72 ชั่วโมง (กระบวนการระดับสถาบัน)

### (ข) operation → ตาราง

| operation | อ่าน | เขียน |
|---|---|---|
| sign-in-with-institution-identity | USER, USER_CATEGORY | USER |
| sign-out | — | (AUDIT_LOG_ENTRY ผ่าน record-audit-event) |
| import-enrollments | USER_CATEGORY | USER, COURSE, TERM, ENROLLMENT, CHAT_ROOM |
| import-academic-records | USER, COURSE, TERM, ENROLLMENT, RETENTION_POLICY | ACADEMIC_RECORD |
| correct-academic-record | ACADEMIC_RECORD | ACADEMIC_RECORD |
| set-current-term | TERM | TERM |
| evaluate-learning-risk | USER, ENROLLMENT, TERM, RISK_RULE, ACADEMIC_RECORD, ALERT | ALERT, ALERT_CONDITION, NOTIFICATION |
| generate-personal-recommendation | ACADEMIC_RECORD, RISK_RULE, ALERT, ALERT_CONDITION | RECOMMENDATION |
| generate-weekly-summaries | USER, ENROLLMENT, TERM, ACADEMIC_RECORD, WEEKLY_SUMMARY | WEEKLY_SUMMARY, NOTIFICATION |
| list-my-notifications | NOTIFICATION | — |
| get-notification-detail | NOTIFICATION, ALERT, ALERT_CONDITION, RECOMMENDATION, WEEKLY_SUMMARY, MENTOR_NOMINATION, MESSAGE | NOTIFICATION (read_at) |
| get-my-recommendation | RECOMMENDATION, ACADEMIC_RECORD, RISK_RULE | — |
| get-my-weekly-summary | WEEKLY_SUMMARY | — |
| list-risk-rules | RISK_RULE, USER_CATEGORY | — |
| save-risk-rule | RISK_RULE, USER_CATEGORY | RISK_RULE |
| list-mentor-criteria | MENTOR_CRITERIA, COURSE | — |
| save-mentor-criteria | MENTOR_CRITERIA, COURSE | MENTOR_CRITERIA |
| list-retention-policies | RETENTION_POLICY | — |
| update-retention-policy | RETENTION_POLICY | RETENTION_POLICY |
| generate-mentor-nominations | ENROLLMENT, TERM, ACADEMIC_RECORD, MENTOR_CRITERIA, USER, MENTOR_NOMINATION | MENTOR_NOMINATION, NOTIFICATION |
| list-mentor-nominations | MENTOR_NOMINATION, USER, COURSE, TERM, MENTOR_CRITERIA | — |
| decide-mentor-nomination | MENTOR_NOMINATION | MENTOR_NOMINATION, MENTOR_GRANT, NOTIFICATION |
| get-my-mentor-status | MENTOR_NOMINATION, MENTOR_GRANT, ENROLLMENT, TERM, COURSE | — |
| list-my-chat-rooms | ENROLLMENT, TERM, CHAT_ROOM, COURSE, MENTOR_GRANT, MENTOR_NOMINATION, CONSENT_RECORD | — |
| get-chat-room | CHAT_ROOM, COURSE, ENROLLMENT, TERM, CONSENT_RECORD, MENTOR_GRANT, MENTOR_NOMINATION | — |
| list-published-messages | MESSAGE, USER, ENROLLMENT, TERM, CONSENT_RECORD | — |
| post-chat-message | ENROLLMENT, TERM, CONSENT_RECORD, MENTOR_GRANT, MENTOR_NOMINATION, CHAT_ROOM | MESSAGE, NOTIFICATION |
| list-my-messages | MESSAGE, MODERATION_DECISION | — |
| list-moderation-queue | MESSAGE, CHAT_ROOM, COURSE, USER | — |
| decide-message-moderation | MESSAGE | MESSAGE, MODERATION_DECISION, NOTIFICATION |
| get-chat-activity-overview | CHAT_ROOM, COURSE, MENTOR_GRANT, MENTOR_NOMINATION, MESSAGE, TERM | — |
| get-current-privacy-notice | PRIVACY_NOTICE | — |
| publish-privacy-notice | PRIVACY_NOTICE | PRIVACY_NOTICE |
| set-consent | PRIVACY_NOTICE, CONSENT_RECORD | CONSENT_RECORD, MESSAGE (เมื่อถอน) |
| list-my-consents | CONSENT_RECORD, PRIVACY_NOTICE | — |
| submit-data-subject-request | USER | DATA_SUBJECT_REQUEST |
| list-my-data-subject-requests | DATA_SUBJECT_REQUEST | — |
| list-data-subject-requests | DATA_SUBJECT_REQUEST, USER | — |
| decide-data-subject-request | DATA_SUBJECT_REQUEST | DATA_SUBJECT_REQUEST, NOTIFICATION |
| fulfil-data-subject-request | DATA_SUBJECT_REQUEST, USER, ACADEMIC_RECORD, ALERT, RECOMMENDATION, MESSAGE | DATA_SUBJECT_REQUEST, USER, ACADEMIC_RECORD, MESSAGE, NOTIFICATION (ตามชนิดคำร้อง) |
| run-retention-sweep | USER, RETENTION_POLICY | USER, ACADEMIC_RECORD, ENROLLMENT, ALERT, ALERT_CONDITION, RECOMMENDATION, WEEKLY_SUMMARY, NOTIFICATION, MENTOR_NOMINATION, MENTOR_GRANT, MESSAGE, DATA_SUBJECT_REQUEST, CONSENT_RECORD |
| record-audit-event | RETENTION_POLICY | AUDIT_LOG_ENTRY |
| search-audit-log | AUDIT_LOG_ENTRY | — |
| purge-expired-audit-log-entries | RETENTION_POLICY | AUDIT_LOG_ENTRY (ลบตามอายุ) |

ตรวจ coverage ฝั่งตาราง: ทุกตาราง 23 ตารางมี operation อ่านและเขียนอย่างน้อยอย่างละ 1 ตัว ยกเว้น USER_CATEGORY (ไม่มี operation เขียน เหตุผล: F-R7 เป็นงานเชิงออกแบบ ค่า seed)

## 9. ข้อจำกัดจาก Requirement

ไม่มีเทคโนโลยีที่ requirement ระบุไว้เอง ข้อบังคับที่ระบุ: พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562, แจ้งเหตุข้อมูลรั่วไหลภายใน 72 ชั่วโมง, เก็บ audit log 1 ปี (configurable), เก็บข้อมูลนักศึกษา +5 ปีหลังพ้นสถานภาพ, MFA บัญชีผู้ดูแลระบบ, เข้ารหัสข้อมูลขณะจัดเก็บและส่งผ่าน (ไม่ระบุวิธี), ช่องทางแจ้งเตือน in-app เท่านั้น

## 10. การตัดสินใจที่ยืนยันแล้ว

ผู้ใช้ยืนยันเมื่อ 2026-10-08 (ฐานเพิ่มเติม: การตัดสินใจเชิงสถาปัตยกรรมใน [[high-level-architecture|High Level Architecture]])

| หัวข้อ | การตัดสินใจ | เหตุผล | วันที่ |
|---|---|---|---|
| ส่วนต่างจาก data concept (D1-D6, ดู [[database-spec|Database Spec]] หัวข้อ 3) | เก็บเป็นรายละเอียดระดับ schema ไม่ย้อนแก้ architecture; แนะนำให้รัน `/sync-architecture` ภายหลัง | ไม่ให้เอกสารชั้นหลังแก้ชั้นก่อน | 2026-10-08 |
| Q1 ภาคปัจจุบัน | ตาราง TERM + `is_current`; operation set-current-term | สลับภาคจุดเดียว คุมสิทธิ์ห้องแชท/เสนอชื่อ | 2026-10-08 |
| Q2 แจ้งเตือนหลายเงื่อนไข | แจ้งรวม 1 รายการต่อรอบ + ALERT_CONDITION | ตรง AC-R1/TS-06 และ snapshot AC-R4/TS-14 | 2026-10-08 |
| Q3 อายุสิทธิ์ mentor | สิทธิ์หมดเมื่อสิ้นภาค ไม่มี operation ถอนสิทธิ์ | ภาคใหม่ต้อง approve ใหม่ ไม่เพิ่มกฎนอก spec | 2026-10-08 |
| Q4 ข้อความเมื่อถอน consent/ครบ retention | ลบเนื้อหาที่ยังไม่เผยแพร่ ทำให้ไม่ระบุตัวผู้เขียนข้อความที่เผยแพร่แล้ว | รักษาบริบทห้องแชทโดยตัดความเชื่อมโยงกับผู้โพสต์ | 2026-10-08 |
| Q5 audit log ใช้งานไม่ได้ | แบ่งระดับ: การกระทำสำคัญปฏิเสธด้วย AUDIT_UNAVAILABLE ส่วนอื่นทำต่อและส่ง log ซ้ำ | รักษาหลักฐานสำคัญโดยไม่ปิดระบบทั้งหมด | 2026-10-08 |
| Q6 ผู้บันทึกผลคำร้อง PDPA | admin บันทึกผลแทนสถาบัน | ใช้ role และ MFA ที่มีอยู่ ไม่เพิ่ม role | 2026-10-08 |
| Q7 ส่งมอบข้อมูลสิทธิเข้าถึง/โอนย้าย | ระบบรวบรวมชุดข้อมูลของผู้ร้องและส่งมอบ | ตอบสิทธิภายในระบบและบันทึก `data_export` ได้ | 2026-10-08 |
| Q8 รูปแบบนำเข้า | นำเข้าหลายรายการต่อครั้ง ผลรายแถว (upsert) + operation แก้/ยกเลิกรายการเดี่ยว | เหมาะกับข้อมูลทั้งภาคและตามรอย audit ก่อน-หลัง | 2026-10-08 |

## 11. คำถามค้างและสมมติฐาน

ไม่มีคำถามค้างที่รอผู้ใช้ตอบ สมมติฐานที่ยังไม่ได้รับการยืนยัน:

- _(ต้องการข้อมูลเพิ่มเติมจากผู้ใช้)_ ค่าตัวเลขของเกณฑ์เตือนและเกณฑ์เสนอชื่อ mentor (ในเอกสารเป็นตัวอย่างจาก AC เท่านั้น) และ SLA ของ moderation
- _(สมมติฐาน)_ ผู้ตรวจ/อนุมัติ mentor และผู้ตั้งค่าเกณฑ์/ภาค/นโยบายคือ admin ส่วนกลาง (architecture Q2); auditor เป็นคนละบัญชีกับ admin; 1 บัญชี 1 role
- _(สมมติฐาน)_ การปฏิเสธ nomination/ข้อความต้องมีเหตุผลและแสดงให้ผู้เกี่ยวข้อง; ผู้เรียนที่ไม่มีข้อมูลย้อนหลังพอ → ผลอ่านเป็น fallback (ครบเกณฑ์ขั้นต่ำพอดีถือว่าผ่าน)
- _(สมมติฐาน)_ ข้อความแชทเรียงต่อเนื่อง ไม่มี reply/thread; ทุกข้อความผ่าน pre-moderation (อนุมานจาก C-BR4); ผู้พ้นสถานภาพ (`ended`) เข้าใช้ไม่ได้ ยกเว้นยื่นคำร้องสิทธิ
- _(สมมติฐาน)_ audit เพิ่มเติมจาก spec 03: เปลี่ยนเกณฑ์/นโยบาย/ภาค, นำเข้า, ผลตรวจข้อความ, เผยแพร่ notice, purge
- _(สมมติฐาน)_ ข้อมูลเกรดรายวิชา/GPA สะสมถูกกำกับด้วยนโยบายเก็บถาวร ซึ่งกระทบ fulfil-data-subject-request (erase) และ run-retention-sweep _(ต้องให้สถาบันยืนยัน)_
- _(ต้องการข้อมูลเพิ่มเติมจากผู้ใช้)_ MFA ของบัญชีแอดมินอยู่ฝั่งสถาบันหรือใน Grade Runway (architecture §10)
- _(ยังไม่ระบุใน spec)_ การเพิ่ม/ถอนวิชาระหว่างภาค, การจัดลำดับแจ้งเตือนหลายเงื่อนไขเกินกว่าการรวม, SLA ของ moderation
- _(สมมติฐาน)_ spec 03 ไม่มี features list/journey/AC ใช้ User Stories + Business Rules

---
ย้อนกลับ: [[index|02-technical]] | ที่เกี่ยวข้อง: [[database-spec|Database Spec]]
