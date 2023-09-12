import base64
import datetime
from io import BytesIO
import json

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
    return {"last_check_date": (result or [[None] * 3])[0]["created_date"], "amounts": result}


@APP.route("/Statistique")
def get_statistique():
    # 3 pipeline to calculate receipt data list
    # distribution_action need to have datetime field named -> full_datetime
    distribution_period = ["2023-07-01"]
    range_amount = []
    controllers = []
    # the first pipe is about the last distribution for each selected period
    f"""
    select id, distribution_date, period_range from (
        select 
            id,
            distribution_date,  
            period_range,
            row_number() over (partition by distribution_date order by full_datetime desc) as rang 
        from distribution_action 
        
        where distribution_date in ({','.join(['%s' for _ in distribution_period])})
    ) where rang = 1
    """  # , params=(*distribution_period), dict_res=True
    result = []
    set_of_receipt_date = set()
    couple_last_distribute_date_id = []
    for d in result:
        try:
            period_range = json.loads(d.period_range)
        except json.JSONDecodeError:
            period_range = []
        set_of_receipt_date.update(period_range)
        couple_last_distribute_date_id.append(str(d.distribution_date) + "-" + str(d.id))
    ####################################################################################################################
    # PROBLEM WITH "distribution_date" --> maybe needed to loop on each distribution_period
    f"""
    select distribution_date, count(*) as nb_receipt, sum(amount) as amount_receipt 
    from receipt_trace
    where 
        receipt_date in ({','.join(['%s' for _ in set_of_receipt_date])})
    amount between %s and %s
    and matricule in ({','.join(['%s' for _ in controllers])})

    group by distribution_date
    """  # , params=(*set_of_receipt_date, *range_amount, *controllers), dict_res=True
    ####################################################################################################################

    # second is about got check already controlled before these last distribution
    f"""
    select distribution_date, count(*) as nb_receipt, sum(amount) as amount_receipt 
    from check_control, distribution_action, receipt_trace 
    where check_control.id_distribution = distribution_action.id and receipt_trace.id = id_receipt_trace
        and distribution_date in ({','.join(['%s' for _ in distribution_period])})
        and (distribution_date || '-' || distribution_action.id) not in 
        ({','.join(['%s' for _ in couple_last_distribute_date_id])}) 
        and (end_control_date is not null or control_status=1)
        and amount between %s and %s
        and matricule in ({','.join(['%s' for _ in controllers])})
        group by distribution_date
    """  # , params=(*distribution_period, *couple_last_distribute_date_id, *range_amount, *controllers), dict_res=True
    result_already_control = []

    # the third is about period with no distribution
    no_distribution_period = list(set(distribution_period).difference([d.distribution_date for d in result]))

    for d in no_distribution_period:
        # apply auto_detect_receipt_date for each d and
        _temp = auto_detect_receipt_date(d)
        f"""
        select count(*) as nb_receipt, sum(amount) as amount_receipt 
        from receipt_trace
        where 
            receipt_date in ({','.join(['%s' for _ in _temp])})
        amount between %s and %s
        and matricule in ({','.join(['%s' for _ in controllers])})
        """  # , params=(*_temp, *range_amount, *controllers), dict_res=True, limit=1

    return render_template("stat_views.html")


def auto_detect_receipt_date(d):
    return []


if __name__ == '__main__':
    # https://www.pinterest.fr/pin/794533559274214883/
    APP.run(debug=True)
