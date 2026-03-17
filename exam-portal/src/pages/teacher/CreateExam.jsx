import { useState } from "react";
import api from "../../api";
import { showToast } from "../../components/Toast";

function CreateExam({ token }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", duration_minutes: "" });
  const [examId, setExamId] = useState(null);
  const [q, setQ] = useState({ question_text: "", options: ["", "", "", ""], answer: "", marks: "1" });
  const [added, setAdded] = useState([]);
  const [loading, setLoading] = useState(false);

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setOption = (i, v) =>
    setQ((prev) => {
      const opts = [...prev.options];
      opts[i] = v;
      return { ...prev, options: opts };
    });

  const handleCreateExam = async () => {
    if (!form.title || !form.description || !form.duration_minutes) {
      return showToast("Please fill all fields", "error");
    }
    setLoading(true);
    const r = await api("/teacher/create-exam", "POST", form, token);
    if (r.ok) {
      setExamId(r.data.exam_id);
      setStep(2);
      showToast("Exam created! Now add questions.");
    } else {
      showToast(r.data.message || "Something went wrong", "error");
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!q.question_text || q.options.some((o) => !o) || !q.answer || !q.marks) {
      return showToast("Fill all question fields", "error");
    }
    if (!q.options.includes(q.answer)) {
      return showToast("Correct answer must match one of the options", "error");
    }
    setLoading(true);
    const r = await api(`/teacher/add-question/${examId}`, "POST", q, token);
    if (r.ok) {
      setAdded((prev) => [...prev, { ...q }]);
      setQ({ question_text: "", options: ["", "", "", ""], answer: "", marks: "1" });
      showToast("Question added!");
    } else {
      showToast(r.data.message || "Error adding question", "error");
    }
    setLoading(false);
  };

  const handleFinish = () => {
    setStep(1);
    setForm({ title: "", description: "", duration_minutes: "" });
    setExamId(null);
    setAdded([]);
    showToast("Exam setup complete!", "success");
  };

  return (
    <>
      <div className="page-title">{step === 1 ? "Create New Exam" : "Add Questions"}</div>
      <div className="page-sub">
        {step === 1 ? "Fill exam details below" : `Exam ID: ${examId}`}
      </div>

      {step === 1 && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card-title">Exam Details</div>

          <div className="form-group">
            <label>Exam Title *</label>
            <input className="form-control" value={form.title} onChange={setField("title")} placeholder="e.g. Unit Test 1 - Physics" />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={setField("description")} placeholder="Short description of the exam..." />
          </div>
          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input className="form-control" type="number" min="1" value={form.duration_minutes} onChange={setField("duration_minutes")} placeholder="e.g. 60" />
          </div>

          <button className="btn btn-primary btn-block" onClick={handleCreateExam} disabled={loading}>
            {loading ? "Creating..." : "Create Exam & Add Questions →"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="row">
          <div className="col">
            <div className="card">
              <div className="card-title">New Question</div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea className="form-control" rows={3} value={q.question_text} onChange={(e) => setQ({ ...q, question_text: e.target.value })} placeholder="Type your question here..." />
              </div>

              {q.options.map((o, i) => (
                <div className="form-group" key={i}>
                  <label>Option {String.fromCharCode(65 + i)} *</label>
                  <input className="form-control" value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}

              <div className="form-group">
                <label>Correct Answer *</label>
                <select className="form-control" value={q.answer} onChange={(e) => setQ({ ...q, answer: e.target.value })}>
                  <option value="">-- Select correct option --</option>
                  {q.options.filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Marks *</label>
                <input className="form-control" type="number" min="1" value={q.marks} onChange={(e) => setQ({ ...q, marks: e.target.value })} />
              </div>

              <button className="btn btn-success btn-block" onClick={handleAddQuestion} disabled={loading}>
                {loading ? "Adding..." : "Add Question"}
              </button>
            </div>
          </div>

          <div className="col">
            <div className="card">
              <div className="card-title">Added Questions ({added.length})</div>

              {added.length === 0 && (
                <div className="empty-state">No questions added yet.</div>
              )}

              {added.map((a, i) => (
                <div key={i} style={{ borderLeft: "3px solid #3a3f9e", paddingLeft: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#888" }}>Q{i + 1} · {a.marks} mark(s)</div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>{a.question_text}</div>
                  <div style={{ fontSize: 11, color: "#27ae60", marginTop: 3 }}>✔ {a.answer}</div>
                </div>
              ))}

              {added.length > 0 && (
                <button className="btn btn-warning btn-block" onClick={handleFinish}>
                  ✔ Finish &amp; Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateExam;
