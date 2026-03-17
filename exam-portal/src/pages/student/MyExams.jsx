import { useState, useEffect } from "react";
import api from "../../api";
import { showToast } from "../../components/Toast";

function MyExams({ token, onStartExam }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    const r = await api("/student/my-exams", "GET", null, token);
    if (r.ok) setExams(r.data.exams || []);
    else showToast("Could not load exams", "error");
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleStart = async (exam) => {
    if (exam.is_closed) return showToast("This exam has been closed by the teacher", "error");

    setStarting(exam.exam_id);
    const r = await api(`/student/start/${exam.exam_id}`, "POST", null, token);

    if (r.ok) {
      showToast("Exam started! Good luck!");
      onStartExam(exam.exam_id, r.data.ends_at);
    } else if (r.status === 400) {
      // already started — use end_at from my-exams response (more reliable)
      showToast("Resuming your previous attempt...", "info");
      onStartExam(exam.exam_id, r.data.ends_at || exam.end_at);
    } else {
      showToast(r.data.message || "Error starting exam", "error");
    }
    setStarting(null);
  };

  const getStatusBadge = (exam) => {
    if (exam.status === "submitted") return <span className="badge badge-green">✔ Submitted</span>;
    if (exam.is_closed) return <span className="badge badge-red">🔒 Closed</span>;
    if (exam.status === "started") return <span className="badge badge-blue">⏳ In Progress</span>;
    return <span className="badge" style={{ background: "#fff3cd", color: "#856404" }}>📝 Not Started</span>;
  };

  return (
    <>
      <div className="page-title">My Exams</div>
      <div className="page-sub">Exams assigned to you by your teacher</div>

      {loading && <div className="empty-state">Loading your exams...</div>}

      {!loading && exams.length === 0 && (
        <div className="alert alert-info">
          ℹ️ No exams assigned yet. Please contact your teacher.
        </div>
      )}

      {!loading && exams.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Exam Title</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => (
                <tr key={exam.exam_id}>
                  <td>{i + 1}</td>
                  <td><strong>{exam.title}</strong></td>
                  <td style={{ color: "#666", fontSize: 12 }}>{exam.description}</td>
                  <td>{exam.duration_minutes} min</td>
                  <td>{getStatusBadge(exam)}</td>
                  <td>
                    {exam.status === "submitted" ? (
                      <span style={{ color: "#aaa", fontSize: 12 }}>Completed</span>
                    ) : exam.is_closed ? (
                      <span style={{ color: "#aaa", fontSize: 12 }}>Unavailable</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStart(exam)}
                        disabled={starting === exam.exam_id}
                      >
                        {starting === exam.exam_id
                          ? "Starting..."
                          : exam.status === "started"
                          ? "Resume Exam"
                          : "Start Exam"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default MyExams;
