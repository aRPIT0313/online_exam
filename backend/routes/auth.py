from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token , verify_jwt_in_request,get_jwt,get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import mongo
from functools import wraps

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

ALLOWED_ROLES = ["student", "teacher", "admin"]

def role_required(*roles):
    """Use as @role_required('admin', 'teacher')"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"message": "Access forbidden"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# -------------------------
# REGISTER
# -------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()

    # Basic validation
    if not all(k in data for k in ("email", "password", "role")):
        return jsonify({"message": "Missing required fields"}), 400

    if data["role"] not in ALLOWED_ROLES:
        return jsonify({"message": "Invalid role"}), 400

    # Check existing user
    if mongo.db.users.find_one({"email": data["email"]}):
        return jsonify({"message": "User already exists"}), 400

    user = {
        "name": data.get("name", ""),
        "email": data["email"],
        "password": generate_password_hash(data["password"]),
        "role": data["role"]
    }

    mongo.db.users.insert_one(user)

    return jsonify({"message": "User registered successfully"}), 201


# -------------------------
# LOGIN
# -------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()

    if not all(k in data for k in ("email", "password")):
        return jsonify({"message": "Missing required fields"}), 400

    user = mongo.db.users.find_one({"email": data["email"]})

    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": user["role"]}
    )

    return jsonify({
        "access_token": access_token,
        "role": user["role"]
    }), 200


@auth_bp.route("/admin-dashboard", methods=["GET"])
@role_required("admin")
def admin_dashboard():
    user_id = get_jwt_identity()
    return {"message": f"Welcome Admin! User ID: {user_id}"}, 200

@auth_bp.route("/teacher-dashboard", methods=["GET"])
@role_required("teacher")
def teacher_dashboard():
    user_id = get_jwt_identity()
    return {"message": f"Welcome Teacher! User ID: {user_id}"}, 200

@auth_bp.route("/student-dashboard", methods=["GET"])
@role_required("student")
def student_dashboard():
    user_id = get_jwt_identity()
    return {"message": f"Welcome Student! User ID: {user_id}"}, 200

@auth_bp.route("/common-dashboard", methods=["GET"])
@role_required("admin", "teacher", "student")
def common_dashboard():
    user_id = get_jwt_identity()
    claims = get_jwt()
    return {
        "message": f"Hello {claims['role'].capitalize()}! User ID: {user_id}"
    }, 200