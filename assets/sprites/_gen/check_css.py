# -*- coding: utf-8 -*-
"""Проверка css/style.css на обязательные классы контракта.

Запуск: python assets/sprites/_gen/check_css.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # корень проекта
CSS = os.path.join(ROOT, 'css', 'style.css')

REQUIRED = ['.game-canvas', '.ui-dialog', '.ui-hud', '.ui-inventory', '.ui-quest']
# вспомогательные классы, запрошенные фронтом
FRONT = ['.game-wrap', '.hp-bar', '.hp-fill', '.hud-vitals', '.hud-level',
         '.bar', '.bar-fill', '.bar-text', '.ui-side', '.side-btn',
         '.skill-bar', '.skill-slot', '.skill-cd', '.boss-bar', '.boss-fill',
         '.ui-hint', '.dlg-speaker', '.dlg-text', '.dlg-paging',
         '.panel-title', '.panel-tip', '.panel-tabs', '.item-row',
         '.quest-row', '.quest-head', '.talent-node', '.talent-grid',
         '.toast', '.chapter-banner', '.banner-title', '.banner-sub',
         '.death-screen', '.victory-screen', '.pixel-btn',
         '.touch-controls', '.joystick-base', '.touch-btn']


def main():
    if not os.path.exists(CSS):
        print('FAIL: %s not found' % CSS)
        return 1
    with open(CSS, 'r', encoding='utf-8') as f:
        src = f.read()
    # убираем комментарии, чтобы не считать упоминания в /* */
    body = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
    selectors = set()
    for m in re.finditer(r'([^{}]+)\{', body):
        selectors.update(s.strip() for s in m.group(1).split(','))
    missing = [c for c in REQUIRED + FRONT
               if not any(c == s or (s.startswith(c + ' ') or s.startswith(c + ',')
                                     or s.endswith(c) or (c in s.split()))
                          for s in selectors)]
    print('css file      : %s (%d bytes)' % (CSS, len(src)))
    print('selectors     : %d' % len(selectors))
    print('missing       : %s' % (missing or 'none'))
    ok = not missing
    print('CSS CHECK     : %s' % ('PASS' if ok else 'FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
