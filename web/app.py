import base64
import datetime
from io import BytesIO

from flask import Flask, render_template, request, jsonify
from PIL import Image

from kb_package.tools import Cdict

APP = Flask(__name__, template_folder="templates", static_folder="static")


@APP.route("/")
def home():
    return render_template("home.html")


@APP.route("/Control")
def control():
    return render_template("control.html")


@APP.route("/get-image", methods=["POST"])
def get_image():
    _inputs = request.get_json()

    _id = _inputs["id"]
    sens = _inputs["sens"]
    if sens == "recto":
        path = r"C:\Users\DEL\OneDrive\MY-CLOUD\SGCI\sentinelle\46832-194366ba5b8a15887ad33b3068c46101.jpg"
    else:
        path = r"C:\Users\DEL\OneDrive\MY-CLOUD\SGCI\sentinelle\check.jpg"
    # with open(path, "rb") as img:
    with Image.open(path) as img:
        # img = img.read()
        img.thumbnail((int(_inputs.get("width") or 1000), int(_inputs.get("height") or 1000)))

        output = BytesIO()
        img.save(output, format="jpeg")
        # img = output
        resp = "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("utf8")
    return resp


@APP.route("/check-control/<int:check_id>", methods=["GET", "POST"], defaults={"check_id": 0})
def get_check_data(check_id=None):
    client_info = get_check_info(check_id)
    kwargs = get_check_stats(client_info)
    return jsonify({"client_info": client_info, **kwargs})


def get_check_info(_id):
    # Mock of request to db for getting check infos
    # calculate beneficiary last_check_receive_date and last_check_receive_id
    return Cdict({"id": _id, "client_name": "KANGA Boris Parfait", "client_id": "005887333",
                  "segment_client": "particulier",
                  "account_number": 277373, "beneficiary_account_number": "109384747737737773773",
                  "beneficiary_name": "KOFFI YAO",
                  "beneficiary_account_created_date": "01/07/2023",
                  "last_check_receive_date": "03/05/2023",
                  "last_check_receive_id": 10,
                  "account_manager_code": "005", "account_manager_mail": "KOUAKOU07@hotmail.fr",
                  "front_image": None, "back_image": None})


def get_check_stats(check_info):
    """
    Got all checks which concerned the client using a request like::
        select amount, created_date, --check emit date
            (case when beneficiary_account_number = check_info.beneficiary_account_number then 1 else 0 end)
                as couple tag,
            id as check_id
        from received_trace where id <> check_info.id and (client_id = check_info.client_id or
            account_number = check_info.account_number)
        order by created_date desc
    """
    result = [(10000000, "2023-05-10", 0), (500000, "2023-02-10", 0), (10000000, "2023-02-12", 1),
              (9000000, "2023-03-01", 1),
              (200000, "2023-03-10", 0)]
    for index in range(len(result)):
        result[index] = list(result[index])
        if len(result[index]) <= 3:
            result[index].extend([None])
        result[index][1] = datetime.date.fromisoformat(str(result[index][1])).strftime(
            "%d/%m/%Y")
    result = [{k: d[i] for k, i in zip(["amount", "created_date", "couple_tag", "check_id"], range(len(d)))}
              for d in result]
    return {"last_check_date": (result or [[None]*3])[0]["created_date"], "amounts": result}


if __name__ == '__main__':
    # https://www.pinterest.fr/pin/794533559274214883/
    APP.run(debug=True)
