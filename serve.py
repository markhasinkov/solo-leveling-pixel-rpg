# -*- coding: utf-8 -*-
"""Solo Leveling Pixel RPG — локальный сервер разработки.

Запуск из корня проекта:
    python serve.py

Поднимает http.server на порту 8000 и печатает адрес
http://localhost:8000. Только стандартная библиотека Python.

Если порт 8000 занят другим процессом, сервер автоматически
занимает первый свободный из 8001, 8002, 8080, 8888 и печатает
фактический адрес.
"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HOST = "127.0.0.1"
PORT = 8000
# Порядок fallback-портов: приоритет у контрактного 8000, но если он занят
# (например, локальной инфраструктурой машины), берём следующий свободный.
FALLBACK_PORTS = (8000, 8001, 8002, 8080, 8888, 0)


def main():
    server = None
    for port in FALLBACK_PORTS:
        try:
            server = ThreadingHTTPServer((HOST, port), SimpleHTTPRequestHandler)
            server.daemon_threads = True
            break
        except OSError as exc:
            print("[serve.py] Порт {0} недоступен: {1}".format(port, exc))
    if server is None:
        print("[serve.py] Не удалось занять ни один порт. Сервер не запущен.")
        sys.exit(1)

    url = "http://localhost:{0}".format(server.server_port)
    print("Solo Leveling Pixel RPG — сервер запущен")
    print("Откройте в браузере: {0}".format(url))
    if server.server_port != PORT:
        print("[serve.py] Внимание: порт {0} занят, использован {1}.".format(PORT, server.server_port))
    print("Остановка: Ctrl+C")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[serve.py] Сервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
