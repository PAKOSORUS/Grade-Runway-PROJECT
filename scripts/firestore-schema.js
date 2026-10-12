// schema ของ Firestore (source of truth ของชื่อ field ชนิด และค่า enum)
// seed-firestore.js ใช้ไฟล์นี้ตรวจก่อนเขียน ถ้าจะอ่านเขียน field ในที่อื่น ให้ใช้ชื่อจากไฟล์นี้
//
// ชนิด: string | number | boolean | date
// optional: true = ไม่มี field นี้ได้ (เช่น ยังไม่ผ่านการตรวจ)

const enums = {
  userRole: ["student", "admin"],
  messageStatus: ["pending", "published", "rejected"],
  requestStatus: ["pending", "approved", "rejected"],
  criteriaType: ["grade", "gpa"],
  autoCheck: ["pass", "fail"],
};

// ตารางแปลงเกรดตัวอักษรเป็นแต้ม (สมมติฐานมาตรฐานทั่วไป ต้องยืนยันกับมหาวิทยาลัย)
const gradeScale = { A: 4.0, "B+": 3.5, B: 3.0, "C+": 2.5, C: 2.0, "D+": 1.5, D: 1.0, F: 0 };

const schemas = {
  users: {
    name: { type: "string" },
    student_code: { type: "string", optional: true },
    role: { type: "string", enum: enums.userRole },
    gpa: { type: "number", optional: true },
  },
  courses: {
    code: { type: "string" },
    name: { type: "string" },
  },
  terms: {
    name: { type: "string" },
    is_current: { type: "boolean" },
  },
  enrollments: {
    user_id: { type: "string" },
    course_id: { type: "string" },
    term_id: { type: "string" },
    grade_letter: { type: "string", enum: Object.keys(gradeScale) },
    grade_point: { type: "number" },
    course_code: { type: "string" },
    course_name: { type: "string" },
  },
  chatRooms: {
    course_code: { type: "string" },
    course_name: { type: "string" },
    mentor_count: { type: "number" },
    last_message_text: { type: "string", optional: true },
    last_message_sender_name: { type: "string", optional: true },
    last_message_at: { type: "date", optional: true },
    created_at: { type: "date" },
  },
  // subcollection: chatRooms/{course_id}/messages
  messages: {
    course_id: { type: "string" },
    author_id: { type: "string" },
    author_name: { type: "string" },
    text: { type: "string" },
    status: { type: "string", enum: enums.messageStatus },
    rejection_reason: { type: "string", optional: true },
    reviewed_by_id: { type: "string", optional: true },
    reviewed_by_name: { type: "string", optional: true },
    reviewed_at: { type: "date", optional: true },
    created_at: { type: "date" },
  },
  mentorRequests: {
    user_id: { type: "string" },
    user_name: { type: "string" },
    student_code: { type: "string" },
    course_id: { type: "string" },
    course_code: { type: "string" },
    course_name: { type: "string" },
    term_id: { type: "string" },
    status: { type: "string", enum: enums.requestStatus },
    auto_check: { type: "string", enum: enums.autoCheck },
    metric_type: { type: "string", enum: enums.criteriaType },
    metric_label: { type: "string" },
    metric_point: { type: "number" },
    criteria_type: { type: "string", enum: enums.criteriaType },
    criteria_label: { type: "string" },
    criteria_point: { type: "number" },
    rejection_reason: { type: "string", optional: true },
    reviewed_by_id: { type: "string", optional: true },
    reviewed_by_name: { type: "string", optional: true },
    reviewed_at: { type: "date", optional: true },
    created_at: { type: "date" },
  },
  mentorCriteria: {
    course_id: { type: "string" },
    criteria_type: { type: "string", enum: enums.criteriaType },
    min_label: { type: "string" },
    min_point: { type: "number" },
    updated_by_id: { type: "string" },
    updated_by_name: { type: "string" },
    updated_at: { type: "date" },
  },
};

module.exports = { enums, gradeScale, schemas };
