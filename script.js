/* 재낭머니 시스템 - 기능 포함: 캡차, 가입, 로그인, 출석, 상점, 랭킹, 관리자 로그, CSV 다운로드 */
var ADMIN_USER = "관리자";
var ADMIN_PASS = "01049457992";

var storeItems = [
  {id:"evt",name:"이벤트 우선참가권",price:50},
  {id:"shoot",name:"촬영 참여권",price:60},
  {id:"rbxfriend",name:"로블록스 친추권",price:80},
  {id:"randbox",name:"랜덤박스",price:100},
  {id:"nameon",name:"이름 화면 표시권",price:40},
  {id:"visitmap",name:"개인맵 방문권",price:120},
  {id:"gametest",name:"게임 테스트 참여권",price:150},
  {id:"pincomment",name:"댓글 고정권",price:90},
  {id:"quest",name:"특별 퀘스트권",price:200}
];

// storage helpers
function loadUsers(){ try{ return JSON.parse(localStorage.getItem('ja_users')||'{}'); }catch(e){return{};} }
function saveUsers(u){ try{ localStorage.setItem('ja_users',JSON.stringify(u)); }catch(e){} }
function loadLogs(){ try{ return JSON.parse(localStorage.getItem('ja_logs')||'[]'); }catch(e){return[];} }
function saveLogs(l){ try{ localStorage.setItem('ja_logs',JSON.stringify(l)); }catch(e){} }

// ensure admin exists
var users = loadUsers();
if(!users[ADMIN_USER]){ users[ADMIN_USER]={pw:ADMIN_PASS,balance:0,lastAttendance:'',items:[]}; saveUsers(users); }

// captcha
var captchaNumber = 0;
function genCaptcha(){ captchaNumber = Math.floor(Math.random()*10000); document.getElementById('captchaNum').innerText = captchaNumber; }
genCaptcha();

// UI helpers
function show(id){ document.getElementById('login').style.display='none'; document.getElementById('register').style.display='none'; document.getElementById('main').style.display='none'; document.getElementById('shop').style.display='none'; document.getElementById('rank').style.display='none'; document.getElementById('admin').style.display='none'; document.getElementById(id).style.display='block'; }
function showRegister(){ show('register'); }
function showLogin(){ show('login'); genCaptcha(); }
function showMain(){ show('main'); renderStore(); updateWelcome(); }
function openShop(){ show('shop'); renderShop(); }
function closeShop(){ show('main'); }
function showRank(){ renderRank(); show('rank'); }
function closeRank(){ show('main'); }

// register
function register(){
  var id = document.getElementById('regUser').value.trim();
  var pw = document.getElementById('regPass').value.trim();
  if(!id || !pw){ alert('아이디와 비밀번호를 입력하세요'); return; }
  var u = loadUsers();
  if(u[id]){ alert('이미 존재하는 아이디입니다'); return; }
  u[id] = {pw:pw,balance:500,lastAttendance:'',items:[]};
  saveUsers(u);
  alert('회원가입 완료! 초기 잔액 500 JN 지급');
  showLogin();
}

// login
function login(){
  var id = document.getElementById('username').value.trim();
  var pw = document.getElementById('password').value.trim();
  var cap = document.getElementById('captchaInput').value.trim();
  if(String(captchaNumber) !== cap){ alert('캡차가 틀렸습니다'); genCaptcha(); return; }
  var u = loadUsers();
  if(id === ADMIN_USER && pw === ADMIN_PASS){
    show('admin'); renderAdmin(); return;
  }
  if(!u[id] || u[id].pw !== pw){ alert('로그인 실패'); genCaptcha(); return; }
  localStorage.setItem('ja_current', id);
  showMain();
}

// logout
function logout(){ localStorage.removeItem('ja_current'); showLogin(); genCaptcha(); }

// render welcome & attendance status
function updateWelcome(){
  var cur = localStorage.getItem('ja_current');
  if(!cur){ showLogin(); return; }
  var u = loadUsers()[cur];
  document.getElementById('welcomeText').innerText = cur + ' 님 환영합니다!';
  document.getElementById('moneyDisplay').innerText = u.balance;
  var today = new Date().toLocaleDateString();
  document.getElementById('attendanceStatus').innerText = (u.lastAttendance === today) ? '오늘 출석 완료' : '아직 출석 전';
}

// attendance
function attendance(){
  var cur = localStorage.getItem('ja_current');
  if(!cur){ alert('로그인 필요'); return; }
  var u = loadUsers();
  var today = new Date().toLocaleDateString();
  if(u[cur].lastAttendance === today){ alert('이미 출석했습니다'); return; }
  u[cur].lastAttendance = today;
  u[cur].balance = (u[cur].balance || 0) + 10;
  saveUsers(u);
  alert('출석 완료! +10 JN');
  updateWelcome();
}

// store rendering (main quick-buy)
function renderStore(){ var cur = localStorage.getItem('ja_current'); var container = document.getElementById('store'); container.innerHTML=''; if(!cur) return; var u = loadUsers()[cur]; storeItems.forEach(function(it){ var div=document.createElement('div'); div.className='item'; div.innerHTML = '<strong>'+it.name+'</strong><br>가격: '+it.price+' JN<br><button onclick="buyItem(\''+it.id+'\')">구매</button>'; container.appendChild(div); }); }

// shop page rendering
function renderShop(){ var list = document.getElementById('storeList'); list.innerHTML=''; storeItems.forEach(function(it){ var row = document.createElement('div'); row.className='item'; row.innerHTML = '<strong>'+it.name+'</strong><br>가격: '+it.price+' JN<br><button onclick="buyItem(\''+it.id+'\')">구매</button>'; list.appendChild(row); }); }

// buy logic
function buyItem(itemId){
  var cur = localStorage.getItem('ja_current'); if(!cur){ alert('로그인 필요'); return; }
  var u = loadUsers(); var me = u[cur]; var it = storeItems.filter(function(x){return x.id===itemId;})[0]; if(!it){ alert('아이템 없음'); return; }
  if((me.balance||0) < it.price){ alert('잔액 부족'); return; }
  me.balance -= it.price; me.items.push(it.id);
  saveUsers(u);
  var logs = loadLogs(); logs.unshift({user:cur,item:it.name,price:it.price,date:(new Date()).toLocaleString()}); saveLogs(logs);
  alert(it.name + ' 구매 완료!');
  updateWelcome();
}

// ranking
function renderRank(){
  var u = loadUsers(); var arr=[]; for(var k in u){ arr.push({name:k,balance:u[k].balance}); } arr.sort(function(a,b){return b.balance-a.balance}); var html=''; for(var i=0;i<arr.length;i++){ html += (i+1)+'. '+arr[i].name+' — '+arr[i].balance+' JN<br>'; } document.getElementById('rankList').innerHTML = html;
}

// admin page
function renderAdmin(){
  var u = loadUsers(); var out=''; for(var k in u){ out += k + ' : ' + (u[k].balance||0) + ' JN\n'; } document.getElementById('userList').innerText = out;
  var logs = loadLogs(); var out2 = logs.length ? logs.map(function(l){return l.date + ' | ' + l.user + ' | ' + l.item + ' | ' + l.price;}).join('\n') : '구매 내역 없음'; document.getElementById('logBox').innerText = out2;
}

// show all users (refresh)
function showAllUsers(){ renderAdmin(); }

// download CSV of logs
function downloadLogs(){
  var logs = loadLogs(); if(logs.length===0){ alert('로그 없음'); return; }
  var csv = 'date,user,item,price\n' + logs.map(function(l){ return '"'+l.date+'","'+l.user+'","'+l.item+'","'+l.price+'"'; }).join('\n');
  var blob = new Blob([csv],{type:'text/csv'}); var url = URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='purchase_logs.csv'; a.click(); URL.revokeObjectURL(url);
}

// auto-login if current set
window.addEventListener('load', function(){ var cur = localStorage.getItem('ja_current'); if(cur){ showMain(); } });
