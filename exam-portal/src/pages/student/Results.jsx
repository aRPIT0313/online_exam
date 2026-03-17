import { useState, useEffect } from "react";
import api from "../../api";
import { API } from "../../api";
import { showToast } from "../../components/Toast";

function Results({ token }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api("/student/my-exams", "GET", null, token).then((r) => {
      if (r.ok) {
        const submitted = (r.data.exams || []).filter((e) => e.status === "submitted");
        setExams(submitted);
      } else {
        showToast("Could not load results", "error");
      }
      setLoading(false);
    });
  }, []);

  // PDF needs token — window.open won't send Authorization header
  // so we fetch manually and create a blob URL
  const handleDownload = async (examId, title) => {
    setDownloading(examId);
    try {
      const res = await fetch(`${API}/student/result-pdf/${examId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.message || "Download failed", "error");
        setDownloading(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result_${title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Result downloaded!");
    } catch (e) {
      showToast("Download failed", "error");
    }
    setDownloading(null);
  };

  return (
    <>
      <div className="page-title">My Results</div>
      <div className="page-sub">Results of your submitted exams</div>

      {loading && <div className="empty-state">Loading results...</div>}

      {!loading && exams.length === 0 && (
        <div className="alert alert-info">
          ℹ️ No submitted exams yet. Results will appear here after you submit an exam.
        </div>
      )}

      {!loading && exams.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Exam Title</th>
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
                  <td>{exam.duration_minutes} min</td>
                  <td><span className="badge badge-green">✔ Submitted</span></td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleDownload(exam.exam_id, exam.title)}
                      disabled={downloading === exam.exam_id}
                    >
                      {downloading === exam.exam_id ? "Downloading..." : "⬇ Download Result"}
                    </button>
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

export default Results;
