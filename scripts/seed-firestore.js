// ใส่ข้อมูลตัวอย่าง (ปลอมทั้งหมด) ลง Firestore ด้วย Firebase Web SDK
// คอลเลกชัน: users, courses, terms, enrollments, chatRooms (+messages), mentorRequests, mentorCriteria
// รัน: node scripts/seed-firestore.js [--dry-run]
// ต้องมี scripts/firebase-config.js (คัดลอกจาก firebase-config.example.js)
// ชื่อ field/ชนิด/enum อยู่ที่ scripts/firestore-schema.js (ที่เดียว)

const { enums, gradeScale, schemas } = require("./firestore-schema");

// เวลาตามเวลาไทย (UTC+7)
const th = (s) => new Date(`${s}+07:00`);

// ---------- ข้อมูลตัวอย่าง (ปลอมทั้งหมด ไม่ใช้ชื่อ/รหัสจริง) ----------

const ADMIN = "user-admin01";
const ADMIN_NAME = "ผู้ดูแลระบบ ตัวอย่าง";

const users = {
  [ADMIN]: { name: ADMIN_NAME, role: "admin" },
  "user-s01": { name: "ตัวอย่าง เอ", student_code: "990000001", role: "student", gpa: 3.82 },
  "user-s02": { name: "ตัวอย่าง บี", student_code: "990000002", role: "student", gpa: 3.45 },
  "user-s03": { name: "ตัวอย่าง ซี", student_code: "990000003", role: "student", gpa: 2.9 },
  "user-s04": { name: "ตัวอย่าง ดี", student_code: "990000004", role: "student", gpa: 3.6 },
  "user-s05": { name: "ตัวอย่าง อี", student_code: "990000005", role: "student", gpa: 3.1 },
};

const courses = {
  "course-SE101": { code: "SE101", name: "Introduction to Programming" },
  "course-SE201": { code: "SE201", name: "Database Management Systems" },
  "course-SE202": { code: "SE202", name: "Web Application Development" },
  "course-MA201": { code: "MA201", name: "Linear Algebra" },
  "course-ST201": { code: "ST201", name: "Statistics for Engineers" },
};

const terms = {
  "2568-2": { name: "2/2568", is_current: false },
  "2568-3": { name: "3/2568", is_current: false },
  "2569-1": { name: "1/2569", is_current: true },
};

// [user, course, term, เกรด]
const enrollmentRows = [
  ["user-s01", "course-SE101", "2569-1", "A"],
  ["user-s01", "course-SE201", "2569-1", "A"],
  ["user-s01", "course-SE202", "2569-1", "B+"],
  ["user-s01", "course-MA201", "2568-3", "A"],
  ["user-s02", "course-SE101", "2569-1", "B"],
  ["user-s02", "course-SE201", "2569-1", "B+"],
  ["user-s03", "course-SE101", "2569-1", "C+"],
  ["user-s03", "course-SE202", "2569-1", "B"],
  ["user-s04", "course-SE201", "2569-1", "A"],
  ["user-s04", "course-SE202", "2569-1", "A"],
  ["user-s05", "course-MA201", "2568-3", "B"], // ไม่มีวิชาในภาคปัจจุบัน (ไว้ทดสอบ empty state)
];
const enrollments = {};
for (const [u, c, t, g] of enrollmentRows) {
  enrollments[`enr-${u}-${c}-${t}`] = {
    user_id: u,
    course_id: c,
    term_id: t,
    grade_letter: g,
    grade_point: gradeScale[g],
    course_code: courses[c].code,
    course_name: courses[c].name,
  };
}

const mentorCriteria = {
  "course-SE101": { course_id: "course-SE101", criteria_type: "grade", min_label: "A", min_point: 4.0, updated_by_id: ADMIN, updated_by_name: ADMIN_NAME, updated_at: th("2026-07-20T10:00:00") },
  "course-SE201": { course_id: "course-SE201", criteria_type: "gpa", min_label: "3.50", min_point: 3.5, updated_by_id: ADMIN, updated_by_name: ADMIN_NAME, updated_at: th("2026-07-20T10:05:00") },
  "course-SE202": { course_id: "course-SE202", criteria_type: "grade", min_label: "B+", min_point: 3.5, updated_by_id: ADMIN, updated_by_name: ADMIN_NAME, updated_at: th("2026-07-20T10:10:00") },
};

// สร้างคำขอจากผู้ใช้/วิชา/สถานะ (metric และ criteria อิงข้อมูลข้างบน แล้วให้ validate ตรวจซ้ำ)
function mentorRequest({ user, course, status, metricType, reason }) {
  const u = users[user];
  const crit = mentorCriteria[course];
  const enr = enrollments[`enr-${user}-${course}-2569-1`];
  const isGrade = metricType === "grade";
  const metricPoint = isGrade ? enr.grade_point : u.gpa;
  const doc = {
    user_id: user,
    user_name: u.name,
    student_code: u.student_code,
    course_id: course,
    course_code: courses[course].code,
    course_name: courses[course].name,
    term_id: "2569-1",
    status,
    auto_check: metricPoint >= crit.min_point ? "pass" : "fail",
    metric_type: metricType,
    metric_label: isGrade ? enr.grade_letter : u.gpa.toFixed(2),
    metric_point: metricPoint,
    criteria_type: crit.criteria_type,
    criteria_label: crit.min_label,
    criteria_point: crit.min_point,
    created_at: th("2026-10-08T09:00:00"),
  };
  if (status !== "pending") {
    doc.reviewed_by_id = ADMIN;
    doc.reviewed_by_name = ADMIN_NAME;
    doc.reviewed_at = th("2026-10-09T11:00:00");
  }
  if (status === "rejected") doc.rejection_reason = reason;
  return doc;
}

const mentorRequests = {
  "req-se101-s01": mentorRequest({ user: "user-s01", course: "course-SE101", status: "approved", metricType: "grade" }),
  "req-se201-s01": mentorRequest({ user: "user-s01", course: "course-SE201", status: "pending", metricType: "gpa" }),
  "req-se202-s03": mentorRequest({
    user: "user-s03",
    course: "course-SE202",
    status: "rejected",
    metricType: "grade",
    reason: "เกรดวิชานี้ยังไม่ถึงเกณฑ์ B+ ที่ประกาศไว้ในปัจจุบัน",
  }),
  "req-se201-s04": mentorRequest({ user: "user-s04", course: "course-SE201", status: "pending", metricType: "gpa" }),
  "req-se202-s04": mentorRequest({ user: "user-s04", course: "course-SE202", status: "approved", metricType: "grade" }),
};

function message(course, author, text, status, created, extra = {}) {
  const doc = { course_id: course, author_id: author, author_name: users[author].name, text, status, created_at: th(created) };
  if (status !== "pending") {
    doc.reviewed_by_id = ADMIN;
    doc.reviewed_by_name = ADMIN_NAME;
    doc.reviewed_at = th(extra.reviewed);
  }
  if (status === "rejected") doc.rejection_reason = extra.reason;
  return doc;
}

// messages[course_id][message_id]
const messages = {
  "course-SE101": {
    "msg-se101-01": message("course-SE101", "user-s02", "ช่วงสอบกลางภาค ควรเริ่มทบทวนบทไหนก่อนดีคะ", "published", "2026-10-10T09:14:00", { reviewed: "2026-10-10T09:18:00" }),
    "msg-se101-02": message("course-SE101", "user-s01", "ลองไล่ทำโจทย์ท้ายบทของสัปดาห์ที่ 1-4 ก่อนนะ แล้วค่อยย้อนดูข้อที่ผิด", "published", "2026-10-10T09:20:00", { reviewed: "2026-10-10T09:24:00" }),
    "msg-se101-03": message("course-SE101", "user-s03", "ขอบคุณมากครับ จะลองทำตามดู", "published", "2026-10-10T09:25:00", { reviewed: "2026-10-10T09:30:00" }),
    "msg-se101-04": message("course-SE101", "user-s03", "มีสรุปโน้ตแจกไหมครับ", "pending", "2026-10-11T08:02:00"),
  },
  "course-SE201": {
    "msg-se201-01": message("course-SE201", "user-s02", "ยังไม่มีผู้แนะนำ ขอถามไว้ก่อนนะคะ ควรเริ่มทบทวนเรื่อง normalization ตรงไหนดี", "pending", "2026-10-11T19:40:00"),
  },
  "course-SE202": {
    "msg-se202-01": message("course-SE202", "user-s04", "แนะนำให้ฝึกทำ mini project เล็ก ๆ ทุกสัปดาห์ จะเห็นภาพรวมเร็วขึ้น", "published", "2026-10-09T14:05:00", { reviewed: "2026-10-09T14:20:00" }),
    "msg-se202-02": message("course-SE202", "user-s03", "ใครมีเฉลยข้อสอบเก่าบ้าง ขอหน่อย", "rejected", "2026-10-10T16:30:00", {
      reviewed: "2026-10-10T17:00:00",
      reason: "ข้อความขอเฉลยข้อสอบไม่เหมาะสมกับห้องแชทนี้ กรุณาถามเรื่องแนวทางการเรียนแทน",
    }),
    "msg-se202-03": message("course-SE202", "user-s01", "ส่วน API ควรอ่านเอกสารประกอบก่อนเรียนไหมคะ", "published", "2026-10-11T10:12:00", { reviewed: "2026-10-11T10:30:00" }),
  },
};

const chatRooms = {
  "course-SE101": {
    course_code: "SE101",
    course_name: courses["course-SE101"].name,
    mentor_count: 1,
    last_message_text: messages["course-SE101"]["msg-se101-03"].text,
    last_message_sender_name: users["user-s03"].name,
    last_message_at: th("2026-10-10T09:25:00"),
    created_at: th("2026-07-06T00:00:00"),
  },
  "course-SE201": {
    course_code: "SE201",
    course_name: courses["course-SE201"].name,
    mentor_count: 0,
    created_at: th("2026-07-06T00:00:00"),
  },
  "course-SE202": {
    course_code: "SE202",
    course_name: courses["course-SE202"].name,
    mentor_count: 1,
    last_message_text: messages["course-SE202"]["msg-se202-03"].text,
    last_message_sender_name: users["user-s01"].name,
    last_message_at: th("2026-10-11T10:12:00"),
    created_at: th("2026-07-06T00:00:00"),
  },
};

// ---------- ตรวจก่อนเขียน ----------

const typeOk = {
  string: (v) => typeof v === "string" && v.trim() !== "",
  number: (v) => typeof v === "number" && Number.isFinite(v),
  boolean: (v) => typeof v === "boolean",
  date: (v) => v instanceof Date && !isNaN(v),
};

function checkDocs(label, docs, schema, errors) {
  for (const [id, d] of Object.entries(docs)) {
    const where = `${label}/${id}`;
    for (const k of Object.keys(d)) {
      if (!(k in schema)) errors.push(`${where}: field เกินมา "${k}"`);
    }
    for (const [k, spec] of Object.entries(schema)) {
      if (!(k in d) || d[k] === undefined) {
        if (!spec.optional) errors.push(`${where}: ขาด field "${k}"`);
        continue;
      }
      if (!typeOk[spec.type](d[k])) errors.push(`${where}: field "${k}" ต้องเป็น ${spec.type}`);
      else if (spec.enum && !spec.enum.includes(d[k])) errors.push(`${where}: field "${k}" ค่า "${d[k]}" ไม่อยู่ใน [${spec.enum.join(", ")}]`);
    }
  }
}

function validate() {
  const errors = [];
  const E = (m) => errors.push(m);

  checkDocs("users", users, schemas.users, errors);
  checkDocs("courses", courses, schemas.courses, errors);
  checkDocs("terms", terms, schemas.terms, errors);
  checkDocs("enrollments", enrollments, schemas.enrollments, errors);
  checkDocs("chatRooms", chatRooms, schemas.chatRooms, errors);
  checkDocs("mentorRequests", mentorRequests, schemas.mentorRequests, errors);
  checkDocs("mentorCriteria", mentorCriteria, schemas.mentorCriteria, errors);
  for (const [cid, docs] of Object.entries(messages)) checkDocs(`chatRooms/${cid}/messages`, docs, schemas.messages, errors);

  // terms
  const current = Object.values(terms).filter((t) => t.is_current === true).length;
  if (current !== 1) E(`terms: is_current = true ต้องมีพอดี 1 เอกสาร (พบ ${current})`);

  // users
  for (const [id, u] of Object.entries(users)) {
    if (u.role === "student" && (u.student_code === undefined || u.gpa === undefined)) E(`users/${id}: นักศึกษาต้องมี student_code และ gpa`);
    if (u.gpa !== undefined && (u.gpa < 0 || u.gpa > 4)) E(`users/${id}: gpa ต้องอยู่ช่วง 0-4`);
  }
  const codes = Object.values(users).map((u) => u.student_code).filter(Boolean);
  for (const c of codes) {
    if (!c.startsWith("99")) E(`users: student_code "${c}" ต้องขึ้นต้นด้วย 99 (ช่วงรหัสปลอม)`);
  }
  if (new Set(codes).size !== codes.length) E("users: student_code ซ้ำกัน");

  // enrollments
  const enrollmentKeys = new Set();
  for (const [id, e] of Object.entries(enrollments)) {
    if (!users[e.user_id]) E(`enrollments/${id}: ไม่พบ user_id "${e.user_id}"`);
    if (!courses[e.course_id]) E(`enrollments/${id}: ไม่พบ course_id "${e.course_id}"`);
    if (!terms[e.term_id]) E(`enrollments/${id}: ไม่พบ term_id "${e.term_id}"`);
    const c = courses[e.course_id];
    if (c && (e.course_code !== c.code || e.course_name !== c.name)) E(`enrollments/${id}: course_code/course_name ไม่ตรงกับ courses`);
    if (e.grade_point !== gradeScale[e.grade_letter]) E(`enrollments/${id}: grade_point ไม่ตรงกับ grade_letter`);
    enrollmentKeys.add(`${e.user_id}|${e.course_id}|${e.term_id}`);
  }
  const currentTermId = Object.keys(terms).find((t) => terms[t].is_current);

  // mentorCriteria
  for (const [id, m] of Object.entries(mentorCriteria)) {
    if (m.course_id !== id) E(`mentorCriteria/${id}: course_id ต้องเท่ากับ doc id`);
    if (!courses[id]) E(`mentorCriteria/${id}: ไม่พบวิชา`);
    const expected = m.criteria_type === "grade" ? gradeScale[m.min_label] : Number(m.min_label);
    if (m.min_point !== expected) E(`mentorCriteria/${id}: min_point ไม่ตรงกับ min_label`);
    if (users[m.updated_by_id]?.role !== "admin" || users[m.updated_by_id].name !== m.updated_by_name) E(`mentorCriteria/${id}: updated_by ต้องเป็นแอดมินและชื่อตรงกับ users`);
  }

  // mentorRequests
  const approvedByCourse = {};
  for (const [id, r] of Object.entries(mentorRequests)) {
    const u = users[r.user_id];
    if (!u) { E(`mentorRequests/${id}: ไม่พบ user_id "${r.user_id}"`); continue; }
    if (r.user_name !== u.name || r.student_code !== u.student_code) E(`mentorRequests/${id}: user_name/student_code ไม่ตรงกับ users`);
    const c = courses[r.course_id];
    if (!c) E(`mentorRequests/${id}: ไม่พบ course_id "${r.course_id}"`);
    else if (r.course_code !== c.code || r.course_name !== c.name) E(`mentorRequests/${id}: course_code/course_name ไม่ตรงกับ courses`);
    if (!terms[r.term_id]) E(`mentorRequests/${id}: ไม่พบ term_id "${r.term_id}"`);
    if (!enrollmentKeys.has(`${r.user_id}|${r.course_id}|${r.term_id}`)) E(`mentorRequests/${id}: ผู้ใช้ไม่ได้ลงทะเบียนวิชา/ภาคนี้`);

    const enr = enrollments[`enr-${r.user_id}-${r.course_id}-${r.term_id}`];
    if (r.metric_type === "grade" && enr && (r.metric_point !== enr.grade_point || r.metric_label !== enr.grade_letter)) E(`mentorRequests/${id}: metric ไม่ตรงกับเกรดใน enrollments`);
    if (r.metric_type === "gpa" && (r.metric_point !== u.gpa || r.metric_label !== u.gpa.toFixed(2))) E(`mentorRequests/${id}: metric ไม่ตรงกับ gpa ของผู้ใช้`);

    const crit = mentorCriteria[r.course_id];
    if (crit && (r.criteria_type !== crit.criteria_type || r.criteria_label !== crit.min_label || r.criteria_point !== crit.min_point)) E(`mentorRequests/${id}: criteria_* ไม่ตรงกับ mentorCriteria`);
    if (r.metric_type !== r.criteria_type) E(`mentorRequests/${id}: metric_type ต้องตรงกับ criteria_type`);
    if (r.auto_check !== (r.metric_point >= r.criteria_point ? "pass" : "fail")) E(`mentorRequests/${id}: auto_check ไม่ตรงกับผลเทียบ metric_point/criteria_point`);

    const reviewed = r.status !== "pending";
    for (const k of ["reviewed_by_id", "reviewed_by_name", "reviewed_at"]) {
      if (reviewed && r[k] === undefined) E(`mentorRequests/${id}: สถานะ ${r.status} ต้องมี ${k}`);
      if (!reviewed && r[k] !== undefined) E(`mentorRequests/${id}: สถานะ pending ต้องไม่มี ${k}`);
    }
    if (r.status === "rejected" && r.rejection_reason === undefined) E(`mentorRequests/${id}: สถานะ rejected ต้องมี rejection_reason`);
    if (r.status !== "rejected" && r.rejection_reason !== undefined) E(`mentorRequests/${id}: rejection_reason ใช้ได้เฉพาะสถานะ rejected`);
    if (reviewed && users[r.reviewed_by_id]?.role !== "admin") E(`mentorRequests/${id}: reviewed_by_id ต้องเป็นแอดมิน`);
    if (reviewed && users[r.reviewed_by_id]?.name !== r.reviewed_by_name) E(`mentorRequests/${id}: reviewed_by_name ไม่ตรงกับ users`);
    if (r.status === "approved") approvedByCourse[r.course_id] = (approvedByCourse[r.course_id] || 0) + 1;
  }

  // chatRooms + messages
  for (const [cid, room] of Object.entries(chatRooms)) {
    const c = courses[cid];
    if (!c) { E(`chatRooms/${cid}: ไม่พบวิชา`); continue; }
    if (room.course_code !== c.code || room.course_name !== c.name) E(`chatRooms/${cid}: course_code/course_name ไม่ตรงกับ courses`);
    if (room.mentor_count !== (approvedByCourse[cid] || 0)) E(`chatRooms/${cid}: mentor_count (${room.mentor_count}) ไม่เท่าจำนวนคำขอ approved (${approvedByCourse[cid] || 0})`);

    const msgs = messages[cid] || {};
    const published = Object.values(msgs).filter((m) => m.status === "published").sort((a, b) => b.created_at - a.created_at);
    const last = published[0];
    const lastFields = ["last_message_text", "last_message_sender_name", "last_message_at"];
    if (!last) {
      for (const k of lastFields) if (room[k] !== undefined) E(`chatRooms/${cid}: ไม่มีข้อความ published แต่มี ${k}`);
    } else if (room.last_message_text !== last.text || room.last_message_sender_name !== last.author_name || +room.last_message_at !== +last.created_at) {
      E(`chatRooms/${cid}: last_message_* ไม่ตรงกับข้อความ published ล่าสุด`);
    }
  }
  for (const [cid, msgs] of Object.entries(messages)) {
    if (!chatRooms[cid]) E(`messages: ไม่พบห้อง chatRooms/${cid}`);
    for (const [id, m] of Object.entries(msgs)) {
      const where = `chatRooms/${cid}/messages/${id}`;
      if (m.course_id !== cid) E(`${where}: course_id ต้องเท่ากับห้อง`);
      const a = users[m.author_id];
      if (!a) E(`${where}: ไม่พบ author_id "${m.author_id}"`);
      else if (a.name !== m.author_name) E(`${where}: author_name ไม่ตรงกับ users`);
      if (!enrollmentKeys.has(`${m.author_id}|${cid}|${currentTermId}`)) E(`${where}: ผู้เขียนไม่ได้ลงทะเบียนวิชานี้ในภาคปัจจุบัน`);

      const reviewed = m.status !== "pending";
      for (const k of ["reviewed_by_id", "reviewed_by_name", "reviewed_at"]) {
        if (reviewed && m[k] === undefined) E(`${where}: สถานะ ${m.status} ต้องมี ${k}`);
        if (!reviewed && m[k] !== undefined) E(`${where}: สถานะ pending ต้องไม่มี ${k}`);
      }
      if (m.status === "rejected" && m.rejection_reason === undefined) E(`${where}: สถานะ rejected ต้องมี rejection_reason`);
      if (m.status !== "rejected" && m.rejection_reason !== undefined) E(`${where}: rejection_reason ใช้ได้เฉพาะสถานะ rejected`);
      if (reviewed && users[m.reviewed_by_id]?.role !== "admin") E(`${where}: reviewed_by_id ต้องเป็นแอดมิน`);
      if (reviewed && users[m.reviewed_by_id]?.name !== m.reviewed_by_name) E(`${where}: reviewed_by_name ไม่ตรงกับ users`);
      if (reviewed && m.reviewed_at < m.created_at) E(`${where}: reviewed_at ก่อน created_at`);
    }
  }

  // ต้องครอบคลุมทุกสถานะที่หน้าจอแสดง
  const seen = (vals, expected, label) => {
    for (const v of expected) if (!vals.includes(v)) E(`ข้อมูลตัวอย่างไม่ครอบคลุม ${label} = ${v}`);
  };
  seen(Object.values(mentorRequests).map((r) => r.status), enums.requestStatus, "mentorRequests.status");
  seen(Object.values(messages).flatMap((m) => Object.values(m)).map((m) => m.status), enums.messageStatus, "messages.status");

  return errors;
}

// ---------- รวมเป็นรายการเอกสารที่จะเขียน ----------

function allDocs() {
  const list = [];
  const add = (path, data) => list.push({ path, data });
  for (const [id, d] of Object.entries(users)) add(["users", id], d);
  for (const [id, d] of Object.entries(courses)) add(["courses", id], d);
  for (const [id, d] of Object.entries(terms)) add(["terms", id], d);
  for (const [id, d] of Object.entries(enrollments)) add(["enrollments", id], d);
  for (const [id, d] of Object.entries(chatRooms)) add(["chatRooms", id], d);
  for (const [cid, msgs] of Object.entries(messages)) for (const [id, d] of Object.entries(msgs)) add(["chatRooms", cid, "messages", id], d);
  for (const [id, d] of Object.entries(mentorRequests)) add(["mentorRequests", id], d);
  for (const [id, d] of Object.entries(mentorCriteria)) add(["mentorCriteria", id], d);
  return list;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const errors = validate();
  if (errors.length) {
    console.error("ตรวจสอบไม่ผ่าน ไม่เขียนอะไร:\n- " + errors.join("\n- "));
    process.exit(1);
  }

  const docs = allDocs();
  const counts = {};
  for (const { path } of docs) {
    const key = path.length === 2 ? path[0] : `${path[0]}/${path[2]}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const summary = Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(", ");

  if (dryRun) {
    for (const { path, data } of docs) console.log(`[dry-run] ${path.join("/")}`, JSON.stringify(data));
    console.log(`[dry-run] จะเขียน ${docs.length} เอกสาร: ${summary} (ไม่ได้เขียนจริง)`);
    return;
  }

  const { initializeApp } = require("firebase/app");
  const { getFirestore, writeBatch, doc, Timestamp } = require("firebase/firestore");
  const firebaseConfig = require("./firebase-config.js");
  if (!firebaseConfig.projectId) throw new Error("firebase-config.js ยังไม่ได้ใส่ projectId");
  console.log(`จะเขียนลงโปรเจกต์: ${firebaseConfig.projectId}`);

  const db = getFirestore(initializeApp(firebaseConfig));
  const toStored = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v instanceof Date ? Timestamp.fromDate(v) : v]));
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    for (const { path, data } of docs.slice(i, i + 400)) batch.set(doc(db, ...path), toStored(data));
    await batch.commit();
  }

  console.log(`เขียน ${docs.length} เอกสาร: ${summary}`);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { validate, data: { users, courses, terms, enrollments, chatRooms, messages, mentorRequests, mentorCriteria } };
