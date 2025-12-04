// re-nang money system
var users = {};
var currentUser = null;
var logs = JSON.parse(localStorage.getItem("jang_logs")||"[]");
var captchaNumber = 0;

function loadUsers(){ try{ users = JSON.parse(localStorage.getItem("jang_users")||"{}"); }catch(e){ users={}; } }
function saveUsers(){ localStorage.setItem("jang_users", JSON.stringify(users)); }
function saveLogs(){ localStorage.setItem("jang_logs", JSON.stringify(logs)); }
function addLog(text){ logs.unshift(text); saveLogs(); }

// ensure admin
function ensureAdmin(){
  loadUsers();
  if(!users["관리자"]){
    users["관리자"] = { password:"01049457992", balance:0, lastAttendance:"", items:[], admin:true };
    saveUsers();
  }
}
ensureAdmin();

// captcha
function refreshCaptcha(){
  captchaNumber = Math.floor(Math.random()*10000);
  var el = document.getElementById("captcha");
  if(el) el.placeholder = "로봇이 아닙니까? 숫자: " + captchaNumber;
}
refreshCaptcha();

// signup
function signup(){
  loadUsers();
  var nick = (document.getElementById("nickname")||{}).value||"";
  var pw = (document.getElementById("password")||{}).value||"";
  var cap = (document.getElementById("captcha")||{}).value||"";
  nick = nick.trim(); pw = pw.trim(); cap = cap.trim();
  if(!nick || !pw || !cap){ alert("모두 입력해주세요."); return; }
  if(Number(cap) !== captchaNumber){ alert("캡차가 틀렸습니다."); refreshCaptcha(); return; }
  if(users[nick]){ alert("이미 존재하는 닉네임입니다."); return; }
  users[nick] = { password: pw, balance:0, lastAttendance:"", items:[], admin:false };
  saveUsers();
  alert("회원가입 완료! 로그인 해주세요.");
  refreshCaptcha();
  document.getElementById("signupBox").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
}

// login
function login(){
  loadUsers();
  var nick = (document.getElementById("loginNick")||{}).value||"";
  var pw = (document.getElementById("loginPw")||{}).value||"";
  nick = nick.trim(); pw = pw.trim();
  if(!users[nick] || users[nick].password !== pw){ alert("닉네임 또는 비밀번호 오류"); return; }
  currentUser = nick;
  localStorage.setItem("currentUser", currentUser);
  showMain();
}

// on load restore
window.onload = function(){
  loadUsers();
  currentUser = localStorage.getItem("currentUser") || null;
  if(currentUser && users[currentUser]){
    showMain();
  } else {
    document.getElementById("signupBox").classList.remove("hidden");
    document.getElementById("loginBox").classList.add("hidden");
  }
};

// show main
function showMain(){
  document.getElementById("signupBox").classList.add("hidden");
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("mainBox").classList.remove("hidden");
  document.getElementById("welcomeText").innerText = currentUser + " 님 환영합니다!";
  document.getElementById("moneyDisplay").innerText = users[currentUser].balance;
  if(users[currentUser] && users[currentUser].admin){
    document.getElementById("adminMenu").classList.remove("hidden");
  } else {
    document.getElementById("adminMenu").classList.add("hidden");
  }
}

// logout
function logout(){ currentUser=null; localStorage.removeItem("currentUser"); document.getElementById("mainBox").classList.add("hidden"); document.getElementById("signupBox").classList.remove("hidden"); document.getElementById("loginBox").classList.add("hidden"); }

// attendance
function attendance(){
  if(!currentUser){ alert("로그인 먼저 해주세요."); return; }
  var today = new Date().toDateString();
  if(users[currentUser].lastAttendance === today){ alert("이미 출석했습니다."); return; }
  users[currentUser].lastAttendance = today;
  users[currentUser].balance += 10;
  saveUsers();
  document.getElementById("moneyDisplay").innerText = users[currentUser].balance;
  addLog(currentUser + " | 출석 +10");
  alert("출석 완료! +10 재낭머니");
}

// shop
function openShop(){ if(!currentUser){ alert("로그인 필요"); return; } document.getElementById("shopBox").classList.remove("hidden"); }
function closeShop(){ document.getElementById("shopBox").classList.add("hidden"); }
function buyItem(name, price){
  if(!currentUser){ alert("로그인 필요"); return; }
  if(users[currentUser].balance < price){ alert("잔액 부족"); return; }
  users[currentUser].balance -= price;
  users[currentUser].items.push(name);
  saveUsers();
  document.getElementById("moneyDisplay").innerText = users[currentUser].balance;
  addLog(currentUser + " | " + name + " 구매 -" + price);
  alert(name + " 구매 완료!");
}

// random box
function buyRandomBox(){
  if(!currentUser){ alert("로그인 필요"); return; }
  var price = 100;
  if(users[currentUser].balance < price){ alert("잔액 부족"); return; }
  users[currentUser].balance -= price;
  // rewards: money or item
  var rewards = [
    {type:"money", value:50},
    {type:"money", value:75},
    {type:"money", value:120},
    {type:"item", value:"이벤트 우선참가권"},
    {type:"item", value:"촬영 참여권"},
    {type:"item", value:"로블록스 친추권"}
  ];
  var pick = rewards[Math.floor(Math.random()*rewards.length)];
  if(pick.type === "money"){
    users[currentUser].balance += pick.value;
  } else {
    users[currentUser].items.push(pick.value);
  }
  saveUsers();
  document.getElementById("moneyDisplay").innerText = users[currentUser].balance;
  addLog(currentUser + " | 랜덤박스 구매 -> " + (pick.type==="money"?pick.value+"재낭머니":pick.value));
  alert("랜덤박스 결과: " + (pick.type==="money"?pick.value+" 재낭머니":pick.value));
}

// ranking
function showRank(){
  document.getElementById("rankBox").classList.remove("hidden");
  loadUsers();
  var arr = [];
  for(var u in users){ arr.push({nick:u,money:users[u].balance}); }
  arr.sort(function(a,b){ return b.money - a.money; });
  var html = "";
  for(var i=0;i<arr.length;i++){ html += (i+1)+". "+arr[i].nick+" - "+arr[i].money+" 재낭머니<br>"; }
  document.getElementById("rankList").innerHTML = html;
}
function closeRank(){ document.getElementById("rankBox").classList.add("hidden"); }

// logs
function showLogs(){ document.getElementById("logBox").classList.remove("hidden"); document.getElementById("logList").innerHTML = logs.length?logs.join("<br>"):"구매 내역 없음"; }
function closeLogs(){ document.getElementById("logBox").classList.add("hidden"); }

// games menu
function openGames(){ if(!currentUser){ alert("로그인 필요"); return; } document.getElementById("gameMenu").classList.remove("hidden"); }
function closeGames(){ document.getElementById("gameMenu").classList.add("hidden"); }
function openGame(url){ window.open(url, "_blank"); }

// function for games to call to reward user
function gameReward(money, item){
  if(!currentUser){ alert("게임 보상 적용 실패: 로그인 상태가 아님"); return; }
  if(money && money>0) users[currentUser].balance += money;
  if(item) users[currentUser].items.push(item);
  saveUsers();
  document.getElementById("moneyDisplay").innerText = users[currentUser].balance;
  addLog(currentUser + " | 미니게임 보상 -> " + (money?money+"재낭머니":"") + (item?(" "+item):""));
}
function exportData(){
  // simple JSON download for admin
  var a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users));
  a.download = 'users.json';
  document.body.appendChild(a); a.click(); a.remove();
}
