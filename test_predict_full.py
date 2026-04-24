import requests
import json

url = "http://localhost:8001/predict"
files = {'file': open('test_pred.csv', 'rb')}
data = {'model_id': 'dummy'}

try:
    r = requests.post(url, files=files, data=data)
    print(f"Status: {r.status_code}")
    print(f"Keys: {list(r.json().keys())}")
    if 'input_data' in r.json():
        print(f"Input Data Length: {len(r.json()['input_data'])}")
        if len(r.json()['input_data']) > 0:
            print(f"Input Data First Row Keys: {list(r.json()['input_data'][0].keys())}")
except Exception as e:
    print(f"Error: {e}")
