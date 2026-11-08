import re, subprocess, os, sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")

APP = pathlib.Path(r"C:\projects\study-cat\index.html")
OUT = pathlib.Path(os.path.dirname(os.path.abspath(__file__))) / "cat_shots"
OUT.mkdir(exist_ok=True)
html = APP.read_text(encoding="utf-8")

# 1 syntax: every inline script block through node --check
blocks = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
bad = 0
for i, b in enumerate(blocks):
    f = OUT / f"blk{i}.js"
    f.write_text(b, encoding="utf-8")
    r = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True)
    if r.returncode:
        bad += 1; print("SYNTAX FAIL blk", i, r.stderr[:400])
print(f"[1] script blocks {len(blocks)}, syntax fail {bad}")
for t in ["div", "section", "button"]:
    o = len(re.findall(rf"<{t}[\s>]", html)); c = len(re.findall(rf"</{t}>", html))
    print(f"[1] tag {t}: open {o} close {c}")

res = []
def check(name, ok, extra=""):
    res.append((name, ok)); print(("PASS " if ok else "FAIL ") + name + (" — " + extra if extra else ""))

with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    ctx = br.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.6, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    blocked = []
    def route(r):
        u = r.request.url
        if u.startswith("file:") or "fonts.googleapis" in u or "fonts.gstatic" in u or "cdn.jsdelivr" in u:
            return r.continue_()
        blocked.append(u); return r.abort()
    page.route("**/*", route)
    page.goto(APP.as_uri(), wait_until="load")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(OUT / "0_home.png"))
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("home no horizontal scroll", sw <= 412, f"scrollWidth {sw}")

    # ---------- spelling stage 3 (was typing) ----------
    page.evaluate("""()=>{const ids=[];for(let i=0;i<WORDS.length&&ids.length<6;i++){if(/^[a-zA-Z]{3,8}$/.test(WORDS[i][0])){S.words[i]=Object.assign(S.words[i]||{},{sp:3,spOk:0});ids.push(i);}}window.__sp=ids;startSpell(0,ids);}""")
    page.wait_for_timeout(300)
    n_inputs = page.evaluate("document.querySelectorAll('#scr-spell input').length")
    check("spelling: no text box", n_inputs == 0)
    info = page.evaluate("({word:sp.cur.word,lv:sp.cur.lv,tiles:sp.cur.tiles.length,dir:document.getElementById('spDir').textContent})")
    check("spelling lv3 has word+3 decoy tiles", info["lv"] == 3 and info["tiles"] == len(info["word"]) + 3, json.dumps(info, ensure_ascii=False))
    page.screenshot(path=str(OUT / "1_spell_lv3.png"))
    # double tap same tile quickly -> only one slot filled
    page.locator("#spTiles .tile").first.click(); page.locator("#spTiles .tile").first.dispatch_event("click")
    filled = page.evaluate("sp.cur.slots.filter(Boolean).length")
    check("spelling: same tile twice fills one slot", filled == 1)
    page.locator("#spTiles .tile.del").click()
    # answer correctly by pressing tiles in order
    word = info["word"]
    for ch in word:
        idx = page.evaluate("ch=>sp.cur.tiles.findIndex((t,i)=>t===ch&&!(sp.cur.used&&sp.cur.used[i]))", ch)
        page.locator("#spTiles .tile").nth(idx).click()
    page.wait_for_timeout(400)
    fb = page.inner_text("#spFb")
    check("spelling: correct answer by buttons", "맞았어" in fb, fb[:40])
    page.screenshot(path=str(OUT / "2_spell_ok.png"))
    page.click("#spGo"); page.wait_for_timeout(200)
    # wrong answer: fill with wrong order
    w2 = page.evaluate("sp.cur.word")
    for k in range(len(w2)):
        page.locator("#spTiles .tile:not(.used):not(.del)").last.click()
    page.wait_for_timeout(400)
    fb2 = page.inner_text("#spFb")
    ok_wrong = ("아깝다" in fb2) or ("맞았어" in fb2)
    check("spelling: wrong/any full answer gets graded", ok_wrong, fb2[:40])

    # ---------- dictation (was typing) ----------
    page.evaluate("()=>{sp=null;startDict(1,null);}")
    page.wait_for_timeout(400)
    check("dictation: no text box", page.evaluate("document.querySelectorAll('#scr-dict input').length") == 0)
    dinfo = page.evaluate("(()=>{const q=dq.list[dq.idx];return {word:WORDS[q.id][0],tiles:q.tiles.length,slots:q.slots.length,n:dq.list.length}})()")
    check("dictation: word letters + 3 decoys", dinfo["tiles"] == len(dinfo["word"]) + 3, json.dumps(dinfo, ensure_ascii=False))
    page.screenshot(path=str(OUT / "3_dict.png"))
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("dictation: no horizontal scroll", sw <= 412, f"scrollWidth {sw}")
    # empty next -> skip toast, second press moves on
    page.click("#dcGo"); before = page.evaluate("dq.idx"); page.click("#dcGo"); after = page.evaluate("dq.idx")
    check("dictation: empty answer needs 2 presses (old behaviour kept)", before == 0 and after == 1)
    right = 0
    total = dinfo["n"]
    for qi in range(1, total):
        wd = page.evaluate("WORDS[dq.list[dq.idx].id][0].toLowerCase()")
        if qi % 3 != 0:
            for ch in wd:
                idx = page.evaluate("ch=>{const q=dq.list[dq.idx];return q.tiles.findIndex((t,i)=>t===ch&&!q.used[i]);}", ch)
                page.locator("#dcTiles .tile").nth(idx).click()
            right += 1
        else:
            page.locator("#dcTiles .tile:not(.del)").first.click()
            page.locator("#dcTiles .tile.del").click()  # back-delete works
            page.locator("#dcTiles .tile:not(.del)").first.click()
        page.click("#dcGo"); page.wait_for_timeout(60)
    page.wait_for_timeout(500)
    graded = page.evaluate("dq?dq.list.filter(q=>q.ok).length:-1")
    check("dictation: grading counts button answers", graded == right, f"graded {graded} expected {right} of {total}")
    page.screenshot(path=str(OUT / "4_dict_result.png"), full_page=True)

    # ---------- sentence making (stage 2 was typing) ----------
    page.evaluate("""()=>{dq=null;const ids=[];for(let i=0;i<WORDS.length&&ids.length<4;i++){const e=String(WORDS[i][2]||'');if(e&&!/[^ -~]/.test(e)){const n=e.split(/\\s+/).length;if(n>=3&&n<=8)ids.push(i);}}cur={session:1,cards:ids,idx:0,quiz:[],qidx:0,correct:0};startMake();}""")
    page.wait_for_timeout(300)
    check("make: no text box", page.evaluate("document.querySelectorAll('#scr-make input').length") == 0)
    parts = page.evaluate("mk.cur.parts")
    def solve():
        for i in range(len(parts)):
            idx = page.evaluate("i=>{const c=mk.cur;return c.tiles.findIndex((t,k)=>t===c.parts[i]&&!c.used[k]);}", i)
            page.locator("#mkTiles .wtile").nth(idx).click()
    solve(); page.click("#mkGo"); page.wait_for_timeout(200)
    check("make stage1: solved", page.evaluate("mk.cur.done&&mk.cur.ok"))
    page.click("#mkGo"); page.wait_for_timeout(200)
    s2 = page.evaluate("({stage:mk.cur.stage,tiles:mk.cur.tiles.length,parts:mk.cur.parts.length,dir:document.getElementById('mkDir').textContent,lad:document.getElementById('mkLad').textContent})")
    check("make stage2: korean prompt + 2 decoy words", s2["stage"] == 2 and s2["tiles"] == s2["parts"] + 2, json.dumps(s2, ensure_ascii=False))
    page.screenshot(path=str(OUT / "5_make_stage2.png"))
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("make: no horizontal scroll", sw <= 412, f"scrollWidth {sw}")
    # wrong first: fill with decoys first
    for k in range(s2["parts"]):
        page.locator("#mkTiles .wtile:not(.used):not(.del)").last.click()
    page.click("#mkGo"); page.wait_for_timeout(200)
    ans_vis = page.evaluate("getComputedStyle(document.getElementById('mkAns')).display!=='none'")
    wrong_ok = page.evaluate("!mk.cur.done")
    check("make stage2: wrong -> retry + 답 button shows", ans_vis and wrong_ok)
    page.click("#mkAns"); page.wait_for_timeout(200)
    st = page.evaluate("({done:mk.cur.done,go:getComputedStyle(document.getElementById('mkGo')).display,slots:mk.cur.slots.join(' '),ex:mk.cur.it.ex})")
    check("make stage2: 답 reveals sentence, 확인 hidden", st["done"] and st["go"] == "none" and st["slots"] == st["ex"].replace("  ", " "), json.dumps(st, ensure_ascii=False))
    page.click("#mkNext"); page.wait_for_timeout(200)
    parts = page.evaluate("mk.cur.parts")
    solve(); page.click("#mkGo"); page.click("#mkGo"); page.wait_for_timeout(200)
    solve(); page.click("#mkGo"); page.wait_for_timeout(200)
    check("make stage2: solved by buttons", page.evaluate("mk.cur.stage===2&&mk.cur.done&&mk.cur.ok"))
    page.screenshot(path=str(OUT / "6_make_ok.png"))

    # ---------- photo subject / kind buttons ----------
    page.evaluate("()=>{mk=null;goHome();shotChips();document.getElementById('shotForm').style.display='';}")
    subj = page.inner_text("#shotSubj"); kind = page.inner_text("#shotKind")
    check("photo: 역사 subject + 예습 kind", "역사" in subj and "예습" in kind, subj.replace("\n", " ") + " / " + kind.replace("\n", " "))

    check("page errors 0", len(errors) == 0, "; ".join(errors)[:300])
    print("blocked network:", len(blocked), sorted(set(u.split('/')[2] for u in blocked if '//' in u))[:5])
    br.close()

print(f"RESULT {sum(1 for _,o in res if o)}/{len(res)}")
