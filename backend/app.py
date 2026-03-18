from flask import Flask, jsonify
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager
from extensions import mongo
import secrets
from routes.auth import auth_bp
from routes.teachers import teacher_bp
from routes.student import student_bp
from datetime import timedelta
from flask_cors import CORS 
load_dotenv()

app = Flask(__name__)
CORS(app)  
# -------------------------
# Configurations
# -------------------------
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

app.config["JWT_SECRET_KEY"] = "my_super_secret_key_for_testing"
app.config["JWT_ACCESS_TOKEN_EXPIRES"]=timedelta(hours=1)
# -------------------------
# Initialize extensions
# -------------------------
mongo.init_app(app)
jwt = JWTManager(app)

# -------------------------
# Routes
# -------------------------
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "Backend running"}), 200

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(teacher_bp)
app.register_blueprint(student_bp)

@app.route("/test")
def test():
    return {"message": "Server running!"}
# -------------------------
# Run Server
# -------------------------
if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)
    