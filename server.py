import http.server
import json
import os
import socket
import sqlite3
import webbrowser
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "school_lms.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def get_saved_state():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT data_json FROM app_state WHERE id = 1")
    row = cur.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row[0])
        except Exception:
            return None
    return None


def save_state_to_db(state_obj):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    payload = json.dumps(state_obj, ensure_ascii=False)
    cur.execute(
        """
        INSERT INTO app_state (id, data_json, updated_at)
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        """,
        (payload,),
    )
    conn.commit()
    conn.close()


class SchoolLMSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        # Chan tai truc tiep cac tep tin co so du lieu va ma nguon may chu
        lower_path = parsed.path.lower()
        if lower_path.endswith((".db", ".py", ".bat", ".toml", ".sqlite", ".jsonl")):
            self.send_error(403, "Access to database and server files is forbidden")
            return

        if parsed.path == "/api/state":
            state = get_saved_state()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(json.dumps(state if state else {}, ensure_ascii=False).encode("utf-8"))
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(length).decode("utf-8")
            try:
                state_obj = json.loads(raw_body)
                save_state_to_db(state_obj)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        # Giữ console gọn gàng
        pass


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    init_db()
    local_ip = get_local_ip()
    url_local = f"http://localhost:{PORT}"
    url_lan = f"http://{local_ip}:{PORT}"

    print("=" * 68)
    print("  TRUONG THPT SO 2 NGUYEN TRUONG TO - HE THONG HOC TIENG ANH")
    print("=" * 68)
    print(f"  [+] Co so du lieu SQLite : {DB_PATH}")
    print(f"  [+] Truy cap tren may nay: {url_local}")
    print(f"  [+] Truy cap mang truong : {url_lan}")
    print("-" * 68)
    print("  Tai khoan Giao vien Quan tri : admin   | Mat khau: 123")
    print("  Tai khoan Hoc sinh mau       : HS1001  | Mat khau: 123")
    print("=" * 68)

    try:
        webbrowser.open(url_local)
    except Exception:
        pass

    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), SchoolLMSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung may chu.")
