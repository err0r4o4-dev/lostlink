import urllib.request
import json
import os

url = "http://host.docker.internal:20128/v1/chat/completions"
api_key = "sk-2c73570b10ff8395-7gfgc2-cb645c59"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "ag/gemini-3.8-flash-high",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.2
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = resp.read().decode('utf-8')
        print(f"Status: {resp.status}")
        print(f"Body: {body}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
