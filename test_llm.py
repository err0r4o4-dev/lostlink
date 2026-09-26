import urllib.request
import urllib.error
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

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
    print(f"Connecting to {url}...")
    with urllib.request.urlopen(req, timeout=5) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} {e.reason}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
