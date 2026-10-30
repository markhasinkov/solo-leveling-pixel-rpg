# -*- coding: utf-8 -*-
"""Настройка Telegram-бота для запуска Mini App.

Токен и URL читаются из локального .env (в git не попадает):
    TELEGRAM_BOT_TOKEN=...
    GAME_URL=https://user.github.io/repo/
    GAME_BUTTON_TEXT=Играть

Запуск:
    python tools/telegram_setup.py
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.telegram.org/bot{token}/{method}"


def load_env(path):
    data = {}
    if not path.exists():
        return data
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def call(token, method, payload=None):
    body = None
    headers = {}
    if payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(API.format(token=token, method=method), data=body, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            data = json.loads(error.read().decode("utf-8"))
        except Exception:
            data = {}
        return {"ok": False, "error_code": error.code, "description": data.get("description", str(error))}
    except Exception as error:
        return {"ok": False, "description": str(error)}


def describe_error(result):
    code = result.get("error_code")
    text = result.get("description") or "неизвестная ошибка"
    return (str(code) + " " + text) if code else text


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    env = load_env(ROOT / ".env")
    token = env.get("TELEGRAM_BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN", "")
    game_url = env.get("GAME_URL") or os.environ.get("GAME_URL", "")
    button_text = env.get("GAME_BUTTON_TEXT") or "Играть"

    if not token:
        print("Нет TELEGRAM_BOT_TOKEN: заполните .env по образцу .env.example")
        return 1
    if not game_url.startswith("https://"):
        print("GAME_URL должен начинаться с https://")
        return 1

    me = call(token, "getMe")
    if not me.get("ok"):
        print("Ошибка getMe: " + describe_error(me))
        return 1
    bot = me["result"]
    print("Бот: @" + str(bot.get("username")) + " (" + str(bot.get("first_name")) + ")")

    # Тексты карточки бота не критичны для запуска Mini App.
    for method, payload in (
        ("setMyShortDescription", {"short_description": "Пиксельная action-RPG по мотивам Solo Leveling."}),
        ("setMyDescription", {
            "description": "Пиксельная action-RPG по мотивам Solo Leveling: "
                           "12 глав, боссы, теневая армия и гильдия Ахджин. "
                           "Нажмите «Играть», чтобы открыть Mini App."
        })
    ):
        result = call(token, method, payload)
        if not result.get("ok"):
            print("Предупреждение " + method + ": " + describe_error(result))

    result = call(token, "setChatMenuButton", {
        "menu_button": {
            "type": "web_app",
            "text": (button_text or "Играть")[:64],
            "web_app": {"url": game_url}
        }
    })
    if not result.get("ok"):
        print("Ошибка setChatMenuButton: " + describe_error(result))
        return 1

    check = call(token, "getChatMenuButton")
    if check.get("ok"):
        menu = check.get("result") or {}
        web = menu.get("web_app") or {}
        print("Меню-кнопка: " + str(menu.get("type")) + " / " + str(menu.get("text")) + " -> " + str(web.get("url")))
    else:
        print("Предупреждение getChatMenuButton: " + describe_error(check))

    print("Готово. Откройте https://t.me/" + str(bot.get("username")) + " и нажмите кнопку Mini App.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
