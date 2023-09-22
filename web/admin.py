import base64
import datetime
import os
from io import BytesIO

from PIL import Image
from flask.blueprints import Blueprint
from flask import Flask, render_template, jsonify, request

from kb_package.database import SQLiteDB


def _get_function_arguments(func):
    while hasattr(func, "__wrapped__"):
        func = func.__wrapped__
    return func.__code__.co_varnames


def parse_type(_type: str):
    _type = _type.lower()
    if _type == "json":
        return "json"
    if "char" in _type or _type == "text":
        if "mail" in _type:
            return "email"
        if "phone" in _type or "contact" in _type:
            return "phone"
        return "text"
    if "date" in _type:
        if "time" in _type:
            return "datetime"
        return "date"
    if "time" in _type:
        return "datetime"

    if _type.startswith(("int", "seri")) or _type.endswith("int"):
        return "integer"
    return "numeric"


class DB:
    def __init__(self):
        self.db_object = SQLiteDB(r"C:\Users\DEL\OneDrive\MY-CLOUD\Orange\DMR_SCRIPTING\db\sqlite.db")

    def get_schema(self):
        if self.db_object._get_name == SQLiteDB.__name__:
            root = (self.db_object.file_name or ":memory:")
            root = os.path.basename(root)

            schema = self.db_object.run_script("""
                WITH tables AS 
                    (SELECT name tableName, sql FROM sqlite_master WHERE type = 'table' AND 
                        tableName NOT LIKE 'sqlite_%') 
                SELECT 
                    fields.name as columnName, 
                    fields.type, 
                    tableName 
                FROM tables CROSS JOIN pragma_table_info(tables.tableName) fields
            """, dict_res=True)

        else:
            root = self.db_object.database_name
            schema = []
        tables_name = sorted(list(set([c.tableName for c in schema])))

        print(schema)
        final_schema = [{"root": root, "is_root": True, "files": [], "folders": tables_name}]
        for table in tables_name:
            final_schema.append({
                "root": root + "/" + table,
                "is_root": False, "folders": [],
                "files": [{"column": c.columnName, "type": parse_type(c.type)} for c in schema if c.tableName == table]
            })

        return final_schema


class CustomAdmin(Blueprint):

    USER_TABLE = "users"

    TEMPLATE = "admin_views.html"
    # routes
    BASE_ROUTE = "/api/admin"
    WEB_BASE_ROUTE = "/Administration"
    APP_NAME = "APP"
    APP_BRAND = "logo.png"

    def __init__(self, *args, **kwargs):
        name = kwargs.get("name", "admin")
        if len(args):
            name = args[0]
        real_kwargs = _get_function_arguments(super().__init__)
        real_kwargs = {k: v for k, v in kwargs.items() if k in real_kwargs}

        super().__init__(name, kwargs.get("import_name") or __name__, **real_kwargs)

        self.add_url_rule(self.get_base_route()+"user-habilitation", None, self.user_habilitation, methods=["POST"])
        self.add_url_rule(self.get_base_route() + "db-console", None, self.db_console)
        print(self.get_base_route() + "run-script")
        self.add_url_rule(self.get_base_route() + "run-script", None, self.run_script, methods=["POST"])

        self.add_url_rule(self.get_base_route("web") + "Habilitation", None, self.habilitation_view)
        self.add_url_rule(self.get_base_route("web") + "Console", None, self.console_view)
        self.add_url_rule(self.get_base_route("web"), None, self.home)

        CustomAdmin.APP_NAME = kwargs.get("app_name") or os.getenv("APP_NAME") or CustomAdmin.APP_NAME
        CustomAdmin.APP_BRAND = kwargs.get("app_brand") or os.getenv("APP_BRAND") or CustomAdmin.APP_BRAND

    @classmethod
    def get_base_route(cls, t: str = "api"):
        if t.lower() == "api":
            rule = cls.BASE_ROUTE
        else:
            rule = cls.WEB_BASE_ROUTE

        if rule.endswith("/"):
            return rule
        return rule + "/"

    def install(self, app: Flask):
        app.register_blueprint(self)

        path = os.path.join(app.static_folder or "", CustomAdmin.APP_BRAND)
        if os.path.exists(path):
            with Image.open(path) as img:
                img.thumbnail((100, 100))
                output = BytesIO()
                img.save(output, format=img.format)
                CustomAdmin.APP_BRAND = "data:image/" + img.format + \
                                        ";base64," + base64.b64encode(output.getvalue()).decode("utf8")

    # api views
    @staticmethod
    def user_habilitation():
        _inputs = request.get_json()
        print(_inputs)
        height = _inputs.get("max-height", 700)

        return jsonify({"users": [{"last_name": "KANGA", "first_name": "BORIS", "matricule": "5000", "email": "kanga07@hotmail.fr",
                                   "last_connexion": datetime.datetime.now().replace(day=10).strftime("%d/%m/%Y - %H:%M:%S")} for _ in range(10)]})

    @staticmethod
    def db_console():
        schema = DB().get_schema()
        return jsonify({"schema": schema})

    @staticmethod
    def run_script():
        _inputs = request.get_json()
        print(_inputs)
        script = _inputs.get("script", "")
        ok = True
        result = None
        error_msg = None
        db_object = DB().db_object
        try:
            result = db_object.run_script(script)
        except Exception as ex:
            ok = False
            error_msg = str(ex)

        return jsonify({"ok": ok, "error_msg": error_msg, "data": result,
                        "columns": db_object.LAST_REQUEST_COLUMNS})

    # front views

    @staticmethod
    def home():
        page = "home"
        return render_template(CustomAdmin.TEMPLATE, page=page, base_web=CustomAdmin.WEB_BASE_ROUTE,
                               base_api=CustomAdmin.BASE_ROUTE)

    @staticmethod
    def habilitation_view():
        return render_template("user_management.html", base_api=CustomAdmin.BASE_ROUTE,
                               brand=CustomAdmin.APP_BRAND, app_name=CustomAdmin.APP_NAME)

    @staticmethod
    def console_view():
        return render_template("sql_script.html", base_api=CustomAdmin.BASE_ROUTE,
                               brand=CustomAdmin.APP_BRAND, app_name=CustomAdmin.APP_NAME)


