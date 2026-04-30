import os
from flask import Flask, render_template

# Configure explicit template and static folders so Flask can reliably locate assets.
base_dir = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(base_dir, "templates")
static_dir = os.path.join(base_dir, "static")
app = Flask(__name__, static_folder=static_dir, template_folder=template_dir)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/book-ticket")
def book_ticket():
    return render_template("book_ticket.html")

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/<path:path>")
def catch_all(path):
    # Make /book-ticket work even when the user refreshes or navigates directly.
    if path.startswith("api") or path.startswith("static"):
        return "Not Found", 404
    return render_template("index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
