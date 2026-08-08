/* ==========================================================
   자료가져오기.js — 아이가 앱에서 찍은 자료 사진을 PC로 내려받는다.

   쓰는 법 (프로젝트 폴더에서):
     node 자료가져오기.js CAT-XXXXXX
     node 자료가져오기.js CAT-XXXXXX --비우기     ← 내려받은 뒤 서버에서 지움

   결과:
     자료수집/2026-08-08_수학_문제집42쪽_s1a2b3.jpg
     자료수집/목록.json      ← 사진마다 과목·용도·제목·날짜

   가족 코드는 아이 앱 [설정 > 엄마 모드 > 기록 공유]에 있는 코드다.
   한 번 쓴 코드는 자료수집/.코드 에 기억해 두므로 다음부터는 인자 없이 실행해도 된다.
   ========================================================== */

const fs = require("fs");
const path = require("path");

const SB = {
  url: "https://wlkyqgfpoenyumudpxle.supabase.co",
  key: "sb_publishable_fPJ7glllJc9KqdDZmMIwXg_F01uTH5y"
};
const OUT = path.join(__dirname, "자료수집");
const CODE_FILE = path.join(OUT, ".코드");
const KINDS = { memo: "외울내용", book: "문제집", exam: "시험범위", etc: "보관" };

function rpc(fn, body) {
  return fetch(SB.url + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SB.key,
      Authorization: "Bearer " + SB.key
    },
    body: JSON.stringify(body)
  }).then(async function (r) {
    const t = await r.text();
    if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
    return t ? JSON.parse(t) : null;
  });
}

function safe(s) {
  return String(s || "").replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

function resolveCode(argv) {
  const fromArg = argv.find(function (a) { return /^CAT-/i.test(a); });
  if (fromArg) return fromArg.toUpperCase();
  try { return fs.readFileSync(CODE_FILE, "utf8").trim().toUpperCase(); } catch (e) { return ""; }
}

async function main() {
  const argv = process.argv.slice(2);
  const wipe = argv.includes("--비우기") || argv.includes("--wipe");
  const code = resolveCode(argv);

  if (!/^CAT-[A-Z0-9]{6}$/.test(code)) {
    console.error("가족 코드가 필요해요.  예)  node 자료가져오기.js CAT-AB12CD");
    console.error("코드는 아이 앱 [설정 > 엄마 모드 > 기록 공유]에 있어요.");
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(CODE_FILE, code, "utf8");

  const rows = await rpc("catshot_list", { p_code: code });
  if (!rows || !rows.length) {
    console.log("아직 올라온 자료가 없어요. (코드: " + code + ")");
    return;
  }
  console.log("서버에 자료 " + rows.length + "장 — 코드 " + code);

  // 이미 받아 둔 파일은 건너뛴다 (파일명에 사진 id 가 들어 있다)
  const have = new Set();
  fs.readdirSync(OUT).forEach(function (f) {
    const m = f.match(/_(s[a-z0-9]+)\.jpg$/i);
    if (m) have.add(m[1]);
  });

  const index = [];
  let got = 0;

  for (const r of rows) {
    const meta = r.meta || {};
    const name = [
      meta.d || String(r.created_at || "").slice(0, 10),
      safe(meta.subj || "기타"),
      safe(meta.title || KINDS[meta.kind] || "자료"),
      r.id
    ].join("_") + ".jpg";

    index.push({
      file: name, id: r.id, 과목: meta.subj || "", 용도: KINDS[meta.kind] || meta.kind || "",
      제목: meta.title || "", 찍은날: meta.d || "", 올린때: r.created_at
    });

    if (have.has(r.id)) continue;

    const dataUrl = await rpc("catshot_get", { p_code: code, p_id: r.id });
    if (!dataUrl) { console.log("  ! " + r.id + " — 사진이 비어 있어요"); continue; }
    const b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, "base64"));
    got++;
    console.log("  + " + name);
  }

  fs.writeFileSync(path.join(OUT, "목록.json"),
    JSON.stringify({ code: code, 받은때: new Date().toISOString(), 자료: index }, null, 2), "utf8");

  console.log("새로 받은 것 " + got + "장 / 전체 " + rows.length + "장 → 자료수집\\");

  if (wipe) {
    for (const r of rows) await rpc("catshot_del", { p_code: code, p_id: r.id });
    console.log("서버에서 " + rows.length + "장을 지웠어요 (PC 파일은 그대로).");
  }
}

main().catch(function (e) {
  console.error("실패:", e.message);
  console.error("supabase-자료.sql 을 Supabase 에서 Run 했는지 확인해 주세요.");
  process.exit(1);
});
