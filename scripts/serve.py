"""Static server for local development.

The default handler sends Last-Modified and honours If-Modified-Since, so a
browser holds on to an ES module across an edit and the page silently runs
yesterday's code. Every response here says not to store anything.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def send_header(self, key, value):
        if key.lower() == "last-modified":
            return
        super().send_header(key, value)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8100
    print(f"serving on http://localhost:{port}")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
