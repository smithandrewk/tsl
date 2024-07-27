from flask import Flask
from flask_cors import CORS
import torch
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/data')
def get_data():
    return torch.load('0.pt')[0][:5000,0].tolist()

if __name__ == '__main__':
    app.run(debug=True)
