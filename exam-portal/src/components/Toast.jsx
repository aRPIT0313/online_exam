import { useState } from "react";

let _addToast = () => {};

export function Toast() {
  const [list, setList] = useState([]);

  _addToast = (msg, type = "success") => {
    const id = Date.now();
    setList((l) => [...l, { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3000);
  };

  return (
    <div className="toast-fixed">
      {list.map((t) => (
        <div
          key={t.id}
          className={`alert alert-${
            t.type === "error" ? "danger" : t.type === "success" ? "success" : "info"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export const showToast = (msg, type) => _addToast(msg, type);
