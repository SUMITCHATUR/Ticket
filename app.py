import os
from flask import Flask, render_template

# Configure explicit template folder so Flask can reliably locate HTML templates.
template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
app = Flask(__name__, template_folder=template_dir)

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
