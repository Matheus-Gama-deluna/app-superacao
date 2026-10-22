import json
import time
import urllib.request
import urllib.parse
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_FILE = 'data/catalog_full_pt.json'

def is_english(text):
    if not text:
        return False
    english_pattern = re.compile(r'\b(the|and|your|with|from|this|that|keep|repeat|position|starting|knees|elbows|floor|ground|bar|barbell|dumbbell|hands|feet|shoulders|chest|back|down|up|slowly)\b', re.IGNORECASE)
    matches = english_pattern.findall(text)
    return len(matches) >= 2

def translate_gtx(text):
    if not text or not text.strip():
        return ""
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=12) as res:
                data = json.loads(res.read().decode('utf-8'))
                translated = ''.join([part[0] for part in data[0] if part and part[0]])
                return translated
        except Exception:
            time.sleep(0.5 + attempt)
    return text

def polish_fitness_pt(text):
    if not text:
        return ""
    replacements = [
        (r'\bhalteres\b', 'halteres'),
        (r'\bhaltere\b', 'halter'),
        (r'\bcore\b', 'abdômen e core'),
        (r'\bstarting position\b', 'posição inicial'),
        (r'\bstarting point\b', 'ponto de partida'),
        (r'\breps\b', 'repetições'),
        (r'\brepetições recomendada\b', 'repetições recomendadas'),
        (r'\bbarra de barra\b', 'barra'),
        (r'\bhaltere de barra\b', 'barra'),
        (r'\blie down\b', 'deite-se'),
        (r'\bstand up\b', 'fique em pé'),
        (r'\bcalcanhares\b', 'calcanhares'),
    ]
    res = text
    for pat, rep in replacements:
        res = re.sub(pat, rep, res, flags=re.IGNORECASE)
    res = re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), res)
    return res.strip()

def process_exercise(ex):
    steps = ex.get('steps_pt') or ex.get('steps') or []
    instr = ex.get('instructions_pt') or ex.get('instructions') or ""

    needs_translation = False
    if is_english(instr):
        needs_translation = True
    elif steps and any(is_english(s) for s in steps):
        needs_translation = True

    if not needs_translation:
        return False

    if steps and len(steps) > 0:
        joined = ' ||| '.join(steps)
        trans_joined = translate_gtx(joined)
        trans_steps = [polish_fitness_pt(s.strip()) for s in trans_joined.split('|||') if s.strip()]
        
        if len(trans_steps) == len(steps):
            ex['steps_pt'] = trans_steps
        else:
            ex['steps_pt'] = [polish_fitness_pt(translate_gtx(s)) for s in steps]
        
        ex['instructions_pt'] = ' '.join(ex['steps_pt'])
    else:
        trans_instr = polish_fitness_pt(translate_gtx(instr))
        ex['instructions_pt'] = trans_instr
        ex['steps_pt'] = [s.strip() for s in trans_instr.split('. ') if s.strip()]

    return True

def main():
    print(f"Loading {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    total = len(exercises)
    print(f"Total exercises: {total}. Starting fast concurrent translation...")

    tasks = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_idx = {executor.submit(process_exercise, ex): idx for idx, ex in enumerate(exercises)}
        completed = 0
        translated = 0
        for future in as_completed(future_to_idx):
            completed += 1
            try:
                did_translate = future.result()
                if did_translate:
                    translated += 1
            except Exception as e:
                pass

            if completed % 50 == 0 or completed == total:
                print(f"Progress: [{completed}/{total}] done ({translated} translated)")
                with open(DATA_FILE, 'w', encoding='utf-8') as f_out:
                    json.dump(exercises, f_out, ensure_ascii=False, indent=2)

    with open(DATA_FILE, 'w', encoding='utf-8') as f_out:
        json.dump(exercises, f_out, ensure_ascii=False, indent=2)

    print(f"Finished! Successfully processed {total} exercises.")

if __name__ == '__main__':
    main()
