// ใส่ข้อมูลตัวอย่างลง Firestore: courses (5) และ terms (3) ด้วย Firebase Web SDK
// รัน: node scripts/seed-firestore.js [--dry-run]
// ต้องมี scripts/firebase-config.js (คัดลอกจาก firebase-config.example.js)

const dryRun = process.argv.includes("--dry-run");

// เวลา 00:00 ตามเวลาไทย (UTC+7)
const thaiMidnight = (ymd) => new Date(`${ymd}T00:00:00+07:00`);

const courses = [
  { course_id: "course-SE101", course_code: "SE101", name: "Introduction to Programming", is_active: true },
  { course_id: "course-SE201", course_code: "SE201", name: "Database Management Systems", is_active: true },
  { course_id: "course-SE202", course_code: "SE202", name: "Web Application Development", is_active: true },
  { course_id: "course-MA201", course_code: "MA201", name: "Linear Algebra", is_active: true },
  { course_id: "course-ST201", course_code: "ST201", name: "Statistics for Engineers", is_active: false },
];

const terms = [
  { term_id: "2568-2", term_code: "2/2568", start_date: thaiMidnight("2025-11-03"), end_date: thaiMidnight("2026-03-20"), is_current: false },
  { term_id: "2568-3", term_code: "3/2568", start_date: thaiMidnight("2026-04-06"), end_date: thaiMidnight("2026-06-12"), is_current: false },
  { term_id: "2569-1", term_code: "1/2569", start_date: thaiMidnight("2026-07-06"), end_date: thaiMidnight("2026-11-13"), is_current: true },
];

const schemas = {
  courses: { course_id: "string", course_code: "string", name: "string", is_active: "boolean" },
  terms: { term_id: "string", term_code: "string", start_date: "date", end_date: "date", is_current: "boolean" },
};

function typeOf(v) {
  return v instanceof Date ? "date" : typeof v;
}

function validate() {
  const errors = [];
  const collections = { courses, terms };
  for (const [name, docs] of Object.entries(collections)) {
    const schema = schemas[name];
    for (const d of docs) {
      const label = `${name}/${d[name === "courses" ? "course_id" : "term_id"]}`;
      for (const k of Object.keys(d)) {
        if (!(k in schema)) errors.push(`${label}: field เกินมา "${k}"`);
      }
      for (const [k, t] of Object.entries(schema)) {
        if (!(k in d)) errors.push(`${label}: ขาด field "${k}"`);
        else if (typeOf(d[k]) !== t || (t === "date" && isNaN(d[k]))) {
          errors.push(`${label}: field "${k}" ต้องเป็น ${t}`);
        }
      }
    }
  }
  for (const t of terms) {
    if (t.end_date < t.start_date) errors.push(`terms/${t.term_id}: end_date ก่อน start_date`);
  }
  const current = terms.filter((t) => t.is_current === true).length;
  if (current !== 1) errors.push(`is_current = true ต้องมีพอดี 1 เอกสาร (พบ ${current})`);
  return errors;
}

async function main() {
  const errors = validate();
  if (errors.length) {
    console.error("ตรวจสอบไม่ผ่าน ไม่เขียนอะไร:\n- " + errors.join("\n- "));
    process.exit(1);
  }

  if (dryRun) {
    const show = (docs) => docs.map((d) => JSON.parse(JSON.stringify(d)));
    console.log("[dry-run] courses:", JSON.stringify(show(courses), null, 2));
    console.log("[dry-run] terms:", JSON.stringify(show(terms), null, 2));
    console.log(`[dry-run] จะเขียน courses ${courses.length} เอกสาร, terms ${terms.length} เอกสาร (ไม่ได้เขียนจริง)`);
    return;
  }

  const { initializeApp } = require("firebase/app");
  const { getFirestore, writeBatch, doc, Timestamp } = require("firebase/firestore");
  const firebaseConfig = require("./firebase-config.js");

  const db = getFirestore(initializeApp(firebaseConfig));
  const batch = writeBatch(db);
  for (const c of courses) batch.set(doc(db, "courses", c.course_id), c);
  for (const t of terms) {
    batch.set(doc(db, "terms", t.term_id), {
      ...t,
      start_date: Timestamp.fromDate(t.start_date),
      end_date: Timestamp.fromDate(t.end_date),
    });
  }
  await batch.commit();

  console.log(`เขียน courses ${courses.length} เอกสาร, terms ${terms.length} เอกสาร`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
