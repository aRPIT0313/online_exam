import { useState, useEffect, useRef } from "react";
import api from "../../api";
import { showToast } from "../../components/Toast";

function TakeExam({ token, examId, endsAt, onSubmit }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api(`/student/questions/${examId}`, "GET", null, token).then((r) => {
      if (r.ok) setQuestions(r.data.questions || []);
      else setError(r.data.message || "Failed to load questions");
    });
  }, []);

  useEffect(() => {
    // clear any previous timer
    if (timerRef.current) clearInterval(timerRef.current);

    if (!endsAt) {
      console.warn("TakeExam: endsAt is null/undefined — timer cannot start");
      return;
    }

    // backend returns ISO string like "2024-01-01T12:00:00.000000"
    // make sure it's treated as UTC — append Z if missing
    const normalized = endsAt.endsWith("Z") ? endsAt : endsAt + "Z";
    const endTime = new Date(normalized).getTime();

    console.log("TakeExam: endsAt raw =", endsAt);
    console.log("TakeExam: endTime =", endTime, "| now =", Date.now(), "| diff =", endTime - Date.now());

    if (isNaN(endTime)) {
      console.error("TakeExam: could not parse endsAt:", endsAt);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    };

    tick(); // fire immediately so UI shows correct time right away
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);
  }, [endsAt]);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleAutoSubmit = async () => {
    showToast("Time's up! Auto-submitting your exam...", "info");
    const payload = questions.map((q) => ({
      question_id: q.question_id,
      answer: answers[q.question_id] || "",
    }));
    const r = await api(`/student/submit/${examId}`, "POST", { answers: payload }, token);
    if (r.ok) {
      showToast(`Time up! Auto-submitted. Your score: ${r.data.score}`);
    } else {
      showToast("Auto-submit failed. Please contact teacher.", "error");
    }
    onSubmit();
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit? This cannot be undone!")) return;
    setSubmitting(true);
    const payload = questions.map((q) => ({
      question_id: q.question_id,
      answer: answers[q.question_id] || "",
    }));
    const r = await api(`/student/submit/${examId}`, "POST", { answers: payload }, token);
    if (r.ok) {
      showToast(`Submitted! Your score: ${r.data.score}`);
      onSubmit();
    } else {
      showToast(r.data.message || "Submission failed", "error");
    }
    setSubmitting(false);
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!questions.length) return <div className="empty-state">Loading questions... please wait</div>;

  const answered = Object.values(answers).filter(Boolean).length;
  const danger = timeLeft !== null && timeLeft < 120;

  return (
    <>
      <div className="timer-box">
        <span>
          ⏱ Time Remaining:{" "}
          <span className="timer-val" style={{ color: danger ? "#e74c3c" : "#333" }}>
            {timeLeft === null ? "Loading..." : timeLeft === 0 ? "00:00 — Time Up!" : fmt(timeLeft)}
          </span>
        </span>
        <span style={{ fontSize: 12, color: "#777" }}>
          Answered: {answered} / {questions.length}
        </span>
      </div>

      {questions.map((q, i) => (
        <div key={q.question_id} className="question-box">
          <div className="question-num">
            Question {i + 1} of {questions.length} &nbsp;|&nbsp; Marks: {q.marks}
          </div>
          <div className="question-text">{q.question_text}</div>
          {q.options.map((opt) => (
            <label
              key={opt}
              className={`option-row ${answers[q.question_id] === opt ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={q.question_id}
                value={opt}
                checked={answers[q.question_id] === opt}
                onChange={() => setAnswers((a) => ({ ...a, [q.question_id]: opt }))}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <div style={{ textAlign: "center", padding: "16px 0 40px" }}>
        <button
          className="btn btn-danger"
          style={{ padding: "10px 32px", fontSize: 15 }}
          onClick={handleSubmit}
          disabled={submitting || timeLeft === 0}
        >
          {submitting ? "Submitting..." : "SUBMIT EXAM"}
        </button>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
          Note: Once submitted you cannot change your answers
        </div>
      </div>
    </>
  );
}

export default TakeExam;
