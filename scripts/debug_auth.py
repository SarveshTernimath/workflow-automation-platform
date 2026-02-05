import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def debug_auth():
    print("--- Debugging Auth ---")
    url = f"{BASE_URL}/login/access-token"
    data = {
        "username": "admin@example.com",
        "password": "adminpassword123"
    }
    try:
        resp = requests.post(url, data=data)
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_auth()
