from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ML service running (MOCK MODE)'}), 200

@app.route('/encode-face', methods=['POST'])
def encode_face():
    """Mock endpoint - simulates face encoding extraction"""
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo provided'}), 400
    
    # Generate random 128-dimensional encoding
    encoding = [random.uniform(-1, 1) for _ in range(128)]
    
    return jsonify({
        'success': True,
        'encoding': encoding,
        'message': 'Face detected and encoded (MOCK)'
    }), 200

@app.route('/match-faces', methods=['POST'])
def match_faces():
    """Mock endpoint - simulates face matching"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Get enrolled students from request
    enrolled_students = data.get('enrolled_students', [])
    
    # Simulate: randomly match some students
    num_matches = min(len(enrolled_students), random.randint(3, len(enrolled_students)))
    
    matches = []
    matched_ids = random.sample(range(len(enrolled_students)), num_matches)
    
    for idx in matched_ids:
        student = enrolled_students[idx]
        matches.append({
            'student_id': student.get('student_id'),
            'name': student.get('name'),
            'confidence': round(random.uniform(0.7, 0.99), 2)
        })
    
    return jsonify({
        'success': True,
        'detected_count': num_matches,
        'matches': matches,
        'message': 'Face matching complete (MOCK)'
    }), 200

if __name__ == '__main__':
    print('🤖 ML Service running in MOCK MODE')
    print('⚠️  Replace with real face recognition later')
    app.run(port=5001, debug=True)