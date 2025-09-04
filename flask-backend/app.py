from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import numpy as np
import requests 
from bs4 import BeautifulSoup 
import os

app = Flask(__name__)
CORS(app)

try:
    model = joblib.load('model.joblib')
    vectorizer = joblib.load('vectorizer.joblib')
    print("Model and vectorizer loaded successfully.")
except FileNotFoundError:
    print("Error: model.joblib or vectorizer.joblib not found.")
    exit()

nltk.download('stopwords')
port_stem = PorterStemmer()

def stemming(content):
    stemmed_content = re.sub('[^a-zA-Z]', ' ', content)
    stemmed_content = stemmed_content.lower()
    stemmed_content = stemmed_content.split()
    stemmed_content = [port_stem.stem(word) for word in stemmed_content if not word in stopwords.words('english')]
    stemmed_content = ' '.join(stemmed_content)
    return stemmed_content

def perform_analysis(text_input):
    """Takes raw text and returns the analysis result."""
    processed_text = stemming(text_input)
    vectorized_text = vectorizer.transform([processed_text])
    probabilities = model.predict_proba(vectorized_text)
    
    prediction = np.argmax(probabilities)
    confidence = np.max(probabilities)
    sentiment = 'Positive' if prediction == 1 else 'Negative'

    return {
        'prediction': int(prediction),
        'sentiment': sentiment,
        'confidence': float(confidence)
    }

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Invalid input, "text" field is required.'}), 400

    text_input = data['text']
    result = perform_analysis(text_input)
    return jsonify(result)

@app.route('/analyze-url', methods=['POST'])
def analyze_url():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'Invalid input, "url" field is required.'}), 400
    
    url = data['url']
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() 

        soup = BeautifulSoup(response.content, 'html.parser')
        
        paragraphs = soup.find_all('p')
        if not paragraphs:
            return jsonify({'error': 'Could not find any text content on this page.'}), 400

        scraped_text = ' '.join([p.get_text() for p in paragraphs])
        
        result = perform_analysis(scraped_text)
        return jsonify(result)

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"Failed to fetch URL: {e}"}), 400
    except Exception as e:
        return jsonify({'error': f"An error occurred: {e}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
