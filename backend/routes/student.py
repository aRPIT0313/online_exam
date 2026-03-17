from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, request, send_file
from extensions import mongo
from utils.util import role_required
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

student_bp = Blueprint("student", __name__, url_prefix="/student")


# -------------------------
# MY EXAMS (assigned to this student)
# -------------------------
@student_bp.route("/my-exams", methods=["GET"])
@jwt_required()
@role_required("student")
def my_exams():
    student_id = get_jwt_identity()

    exams = mongo.db.exams.find({"assigned_students": student_id})

    output = []
    for exam in exams:
        result = mongo.db.results.find_one({
            "exam_id": str(exam["_id"]),
            "student_id": student_id
        })
        output.append({
            "exam_id": str(exam["_id"]),
            "title": exam["title"],
            "description": exam["description"],
            "duration_minutes": exam["duration_minutes"],
            "is_closed": exam.get("is_closed", False),
            # send end_at so frontend timer works on resume
            "end_at": result["end_at"].isoformat() if result and result.get("end_at") else None,
            "status": "submitted" if result and result["submitted_at"]
                      else "started" if result
                      else "not_started"
        })

    return {"exams": output}, 200


# -------------------------
# START EXAM
# -------------------------
@student_bp.route("/start/<exam_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def start_exam(exam_id):
    student_id = get_jwt_identity()

    exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        return {"message": "Invalid exam"}, 404

    if exam.get("is_closed"):
        return {"message": "This exam has been closed by the teacher"}, 403

    existing = mongo.db.results.find_one({"exam_id": exam_id, "student_id": student_id})
    if existing:
        # resume - send back the original end_at
        return {
            "message": "Exam already started",
            "ends_at": existing["end_at"].isoformat()
        }, 400

    started_at = datetime.utcnow()
    end_at = started_at + timedelta(minutes=exam["duration_minutes"])

    mongo.db.results.insert_one({
        "exam_id": exam_id,
        "student_id": student_id,
        "started_at": started_at,
        "end_at": end_at,
        "submitted_at": None,
        "score": 0,
        "answers": []
    })

    return {"message": "Exam started", "ends_at": end_at.isoformat()}, 200


# -------------------------
# VIEW QUESTIONS
# -------------------------
@student_bp.route("/questions/<exam_id>", methods=["GET"])
@jwt_required()
@role_required("student")
def get_questions(exam_id):
    student_id = get_jwt_identity()

    result = mongo.db.results.find_one({"exam_id": exam_id, "student_id": student_id})
    if not result:
        return {"message": "Exam not started"}, 400

    if result["submitted_at"]:
        return {"message": "Exam already submitted"}, 403

    if datetime.utcnow() >= result["end_at"]:
        mongo.db.results.update_one(
            {"_id": result["_id"]},
            {"$set": {"submitted_at": datetime.utcnow()}}
        )
        return {"message": "Time over. Exam auto-submitted."}, 403

    questions = mongo.db.questions.find({"exam_id": exam_id})
    return {
        "questions": [{
            "question_id": str(q["_id"]),
            "question_text": q["question_text"],
            "options": q["options"],
            "marks": q["marks"]
        } for q in questions]
    }, 200


# -------------------------
# SUBMIT EXAM
# -------------------------
@student_bp.route("/submit/<exam_id>", methods=["POST"])
@jwt_required()
@role_required("student")
def submit_exam(exam_id):
    student_id = get_jwt_identity()
    data = request.json.get("answers", [])

    result = mongo.db.results.find_one({"exam_id": exam_id, "student_id": student_id})
    if not result or result["submitted_at"]:
        return {"message": "Exam not active"}, 400

    # block submission if time is over
    if datetime.utcnow() > result["end_at"]:
        mongo.db.results.update_one(
            {"_id": result["_id"]},
            {"$set": {"submitted_at": datetime.utcnow()}}
        )
        return {"message": "Time is over. Exam has been auto-submitted."}, 403

    questions = list(mongo.db.questions.find({"exam_id": exam_id}))
    qmap = {str(q["_id"]): q for q in questions}

    score = 0
    breakdown = []

    for ans in data:
        q = qmap.get(ans["question_id"])
        if not q:
            continue

        correct = ans["answer"] == q["answer"]
        obtained = q["marks"] if correct else 0
        score += obtained

        breakdown.append({
            "question_id": ans["question_id"],
            "selected": ans["answer"],
            "correct": q["answer"],
            "marks_obtained": obtained,
            "total_marks": q["marks"]
        })

    mongo.db.results.update_one(
        {"_id": result["_id"]},
        {"$set": {
            "score": score,
            "answers": breakdown,
            "submitted_at": datetime.utcnow()
        }}
    )

    return {"message": "Exam submitted", "score": score}, 200


# -------------------------
# DOWNLOAD RESULT PDF
# -------------------------
@student_bp.route("/result-pdf/<exam_id>", methods=["GET"])
@jwt_required()
@role_required("student")
def download_pdf(exam_id):
    student_id = get_jwt_identity()
    result = mongo.db.results.find_one({"exam_id": exam_id, "student_id": student_id})

    if not result or not result["submitted_at"]:
        return {"message": "Result not available"}, 400

    exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
    student = mongo.db.users.find_one({"_id": ObjectId(student_id)})

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Exam Result")
    y -= 20
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, y, f"Exam: {exam['title']}")
    y -= 18
    pdf.drawString(50, y, f"Student: {student.get('name', 'N/A')} ({student.get('email', '')})")
    y -= 18
    pdf.drawString(50, y, f"Score: {result['score']}")
    y -= 18
    pdf.drawString(50, y, f"Submitted At: {result['submitted_at'].strftime('%Y-%m-%d %H:%M:%S')}")
    y -= 30

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(50, y, "Question-wise Breakdown:")
    y -= 20

    pdf.setFont("Helvetica", 10)
    for i, a in enumerate(result["answers"], start=1):
        if y < 80:
            pdf.showPage()
            y = height - 50
        pdf.drawString(50, y, f"Q{i}. Marks: {a['marks_obtained']}/{a['total_marks']}  |  Your answer: {a['selected']}  |  Correct: {a['correct']}")
        y -= 18

    pdf.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="result.pdf", mimetype="application/pdf")
