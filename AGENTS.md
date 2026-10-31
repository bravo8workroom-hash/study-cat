> **This file is the shared instruction set read by every AI (Claude, Codex, others).** For Claude, `CLAUDE.md` pulls this file in (`@AGENTS.md`); Codex reads this file directly. **Write rules only here** — rules written in `CLAUDE.md` are invisible to other AIs. Global rules are in `~\.claude\CLAUDE.md` (§0-0 has the translation table for other AIs) · the workspace map is `~\vault-workspace\WORKSPACE_MASTER.md` · the skill list is `~\vault-workspace\스킬목록.md`.

# Child learning program — working instructions

## ⛔ Absolute principle — no personal information or child data in a public repository (confirmed by the user 2026-08-09)
This repository is **public** because of GitHub Pages. Never commit personal information, the child's learning data, or student records in any form.
- **The original of all child data is the private Supabase** (plans · student records · performance records · photos). Locally, only the 「캣샘」's working copy is kept briefly, and it is never put into git.
- Forbidden targets: 학생기록.json, 계획.json, 캣샘도구.js, 자료수집/, export-*.json, and every file containing the child's name, photos or records.
- Even if .gitignore blocks them, `git add -f` is absolutely forbidden. **Right before committing, check with `git status` that no child-data file is staged** — this is part of the commit procedure.
- When creating a new file that will hold child data, add it to .gitignore **before creating the file**.
- If something was committed or pushed by mistake, immediately remove it from the public history by rewriting history (force push) and report to the user.

## Target
- A 중1 (Grade 1 of middle school) boy. English from the basics (elementary level), math is basic-skills reinforcement in progress.
- Since his interest in studying is low, questions, explanations and coaching phrases are short, easy, and in a tone that does not nag.

## Project files
- `설계문서.md` — the overall design. The standard for every feature judgment. Before building a new feature, always read the relevant section.
- `다음단계_개발지시서.md` — current implementation state and the remaining roadmap.
- `앱/공부하는고양이.html` — the app actually in use. When editing, follow the 「App editing rules」 below.

## App editing rules
1. Keep a single HTML file. No server, installation or external dependencies (except the font CDN).
2. Design: dark-navy #19162B background, card #FDFEFF, accent #FEB686 (orange) · #FFE9C3 (cream), secondary #4D4C6B · #6A6986. Blob (round organic curves) style.
3. **The cat is always black, no exception.** No color inversion or tint. On a dark background, put it inside a white/cream circle background.
4. Learning structure: 3 sessions of 20 minutes a day, session 3 is always review. Spaced repetition (1→3→7→14→30 days) applies to every learning item.
5. There is only one localStorage key, `catstudy`. **When changing the structure, put in migration code so existing users' records do not break** (the child's points and streak must not disappear).
6. New content (words · questions) must follow the JSON format of section 11 of the design document.

## 캣샘 (when the user calls 「캣샘」 — workflow confirmed 2026-08-08)
1. Directly read the latest files (photos · 목록.json) in the `자료수집/` folder. If the folder is empty or missing, first download with `node 자료가져오기.js` (it is a Supabase project dedicated to study-cat, so no family-code entry is needed — the fixed code `CAT-STUDY1` is built in, confirmed 2026-08-09).
2. **No duplicate work**: ids written in `자료수집/처리기록.json` are materials for which content was already made — skip them and process only new materials. (If the file does not exist, all are new materials.)
3. From the materials read, generate questions · memorization sets · wrong-answer notes in the **JSON format of section 11 of the design document** (following the 「Content generation rules」 below).
4. Save the result file with the date attached, and guide the user to send it to the app via 설계실 [관리] → [파일 넣기].
5. When generation is done, add the id · date · output file name of the materials processed this time to `자료수집/처리기록.json`.
- Caution: `자료수집/` holds the child's photos, so **never commit** (.gitignore blocks it, `git add -f` is forbidden). In-app UI extensions such as linking homework or per-table-of-contents wrong answers are a withdrawn direction, so do not propose them again — 「캣샘」 (collect → Claude reads directly and generates → load the file) is the confirmed plan.
- However, **moving the management functions to 설계실 is a separate confirmed plan (user's request 2026-08-08)**: from the 설계실.html [관리] panel, remotely operate the app's settings · mom mode · developer menu (the instruction is cmd.ops of the catstudy_plan doc; the app's applyCmd applies it 1회 (once) and replies with S.cmdDone). Putting in files is done properly through 설계실 [파일 넣기] (2026-08-09: the entry points to mom mode and developer menu were removed from the app settings — the developer menu moved to test mode `index.html?test=1`, and the number of new words per day is automatic via autoNewPerDay).

## 캣샘 = overall learning manager (confirmed 2026-08-09 — 「캣샘」 manages directly instead of 설계실 buttons)
설계실.html is a read-only dashboard. Establishing and adjusting plans, judging the child's level, and recording evaluations are all done in conversation between the user and 「캣샘」, and 「캣샘」 reflects them directly through the channels below (the save/load/send/receive buttons of 설계실 were removed at this point — automatic sync).

1. **Learning plan — the server (catstudy_plan) is the original.**
   `node 캣샘도구.js 계획받기` → edit only plan/extra of `계획.json` → `node 캣샘도구.js 계획올리기`.
   The tool takes care of cmd.ops (management instructions) and names (node name tags) by itself, so do not touch them.
   설계실 auto-receives when opened and auto-sends when edited, so no separate operation is needed. 계획.json must not be committed (.gitignore).
2. **Child's performance record**: `node 캣샘도구.js 기록받기` → `자료수집/아이기록.json` (accuracy rate · wrong answers · feedback · points). Never commit.
3. **Student state — the server (private Supabase, code CAT-STUDY2) is the original.** The 설계실 [학생 기록] panel reads directly from the server.
   `node 캣샘도구.js 학생받기` → edit `학생기록.json` → `node 캣샘도구.js 학생올리기`.
   Contents: level (profile.level) · learning direction (direction) · learning-method principles (methods) · evaluation records (evals) · 캣샘 journal (journal).
   - evals and journal are **stacked** with the newest on top (never deleted).
   - level and direction are overwritten, but leave one line in the journal about why it was changed and update `updated`.
   - Just in case, do not write personally identifying information such as the child's name — only level · direction · evaluation content.
4. **Evaluation loop (when the user requests with 「평가」, 「요즘 어때」, etc.)**: 기록받기 → report accuracy · completion · feedback plainly → after 학생받기 add an evaluation and 학생올리기 → if needed propose adjusting the plan · curriculum → reflect when approved.
5. **Curriculum edits**: short learning methods and pass criteria go in curriculum.js, long materials in curriculum/<subject>/<node id>.md. When formally registering a temporary node from 설계실, read the data from the extra of the server doc, put it into curriculum.js, and run `node 자료파일_만들기.js`.
6. **Child data is forbidden in git (user's instruction 2026-08-09, see the absolute principle above)**: the original is the private Supabase — the local copies (학생기록.json · 계획.json · 자료수집/) and 캣샘도구.js are .gitignore targets, `git add -f` is absolutely forbidden. Only code such as curriculum.js is committed and pushed after verification.

## Content generation rules (when making questions and wrong-answer notes)
1. Write explanations in words a 중1 (Grade 1 of middle school) student can read and understand alone. One short sentence at a time.
2. Question variants are of the same type and the same difficulty as the original (or slightly easier). Change only numbers and subject matter.
3. A wrong-answer note is ① the question ② the answer the child wrote ③ why it was wrong ④ the core concept ⑤ the structure of a similar question.
   At the end, one line of coaching 「노트는 이렇게 만드는 거야」 is mandatory.
   Current handover stage: [Weeks 1~3 — write everything] ← edit this line as progress goes
4. Praise and encouragement are plain, without exaggeration. No 「천재네!」; use the style 「어제보다 2개 늘었네」.
5. Read the files in the 자료수집/ folder, and save the result with the date attached.
