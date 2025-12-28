# server/app.py
from flask import Flask, jsonify
from flask_cors import CORS
# Import both lists now
from data import beers, vodka, rum, whisky

app = Flask(__name__)
CORS(app)

@app.route('/api/beers', methods=['GET'])
def get_beers():
    return jsonify(beers)

@app.route('/api/vodka', methods=['GET'])
def get_vodka():
    return jsonify(vodka)

@app.route('/api/rum', methods=['GET'])
def get_rum():
    return jsonify(rum)

@app.route('/api/whisky', methods=['GET'])
def get_whisky():
    return jsonify(whisky)

if __name__ == '__main__':
    app.run(debug=True, port=8080)