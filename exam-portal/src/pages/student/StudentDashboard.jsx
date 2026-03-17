function StudentDashboard({ onGoExams }) {
  return (
    <>
      <div className="page-title">Student Dashboard</div>
      <div className="page-sub">Welcome to the Online Exam Portal!</div>

      <div className="alert alert-info">
        ℹ️ Get your Exam ID from your teacher and click "My Exams" to start.
      </div>

      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-title">How to Attempt Exam?</div>
            <ol style={{ paddingLeft: 18, lineHeight: 2, fontSize: 13 }}>
              <li>Get Exam ID from your teacher</li>
              <li>Click on "My Exams" in the sidebar</li>
              <li>Enter the exam ID and click Start</li>
              <li>Answer all questions before time ends</li>
              <li>Click the Submit button</li>
              <li>Download result PDF from Results page</li>
            </ol>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onGoExams}>
              Go to My Exams →
            </button>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-title">Important Notes</div>
            <ul style={{ paddingLeft: 18, lineHeight: 2, fontSize: 13, color: "#555" }}>
              <li>Do not refresh page during exam</li>
              <li>Exam auto-submits when time ends</li>
              <li>Each question may have different marks</li>
              <li>Once submitted, you cannot re-attempt</li>
            </ul>
            <div className="alert alert-danger" style={{ marginTop: 12, fontSize: 12 }}>
              ⚠️ Contact teacher if you face any technical issues.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;
