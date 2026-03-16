from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
import logging
import tempfile
import os

from deepface import DeepFace

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

MODEL      = "Facenet"          # fast + accurate; swap to "ArcFace" for higher accuracy
BACKEND    = "opencv"           # detector: opencv | retinaface | mtcnn
THRESHOLD  = 0.40               # cosine distance threshold (lower = stricter)


def save_temp(file_storage):
    """Save uploaded FileStorage to a temp file and return its path."""
    suffix = os.path.splitext(file_storage.filename or "img.jpg")[1] or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    file_storage.save(tmp.name)
    return tmp.name


# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ML service running", "model": MODEL})


# ── Encode single face ────────────────────────────────────────────────────────
@app.route("/encode-face", methods=["POST"])
def encode_face():
    if "photo" not in request.files:
        return jsonify({"success": False, "message": "No photo uploaded"}), 400

    path = save_temp(request.files["photo"])
    try:
        result = DeepFace.represent(
            img_path=path,
            model_name=MODEL,
            detector_backend=BACKEND,
            enforce_detection=True
        )
        # DeepFace returns a list; expect exactly one face
        if len(result) == 0:
            return jsonify({"success": False, "message": "No face detected"}), 400
        if len(result) > 1:
            return jsonify({"success": False, "message": "Multiple faces detected — use a solo photo"}), 400

        encoding = result[0]["embedding"]
        return jsonify({"success": True, "encoding": encoding})

    except ValueError as e:
        return jsonify({"success": False, "message": "No face detected"}), 400
    except Exception as e:
        logging.exception("Encode error")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        os.unlink(path)


# ── Match faces in classroom photo ───────────────────────────────────────────
@app.route("/match-faces", methods=["POST"])
def match_faces():
    if "photo" not in request.files:
        return jsonify({"success": False, "message": "Photo required"}), 400

    students_json = request.form.get("enrolled_students")
    if not students_json:
        return jsonify({"success": False, "message": "enrolled_students required"}), 400

    enrolled = json.loads(students_json)
    if not enrolled:
        return jsonify({"success": True, "matches": [], "detected_count": 0}), 200

    path = save_temp(request.files["photo"])
    try:
        # Get embeddings for every face in the classroom photo
        detected = DeepFace.represent(
            img_path=path,
            model_name=MODEL,
            detector_backend=BACKEND,
            enforce_detection=False   # don't crash if 0 faces
        )

        if not detected:
            return jsonify({"success": False, "message": "No faces detected in photo"}), 400

        detected_count = len(detected)
        detected_embeddings = [np.array(d["embedding"]) for d in detected]

        # Build known embeddings list
        known = []
        for s in enrolled:
            if "encoding" in s and s["encoding"]:
                known.append({
                    "student_id": s["student_id"],
                    "name": s["name"],
                    "vec": np.array(s["encoding"])
                })

        matches = []
        matched_ids = set()

        for det_vec in detected_embeddings:
            best_dist = float("inf")
            best_student = None

            for k in known:
                if k["student_id"] in matched_ids:
                    continue
                # Cosine distance
                a, b = det_vec, k["vec"]
                cos_dist = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10)
                if cos_dist < best_dist:
                    best_dist = cos_dist
                    best_student = k

            if best_student and best_dist < THRESHOLD:
                confidence = round(float(1 - best_dist), 3)
                matches.append({
                    "student_id": best_student["student_id"],
                    "name": best_student["name"],
                    "confidence": confidence
                })
                matched_ids.add(best_student["student_id"])

        return jsonify({
            "success": True,
            "detected_count": detected_count,
            "matches": matches,
            "unmatched_faces": detected_count - len(matches)
        })

    except Exception as e:
        logging.exception("Match error")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        os.unlink(path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"🤖 ML Service (DeepFace) running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
