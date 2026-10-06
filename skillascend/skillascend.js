/* SkillAscend frontend - integrated version */
const API_BASE = localStorage.getItem("skillascend_api") || (location.protocol === "file:" ? "http://localhost:3000" : location.origin);
const YT = "https://www.youtube.com/results?search_query=";

let currentUser = null;
let authMode = "login";
let recognition = null;
let listening = false;
let QZ = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

const SKILL_ICONS = {
  HTML:"🌐", CSS:"🎨", JavaScript:"⚡", React:"⚛️", Python:"🐍",
  SQL:"🗄️", Git:"🔧", Excel:"📊", "Data Structures":"🧩", Tally:"📒"
};

const SKILLS = ["HTML","CSS","JavaScript","React","Python","SQL","Git","Excel","Data Structures","Tally"];
const CHANNELS = {
  HTML:"freeCodeCamp.org", CSS:"Kevin Powell", JavaScript:"Programming with Mosh",
  React:"Bro Code", Python:"CodeWithHarry", SQL:"freeCodeCamp.org",
  Git:"Kunal Kushwaha", Excel:"ExcelIsFun", "Data Structures":"Apna College", Tally:"Tally Solutions"
};

const COURSES = SKILLS.map(s => ({
  skill:s,
  title:`${s} for Beginners`,
  description:`Free beginner-friendly ${s} tutorial.`,
  channel:CHANNELS[s] || "freeCodeCamp.org"
}));

const JOB_TEMPLATES = [
  ["Frontend Developer","Tech Startup",["HTML","CSS","JavaScript"],"High",92],
  ["Junior Python Developer","Software Company",["Python","SQL","Git"],"High",90],
  ["Data Entry & Excel Assistant","Local Business",["Excel"],"Medium",86],
  ["Accounts Assistant","Business Services",["Excel","Tally"],"High",89],
  ["Junior Web Developer","Digital Agency",["HTML","CSS","JavaScript","Git"],"Medium",84],
  ["Computer Operator","Local Services",["Computer Basics","Excel"],"High",88],
  ["IT Support Assistant","Technology Services",["Networking","Computer Basics"],"High",91],
  ["Customer Support Executive","Service Company",["Communication","Computer Basics"],"Medium",85],
  ["Office Assistant","Business Services",["Excel","Communication"],"High",87],
  ["Software Testing Trainee","IT Company",["Testing","JavaScript"],"Medium",89]
];
function buildLocationJobs(location) {
  const loc=(location||"India").trim()||"India", jobs=[];
  for(let i=0;i<280;i++){const t=JOB_TEMPLATES[i%JOB_TEMPLATES.length], n=Math.floor(i/JOB_TEMPLATES.length)+1; jobs.push({title:t[0]+(n>1?` ${n}`:""),company:t[1],location:loc,skills:t[2],stability:t[3],trust:t[4],match:0});}
  return jobs;
}
let JOBS = buildLocationJobs("India");

const GOV_EXAMS = [
  {name:"SSC CGL",min:"Graduation",minAge:18,maxAge:32,desc:"Graduate-level central government recruitment."},
  {name:"SSC CHSL",min:"12th",minAge:18,maxAge:27,desc:"12th-level central government recruitment."},
  {name:"SSC MTS",min:"10th",minAge:18,maxAge:25,desc:"10th-level central government recruitment."},
  {name:"Bank PO",min:"Graduation",minAge:20,maxAge:30,desc:"Graduate-level banking recruitment."},
  {name:"Railway NTPC",min:"12th",minAge:18,maxAge:33,desc:"Railway recruitment; exact eligibility varies by notification."}
];

function showMessage(msg) {
  const el = $("message");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => el.classList.add("hidden"), 3200);
}

function userKey(email) { return "skillascend_user_" + email.toLowerCase().trim(); }

function defaultUser(name,email,password) {
  return {
    name, email, password,
    phone:"", location:"", link:"",
    careerGoal:"", summary:"",
    skills:[], education:[], experience:[], projects:[], certifications:[], languages:[], hobbies:[],
    verifiedSkillList:[], completedVerificationList:[], videoPicks:{}, trustScore:100,
    goalInfo:null, progress:{}
  };
}

function saveUser() {
  if (!currentUser) return;
  localStorage.setItem(userKey(currentUser.email), JSON.stringify(currentUser));
  localStorage.setItem("skillascend_current", currentUser.email);
}

function loadUser(email) {
  try { return JSON.parse(localStorage.getItem(userKey(email))); }
  catch { return null; }
}

function initAuth() {
  const email = localStorage.getItem("skillascend_current");
  if (email) {
    const u = loadUser(email);
    if (u) { currentUser = u; enterApp(); return; }
  }
  $("authPage").classList.remove("hidden");
  $("mainApp").classList.add("hidden");
}

function toggleAuth() {
  authMode = authMode === "login" ? "signup" : "login";
  $("authTitle").textContent = authMode === "login" ? "Welcome Back 👋" : "Create your account";
  $("authSubtitle").textContent = authMode === "login" ? "Login to continue your career journey." : "Start building your career profile.";
  $("nameField").classList.toggle("hidden", authMode !== "signup");
  $("authButton").textContent = authMode === "login" ? "Login" : "Create Account";
  $("switchText").textContent = authMode === "login" ? "Don't have an account?" : "Already have an account?";
  $("switchButton").textContent = authMode === "login" ? "Create Account" : "Login";
}

function handleAuth() {
  const name = $("nameInput").value.trim();
  const email = $("emailInput").value.trim().toLowerCase();
  const password = $("passwordInput").value;

  if (!email || !password || !email.includes("@")) return showMessage("Enter a valid email and password.");

  if (authMode === "signup") {
    if (!name) return showMessage("Enter your full name.");
    if (loadUser(email)) return showMessage("Account already exists. Please login.");
    currentUser = defaultUser(name,email,password);
    saveUser();
    enterApp();
    showMessage("Account created successfully.");
  } else {
    const u = loadUser(email);
    if (!u || u.password !== password) return showMessage("Invalid email or password.");
    currentUser = u;
    saveUser();
    enterApp();
    showMessage("Welcome back!");
  }
}

function googleLogin() {
  const email = prompt("Demo Google login: enter the Google account email.");
  if (!email || !email.includes("@")) return;
  let u = loadUser(email);
  if (!u) {
    const name = prompt("Enter the name for this demo Google account:") || email.split("@")[0];
    u = defaultUser(name,email,"google-demo");
    localStorage.setItem(userKey(email), JSON.stringify(u));
  }
  currentUser = u;
  saveUser();
  enterApp();
}

function logout() {
  localStorage.removeItem("skillascend_current");
  currentUser = null;
  $("mainApp").classList.add("hidden");
  $("authPage").classList.remove("hidden");
  $("passwordInput").value = "";
}

function enterApp() {
  $("authPage").classList.add("hidden");
  $("mainApp").classList.remove("hidden");
  updateUserUI();
  renderCourses();
  renderJobs();
  renderGov();
  renderVerification();
  updateCVPreview();
  updateDashboard();
  showPage("dashboard", document.querySelector(".nav-button.active"));
}

function showPage(id, btn) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const page = $(id);
  if (!page) return;
  page.classList.remove("hidden");
  document.querySelectorAll(".nav-button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  else {
    const match = [...document.querySelectorAll(".nav-button")].find(b => b.getAttribute("onclick")?.includes("'" + id + "'"));
    if (match) match.classList.add("active");
  }
  if (id === "courses") renderCourses();
  if (id === "jobs") renderJobs();
  if (id === "government") renderGov();
  if (id === "verification") renderVerification();
  if (id === "gaps") renderGaps();
}

function openPage(id) { showPage(id); }

function initials(name) {
  return (String(name || "U").trim().split(/\s+/).map(x => x[0]).join("").slice(0,2) || "U").toUpperCase();
}

function updateUserUI() {
  if (!currentUser) return;
  const av = initials(currentUser.name);
  $("topUserName").textContent = currentUser.name || "User";
  $("topAvatar").textContent = av;
  $("welcomeName").textContent = currentUser.name || "User";
  $("profileName").textContent = currentUser.name || "User";
  $("profileEmail").textContent = currentUser.email;
  $("profileAvatar").textContent = av;
  $("profileNameInput").value = currentUser.name || "";
  $("profileEmailInput").value = currentUser.email;
  $("profileSkills").value = (currentUser.skills || []).join(", ");
  $("settingsEmail").textContent = currentUser.email;
  $("cvName").value = currentUser.name || "";
  $("cvEmail").value = currentUser.email || "";
  $("cvPhone").value = currentUser.phone || "";
  $("cvLocation").value = currentUser.location || "";
  $("cvLink").value = currentUser.link || "";
  $("careerGoal").value = currentUser.careerGoal || "";
  $("cvSummary").value = currentUser.summary || "";
  $("cvSkills").value = (currentUser.skills || []).join(", ");
  $("cvEducation").value = (currentUser.education || []).join("\n");
  $("cvExperience").value = (currentUser.experience || []).join("\n");
  $("cvProjects").value = (currentUser.projects || []).join("\n");
  $("cvCerts").value = (currentUser.certifications || []).join("\n");
  $("cvLanguages").value = (currentUser.languages || []).join(", ");
  $("cvHobbies").value = (currentUser.hobbies || []).join(", ");
  paintTrust();
}

function updateDashboard() {
  if (!currentUser) return;
  const cvFields = ["name","email","careerGoal","summary","phone","location","skills","education","experience","projects","certifications"];
  const filled = cvFields.filter(k => Array.isArray(currentUser[k]) ? currentUser[k].length : String(currentUser[k] || "").trim()).length;
  const cv = Math.round(filled / cvFields.length * 100);
  const verified = currentUser.skills?.length ? Math.round((currentUser.verifiedSkillList?.length || 0) / currentUser.skills.length * 100) : 0;
  const required = getRequiredSkills(currentUser);
  const missing = required.filter(s => !hasSkill(currentUser.skills,s)).length;
  const learning = required.length ? Math.round(((required.length-missing)/required.length)*100) : 0;
  const overall = Math.round((cv + verified + learning) / 3);

  $("ovScore").textContent = overall + "%"; $("ovBar").style.width = overall + "%";
  $("lrScore").textContent = learning + "%"; $("lrBadge").textContent = learning ? "In progress" : "Not started";
  $("cvScore").textContent = cv + "%"; $("cvBadge").textContent = cv >= 80 ? "Ready" : "In progress";
  $("vfScore").textContent = verified + "%"; $("vfBadge").textContent = verified ? "Verified" : "Not started";
  paintTrust();
}

function paintTrust() {
  if (!currentUser) return;
  const t = trust();
  if ($("trScore")) $("trScore").textContent = t;
  if ($("trBadge")) {
    $("trBadge").textContent = t >= 80 ? "Trusted" : t >= 50 ? "Caution" : "Low trust";
    $("trBadge").className = "badge " + (t >= 80 ? "green" : t >= 50 ? "orange" : "red");
  }
  if ($("trustBar")) $("trustBar").innerHTML = "🔒 Trust Score: <strong>" + t + "/100</strong> · each verification violation = −3";
  if ($("qzTrust")) $("qzTrust").textContent = t;
}
function trust() { return currentUser?.trustScore == null ? 100 : currentUser.trustScore; }

function hasSkill(list, skill) {
  return (list || []).some(x => String(x).trim().toLowerCase() === String(skill).trim().toLowerCase());
}
function normalizeSkill(s) {
  const x = String(s || "").trim().toLowerCase();
  const map = {"js":"JavaScript","javascript":"JavaScript","java script":"JavaScript","html5":"HTML","css3":"CSS","sql":"SQL","python":"Python","reactjs":"React","react.js":"React","data structure":"Data Structures","excel":"Excel","tally":"Tally","git/github":"Git","github":"Git"};
  return map[x] || String(s || "").trim();
}
function listLines(v) { return String(v || "").split(/\n/).map(x => x.trim()).filter(Boolean); }
function listComma(v) { return String(v || "").split(",").map(x => x.trim()).filter(Boolean); }

function getRequiredSkills(u) {
  return (u.goalInfo?.valid && u.goalInfo.goal === u.careerGoal && u.goalInfo.required)
    ? u.goalInfo.required : inferRequiredSkills(u.careerGoal);
}
function inferRequiredSkills(goal) {
  const g = String(goal || "").toLowerCase();
  if (!g) return [];
  if (g.includes("frontend") || g.includes("web")) return ["HTML","CSS","JavaScript","Git"];
  if (g.includes("python")) return ["Python","SQL","Git"];
  if (g.includes("data")) return ["Python","SQL","Excel"];
  if (g.includes("account")) return ["Excel","Tally"];
  if (g.includes("software")) return ["Python","SQL","Git","Data Structures"];
  return [];
}

function renderCourses() {
  const q = ($("courseSearch")?.value || "").toLowerCase();
  const missing = getRequiredSkills(currentUser || {}).filter(s => !hasSkill(currentUser?.skills,s));
  let data = COURSES.filter(c => !q || c.skill.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  data.sort((a,b) => (missing.includes(b.skill)-missing.includes(a.skill)));
  $("courseList").innerHTML = data.map(c => `
    <div class="course-card">
      <div class="course-icon">${SKILL_ICONS[c.skill] || "🎓"}</div>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.description)} ${missing.includes(c.skill) ? "<strong>Recommended for your skill gap.</strong>" : ""}</p>
      <div class="actions"><a class="main-button" target="_blank" rel="noopener" href="${YT + encodeURIComponent(c.skill+" tutorial "+c.channel)}">▶ Watch</a></div>
    </div>`).join("");
}

function renderJobs() {
  const location=(currentUser?.location||"").trim()||"India";
  JOBS=buildLocationJobs(location);
  const q=($ ("jobSearch")?.value||"").toLowerCase().trim();
  const skills=currentUser?.skills||[];
  const data=JOBS.filter(j=>!q||(j.title+" "+j.company+" "+j.location+" "+j.skills.join(" ")).toLowerCase().includes(q))
    .map(j=>({...j,match:j.skills.filter(s=>hasSkill(skills,s)).length}))
    .sort((a,b)=>b.match-a.match);
  const count=$("jobCount"); if(count) count.textContent=`${data.length}+ jobs found`;
  const lt=$("jobLocationText"); if(lt) lt.textContent=`Showing jobs based on your CV location: ${location}`;
  $("jobList").innerHTML=data.map(j=>`
    <div class="job-card"><div><h2>${esc(j.title)}</h2><p>${esc(j.company)} · ${esc(j.location)}</p>
    <div class="job-meta"><span>Skill match: ${j.skills.length?Math.round(j.match/j.skills.length*100):0}%</span><span>Stability: ${esc(j.stability)}</span><span>Employer trust: ${j.trust}/100</span></div></div>
    <button class="success-button" onclick="showMessage('Demo: application flow can be connected to a real job API later.')">Apply</button></div>`).join("")||"<div class='settings-card'>No jobs found.</div>";
}

function renderGov() {
  const qual = $("qualification")?.value || "Graduation";
  const age = Number($("age")?.value || 22);
  const rank = {"10th":1,"12th":2,"Graduation":3}[qual] || 3;
  const eligible = GOV_EXAMS.filter(e => rank >= {"10th":1,"12th":2,"Graduation":3}[e.min] && age >= e.minAge && age <= e.maxAge);
  $("examCount").textContent = `${eligible.length} Eligible Exam${eligible.length === 1 ? "" : "s"}`;
  $("examList").innerHTML = GOV_EXAMS.map(e => {
    const ok = rank >= {"10th":1,"12th":2,"Graduation":3}[e.min] && age >= e.minAge && age <= e.maxAge;
    return `<div class="exam-row ${ok ? "" : "no"}"><div><h3>${esc(e.name)}</h3><p>${esc(e.desc)} Required: ${esc(e.min)} · Typical age: ${e.minAge}-${e.maxAge}</p></div><div class="exam-right"><span class="badge ${ok?"green":"red"}">${ok?"Eligible":"Not eligible"}</span></div></div>`;
  }).join("");
}

function renderVerification() {
  const skills = currentUser?.skills || [];
  $("verifyList").innerHTML = skills.length ? skills.map(s => {
    const verified = hasSkill(currentUser.verifiedSkillList,s);
    const completed = verified || hasSkill(currentUser.completedVerificationList,s);
    const status = verified ? "Verified skill — assessment completed successfully." : completed ? "Assessment completed — skill not yet verified." : "Take the 10-question verification.";
    const button = completed ? `<span class="badge ${verified ? "green" : "orange"}">${verified ? "✓ Verified" : "✓ Complete"}</span>` : `<button class="main-button" onclick="verifySkill('${esc(s).replace(/'/g,"&#39;")}')">▶ Start Verification</button>`;
    return `<div class="feature-card"><div class="feature-icon green-icon">🛡️</div><h3>${esc(s)}</h3><p>${status}</p>${button}</div>`;
  }).join("") : "<div class='settings-card'><p>Add skills in your Profile or CV Builder first.</p></div>";
  paintTrust();
}

async function callAI(task,data) {
  const r = await fetch(API_BASE, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,data})});
  const j = await r.json().catch(()=>({}));
  if (!r.ok || j.error) throw new Error(j.error || "AI server error");
  return j;
}
async function askAI(task,data){ return callAI(task,data); }

async function updateCV(force=false) {
  if (!currentUser) return;
  // Name/email identify the logged-in account, so keep the account identity
  // if those two CV fields are intentionally left blank. All other CV fields
  // are replaced by exactly what is currently in the form (including empty).
  const enteredName = $("cvName").value.trim();
  const enteredEmail = $("cvEmail").value.trim();
  if (enteredName) currentUser.name = enteredName;
  if (enteredEmail) currentUser.email = enteredEmail;
  currentUser.phone = $("cvPhone").value.trim();
  currentUser.location = $("cvLocation").value.trim();
  currentUser.link = $("cvLink").value.trim();
  currentUser.careerGoal = $("careerGoal").value.trim();
  currentUser.summary = $("cvSummary").value.trim();
  currentUser.skills = listComma($("cvSkills").value).map(normalizeSkill);
  currentUser.education = listLines($("cvEducation").value);
  currentUser.experience = listLines($("cvExperience").value);
  currentUser.projects = listLines($("cvProjects").value);
  currentUser.certifications = listLines($("cvCerts").value);
  currentUser.languages = listComma($("cvLanguages").value);
  currentUser.hobbies = listComma($("cvHobbies").value);
  saveUser(); updateUserUI(); updateCVPreview(); updateDashboard();
  if (force) await verifyGoalAndGap();
  else showMessage("CV updated.");
}

async function clearCV() {
  if (!currentUser) return;
  if (!confirm("Clear all CV information? Your login name and email will be kept.")) return;

  currentUser.phone = "";
  currentUser.location = "";
  currentUser.link = "";
  currentUser.careerGoal = "";
  currentUser.summary = "";
  currentUser.skills = [];
  currentUser.education = [];
  currentUser.experience = [];
  currentUser.projects = [];
  currentUser.certifications = [];
  currentUser.languages = [];
  currentUser.hobbies = [];
  currentUser.goalInfo = null;
  currentUser.skillGaps = [];

  // Clear any generated/temporary CV information too, then persist immediately.
  ["cvPhone","cvLocation","cvLink","careerGoal","cvSummary","cvSkills","cvEducation","cvExperience","cvProjects","cvCerts","cvLanguages","cvHobbies"].forEach(id => {
    if ($(id)) $(id).value = "";
  });
  $("goalStatus").textContent = "";
  $("gapResult").innerHTML = "";

  saveUser();
  updateUserUI();
  updateCVPreview();
  updateDashboard();
  renderCourses();
  renderVerification();
  showMessage("CV cleared. Old CV data has been removed.");
}

async function verifyGoalAndGap() {
  const goal = currentUser.careerGoal;
  if (!goal) return showMessage("Enter a career goal first.");
  $("goalStatus").textContent = "🧠 Verifying career goal...";
  try {
    const r = await askAI("goal",{goal,knownSkills:SKILLS,knownJobs:JOBS.map(x=>x.title)});
    currentUser.goalInfo = {...r, goal};
    if (!r.valid) {
      $("goalStatus").textContent = "⚠ " + r.message;
      currentUser.goalInfo.valid = false;
    } else {
      currentUser.goalInfo.valid = true;
      currentUser.goalInfo.required = (r.required || []).map(normalizeSkill);
      $("goalStatus").textContent = "✓ Valid goal: " + (r.title || goal) + " · Required skills: " + currentUser.goalInfo.required.join(", ");
    }
    saveUser();
    await renderGapResult();
    renderGaps(); updateDashboard();
  } catch(e) {
    const req = inferRequiredSkills(goal);
    currentUser.goalInfo = {valid:req.length>0,title:goal,required:req,goal};
    saveUser();
    $("goalStatus").textContent = req.length ? "✓ Goal recognized using local skill map." : "⚠ AI server unavailable. Try a common job title.";
    await renderGapResult(); updateDashboard();
  }
}

async function renderGapResult() {
  const req = getRequiredSkills(currentUser);
  const missing = req.filter(s=>!hasSkill(currentUser.skills,s));
  if (!req.length) { $("gapResult").innerHTML=""; return; }
  let advice = missing.length ? "You are missing some skills required for this goal." : "You have the listed required skills.";
  let plan = missing.map(s=>"Learn and practise "+s);
  try {
    const r = await askAI("gap",{goal:currentUser.careerGoal,required:req,skills:currentUser.skills,verified:currentUser.verifiedSkillList});
    advice = r.advice || advice; plan = r.plan || plan;
  } catch {}
  $("gapResult").innerHTML = `<div class="settings-card gap-card"><h2>🎯 Your Skill Gap</h2><p>${esc(advice)}</p><p><strong>Next steps:</strong></p><ol>${plan.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><p>Missing: <strong>${esc(missing.join(", ") || "None")}</strong></p></div>`;
}

async function improveCVWithAI() {
  const text = $("voiceText").value.trim();
  if (!text) return showMessage("Speak or type something first.");
  $("aiStatus").textContent = "🧠 AI is preparing your CV...";
  try {
    const r = await askAI("cv",{text,goal:currentUser.careerGoal,skills:currentUser.skills,knownSkills:SKILLS});
    currentUser.summary = r.summary || currentUser.summary;
    currentUser.skills = (r.skills || currentUser.skills).map(normalizeSkill);
    currentUser.education = r.education || currentUser.education;
    currentUser.experience = r.experience || currentUser.experience;
    currentUser.projects = r.projects || currentUser.projects;
    currentUser.certifications = r.certifications || currentUser.certifications;
    currentUser.languages = r.languages || currentUser.languages;
    currentUser.hobbies = r.hobbies || currentUser.hobbies;
    saveUser(); updateUserUI(); updateCVPreview(); updateDashboard();
    $("aiStatus").textContent = "✓ CV updated";
    showMessage("AI updated your CV.");
  } catch(e) {
    $("aiStatus").textContent = "AI unavailable";
    showMessage("Start server.js and try again.");
  }
}

function updateCVPreview() {
  const u = currentUser; if (!u) return;
  $("previewName").textContent = u.name || "—";
  const contact = [u.email,u.phone,u.location,u.link].filter(Boolean).join(" · ");
  $("previewContact").textContent = contact || "—";
  const goal = u.goalInfo?.valid ? (u.goalInfo.title || u.careerGoal) : u.careerGoal;
  $("previewGoal").textContent = u.summary || "—";
  $("previewSkills").innerHTML = (u.skills||[]).map(s=>`<span class="skill-tag">${esc(s)}${hasSkill(u.verifiedSkillList,s)?" ✓":""}</span>`).join("") || '<p class="cv-empty">—</p>';
  const sections = [["Education","education"],["Experience","experience"],["Projects","projects"],["Certifications","certifications"],["Languages","languages"],["Hobbies & Interests","hobbies"]];
  $("previewSections").innerHTML = `<div class="cv-section"><h3>Career Goal</h3>${goal?`<p>${esc(goal)}</p>`:'<p class="cv-empty">—</p>'}</div>` + sections.map(([title,key])=>{
    const list=u[key]||[];
    const body=list.length ? ((key==="languages"||key==="hobbies") ? list.map(x=>`<span class="skill-tag">${esc(x)}</span>`).join("") : `<ul>${list.map(x=>`<li>${esc(String(x).split("|").map(s=>s.trim()).filter(Boolean).join(" — "))}</li>`).join("")}</ul>`) : '<p class="cv-empty">—</p>';
    return `<div class="cv-section"><h3>${title}</h3>${body}</div>`;
  }).join("");
}

function saveProfile() {
  currentUser.name = $("profileNameInput").value.trim() || currentUser.name;
  currentUser.skills = listComma($("profileSkills").value).map(normalizeSkill);
  saveUser(); updateUserUI(); updateCVPreview(); updateDashboard(); renderVerification(); renderCourses();
  showMessage("Profile saved.");
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status=$("voiceStatus"), box=$("voiceText"), btn=$("voiceButton");
  if (!SR) return status.textContent="Voice needs Chrome or Edge. Or type below.";
  if (listening) { listening=false; try{recognition.stop()}catch{}; return; }
  recognition = new SR();
  recognition.lang=$("voiceLang").value; recognition.continuous=true; recognition.interimResults=true;
  let finalText=box.value.trim();
  recognition.onresult=e=>{
    let interim="";
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      if(e.results[i].isFinal) finalText += (finalText?" ":"")+t;
      else interim += t;
    }
    box.value=finalText+(interim?" "+interim:"");
  };
  recognition.onerror=e=>{ if(e.error!=="no-speech") status.textContent="Voice error: "+e.error; };
  recognition.onend=()=>{
    if(listening){try{recognition.start();return}catch{}}
    btn.textContent="🎙️ Speak";btn.classList.remove("recording");
    if(box.value.trim()){status.textContent="🧠 Analysing...";improveCVWithAI()}else status.textContent="Voice input ready";
  };
  recognition.start(); listening=true; btn.textContent="⏹ Stop & Create CV";btn.classList.add("recording");status.textContent="🔴 Recording...";
}

function videoLink(skill,channel){return YT+encodeURIComponent(skill+" tutorial "+(channel||""));}

async function renderGaps() {
  const box=$("gapPage"), u=currentUser;
  const req=getRequiredSkills(u);
  if(!req.length){box.innerHTML="<div class='settings-card'><p>Set a valid career goal in CV Builder first.</p></div>";return;}
  const missing=req.filter(s=>!hasSkill(u.skills,s));
  if(!missing.length){box.innerHTML="<div class='settings-card'><p>🎉 No skill gaps! Go to Verify Skills.</p></div>";return;}
  box.innerHTML="<p>🔍 Finding teachers...</p>";
  u.videoPicks=u.videoPicks||{};
  const need=missing.filter(s=>!u.videoPicks[s]);
  if(need.length){
    try{
      const r=await askAI("videos",{goal:u.careerGoal,skills:need});
      need.forEach(s=>{
        const p=(r.picks||[]).find(x=>String(x.skill).toLowerCase()===s.toLowerCase());
        u.videoPicks[s]=p?{channel:String(p.channel),why:String(p.why||"")}:{channel:CHANNELS[s]||"freeCodeCamp.org",why:"Popular beginner-friendly teacher."};
      });
    }catch{
      need.forEach(s=>u.videoPicks[s]={channel:CHANNELS[s]||"freeCodeCamp.org",why:"Popular beginner-friendly teacher."});
    }
    saveUser();
  }
  box.innerHTML=missing.map(s=>{
    const p=u.videoPicks[s];
    return `<div class="settings-card gap-card"><h2>${SKILL_ICONS[s]||"🎓"} ${esc(s)}</h2><p>Best teacher: <strong>${esc(p.channel)}</strong></p><p>${esc(p.why)}</p><a class="main-button" target="_blank" rel="noopener" href="${videoLink(s,p.channel)}">▶ Watch on YouTube</a></div>`;
  }).join("");
}

function downloadGap(){
  const u=currentUser,req=getRequiredSkills(u),miss=req.filter(s=>!hasSkill(u.skills,s));
  const lines=["SKILL GAP REPORT","Name: "+u.name,"Goal: "+(u.careerGoal||"-"),"","Required: "+req.join(", "),"Missing: "+(miss.join(", ")||"None"),""].concat(miss.map(s=>{const p=(u.videoPicks||{})[s];return "- "+s+(p?" | "+p.channel+" | "+videoLink(s,p.channel):"")}));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/plain"}));a.download="skill-gap-report.txt";a.click();URL.revokeObjectURL(a.href);
}

function verifySkill(skill){
  if(!hasSkill(currentUser.skills,skill)) return showMessage("Add this skill to your profile first.");
  QZ={skill,qs:[],i:0,right:0,stream:null,timer:null,last:0,base:null};
  document.body.insertAdjacentHTML("beforeend",`<div id="qzModal" class="qz-modal"><div class="qz-box"><div class="qz-top"><h2 id="qzTitle"></h2><div>🔒 Trust: <strong id="qzTrust">100</strong></div></div><div class="qz-body"><video id="qzVideo" autoplay muted playsinline></video><div id="qzMain"></div></div><div id="qzWarn" class="qz-warn"></div></div></div>`);
  $("qzTitle").textContent="Verify: "+skill; $("qzTrust").textContent=trust();
  $("qzMain").innerHTML=`<h3>Before you start</h3><ul class="qz-rules"><li>Your camera turns on during verification.</li><li>Keep your face visible.</li><li>Tab switching may reduce trust.</li><li>Each detected violation deducts 3 trust points.</li><li>Pass: 70% or higher and trust 50 or more.</li></ul><button class="main-button" onclick="beginQuiz()">📷 Turn on camera &amp; Start</button> <button class="outline-button" onclick="endQuiz()">Cancel</button>`;
}

async function beginQuiz(){
  try{QZ.stream=await navigator.mediaDevices.getUserMedia({video:true});}catch{return showMessage("Camera permission is required for skill verification.");}
  $("qzVideo").srcObject=QZ.stream;$("qzMain").innerHTML="<p>✨ Preparing questions...</p>";
  try{const r=await askAI("quiz",{skill:QZ.skill});QZ.qs=(r.questions||[]).slice(0,10);}catch(e){}
  if(QZ.qs.length<10){showMessage("Could not create questions. Make sure server.js is running.");endQuiz();return;}
  watchUser();showQ();
}
function violation(why){
  const now=Date.now();if(!QZ||now-QZ.last<3000)return;QZ.last=now;
  currentUser.trustScore=Math.max(0,trust()-3);saveUser();paintTrust();
  if($("qzWarn")){$("qzWarn").textContent="⚠ "+why+" (−3 trust)";setTimeout(()=>{if($("qzWarn"))$("qzWarn").textContent=""},3000);}
}
function tabCheck(){if(document.hidden)violation("Tab switched")}
function watchUser(){
  document.addEventListener("visibilitychange",tabCheck);
  if(!("FaceDetector" in window)){ $("qzWarn").textContent="Face tracking is not supported in this browser. Tab switching is still checked."; return; }
  const fd=new FaceDetector({fastMode:true,maxDetectedFaces:3}),v=$("qzVideo");
  QZ.timer=setInterval(async()=>{try{const f=await fd.detect(v);if(f.length===0)return violation("Face not visible");if(f.length>1)return violation("More than one face");const bb=f[0].boundingBox,c=bb.x+bb.width/2;if(QZ.base==null)QZ.base=c;else if(Math.abs(c-QZ.base)>v.videoWidth*.15)violation("You moved or looked away")}catch{}},1000);
}
function showQ(){
  const q=QZ.qs[QZ.i];$("qzMain").innerHTML=`<p class="qz-count">Question ${QZ.i+1} of ${QZ.qs.length}</p><h3>${esc(q.q)}</h3>`+q.options.map((o,k)=>`<button class="qz-opt" onclick="answerQ(${k})">${esc(o)}</button>`).join("");
}
function answerQ(k){if(k===QZ.qs[QZ.i].answer)QZ.right++;QZ.i++;if(QZ.i<QZ.qs.length)showQ();else finishQuiz()}
function stopCam(){if(!QZ)return;clearInterval(QZ.timer);document.removeEventListener("visibilitychange",tabCheck);if(QZ.stream)QZ.stream.getTracks().forEach(t=>t.stop());QZ.stream=null}
function finishQuiz(){
  stopCam();const n=QZ.qs.length,pct=Math.round(QZ.right/n*100),skill=QZ.skill,ok=pct>=70&&trust()>=50;
  currentUser.completedVerificationList=currentUser.completedVerificationList||[];
  if(!hasSkill(currentUser.completedVerificationList,skill)) currentUser.completedVerificationList.push(skill);
  if(ok){
    currentUser.verifiedSkillList=currentUser.verifiedSkillList||[];
    if(!hasSkill(currentUser.verifiedSkillList,skill)) currentUser.verifiedSkillList.push(skill);
  }
  saveUser();
  $("qzMain").innerHTML=`<div class="verification-result"><h3>${ok?"✅ Skill verified & completed":"✓ Verification completed"}</h3><p><strong>${esc(skill)}</strong> is now marked <strong>Complete</strong>.</p><p>Score: ${QZ.right}/${n} (${pct}%) · Trust: ${trust()}/100</p>${ok?"<p class='result-good'>This skill is now verified and can be used for matching.</p>":"<p class='result-warning'>The assessment is complete, but the skill needs another successful attempt to become verified.</p>"}<button class="main-button" onclick="endQuiz()">Done</button></div>`;
  updateUserUI();updateDashboard();renderVerification();
}
function endQuiz(){stopCam();$("qzModal")?.remove();QZ=null}

document.addEventListener("DOMContentLoaded",initAuth);