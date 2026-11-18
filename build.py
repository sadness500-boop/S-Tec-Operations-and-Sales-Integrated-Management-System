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
# 전체 백업 도구도 파일 안에 넣음 (관리 콘솔 「💾 전체 백업」이 인터넷 주소 없이도 동작)
extra = ''.join(f'<script data-src="{js}">/* {js} */\n' + (R / js).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>\n'
                for js in ['vendor/exceljs.min.js', 'vendor/stec-backup.js'])
s = s.replace('</body>', extra + '</body>', 1)
# 공통 기준정보 도구도 파일 안에 넣음 (PC에서 파일로 열어도 「🏢 기준정보」 동작)
_sm = (R / 'vendor/stec-master.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
s = s.replace('<script src="vendor/stec-master.js"></script>', '<script data-src="vendor/stec-master.js">\n' + _sm + '\n</script>', 1)
def datauri(m):
    p = R / m.group(2)
    if not p.exists(): return m.group(0)
    mime = {'.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2'}.get(p.suffix, 'image/jpeg')
    return m.group(1) + f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
s = re.sub(r'''((?:src=|href=)["']|['"])((?:assets|icons)/[\w./-]+\.(?:png|jpg|webp|woff2))''', datauri, s)
out = R / 'releases' / f'S-Tec-Operations-and-Sales-Integrated-Management-System_v{ver}.html'
out.write_text(s, encoding='utf-8')
print(out, round(out.stat().st_size / 1024), 'KB')
