import { useState, useEffect } from "react";
import api from "../../api";
import { API } from "../../api";
import { showToast } from "../../components/Toast";

function ViewResults({ token }) {
  const [myExams, setMyExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [closing, setClosing] = useState(null);

  // assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignExamId, setAssignExamId] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [foundStudent, setFoundStudent] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchMyExams = async () => {
    const r = await api("/teacher/my-exams", "GET", null, token);
    if (r.ok) setMyExams(r.data.exams || []);
  };

  useEffect(() => { fetchMyExams(); }, []);

  useEffect(() => {
    if (!selectedExamId) { setResults(null); return; }
    setLoadingResults(true);
    api(`/teacher/results/${selectedExamId}`, "GET", null, token).then((r) => {
      if (r.ok) setResults(r.data.results || []);
      else showToast(r.data.message || "Error loading results", "error");
      setLoadingResults(false);
    });
  }, [selectedExamId]);

  const handleCloseExam = async (examId) => {
    if (!window.confirm("Are you sure you want to close this exam? Students won't be able to start it anymore.")) return;
    setClosing(examId);
    const r = await api(`/teacher/close-exam/${examId}`, "POST", null, token);
    if (r.ok) {
      showToast("Exam closed successfully!");
      fetchMyExams(); // refresh list
      if (selectedExamId === examId) setSelectedExamId("");
    } else {
      showToast(r.data.message || "Could not close exam", "error");
    }
    setClosing(null);
  };

  // PDF for teacher also needs token
  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`${API}/teacher/result-pdf/${selectedExamId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { showToast("PDF download failed", "error"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exam_results.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("PDF downloaded!");
    } catch {
      showToast("PDF download failed", "error");
    }
  };

  const handleFindStudent = async () => {
    if (!emailInput.trim()) return showToast("Enter student email", "error");
    if (studentList.find((s) => s.email === emailInput.trim()))
      return showToast("Student already added", "error");
    setSearching(true);
    setFoundStudent(null);
    const r = await api("/teacher/find-student", "POST", { email: emailInput.trim() }, token);
    if (r.ok) { setFoundStudent(r.data); showToast(`Found: ${r.data.name || r.data.email}`); }
    else showToast(r.data.message || "Student not found", "error");
    setSearching(false);
  };

  const handleAddToList = () => {
    if (!foundStudent) return;
    setStudentList((prev) => [...prev, foundStudent]);
    setFoundStudent(null);
    setEmailInput("");
  };

  const handleRemove = (id) => setStudentList((prev) => prev.filter((s) => s.student_id !== id));

  const handleAssign = async () => {
    if (!assignExamId) return showToast("Please select an exam", "error");
    if (!studentList.length) return showToast("Add at least one student", "error");
    setAssigning(true);
    const r = await api(
      `/teacher/assign-exam/${assignExamId}`,
      "POST",
      { student_ids: studentList.map((s) => s.student_id) },
      token
    );
    if (r.ok) {
      showToast(`Assigned to ${r.data.assigned_count} student(s)!`);
      setShowAssign(false);
      setStudentList([]);
      setAssignExamId("");
    } else {
      showToast(r.data.message || "Assignment failed", "error");
    }
    setAssigning(false);
  };

  const openAssign = () => {
    setShowAssign(true);
    setStudentList([]);
    setFoundStudent(null);
    setEmailInput("");
    setAssignExamId("");
  };

  const selectedExam = myExams.find((e) => e.exam_id === selectedExamId);

  return (
    <>
      <div className="page-title">View Results</div>
      <div className="page-sub">Select an exam to see results</div>

      {/* exam list table */}
      <div className="card">
        <div className="card-title">My Exams</div>
        {myExams.length === 0 ? (
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            ℹ️ No exams found. Please create an exam first.
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Duration</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {myExams.map((ex, i) => (
                <tr key={ex.exam_id}>
                  <td>{i + 1}</td>
                  <td><strong>{ex.title}</strong></td>
                  <td>{ex.duration_minutes} min</td>
                  <td>
                    {ex.is_closed
                      ? <span className="badge badge-red">🔒 Closed</span>
                      : <span className="badge badge-green">✔ Active</span>}
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedExamId(ex.exam_id)}
                    >
                      View Results
                    </button>
                    {!ex.is_closed && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCloseExam(ex.exam_id)}
                        disabled={closing === ex.exam_id}
                      >
                        {closing === ex.exam_id ? "Closing..." : "Close Exam"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="btn btn-warning" onClick={openAssign}>Assign Exam</button>
        </div>
      </div>

      {/* results panel */}
      {selectedExamId && (
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Results — {selectedExam?.title}</span>
            <button className="btn btn-success btn-sm" onClick={handleDownloadPDF}>⬇ Download PDF</button>
          </div>

          {loadingResults && <div className="empty-state">Loading...</div>}

          {!loadingResults && results && (
            results.length === 0 ? (
              <div className="empty-state">No submissions yet.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>#</th><th>Student Name</th><th>Score</th><th>Submitted At</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{r.student}</td>
                      <td><strong>{r.score}</strong></td>
                      <td style={{ fontSize: 12 }}>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "-"}</td>
                      <td>
                        <span className={`badge ${r.submitted_at ? "badge-green" : "badge-red"}`}>
                          {r.submitted_at ? "Submitted" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      {/* assign modal */}
      {showAssign && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAssign(false)}>
          <div className="modal-box">
            <div className="modal-title">Assign Exam to Students</div>

            <div className="form-group">
              <label>Select Exam *</label>
              <select className="form-control" value={assignExamId} onChange={(e) => setAssignExamId(e.target.value)}>
                <option value="">-- Select an exam --</option>
                {myExams.filter(e => !e.is_closed).map((ex) => (
                  <option key={ex.exam_id} value={ex.exam_id}>{ex.title}</option>
                ))}
              </select>
            </div>

            <hr />

            <div className="form-group">
              <label>Search Student by Email</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-control"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@example.com"
                  onKeyDown={(e) => e.key === "Enter" && handleFindStudent()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleFindStudent} disabled={searching}>
                  {searching ? "..." : "Search"}
                </button>
              </div>
            </div>

            {foundStudent && (
              <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span>✔ <strong>{foundStudent.name || "Student"}</strong> ({foundStudent.email})</span>
                <button className="btn btn-success btn-sm" onClick={handleAddToList}>+ Add</button>
              </div>
            )}

            {studentList.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: "#555", marginBottom: 6 }}>
                  Students to assign ({studentList.length}):
                </div>
                {studentList.map((s) => (
                  <div key={s.student_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee", fontSize: 13 }}>
                    <span>{s.name || s.email} <span style={{ color: "#aaa", fontSize: 11 }}>({s.email})</span></span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s.student_id)}>✕ Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={assigning || !studentList.length || !assignExamId}
              >
                {assigning ? "Assigning..." : `Assign to ${studentList.length} Student(s)`}
              </button>
              <button className="btn btn-danger" onClick={() => setShowAssign(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewResults;
