import http.server as server
import urllib.request
import urllib.parse
import json
import re
import os 
from os import curdir, sep

DEBUG = True

def get(requested_url):
    response = urllib.request.urlopen(requested_url)
    return response.read()


class HTTPRequestHandler(server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith("/?url="):
            try:
                path = self.path
                if self.path == '/':
                    path = '/index.html'
                f = open(curdir + sep + path, 'rb')

                self.send_response(200)
                self.end_headers()
                self.wfile.write(f.read())
                f.close()
                return

            except IOError:
                self.send_error(404,'File Not Found: %s' % self.path)
            return
        
        query = urllib.parse.parse_qs(self.path.split("?")[1])
        requested_url = query["url"][0]
        self.send_response(200)
        self.end_headers()
        data = get(requested_url)
        self.wfile.write(data)

if __name__ == '__main__':
    PORT = 8000 if "PORT" not in os.environ else int(os.environ["PORT"])
    server_address = ("", PORT)

    handler = HTTPRequestHandler
    print("Server listening on port :", PORT)

    try:
        if DEBUG:
            server.test(HandlerClass=handler, port=PORT)
        else:
            httpd = server.HTTPServer(server_address, handler) 
            httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    
    if not DEBUG:
        httpd.server_close()
    print("Server stopped.")
