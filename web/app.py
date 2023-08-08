from flask import Flask, render_template


APP = Flask(__name__, template_folder="templates", static_folder="static")


@APP.route("/")
def home():
    return render_template("home.html")


@APP.route("/Control")
def control():
    return render_template("control.html")

# https://www.pinterest.fr/pin/587367976385806869/


if __name__ == '__main__':
    APP.run(debug=True)