#!/usr/bin/env python3
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()

def run_server():
    server_address = ('0.0.0.0', 3000)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print("Server running on http://0.0.0.0:3000")
    httpd.serve_forever()

if __name__ == '__main__':
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer stopped")
        sys.exit(0)