from flask_jwt_extended import jwt_required, get_jwt
from flask import Blueprint, request, send_file
from extensions import mongo
from utils.util import role_required
from bson.objectid import ObjectId
from bson.errors import InvalidId
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from datetime import datetime

teacher_bp = Blueprint("teacher", __name__, url_prefix="/teacher")


# -------------------------
# CREATE EXAM
# -------------------------
@teacher_bp.route("/create-exam", methods=["POST"])
@jwt_required()
@role_required("teacher")
def create_exam():
    data = request.json or {}

    if not data.get("title") or not data.get("description") or not data.get("duration_minutes"):
        return {"message": "Title, description and duration required"}, 400

    claims = get_jwt()

    exam = {
        "title": data["title"],
        "description": data["description"],
        "duration_minutes": int(data["duration_minutes"]),
        "created_by": claims["sub"],
        "questions": [],
        "assigned_students": [],
        "is_closed": False
    }

    exam_id = mongo.db.exams.insert_one(exam).inserted_id
    return {"message": "Exam created", "exam_id": str(exam_id)}, 201


# -------------------------
# ADD QUESTION
# -------------------------
@teacher_bp.route("/add-question/<exam_id>", methods=["POST"])
@jwt_required()
@role_required("teacher")
def add_question(exam_id):
    try:
        exam_obj_id = ObjectId(exam_id)
    except InvalidId:
        return {"message": "Invalid exam ID"}, 400

    if not mongo.db.exams.find_one({"_id": exam_obj_id}):
        return {"message": "Exam not found"}, 404

    data = request.json or {}
    required = ("question_text", "options", "answer", "marks")
    if not all(k in data for k in required):
        return {"message": "Incomplete question data"}, 400

    question = {
        "exam_id": exam_id,
        "question_text": data["question_text"],
        "options": data["options"],
        "answer": data["answer"],
        "marks": int(data["marks"])
    }

    qid = mongo.db.questions.insert_one(question).inserted_id

    mongo.db.exams.update_one(
        {"_id": exam_obj_id},
        {"$push": {"questions": str(qid)}}
    )

    return {"message": "Question added", "question_id": str(qid)}, 201


# -------------------------
# ASSIGN EXAM
# -------------------------
@teacher_bp.route("/assign-exam/<exam_id>", methods=["POST"])
@jwt_required()
@role_required("teacher")
def assign_exam(exam_id):
    try:
        exam_obj_id = ObjectId(exam_id)
    except InvalidId:
        return {"message": "Invalid exam ID"}, 400

    if not mongo.db.exams.find_one({"_id": exam_obj_id}):
        return {"message": "Exam not found"}, 404

    data = request.json or {}
    student_ids = data.get("student_ids", [])
    if not student_ids:
        return {"message": "No student IDs provided"}, 400

    valid_ids = []
    invalid_ids = []

    for sid in student_ids:
        try:
            sid_obj = ObjectId(sid)
            if mongo.db.users.find_one({"_id": sid_obj, "role": "student"}):
                valid_ids.append(str(sid_obj))
            else:
                invalid_ids.append(sid)
        except InvalidId:
            invalid_ids.append(sid)

    if not valid_ids:
        return {"message": "No valid students found"}, 400

    mongo.db.exams.update_one(
        {"_id": exam_obj_id},
        {"$addToSet": {"assigned_students": {"$each": valid_ids}}}
    )

    return {
        "message": "Exam assigned successfully",
        "assigned_count": len(valid_ids),
        "invalid_student_ids": invalid_ids
    }, 200


# -------------------------
# CLOSE EXAM
# -------------------------
@teacher_bp.route("/close-exam/<exam_id>", methods=["POST"])
@jwt_required()
@role_required("teacher")
def close_exam(exam_id):
    claims = get_jwt()
    teacher_id = claims["sub"]

    try:
        exam_obj_id = ObjectId(exam_id)
    except InvalidId:
        return {"message": "Invalid exam ID"}, 400

    exam = mongo.db.exams.find_one({"_id": exam_obj_id})
    if not exam:
        return {"message": "Exam not found"}, 404

    if exam.get("created_by") != teacher_id:
        return {"message": "You can only close your own exams"}, 403

    mongo.db.exams.update_one(
        {"_id": exam_obj_id},
        {"$set": {"is_closed": True}}
    )

    return {"message": "Exam closed successfully"}, 200


# -------------------------
# MY EXAMS
# -------------------------
@teacher_bp.route("/my-exams", methods=["GET"])
@jwt_required()
@role_required("teacher")
def my_exams():
    claims = get_jwt()
    teacher_id = claims["sub"]

    exams = mongo.db.exams.find({"created_by": teacher_id})

    return {
        "exams": [
            {
                "exam_id": str(e["_id"]),
                "title": e["title"],
                "duration_minutes": e["duration_minutes"],
                "is_closed": e.get("is_closed", False)
            }
            for e in exams
        ]
    }, 200


# -------------------------
# FIND STUDENT BY EMAIL
# -------------------------
@teacher_bp.route("/find-student", methods=["POST"])
@jwt_required()
@role_required("teacher")
def find_student():
    email = (request.json or {}).get("email", "").strip()
    if not email:
        return {"message": "Email required"}, 400

    student = mongo.db.users.find_one({"email": email, "role": "student"})
    if not student:
        return {"message": "No student found with this email"}, 404

    return {
        "student_id": str(student["_id"]),
        "name": student.get("name", ""),
        "email": student["email"]
    }, 200


# -------------------------
# LIST STUDENTS (only assigned to this teacher's exams)
# -------------------------
@teacher_bp.route("/students", methods=["GET"])
@jwt_required()
@role_required("teacher")
def list_students():
    claims = get_jwt()
    teacher_id = claims["sub"]

    teacher_exams = list(mongo.db.exams.find({"created_by": teacher_id}))

    student_ids = set()
    for exam in teacher_exams:
        for sid in exam.get("assigned_students", []):
            student_ids.add(sid)

    if not student_ids:
        return {"students": []}, 200

    output = []
    for sid in student_ids:
        try:
            student = mongo.db.users.find_one({"_id": ObjectId(sid), "role": "student"})
            if student:
                output.append({
                    "student_id": str(student["_id"]),
                    "name": student.get("name", ""),
                    "email": student["email"]
                })
        except Exception:
            continue

    return {"students": output}, 200


# -------------------------
# VIEW RESULTS
# -------------------------
@teacher_bp.route("/results/<exam_id>", methods=["GET"])
@jwt_required()
@role_required("teacher")
def view_results(exam_id):
    results = list(mongo.db.results.find({"exam_id": exam_id}))

    output = []
    for r in results:
        student = mongo.db.users.find_one({"_id": ObjectId(r["student_id"])})
        output.append({
            "student": student["name"] if student else "Unknown",
            "score": r["score"],
            "submitted_at": r["submitted_at"]
        })

    return {"results": output}, 200


# -------------------------
# DOWNLOAD RESULT PDF (ALL STUDENTS)
# -------------------------
@teacher_bp.route("/result-pdf/<exam_id>", methods=["GET"])
@jwt_required()
@role_required("teacher")
def download_exam_results_pdf(exam_id):
    try:
        exam_obj_id = ObjectId(exam_id)
    except InvalidId:
        return {"message": "Invalid exam ID"}, 400

    exam = mongo.db.exams.find_one({"_id": exam_obj_id})
    if not exam:
        return {"message": "Exam not found"}, 404

    results = list(mongo.db.results.find({"exam_id": exam_id}))
    if not results:
        return {"message": "No results available"}, 400

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Exam Results Report")
    y -= 20
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, y, f"Exam: {exam['title']}")
    y -= 30

    for idx, r in enumerate(results, start=1):
        student = mongo.db.users.find_one({"_id": ObjectId(r["student_id"])})

        if y < 150:
            pdf.showPage()
            y = height - 50

        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(50, y, f"{idx}. Student: {student['name'] if student else 'Unknown'}")
        y -= 15

        pdf.setFont("Helvetica", 10)
        pdf.drawString(60, y, f"Email: {student.get('email') if student else '-'}")
        y -= 15
        pdf.drawString(60, y, f"Score: {r['score']}")
        y -= 15
        pdf.drawString(
            60, y,
            f"Submitted At: {r['submitted_at'].strftime('%Y-%m-%d %H:%M:%S') if r['submitted_at'] else 'Not Submitted'}"
        )
        y -= 30

    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="exam_results.pdf",
        mimetype="application/pdf"
    )
