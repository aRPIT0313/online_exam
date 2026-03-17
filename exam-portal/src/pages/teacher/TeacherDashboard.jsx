import { useState, useEffect } from "react";
import api from "../../api";

function TeacherDashboard({ token }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api("/teacher/students", "GET", null, token).then((r) => {
      if (r.ok) setStudents(r.data.students || []);
    });
  }, []);

  return (
    <>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Welcome back, Teacher!</div>

      <div className="row">
        <div className="col">
          <div className="stat-box">
            <div className="stat-num">{students.length}</div>
            <div className="stat-lbl">Total Students</div>
          </div>
        </div>
        <div className="col">
          <div className="stat-box" style={{ borderTopColor: "#27ae60" }}>
            <div className="stat-num" style={{ color: "#27ae60" }}>Active</div>
            <div className="stat-lbl">Portal Status</div>
          </div>
        </div>
        <div className="col">
          <div className="stat-box" style={{ borderTopColor: "#f39c12" }}>
            <div className="stat-num" style={{ color: "#f39c12" }}>v1.0</div>
            <div className="stat-lbl">Version</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">All Registered Students</div>
        {students.length === 0 ? (
          <div className="empty-state">No students found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.student_id}>
                  <td>{i + 1}</td>
                  <td>{s.name || "N/A"}</td>
                  <td>{s.email}</td>
                  <td style={{ fontSize: 11, fontFamily: "monospace" }}>{s.student_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default TeacherDashboard;
