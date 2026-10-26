import http.server
import socketserver
import os

PORT = 8888
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lexguard-html"))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
        print(f"Dev Showcase Server (No-Cache) serving {DIRECTORY} at http://127.0.0.1:{PORT}")
        httpd.serve_forever()
