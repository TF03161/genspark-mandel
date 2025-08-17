#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = "/home/user/webapp"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for better compatibility
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Reduce log verbosity
        pass

os.chdir(DIRECTORY)

with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🚀 Quantum Fractal Universe Server")
    print(f"📍 Serving at http://0.0.0.0:{PORT}")
    print(f"📂 Directory: {DIRECTORY}")
    print(f"✨ Server is ready!")
    httpd.serve_forever()