# Backlog

รายการ backlog ที่แตกออกมาจากเอกสาร requirement ใน [[01-spec/index|01-spec]] เรียงจาก **ใหม่ไปเก่า** (แถวล่าสุดอยู่บนสุด) แต่ละแถวจะถูกเพิ่มโดยอัตโนมัติเมื่อมีการสร้าง/แก้ไขเอกสาร requirement

| วันที่ | Requirement | สรุปหัวข้อ | สถานะ |
|---|---|---|---|
| 2026-08-25 | [[01-spec/20260825-03-logging-pdpa-compliance\|การเก็บ Log กิจกรรมและการปฏิบัติตาม PDPA]] | Audit logging ทั่วระบบ + การปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (สิทธิเจ้าของข้อมูล, ระยะเวลาเก็บข้อมูล, breach notification) | New (มีแค่ spec) |
| 2026-08-25 | [[01-spec/20260825-02-high-grade-peer-review-chat\|ช่องแชทรีวิวและแนะนำวิธีการเรียนจากนักศึกษาเกรดสูง]] | ห้องแชทกลุ่มแยกตามรายวิชา ให้นักศึกษาเกรดสูง (ผ่านการอนุมัติจากแอดมิน) แนะนำวิธีการเรียน โดยข้อความต้องผ่าน pre-moderation | Test Planned (มี prototype v1 แล้ว) |
| 2026-08-25 | [[01-spec/20260825-01-personalized-learning-reminder\|ระบบเตือนและแนะนำแนวทางการเรียนส่วนบุคคล]] | ระบบเตือน+แนะนำแนวทางการเรียนเฉพาะบุคคลสำหรับนักเรียน/นักศึกษา (ออกแบบให้ configurable เผื่อขยายไปบริบทอื่นในอนาคต) | Test Planned (ยังไม่มี prototype) |

## ความหมายของสถานะ

สถานะบอกขั้นล่าสุดที่เอกสารของ requirement นั้นทำไปถึงแล้ว ตามลำดับงานใน vault
- **New**: มีเอกสาร spec แล้ว แต่ยังไม่ได้แตก features list/user journey
- **Designed**: มี features list และ user journey แล้ว (ใน [[../02-design/01-prototypes/index|01-prototypes]])
- **Test Planned**: มี Acceptance Criteria และ Test Plan แล้ว (ใน [[../03-testing/01-test-plan/index|01-test-plan]])
- **Tested**: มีผลการทดสอบจริงแล้ว (ใน [[../03-testing/02-test-result/index|02-test-result]])
- **Superseded**: ถูกแทนที่ด้วย requirement ฉบับใหม่ (ระบุลิงก์ฉบับใหม่ในวงเล็บ)
