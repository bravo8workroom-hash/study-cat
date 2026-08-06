/* 로드맵 2단계 패치 — 공부하는 고양이 v2 (수학 기본 연산 + 주간 복습) */
window.PATCH2 = (function(){

var CSS = `
/* ---------- 수학(2단계) ---------- */
#mWord{font-size:26px;line-height:1.35;text-align:center}
.solve{display:none;margin-top:14px}
.solve.on{display:block}
.sline{background:rgba(253,254,255,.09);border:1px solid rgba(253,254,255,.16);border-radius:18px;padding:12px 14px;font-size:15px;font-weight:700;line-height:1.5;margin-bottom:8px}
.solvebtn{width:100%;border-radius:999px;border:1.5px dashed rgba(254,182,134,.65);background:transparent;color:var(--orange);font-weight:800;font-size:15px;padding:13px;margin-bottom:10px}
.mstrip{background:var(--paper);color:var(--ink);border-radius:26px;padding:14px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px;text-align:left}
.mstrip img{width:46px;height:46px;object-fit:contain;flex:none}
.mstrip .t{font-size:15px;font-weight:800;line-height:1.3}
.mstrip .d{font-size:13px;font-weight:600;color:var(--mist);margin-top:3px;line-height:1.4}
.mstrip .go{margin-left:auto;font-size:16px;font-weight:800;flex:none}
.ladder{display:flex;gap:4px;margin-top:9px}
.rung{height:6px;flex:1;border-radius:999px;background:rgba(25,22,43,.13)}
.rung.f{background:var(--orange)}
`;

var SCREENS = `
  <!-- ============ 계산 연습 / 출발점 찾기 ============ -->
  <section class="screen" id="scr-math">
    <div class="topbar">
      <button class="back" onclick="goHome()">←</button>
      <div class="ptrack"><div class="pfill" id="mathFill"></div></div>
      <div class="pcount" id="mathCount"></div>
    </div>
    <div class="qword">
      <img src="{{CAT_calc}}" alt="">
      <div class="dir" id="mDir"></div>
      <div class="word" id="mWord"></div>
    </div>
    <div id="mOpts"></div>
    <div class="fb" id="mFb"></div>
    <div class="solve" id="mSolve"></div>
    <button class="bigbtn o" id="mNext" style="width:100%;display:none" onclick="mathNext()">다음 →</button>
  </section>

`;

var ENGINE = `/* ================= 수학 사다리 (2단계) ================= */
const M_LEVELS=[
  {n:1,name:"자연수 사칙연산"},
  {n:2,name:"분수 약분과 덧셈·뺄셈"},
  {n:3,name:"분수 곱셈·나눗셈"},
  {n:4,name:"소수 사칙연산"},
  {n:5,name:"정수(음수) 계산"},
  {n:6,name:"문자식 정리와 대입"},
  {n:7,name:"일차방정식"}
];
const DIAG_PLAN=[["자연수",1,4],["분수",2,4],["소수",4,3],["정수",5,3],["문자식",6,3],["방정식",7,3]];

function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;}
function fr(n,d){const g=gcd(n,d);n=n/g;d=d/g;if(d<0){n=-n;d=-d;}return d===1?String(n):n+"/"+d;}
function dc(x){return Math.round(x*100)/100;}
function jitter(ans,t){
  if(/^-?\\d+(\\.\\d+)?$/.test(ans)){return String(dc(parseFloat(ans)+t*(t%2?1:-1)));}
  const m=ans.match(/^(-?\\d+)\\/(\\d+)$/);if(m)return (Number(m[1])+t)+"/"+m[2];
  const x=ans.match(/^(-?\\d+)x$/);if(x)return (Number(x[1])+t)+"x";
  return ans+"  ".slice(0,t);
}
function opts4(ans,cands){
  const out=[];
  (cands||[]).forEach(c=>{if(c&&c!==ans&&c!=="NaN"&&out.indexOf(c)<0)out.push(c);});
  let t=1;while(out.length<3&&t<40){const v=jitter(ans,t++);if(v!==ans&&out.indexOf(v)<0)out.push(v);}
  return shuffle([ans].concat(out.slice(0,3)));
}

function g1(){
  const op=["+","-","×","÷"][ri(0,3)];
  if(op==="+"){
    const a=ri(14,89),b=ri(14,89),s=a+b,ta=Math.floor(a/10)*10,tb=Math.floor(b/10)*10;
    return {q:a+" + "+b,a:String(s),wrong:[String(s+ri(1,9)),String(s-ri(1,9)),String(s+10)],
      steps:["십의 자리끼리 먼저: "+ta+" + "+tb+" = "+(ta+tb),
             "일의 자리끼리: "+(a%10)+" + "+(b%10)+" = "+((a%10)+(b%10)),
             "둘을 합치면 "+s]};
  }
  if(op==="-"){
    const a=ri(45,99),b=ri(13,a-8),s=a-b;
    return {q:a+" - "+b,a:String(s),wrong:[String(s+ri(1,9)),String(s-ri(1,9)),String(s+10)],
      steps:[b+"를 한 번에 빼기 어려우면 나눠서 빼자",
             a+" - "+Math.floor(b/10)*10+" = "+(a-Math.floor(b/10)*10),
             "여기서 "+(b%10)+"을 더 빼면 "+s]};
  }
  if(op==="×"){
    const a=ri(3,19),b=ri(3,12),s=a*b,b1=Math.floor(b/2),b2=b-b1;
    return {q:a+" × "+b,a:String(s),wrong:[String(s+a),String(s-a),String(a*(b+1)+1)],
      steps:[b+"을 "+b1+"과 "+b2+"로 쪼개 보자",
             a+" × "+b1+" = "+(a*b1)+" , "+a+" × "+b2+" = "+(a*b2),
             "두 값을 더하면 "+s]};
  }
  const b=ri(2,9),s=ri(3,12),a=b*s;
  return {q:a+" ÷ "+b,a:String(s),wrong:[String(s+1),String(s-1),String(s+2)],
    steps:[b+"에 몇을 곱하면 "+a+"이 될까?",
           b+" × "+(s-1)+" = "+(b*(s-1))+" 은 아직 작아",
           b+" × "+s+" = "+a+" 이니까 답은 "+s]};
}
function g2(){
  if(Math.random()<0.5){
    const d0=ri(3,9),n0=ri(1,d0-1),k=ri(2,6),n=n0*k,d=d0*k;
    return {q:n+"/"+d+" 를 가장 간단하게",a:fr(n0,d0),wrong:[fr(n0*2,d0*2+1),(n0+1)+"/"+d0,n0+"/"+(d0+1)],
      steps:["분자 "+n+"과 분모 "+d+"를 같은 수로 나눌 수 있어",
             "둘 다 "+k+"로 나누면 "+n+"÷"+k+" = "+n0+", "+d+"÷"+k+" = "+d0,
             "그래서 "+fr(n0,d0)]};
  }
  const d1=ri(2,7),k=ri(1,3)===1?1:ri(2,3),d2=d1*k;
  const n1=ri(1,d1-1||1),n2=ri(1,d2-1||1),plus=Math.random()<0.6;
  const num=plus?(n1*k+n2):(n1*k-n2);
  return {q:n1+"/"+d1+(plus?" + ":" - ")+n2+"/"+d2,a:fr(num,d2),
    wrong:[fr(n1+n2,d1+d2),(num+1)+"/"+d2,fr(num,d1)],
    steps:["분모가 다르면 먼저 같게 만들자",
           n1+"/"+d1+" = "+(n1*k)+"/"+d2+" (위아래 "+k+"배)",
           (n1*k)+(plus?" + ":" - ")+n2+" = "+num+" 이니까 "+fr(num,d2)]};
}
function g3(){
  const a=ri(1,7),b=ri(2,9),c=ri(1,7),d=ri(2,9);
  if(Math.random()<0.55){
    return {q:a+"/"+b+" × "+c+"/"+d,a:fr(a*c,b*d),wrong:[fr(a+c,b+d),fr(a*d,b*c),(a*c)+"/"+(b+d)],
      steps:["분수 곱셈은 분자끼리, 분모끼리 곱해",
             "분자 "+a+"×"+c+" = "+(a*c)+" , 분모 "+b+"×"+d+" = "+(b*d),
             "약분하면 "+fr(a*c,b*d)]};
  }
  return {q:a+"/"+b+" ÷ "+c+"/"+d,a:fr(a*d,b*c),wrong:[fr(a*c,b*d),fr(a+d,b+c),(a*d)+"/"+(b+c)],
    steps:["나눗셈은 뒤 분수를 뒤집어서 곱하기",
           a+"/"+b+" × "+d+"/"+c,
           "분자 "+(a*d)+", 분모 "+(b*c)+" → "+fr(a*d,b*c)]};
}
function d10(){let v=ri(11,99);if(v%10===0)v+=ri(1,9);return dc(v/10);}
function g4(){
  const r=Math.random();
  if(r<0.45){
    const a=d10(),b=d10(),plus=Math.random()<0.6,s=dc(plus?a+b:Math.abs(a-b));
    const x=plus?a:Math.max(a,b),y=plus?b:Math.min(a,b);
    return {q:x+(plus?" + ":" - ")+y,a:String(s),wrong:[String(dc(s+0.1)),String(dc(s-0.1)),String(dc(s+1))],
      steps:["소수점 위치를 딱 맞춰 세로로 쓰자",
             "소수점을 빼고 "+Math.round(x*10)+(plus?" + ":" - ")+Math.round(y*10)+" = "+Math.round(dc(plus?x+y:x-y)*10),
             "소수점 한 자리를 되돌리면 "+s]};
  }
  const a=d10(),b=ri(2,9),s=dc(a*b);
  return {q:a+" × "+b,a:String(s),wrong:[String(dc(s*10)),String(dc(s/10)),String(dc(s+b))],
    steps:["소수점을 잠깐 치우고 계산해 보자",
           Math.round(a*10)+" × "+b+" = "+Math.round(a*10)*b,
           "소수점 한 자리를 다시 넣으면 "+s]};
}
function g5(){
  const ops=["+","-","×"],op=ops[ri(0,2)];
  let a=ri(-19,19)||-7,b=ri(-15,15)||6;
  if(op==="×"){a=ri(-9,9)||-4;b=ri(-9,9)||3;}
  const s=op==="+"?a+b:op==="-"?a-b:a*b;
  const bs=b<0?"("+b+")":String(b);
  return {q:a+" "+op+" "+bs,a:String(s),wrong:[String(-s),String(s+1),String(s-2)],
    steps:op==="×"?["부호끼리 먼저: 같으면 +, 다르면 -",
                    "숫자만 보면 "+Math.abs(a)+" × "+Math.abs(b)+" = "+Math.abs(a*b),
                    "부호를 붙이면 "+s]
                 :["수직선에서 "+a+"에서 출발해",
                   (op==="+"?b+"만큼 ":"반대로 "+b+"만큼 ")+(s>a?"오른쪽":"왼쪽")+"으로 이동",
                   "도착한 곳이 "+s]};
}
function g6(){
  if(Math.random()<0.5){
    const a=ri(2,9),b=ri(2,9),plus=Math.random()<0.65,s=plus?a+b:a-b;
    return {q:a+"x "+(plus?"+":"-")+" "+b+"x 를 간단히",a:s+"x",wrong:[(a*b)+"x",(plus?a+b:b-a)+"x",String(s)],
      steps:["x가 붙은 것끼리는 같은 종류(동류항)야",
             "x를 물건이라 보면 "+a+"개 "+(plus?"+":"-")+" "+b+"개",
             "= "+s+"개 → "+s+"x"]};
  }
  const x=ri(2,7),a=ri(2,6),b=ri(1,12),plus=Math.random()<0.7,s=plus?a*x+b:a*x-b;
  return {q:"x = "+x+" 일 때, "+a+"x "+(plus?"+":"-")+" "+b,a:String(s),
    wrong:[String(a+x+(plus?b:-b)),String(s+a),String(plus?a*x-b:a*x+b)],
    steps:["x 자리에 "+x+"를 그대로 넣어",
           a+" × "+x+" = "+(a*x),
           (a*x)+" "+(plus?"+":"-")+" "+b+" = "+s]};
}
function g7(){
  const a=ri(2,7),x=ri(2,12),b=ri(1,20),plus=Math.random()<0.6,c=plus?a*x+b:a*x-b;
  return {q:a+"x "+(plus?"+":"-")+" "+b+" = "+c+" 에서 x",a:String(x),
    wrong:[String(x+1),String(x-1),String(c-b)],
    steps:["x만 남기려면 먼저 숫자를 반대로 넘겨",
           a+"x = "+c+" "+(plus?"-":"+")+" "+b+" = "+(a*x),
           "양쪽을 "+a+"로 나누면 x = "+x]};
}
const M_GEN=[g1,g2,g3,g4,g5,g6,g7];
function genMath(lv){const p=M_GEN[Math.min(6,Math.max(0,lv-1))]();p.lv=lv;return p;}

function mathLevel(){return (S.math&&S.math.level)||1;}
function recentAcc(){
  const h=(S.math.hist||[]).slice(-20);
  if(!h.length)return null;
  return h.reduce((a,b)=>a+b,0)/h.length;
}
function pickLevel(){
  const L=mathLevel();
  if(S.math.mix&&L>1&&Math.random()<0.4)return L-1;
  return L;
}
function buildMathSet(n){
  const out=[];
  for(let i=0;i<n;i++){const p=genMath(pickLevel());p.type="math";p.opts=opts4(p.a,p.wrong);out.push(p);}
  return out;
}
function buildEngSet(n){
  const ids=Object.keys(S.words).map(Number);
  if(!ids.length)return [];
  return shuffle(ids).slice(0,n).map(id=>{
    const w=WORDS[id];
    const pool=shuffle(WORDS.map((_,i)=>i).filter(i=>i!==id)).slice(0,3);
    return {type:"eng",id:id,q:w[0],dir:"무슨 뜻일까?",a:w[1],
      opts:shuffle([w[1]].concat(pool.map(i=>WORDS[i][1]))),steps:[w[2],w[3]]};
  });
}
function buildDiag(){
  const out=[];
  DIAG_PLAN.forEach(function(row,ai){
    const n=row[2];
    for(let i=0;i<n;i++){
      const lv=(ai===1&&i>=2)?3:row[1];
      const p=genMath(lv);p.type="math";p.area=ai;p.areaName=row[0];p.opts=opts4(p.a,p.wrong);out.push(p);
    }
  });
  return out;
}

function sessionKind(k){
  const d=new Date((k||todayKey())+"T00:00:00").getDay();
  if(d===6)return "week";
  if(d===2||d===4)return "math";
  return "eng";
}
function mathDesc(){
  if(!S.math.diagDone)return "출발점 찾기 20문제 · 딱 맞는 단계 찾기";
  return mathLevel()+"단계 "+M_LEVELS[mathLevel()-1].name+" · 10문제";
}
function renderMathStrip(){
  const el=$("mathStrip");if(!el)return;
  const done=S.math.diagDone,acc=recentAcc();
  let rungs="";for(let i=1;i<=7;i++)rungs+='<div class="rung'+(i<=mathLevel()?" f":"")+'"></div>';
  const t=done?("수학 사다리 "+mathLevel()+"단계 · "+M_LEVELS[mathLevel()-1].name):"아직 출발점을 안 찾았어";
  const d=done?(acc===null?"화·목 세션 2에서 계산 연습을 해":"최근 정답률 "+Math.round(acc*100)+"% · 화·목에 계산 연습")
              :"20문제만 풀면 너에게 딱 맞는 단계를 찾아줄게";
  el.innerHTML='<div class="mstrip"'+(done?"":' style="cursor:pointer"')+'><img src="'+CATS.calc+'"><div style="flex:1"><div class="t">'+t+'</div><div class="d">'+d+'</div><div class="ladder">'+rungs+'</div></div><div class="go">'+(done?"":"▶")+'</div></div>';
  if(!done)el.querySelector(".mstrip").onclick=function(){startDiag();};
}

let mc={mode:"math",list:[],idx:0,correct:0,locked:false};
function startMath(kind){
  if(!S.math.diagDone){startDiag();return;}
  mc={mode:kind==="week"?"week":"math",list:[],idx:0,correct:0,locked:false,promoted:false};
  mc.list=kind==="week"?shuffle(buildMathSet(6).concat(buildEngSet(6))):buildMathSet(10);
  if(!mc.list.length){toast("문제를 만들지 못했어. 다시 해 볼까?");return;}
  showMathQ();
}
function startDiag(){
  mc={mode:"diag",list:buildDiag(),idx:0,correct:0,locked:false,skip:{},wrongRun:0,lastArea:-1,areaScore:{}};
  showMathQ();
}
function showMathQ(){
  if(mc.mode==="diag"){while(mc.idx<mc.list.length&&mc.skip[mc.list[mc.idx].area])mc.idx++;}
  if(mc.idx>=mc.list.length){return mc.mode==="diag"?finishDiag():finishMath();}
  const p=mc.list[mc.idx];
  mc.locked=false;mc.stepsLeft=null;
  if(mc.mode==="diag"&&p.area!==mc.lastArea){mc.wrongRun=0;mc.lastArea=p.area;}
  $("mathFill").style.width=Math.round(mc.idx/mc.list.length*100)+"%";
  $("mathCount").textContent=(mc.idx+1)+"/"+mc.list.length;
  $("mDir").textContent=p.type==="eng"?"영어 · "+p.dir:(mc.mode==="diag"?p.areaName+" 알아보기":M_LEVELS[p.lv-1].name);
  $("mWord").textContent=p.q;
  const box=$("mOpts");box.innerHTML="";
  p.opts.forEach(function(o){
    const b=document.createElement("button");b.className="opt";b.textContent=o;
    b.onclick=function(){mathAnswer(b,o,p);};box.appendChild(b);
  });
  $("mFb").innerHTML="";
  const sv=$("mSolve");sv.className="solve";sv.innerHTML="";
  $("mNext").style.display="none";
  show("scr-math");
}
function mathAnswer(btn,val,p){
  if(mc.locked)return;mc.locked=true;
  const ok=val===p.a;
  document.querySelectorAll("#mOpts .opt").forEach(function(b){
    b.onclick=null;
    if(b.textContent===p.a)b.classList.add("correct");
    else if(b===btn)b.classList.add("wrong");
    else b.classList.add("dim");
  });
  if(ok){mc.correct++;$("mFb").innerHTML='<img src="'+CATS.jump+'">좋아, 맞았어!';}
  else{
    $("mFb").innerHTML='<img src="'+CATS.scratch+'">답은 '+p.a+'. 풀이를 한 줄씩 볼까?';
    openSolve(p);
  }
  if(mc.mode==="diag"){
    mc.areaScore[p.area]=(mc.areaScore[p.area]||0)+(ok?1:0);
    if(ok)mc.wrongRun=0;else{mc.wrongRun++;if(mc.wrongRun>=2){mc.skip[p.area]=true;mc.wrongRun=0;}}
  }else{
    if(p.type==="math"){
      S.math.hist.push(ok?1:0);
      if(S.math.hist.length>60)S.math.hist=S.math.hist.slice(-60);
    }else{
      srs(p.id,ok);
      const lg=dayLog();
      if(!ok&&lg.wrong.indexOf(p.id)<0)lg.wrong.push(p.id);
    }
    const lg2=dayLog();lg2.m[1]++;if(ok)lg2.m[0]++;
    save();
  }
  $("mNext").textContent=(mc.idx+1>=mc.list.length)?"끝내기 →":"다음 →";
  $("mNext").style.display="block";
}
function openSolve(p){
  const sv=$("mSolve");sv.className="solve on";
  mc.stepsLeft=(p.steps||[]).slice();
  if(!mc.stepsLeft.length){sv.className="solve";return;}
  sv.innerHTML='<button class="solvebtn" onclick="nextStep()">풀이 한 줄 보기</button>';
}
function nextStep(){
  const sv=$("mSolve"),btn=sv.querySelector(".solvebtn");
  const line=mc.stepsLeft&&mc.stepsLeft.length?mc.stepsLeft.shift():null;
  if(line===null){if(btn)btn.remove();return;}
  const d=document.createElement("div");d.className="sline";d.textContent=line;
  sv.insertBefore(d,btn);
  if(!mc.stepsLeft.length&&btn){btn.textContent="이해했어!";btn.onclick=function(){btn.remove();};}
}
function mathNext(){mc.idx++;mc.locked=false;showMathQ();}

function checkPromotion(){
  mc.promoted=false;
  const acc=recentAcc(),h=(S.math.hist||[]);
  if(acc===null)return;
  const t=todayKey();
  if(h.length>=10&&acc>=0.8){
    if(S.math.hi.indexOf(t)<0)S.math.hi.push(t);
    if(S.math.hi.indexOf(addDays(t,-1))>=0&&S.math.level<7){
      S.math.level++;S.points+=100;S.math.hi=[];S.math.hist=[];S.math.mix=false;mc.promoted=true;
    }
    if(S.math.hi.length>6)S.math.hi=S.math.hi.slice(-6);
  }
  if(h.length>=10){ if(acc<0.5)S.math.mix=true; else if(acc>=0.65)S.math.mix=false; }
}
function finishMath(){
  const total=mc.list.length,acc=total?Math.round(mc.correct/total*100):0;
  let extra=0;
  if(mc.mode==="week"){const lg=dayLog();if(!lg.wk){lg.wk=true;extra=50;S.points+=50;}}
  checkPromotion();save();
  cur={session:2,cards:[],idx:0,quiz:new Array(total).fill(0),qidx:0,correct:mc.correct};
  finishSession();
  $("doneCat").src=mc.mode==="week"?CATS.trophy:CATS.calc;
  $("doneTitle").textContent=mc.mode==="week"?"주간 복습 끝!":"계산 연습 끝!";
  let msg="정답률 "+acc+"%";
  if(extra)msg+=" · 주간 복습 보너스 +50P";
  if(mc.promoted)msg+=" · 사다리 "+mathLevel()+"단계로 올라갔어! +100P";
  else if(acc>=80)msg+=" · 이 속도면 곧 한 칸 올라가";
  $("doneMsg").textContent=msg;
  if(mc.promoted)setTimeout(function(){toast("사다리 "+mathLevel()+"단계 도착! +100P");},900);
}
function finishDiag(){
  let lvl=1;
  for(let i=0;i<DIAG_PLAN.length;i++){
    const n=DIAG_PLAN[i][2],sc=mc.areaScore[i]||0;
    if(mc.skip[i]||sc<Math.ceil(n*0.6))break;
    lvl=DIAG_PLAN[i+1]?DIAG_PLAN[i+1][1]:7;
  }
  lvl=Math.min(7,Math.max(1,lvl));
  S.math.diagDone=true;S.math.level=lvl;S.math.hist=[];S.math.hi=[];S.math.mix=false;
  S.points+=30;save();
  $("doneCat").src=CATS.calc;
  $("doneTitle").textContent="출발점을 찾았어!";
  $("donePoint").innerHTML="+30<small>P</small>";
  $("doneMsg").textContent="너한테 딱 맞는 시작은 "+lvl+"단계 · "+M_LEVELS[lvl-1].name+". 여기서부터 한 칸씩 올라가 보자!";
  const card=$("doneCard");card.classList.remove("pop");void card.offsetWidth;card.classList.add("pop");
  show("scr-done");
}

`;

return [
 {find:"\n</style>", replace:CSS+"</style>"},
 {find:'</div>\n\n<nav><div class="navin">', replace:SCREENS+'</div>\n\n<nav><div class="navin">'},
 {find:'sleeplap:"{{CAT_sleeplap}}", quiz:"{{CAT_quiz}}", sleep:"{{CAT_sleep}}"',
  replace:'sleeplap:"{{CAT_sleeplap}}", quiz:"{{CAT_quiz}}", sleep:"{{CAT_sleep}}",\n  calc:"{{CAT_calc}}", gift:"{{CAT_gift}}"'},
 {find:'function defState(){return {points:0,streak:0,lastActive:null,words:{},log:{},settings:{name:"",newPerDay:7}};}',
  replace:'function defState(){return {points:0,streak:0,lastActive:null,words:{},log:{},settings:{name:"",newPerDay:7},math:{level:1,diagDone:false,hist:[],hi:[],mix:false}};}\nfunction migrate(){\n  if(!S.settings)S.settings={name:"",newPerDay:7};\n  if(!S.math)S.math={level:1,diagDone:false,hist:[],hi:[],mix:false};\n  if(!S.math.hist)S.math.hist=[];\n  if(!S.math.hi)S.math.hi=[];\n  if(typeof S.math.level!=="number")S.math.level=1;\n  if(!S.log)S.log={};\n  Object.keys(S.log).forEach(function(k){var l=S.log[k];if(!l.m)l.m=[0,0];if(l.wk===undefined)l.wk=false;});\n}'},
 {find:'function load(){try{S=JSON.parse(localStorage.getItem("catstudy"))||defState();}catch(e){S=defState();}}',
  replace:'function load(){try{S=JSON.parse(localStorage.getItem("catstudy"))||defState();}catch(e){S=defState();}migrate();}'},
 {find:'if(!S.log[k])S.log[k]={s:[false,false,false],newIds:[],wrong:[],quiz:[0,0]};return S.log[k];',
  replace:'if(!S.log[k])S.log[k]={s:[false,false,false],newIds:[],wrong:[],quiz:[0,0],m:[0,0],wk:false};if(!S.log[k].m)S.log[k].m=[0,0];return S.log[k];'},
 {find:'<div id="sessionList"></div>', replace:'<div id="sessionList"></div>\n    <div id="mathStrip"></div>'},
 {find:'    if(sd.n===2)desc="오늘 단어 + 복습 "+dueN+"개";',
  replace:'    let catKey=sd.cat,ttl=sd.title;\n    if(sd.n===2){\n      const k=sessionKind();\n      if(k==="math"){ttl="계산 연습";desc=mathDesc();catKey="calc";}\n      else if(k==="week"){ttl="주간 복습";desc="영어+수학 미니 복습 · +50P";catKey="trophy";}\n      else desc="오늘 단어 + 복습 "+dueN+"개";\n    }'},
 {find:'    b.innerHTML=\'<img src="\'+CATS[sd.cat]+\'"><div><div class="t">세션 \'+sd.n+\' · \'+sd.title+\'</div>',
  replace:'    b.innerHTML=\'<img src="\'+CATS[catKey]+\'"><div><div class="t">세션 \'+sd.n+\' · \'+ttl+\'</div>'},
 {find:'  $("homeTip").innerHTML=', replace:'  renderMathStrip();\n  $("homeTip").innerHTML='},
 {find:'  }else if(n===2){\n    const today=dayLog().newIds.filter(id=>S.words[id]);',
  replace:'  }else if(n===2){\n    const kind=sessionKind();\n    if(kind!=="eng"){startMath(kind);return;}\n    const today=dayLog().newIds.filter(id=>S.words[id]);'},
 {find:'/* ================= 내비 ================= */', replace:ENGINE+'/* ================= 내비 ================= */'}
];
})();
