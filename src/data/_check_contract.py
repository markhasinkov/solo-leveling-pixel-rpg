# -*- coding: utf-8 -*-
"""Устаревшая проверка контракта. Актуальная: tools/verify_data.py."""
import os
import runpy

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
runpy.run_path(os.path.join(ROOT, "tools", "verify_data.py"), run_name="__main__")
