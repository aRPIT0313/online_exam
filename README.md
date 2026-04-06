# 📝 Online Exam Portal

A full-stack online examination platform with a Python backend and a React-based frontend (`exam-portal`). Students can take exams through a clean web interface, while the backend handles question management, submissions, and results.

---

## 🗂️ Project Structure

```
online_exam/
│
├── backend/              # Python backend (API server)
├── exam-portal/          # React frontend (exam UI)
├── .gitignore
└── README.md
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (JavaScript) |
| Backend | Python |
| Styling | CSS |
| Environment | `.env` for config, `venv` for Python |

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** (v14+) and **npm**
- **Python** (3.8+) and **pip**

---

### 1. Clone the Repository

```bash
git clone https://github.com/aRPIT0313/online_exam.git
cd online_exam
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env as needed

# Start the backend server
python app.py
```

The backend will run on `http://localhost:5000` by default.

---

### 3. Frontend Setup

```bash
cd exam-portal

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000` by default.

---

## 🖥️ Features

- Student-facing exam interface for taking online tests
- Question display with multiple choice or input-based answers
- Timed exam sessions
- Result submission and score display
- REST API backend for managing exams and student responses

---

## 📁 Environment Variables

Create a `.env` file in the `backend/` directory. Key variables typically include:

```
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
DEBUG=True
```

> Refer to `.env.example` (if provided) for all required variables.

---
## Results
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/login.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/reg.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/createexam.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/assignexam.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/selectstudent.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/listofstu.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/takeexam.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/examforstudent.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/submitans.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/stuseeres.png)
![Output](https://raw.githubusercontent.com/aRPIT0313/images/main/exam/teacviewres.png)
## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available for educational use.
