
from autocorrect import AutoCorrect
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Initialize and train the autocorrect model
corrector = AutoCorrect()

# Training data - you can expand this
training_text = """
The quick brown fox jumps over the lazy dog. Programming is fun and rewarding.
Python is a versatile programming language. JavaScript makes web pages interactive.
Common spelling mistakes include recieve, seperate, occured, and accomodate.
"""
corrector.train(training_text)

@app.route('/correct', methods=['POST'])
def correct_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        corrected_text = corrector.correct_text(text)
        original_words = text.split()
        corrected_words = corrected_text.split()
        
        corrections = []
        for orig, corr in zip(original_words, corrected_words):
            if orig.lower() != corr.lower():
                corrections.append({
                    'original': orig,
                    'corrected': corr
                })
        
        return jsonify({
            'corrected_text': corrected_text,
            'corrections': corrections,
            'correction_count': len(corrections)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)