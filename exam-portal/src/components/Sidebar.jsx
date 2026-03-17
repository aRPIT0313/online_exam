const TEACHER_LINKS = [
  { id: "dashboard", label: "🏠 Dashboard" },
  { id: "create",    label: "➕ Create Exam" },
  { id: "exams",     label: "📋 View Results" },
  { id: "students",  label: "👥 Students" },
];

const STUDENT_LINKS = [
  { id: "dashboard", label: "🏠 Dashboard" },
  { id: "exams",     label: "📝 My Exams" },
  { id: "results",   label: "📊 Results" },
];

function Sidebar({ role, tab, setTab }) {
  const links = role === "teacher" ? TEACHER_LINKS : STUDENT_LINKS;

  return (
    <div className="sidebar">
      {links.map((l) => (
        <a
          key={l.id}
          className={tab === l.id ? "active" : ""}
          onClick={() => setTab(l.id)}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

export default Sidebar;
