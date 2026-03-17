import { useState } from "react";
import "./styles/main.css";

import { Toast } from "./components/Toast";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import LoginPage from "./pages/LoginPage";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateExam from "./pages/teacher/CreateExam";
import ViewResults from "./pages/teacher/ViewResults";

import StudentDashboard from "./pages/student/StudentDashboard";
import MyExams from "./pages/student/MyExams";
import TakeExam from "./pages/student/TakeExam";
import Results from "./pages/student/Results";

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [activeExam, setActiveExam] = useState(null); // { id, ends }

  const handleLogin = (t, r) => {
    setToken(t);
    setRole(r);
    setTab("dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setTab("dashboard");
    setActiveExam(null);
  };

  const handleStartExam = (id, ends) => {
    setActiveExam({ id, ends });
  };

  const handleFinishExam = () => {
    setActiveExam(null);
    setTab("results");
  };

  const handleSetTab = (t) => {
    setActiveExam(null);
    setTab(t);
  };

  // not logged in
  if (!token) {
    return (
      <>
        <Toast />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // student is taking exam - full screen mode
  if (activeExam) {
    return (
      <>
        <Toast />
        <Navbar role={role} />
        <div style={{ padding: 20, maxWidth: 760, margin: "0 auto" }}>
          <TakeExam
            token={token}
            examId={activeExam.id}
            endsAt={activeExam.ends}
            onSubmit={handleFinishExam}
          />
        </div>
      </>
    );
  }

  // main app with sidebar layout
  return (
    <>
      <Toast />
      <Navbar role={role} onLogout={handleLogout} />

      <div className="clearfix">
        <Sidebar role={role} tab={tab} setTab={handleSetTab} />

        <div className="content">
          {role === "teacher" && (
            <>
              {tab === "dashboard" && <TeacherDashboard token={token} />}
              {tab === "create"    && <CreateExam token={token} />}
              {tab === "exams"     && <ViewResults token={token} />}
              {tab === "students"  && <TeacherDashboard token={token} />}
            </>
          )}

          {role === "student" && (
            <>
              {tab === "dashboard" && <StudentDashboard onGoExams={() => setTab("exams")} />}
              {tab === "exams"     && <MyExams token={token} onStartExam={handleStartExam} />}
              {tab === "results"   && <Results token={token} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
