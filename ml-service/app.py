from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import logging
import json

# -------------------------------
# App Initialization
# -------------------------------
app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

MATCH_THRESHOLD = 0.6
MAX_FACES_ALLOWED = 50


# -------------------------------
# Health Check
# -------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ML service running"
    })


# -------------------------------
# Detect Faces API
# -------------------------------
@app.route("/detect-faces", methods=["POST"])
def detect_faces():
    try:
        if "photo" not in request.files:
            return jsonify({
                "success": False,
                "message": "No image uploaded"
            }), 400

        file = request.files["photo"]

        image = face_recognition.load_image_file(file)

        face_locations = face_recognition.face_locations(image)

        faces = []
        for (top, right, bottom, left) in face_locations:
            faces.append({
                "top": top,
                "right": right,
                "bottom": bottom,
                "left": left
            })

        return jsonify({
            "success": True,
            "face_count": len(face_locations),
            "faces": faces
        })

    except Exception as e:
        logging.exception("Detect faces error")
        return jsonify({
            "success": False,
            "message": "Face detection failed",
            "error": str(e)
        }), 500


# -------------------------------
# Encode Face API
# -------------------------------
@app.route("/encode-face", methods=["POST"])
def encode_face():
    try:
        if "photo" not in request.files:
            return jsonify({
                "success": False,
                "message": "No photo uploaded"
            }), 400

        file = request.files["photo"]

        image = face_recognition.load_image_file(file)

        face_locations = face_recognition.face_locations(image)

        if len(face_locations) == 0:
            return jsonify({
                "success": False,
                "message": "No face detected"
            }), 400

        if len(face_locations) > 1:
            return jsonify({
                "success": False,
                "message": "Multiple faces detected"
            }), 400

        encodings = face_recognition.face_encodings(
            image,
            face_locations
        )

        encoding_list = encodings[0].tolist()

        return jsonify({
            "success": True,
            "encoding": encoding_list
        })

    except Exception as e:
        logging.exception("Encoding error")
        return jsonify({
            "success": False,
            "message": "Face encoding failed",
            "error": str(e)
        }), 500


# -------------------------------
# Match Faces API
# -------------------------------
@app.route("/match-faces", methods=["POST"])
def match_faces():
    try:
        logging.info("Match faces request")

        if "photo" not in request.files:
            return jsonify({
                "success": False,
                "message": "Photo required"
            }), 400

        students_json = request.form.get("enrolled_students")

        if not students_json:
            return jsonify({
                "success": False,
                "message": "Enrolled students data required"
            }), 400

        enrolled_students = json.loads(students_json)

        image = face_recognition.load_image_file(
            request.files["photo"]
        )

        face_locations = face_recognition.face_locations(image)

        detected_count = len(face_locations)

        if detected_count == 0:
            return jsonify({
                "success": False,
                "message": "No faces detected"
            }), 400

        if detected_count > MAX_FACES_ALLOWED:
            return jsonify({
                "success": False,
                "message": "Too many faces"
            }), 400

        detected_encodings = face_recognition.face_encodings(
            image,
            face_locations
        )

        known_encodings = []
        known_students = []

        for s in enrolled_students:
            if "encoding" in s:
                known_encodings.append(
                    np.array(s["encoding"])
                )
                known_students.append(s)

        matches = []
        matched_ids = set()

        for enc in detected_encodings:

            distances = face_recognition.face_distance(
                known_encodings,
                enc
            )

            if len(distances) == 0:
                continue

            best_index = np.argmin(distances)
            best_distance = distances[best_index]

            if best_distance < MATCH_THRESHOLD:
                student = known_students[best_index]

                confidence = float(1 - best_distance)

                matches.append({
                    "student_id": student["student_id"],
                    "name": student["name"],
                    "confidence": round(confidence, 3)
                })

                matched_ids.add(student["student_id"])

        unmatched_faces = detected_count - len(matches)

        return jsonify({
            "success": True,
            "detected_count": detected_count,
            "matches": matches,
            "unmatched_faces": unmatched_faces
        })

    except Exception as e:
        logging.exception("Matching error")
        return jsonify({
            "success": False,
            "message": "Face matching failed",
            "error": str(e)
        }), 500


# -------------------------------
# Run Server
# -------------------------------
if __name__ == "__main__":
    print("🤖 ML Service Running on 5001")
    app.run(host="0.0.0.0", port=5001, debug=True)