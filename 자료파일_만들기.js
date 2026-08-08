/* curriculum.js 를 읽어 노드마다 학습방법 파일(.md)을 만든다.
   이미 있는 파일은 건드리지 않는다 — 마음 놓고 여러 번 돌려도 된다.

   쓰는 법 (프로젝트 폴더에서):  node 자료파일_만들기.js
   새 노드를 curriculum.js 에 추가한 뒤 한 번 돌리면 파일이 생긴다.        */

const fs = require("fs");
const path = require("path");

const root = __dirname;
const src = fs.readFileSync(path.join(root, "curriculum.js"), "utf8");
const CURRICULUM = new Function(src + "\nreturn CURRICULUM;")();

let made = 0, kept = 0;

CURRICULUM.subjects.forEach(function (subj) {
  const dir = path.join(root, "curriculum", subj.id);
  fs.mkdirSync(dir, { recursive: true });

  subj.units.forEach(function (unit) {
    unit.nodes.forEach(function (node) {
      const file = path.join(dir, node.id + ".md");
      if (fs.existsSync(file)) { kept++; return; }

      const body = [
        "# " + node.title,
        "",
        subj.name + " · " + unit.name + " · " + node.min + "분",
        "",
        "> " + node.desc,
        "> 통과 기준: " + node.check,
        "",
        "## 학습방법",
        ...node.how.map(function (h) { return "- " + h; }),
        "",
        "## 자료 · 문제",
        "",
        "(교과서·문제집에서 뽑은 것을 여기에 붙여넣는다)",
        "",
        "## 아이가 막힌 곳",
        "",
        "(날짜와 함께 짧게. 여기 쌓인 게 다음 달 계획의 근거가 된다)",
        ""
      ].join("\n");

      fs.writeFileSync(file, body, "utf8");
      made++;
    });
  });
});

console.log("만든 파일 " + made + "개, 그대로 둔 파일 " + kept + "개");
