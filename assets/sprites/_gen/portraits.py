# -*- coding: utf-8 -*-
"""HD-портреты 64x64 для HUD и диалогов (на основе кадра покоя)."""
import os

from . import anims, png, humans, monsters, bosses, rulers


def generate(out_dir):
    target = os.path.join(out_dir, 'portraits')
    os.makedirs(target, exist_ok=True)
    made = []
    ids = list(humans.HUMANS.keys()) + list(monsters.SMALL.keys()) + \
        list(bosses.BOSSES1.keys()) + list(rulers.BOSSES2.keys())
    for cid in ids:
        base, _ = anims.base_sprite(cid)
        portrait = anims.polish_frame(base)
        path = os.path.join(target, cid + '.png')
        png.save_png(path, 64, 64, portrait)
        made.append(path)
    return made
