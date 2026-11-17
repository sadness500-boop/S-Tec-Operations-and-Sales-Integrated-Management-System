#!/usr/bin/env python3
"""releases/S-Tec-Operations-and-Sales-Integrated-Management-System_v<버전>.html — 파일 하나로 열리는 배포본을 만듭니다.
   (vendor 스크립트와 그림을 모두 HTML 안에 넣습니다)  Designed & Developed by Rat Rae Choi"""
import base64, json, pathlib, re
R = pathlib.Path(__file__).resolve().parent
ver = json.loads((R / 'version.json').read_text(encoding='utf-8'))['version']
s = (R / 'index.html').read_text(encoding='utf-8')
assert f"APP_VERSION = '{ver}'" in s, 'index.html 의 APP_VERSION 과 version.json 이 다릅니다'
for js in ['vendor/supabase.js', 'vendor/qr.js']:
    code = (R / js).read_text(encoding='utf-8').replace('</script', '<\\/script')
    s = s.replace(f'<script src="{js}"></script>', f'<script>/* {js} */\n{code}\n</script>')
def datauri(m):
    p = R / m.group(2)
    if not p.exists(): return m.group(0)
    mime = 'image/png' if p.suffix == '.png' else 'image/jpeg'
    return m.group(1) + f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
s = re.sub(r'''((?:src=|href=)["']|['"])((?:assets|icons)/[\w./-]+\.(?:png|jpg))''', datauri, s)
out = R / 'releases' / f'S-Tec-Operations-and-Sales-Integrated-Management-System_v{ver}.html'
out.write_text(s, encoding='utf-8')
print(out, round(out.stat().st_size / 1024), 'KB')
