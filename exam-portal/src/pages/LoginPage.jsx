import { useState } from "react";
import api from "../api";
import { showToast } from "../components/Toast";

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "student" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);

    if (mode === "login") {
      const r = await api("/auth/login", "POST", {
        email: form.email,
        password: form.password,
      });
      if (r.ok) {
        showToast("Login successful!");
        onLogin(r.data.access_token, r.data.role);
      } else {
        showToast(r.data.message || "Login failed", "error");
      }
    } else {
      const r = await api("/auth/register", "POST", form);
      if (r.ok) {
        showToast("Registered! Please login.");
        setMode("login");
      } else {
        showToast(r.data.message || "Registration failed", "error");
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-title">📝 Exam Portal</div>
        <div className="login-sub">Online Examination System — v1.0</div>

        {mode === "register" && (
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={form.name} onChange={set("name")} placeholder="Enter full name" />
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input className="form-control" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            className="form-control"
            type="password"
            value={form.password}
            onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
          />
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label>Register As</label>
            <select className="form-control" value={form.role} onChange={set("role")}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        <hr />

        <div style={{ textAlign: "center" }}>
          {mode === "login" ? "New user? " : "Already have account? "}
          <span className="toggle-link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Register here" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
