from flask import Flask, render_template, request, jsonify
from utils import validate_nric, generate_barcode_base64
import os

app = Flask(__name__)

# Ensure static folder exists
if not os.path.exists('static'):
    os.makedirs('static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/validate', methods=['POST'])
def validate():
    data = request.json
    nric = data.get('nric', '').upper()
    
    is_valid, message = validate_nric(nric)
    
    response = {
        'valid': is_valid,
        'message': message,
        'barcode': None
    }
    
    if is_valid:
        barcode_b64 = generate_barcode_base64(nric)
        if barcode_b64:
            response['barcode'] = f"data:image/png;base64,{barcode_b64}"
            
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
