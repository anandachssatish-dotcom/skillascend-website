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

const GOV_NOTE = "General pattern only. Sections, marks and syllabus can change, so always check the official notification.";
const SSC_QUANT = ["Number system","Percentage","Ratio & proportion","Average","Profit & loss","Simple & compound interest","Time & work","Time, speed & distance","Algebra","Geometry","Mensuration","Trigonometry","Data interpretation"];
const SSC_REASON = ["Analogy","Classification (odd one out)","Number & letter series","Coding-decoding","Blood relations","Direction sense","Syllogism","Venn diagrams","Puzzles & seating","Non-verbal reasoning (figures, paper folding)"];
const SSC_ENGLISH = ["Reading comprehension","Cloze test","Error spotting","Sentence improvement","Synonyms & antonyms","One-word substitution","Idioms & phrases","Para jumbles","Active/passive & direct/indirect speech"];
const SSC_GA = ["History","Geography","Indian polity","Economy basics","General science","Static GK","Current affairs","Awards, books & sports"];
const GOV_SYLLABUS = {
  "SSC CGL":{pattern:"Tier I (computer-based, 4 sections). Higher tiers add advanced maths, English and other papers depending on the post.",subjects:[
    {name:"Quantitative Aptitude",weight:3,topics:SSC_QUANT},
    {name:"General Intelligence & Reasoning",weight:2,topics:SSC_REASON},
    {name:"English Comprehension",weight:2,topics:SSC_ENGLISH},
    {name:"General Awareness",weight:2,topics:SSC_GA}]},
  "SSC CHSL":{pattern:"Tier I (computer-based, 4 sections). A later skill or typing test applies for some posts.",subjects:[
    {name:"Quantitative Aptitude",weight:2,topics:["Number system","Percentage","Ratio & proportion","Average","Profit & loss","Simple interest","Time & work","Time, speed & distance","Basic algebra","Basic geometry & mensuration","Data interpretation"]},
    {name:"General Intelligence & Reasoning",weight:2,topics:SSC_REASON},
    {name:"English Language",weight:2,topics:SSC_ENGLISH},
    {name:"General Awareness",weight:2,topics:SSC_GA}]},
  "SSC MTS":{pattern:"Computer-based exam with maths/reasoning and awareness/English sections.",subjects:[
    {name:"Numerical & Mathematical Ability",weight:2,topics:["Number system & BODMAS","Fractions & decimals","Percentage","Ratio & proportion","Average","Profit & loss","Simple interest","Time & work","Basic mensuration"]},
    {name:"Reasoning Ability",weight:2,topics:["Analogy","Odd one out","Series","Coding-decoding","Direction sense","Blood relations","Simple puzzles","Non-verbal reasoning"]},
    {name:"General Awareness",weight:2,topics:SSC_GA},
    {name:"English Language",weight:1,topics:["Vocabulary","Basic grammar","Spelling & error spotting","Fill in the blanks","Comprehension passage"]}]},
  "Bank PO":{pattern:"Prelims (English, Quant, Reasoning), then Mains (more sections and a descriptive English test), then Interview.",subjects:[
    {name:"Quantitative Aptitude",weight:3,topics:["Simplification & approximation","Number series","Quadratic equations","Arithmetic (percentage, ratio, interest, time & work)","Data sufficiency","Mensuration"]},
    {name:"Reasoning & Computer Aptitude",weight:3,topics:["Puzzles & seating arrangement","Syllogism","Inequalities","Blood relations & direction","Input-output","Coding-decoding","Computer basics (hardware, software, networks, MS Office)"]},
    {name:"English Language",weight:2,topics:["Reading comprehension","Cloze test","Error spotting","Para jumbles","Fill in the blanks","Descriptive writing (letter & essay)"]},
    {name:"Banking & Economy Awareness",weight:2,topics:["Banking terms & RBI functions","Financial institutions","Government schemes","Budget & economy basics","Current affairs"]},
    {name:"Data Analysis & Interpretation",weight:2,topics:["Tables & bar graphs","Line & pie charts","Caselet DI","Missing DI","Data sufficiency"]}]},
  "Railway NTPC":{pattern:"Computer-based test (CBT 1 and CBT 2). Some posts also need a typing or aptitude test.",subjects:[
    {name:"Mathematics",weight:2,topics:["Number system","Percentage","Ratio & proportion","Average","Profit & loss","Simple & compound interest","Time & work","Time, speed & distance","Geometry & mensuration","Algebra & trigonometry basics"]},
    {name:"General Intelligence & Reasoning",weight:2,topics:["Analogy","Series","Coding-decoding","Blood relations","Direction sense","Syllogism","Venn diagrams","Puzzles","Statement & conclusion"]},
    {name:"General Awareness",weight:3,topics:["Current affairs","Indian history","Geography","Indian polity & constitution","Economy basics","Physics basics","Chemistry basics","Biology basics","Computers & Railways GK"]}]}
};

const SSC_APPLY = {
  links:[{label:"SSC official website (register and apply)",url:"https://ssc.gov.in"}],
  centreMode:"choose",
  centreNote:"In the application form you choose 3 exam centres in order of preference. Choose carefully, because changing a centre later is usually not allowed.",
  steps:["Complete One-Time Registration (OTR) on the SSC website. It is needed for every SSC exam.","Log in with your registration ID and password.","When the notification is open, click Apply and select this exam.","Fill your details and choose 3 exam centres in order of preference.","Upload your photo and signature, pay the fee (if it applies to your category) and submit.","Save the confirmation page or PDF."],
  docs:["Photo and signature (scanned, in the size shown on the form)","Valid ID proof (Aadhaar or other)","Mark sheets and certificates of your qualification","Category certificate, if you claim a category benefit","Mobile number and email you can access for OTP"]
};
const GOV_APPLY = {
  "SSC CGL":SSC_APPLY, "SSC CHSL":SSC_APPLY, "SSC MTS":SSC_APPLY,
  "Bank PO":{
    links:[{label:"IBPS official website (PO/MT)",url:"https://www.ibps.in"},{label:"SBI careers (SBI PO)",url:"https://sbi.co.in/web/careers"}],
    centreMode:"choose",
    centreNote:"IBPS asks for your preferred exam centre (state and city) in the form, usually for Prelims and Mains. SBI PO is a separate recruitment with its own form.",
    steps:["Open the official website of the bank or IBPS and go to the current recruitment notice.","Register with your email and mobile number, then log in.","Fill your details and select your preferred exam centre.","Upload photo, signature and the other documents the notice asks for.","Pay the fee online and submit.","Save the confirmation page."],
    docs:["Photo and signature (scanned)","Valid ID proof (Aadhaar or other)","Graduation certificate or marks","Category certificate, if you claim a category benefit","Any extra upload the notice asks for (for example thumb impression or handwritten declaration)"]
  },
  "Railway NTPC":{
    links:[{label:"RRB application portal",url:"https://www.rrbapply.gov.in"}],
    centreMode:"allotted",
    centreNote:"You usually apply to ONE RRB only, and applying to more than one can get all your forms rejected. The board allots your exam city, and it is shown on the RRB website shortly before the exam. Changing the centre is normally not allowed.",
    steps:["Open the RRB application portal and create an account (or log in if you already have one).","Choose ONE RRB and your post preferences.","Fill your details and upload photo and signature.","Pay the fee online and submit.","Save the confirmation page.","Check your exam city and admit card on the RRB website before the exam."],
    docs:["Photo and signature (scanned)","Valid ID proof (Aadhaar or other)","Qualification certificates and mark sheets","Category certificate, if you claim a category benefit","Mobile number and email you can access for OTP"]
  }
};
const CITY_LIST = ["Panaji","Margao","Mapusa","Vasco da Gama","Mumbai","Pune","Nagpur","Nashik","Kolhapur","Belagavi","Hubballi","Bengaluru","Mangaluru","Hyderabad","Chennai","Kochi","Thiruvananthapuram","Delhi","Lucknow","Patna","Kolkata","Bhopal","Indore","Ahmedabad","Jaipur","Chandigarh"];

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

function jobStatus(job) {
  const verifiedList = currentUser?.verifiedSkillList || [];
  const pending = job.skills.filter(s => !hasSkill(verifiedList, s));
  return { pending, ready: pending.length === 0 };
}

function findJob(enc) {
  const title = decodeURIComponent(enc);
  return JOBS.find(j => j.title === title);
}

// Learn: open Courses, filtered to the first skill that is not verified yet.
function learnForJob(enc) {
  const job = findJob(enc); if (!job) return;
  const { pending } = jobStatus(job);
  showPage("courses");
  const box = $("courseSearch");
  if (box) { box.value = pending[0] || ""; renderCourses(); }
  showMessage(pending.length ? "Learn " + pending.join(", ") + ", then verify it to unlock Apply." : "All skills for this job are verified.");
}

function applyJob(enc) {
  const job = findJob(enc); if (!job) return;
  const { pending, ready } = jobStatus(job);
  if (!ready) return showMessage("Verify these skills first: " + pending.join(", "));
  currentUser.appliedJobs = currentUser.appliedJobs || [];
  const key = job.title + "|" + job.location;
  if (!currentUser.appliedJobs.includes(key)) currentUser.appliedJobs.push(key);
  saveUser(); renderJobs();
  showMessage("Applied for " + job.title + ". (Demo: connect a real job API later.)");
}

function renderJobs() {
  const location=(currentUser?.location||"").trim()||"India";
  JOBS=buildLocationJobs(location);
  const q=($ ("jobSearch")?.value||"").toLowerCase().trim();
  const verifiedList=currentUser?.verifiedSkillList||[];
  const applied=currentUser?.appliedJobs||[];
  const data=JOBS.filter(j=>!q||(j.title+" "+j.company+" "+j.location+" "+j.skills.join(" ")).toLowerCase().includes(q))
    .map(j=>({...j,verifiedCount:j.skills.filter(s=>hasSkill(verifiedList,s)).length,match:j.skills.filter(s=>hasSkill(currentUser?.skills||[],s)).length}))
    .sort((a,b)=>(b.verifiedCount/b.skills.length-a.verifiedCount/a.skills.length)||(b.match-a.match));
  const count=$("jobCount"); if(count) count.textContent=`${data.length}+ jobs found`;
  const lt=$("jobLocationText"); if(lt) lt.textContent=`Showing jobs based on your CV location: ${location}`;
  $("jobList").innerHTML=data.map(j=>{
    const { pending, ready } = jobStatus(j);
    const enc = encodeURIComponent(j.title);
    const done = applied.includes(j.title+"|"+j.location);
    const chips = j.skills.map(s => hasSkill(verifiedList,s)
      ? `<span class="job-skill ok">✓ ${esc(s)}</span>`
      : `<span class="job-skill">${esc(s)}</span>`).join("");
    const applyBtn = done
      ? `<button class="outline-button" disabled>✓ Applied</button>`
      : ready
        ? `<button class="success-button" onclick="applyJob('${enc}')">Apply</button>`
        : `<button class="success-button" disabled title="Verify all required skills to apply">🔒 Apply</button>`;
    return `<div class="job-card"><div><h2>${esc(j.title)}</h2><p>${esc(j.company)} · ${esc(j.location)}</p>
    <div class="job-skills"><span class="job-skills-label">Skills required:</span>${chips}</div>
    ${ready ? "" : `<p class="job-hint">Verify to unlock Apply: ${esc(pending.join(", "))}</p>`}</div>
    <div class="job-actions"><button class="main-button" onclick="learnForJob('${enc}')">📚 Learn</button>${applyBtn}</div></div>`;
  }).join("")||"<div class='settings-card'>No jobs found.</div>";
}

function renderGov() {
  const qual = $("qualification")?.value || "Graduation";
  const age = Number($("age")?.value || 22);
  const rank = {"10th":1,"12th":2,"Graduation":3}[qual] || 3;
  const eligible = GOV_EXAMS.filter(e => rank >= {"10th":1,"12th":2,"Graduation":3}[e.min] && age >= e.minAge && age <= e.maxAge);
  $("examCount").textContent = `${eligible.length} Eligible Exam${eligible.length === 1 ? "" : "s"}`;
  $("examList").innerHTML = GOV_EXAMS.map(e => {
    const ok = rank >= {"10th":1,"12th":2,"Graduation":3}[e.min] && age >= e.minAge && age <= e.maxAge;
    return `<div class="exam-row ${ok ? "" : "no"}"><div><h3>${esc(e.name)}</h3><p>${esc(e.desc)} Required: ${esc(e.min)} · Typical age: ${e.minAge}-${e.maxAge}</p></div><div class="exam-right"><span class="badge ${ok?"green":"red"}">${ok?"Eligible":"Not eligible"}</span>${ok&&currentUser?.examApplied?.[e.name]?'<span class="badge blue">✓ Applied</span>':""}${ok&&GOV_SYLLABUS[e.name]?`<button class="outline-button" onclick="openSyllabus('${encodeURIComponent(e.name)}')">📖 Syllabus</button><button class="main-button" onclick="openStudyPlan('${encodeURIComponent(e.name)}')">🗓️ Study Plan</button>`:""}${ok&&GOV_APPLY[e.name]?`<button class="success-button" onclick="openApply('${encodeURIComponent(e.name)}')">📝 Apply</button>`:""}</div></div>`;
  }).join("");
}


function openGovModal(html) {
  closeGovModal();
  const d = document.createElement("div");
  d.className = "qz-modal"; d.id = "govModal";
  d.innerHTML = `<div class="qz-box">${html}</div>`;
  d.addEventListener("click", e => { if (e.target === d) closeGovModal(); });
  document.body.appendChild(d);
}
function closeGovModal() { $("govModal")?.remove(); }

function openSyllabus(enc) {
  const name = decodeURIComponent(enc), ex = GOV_SYLLABUS[name]; if (!ex) return;
  const subjects = ex.subjects.map(s => `<div class="syl-subject"><h3>${esc(s.name)}</h3><div>${s.topics.map(t=>`<span class="skill-tag">${esc(t)}</span>`).join("")}</div></div>`).join("");
  openGovModal(`<div class="qz-top"><h2>📖 ${esc(name)} Syllabus</h2><button class="outline-button" onclick="closeGovModal()">✕ Close</button></div>
    <p class="qz-count">${esc(ex.pattern)}</p>${subjects}
    <p class="demo-note">${esc(GOV_NOTE)}</p>
    <div class="cv-actions"><button class="main-button" onclick="openStudyPlan('${enc}')">🗓️ Make my study plan</button></div>`);
}

function openApply(enc) {
  const name = decodeURIComponent(enc), a = GOV_APPLY[name]; if (!a) return;
  const u = currentUser, saved = u.examCentres?.[name] || [], done = u.examApplied?.[name], docsDone = u.examDocs?.[name] || [];
  const links = a.links.map(l=>`<a class="main-button" target="_blank" rel="noopener noreferrer" href="${esc(l.url)}">🌐 ${esc(l.label)}</a>`).join("");
  const centreTitle = a.centreMode === "choose" ? "📍 Exam centre preference" : "📍 Exam centre";
  const centreHelp = a.centreMode === "choose"
    ? "Write your 3 preferred cities in order, so you are ready when you fill the official form."
    : "Write the cities near you. This helps you choose the right RRB.";
  const inputs = [0,1,2].map(i=>`<div class="centre-row"><span class="centre-no">${i+1}</span><input list="cityList" id="ec${i}" placeholder="${i===0?"Nearest city":"Backup city"}" value="${esc(saved[i]||"")}"><button class="outline-button" onclick="openCentreMap(${i})">🗺️ Maps</button></div>`).join("");
  const docs = a.docs.map((d,i)=>`<label class="doc-row"><input type="checkbox" ${docsDone.includes(i)?"checked":""} onchange="toggleExamDoc('${enc}',${i},this.checked)"> ${esc(d)}</label>`).join("");
  openGovModal(`<div class="qz-top"><h2>📝 Apply for ${esc(name)}</h2><button class="outline-button" onclick="closeGovModal()">✕ Close</button></div>
    <p class="qz-count">Applications are made only on the official website. Check the latest notification for dates, fee and eligibility before you apply.</p>
    <div class="cv-actions">${links}</div>
    <h3>${centreTitle}</h3>
    <p class="qz-count">${esc(a.centreNote)}</p><p class="qz-count">${esc(centreHelp)}</p>
    ${inputs}<datalist id="cityList">${CITY_LIST.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
    <div class="cv-actions"><button class="main-button" onclick="saveExamCentres('${enc}')">Save my centre choices</button></div>
    <h3>Steps to apply</h3><ol class="apply-steps">${a.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
    <h3>Keep these ready</h3>${docs}
    <div class="apply-done">${done?`<span class="badge green">✓ Marked as applied on ${esc(done)}</span> <button class="outline-button" onclick="markExamApplied('${enc}',false)">Undo</button>`:`<button class="success-button" onclick="markExamApplied('${enc}',true)">I have applied</button>`}</div>
    <p class="demo-note">Never pay through third-party websites. Use only the official links above.</p>`);
}

function openCentreMap(i) {
  const city = $("ec"+i)?.value.trim();
  if (!city) return showMessage("Type a city first.");
  window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("computer based exam centre in " + city), "_blank", "noopener");
}
function saveExamCentres(enc) {
  const name = decodeURIComponent(enc);
  currentUser.examCentres = currentUser.examCentres || {};
  currentUser.examCentres[name] = [0,1,2].map(i=>$("ec"+i).value.trim());
  saveUser(); showMessage("Centre choices saved.");
}
function toggleExamDoc(enc, i, on) {
  const name = decodeURIComponent(enc);
  currentUser.examDocs = currentUser.examDocs || {};
  const set = new Set(currentUser.examDocs[name] || []);
  on ? set.add(i) : set.delete(i);
  currentUser.examDocs[name] = [...set]; saveUser();
}
function markExamApplied(enc, on) {
  const name = decodeURIComponent(enc);
  currentUser.examApplied = currentUser.examApplied || {};
  if (on) currentUser.examApplied[name] = new Date().toLocaleDateString("en-IN"); else delete currentUser.examApplied[name];
  saveUser(); renderGov(); openApply(enc);
}

let lastPlan = null;

function openStudyPlan(enc) {
  const name = decodeURIComponent(enc), ex = GOV_SYLLABUS[name]; if (!ex) return;
  const saved = currentUser?.studyPlans?.[name] || {};
  const levelOpts = sel => ["Weak","Average","Strong"].map(l=>`<option ${((sel||"Average")===l)?"selected":""}>${l}</option>`).join("");
  const rows = ex.subjects.map((s,i)=>`<div class="plan-level"><span>${esc(s.name)}</span><select id="gpLvl${i}">${levelOpts(saved.levels?.[i])}</select></div>`).join("");
  openGovModal(`<div class="qz-top"><h2>🗓️ ${esc(name)} Study Plan</h2><button class="outline-button" onclick="closeGovModal()">✕ Close</button></div>
    <p class="qz-count">Tell us your time and how strong you are in each subject. Weak subjects get more time.</p>
    <div class="two">
      <div class="input-group"><label>Weeks until exam</label><input id="gpWeeks" type="number" min="2" max="52" value="${saved.weeks||12}"></div>
      <div class="input-group"><label>Study hours per day</label><input id="gpHours" type="number" min="1" max="12" step="0.5" value="${saved.hours||3}"></div>
    </div>
    <h3>Your level in each subject</h3>${rows}
    <div class="cv-actions"><button class="main-button" onclick="generateStudyPlan('${enc}')">Create My Plan</button></div>
    <div id="gpResult"></div>`);
  if (saved.weeks) generateStudyPlan(enc);
}

function buildStudyPlan(ex, weeks, hpd, levels) {
  const rev = weeks >= 10 ? 2 : weeks >= 5 ? 1 : 0;
  const S = weeks - rev, factor = {Weak:1.5, Average:1, Strong:0.6};
  const subs = ex.subjects.map((s,i)=>({...s, level:levels[i], w:s.weight*(factor[levels[i]]||1)}));
  const totalW = subs.reduce((a,s)=>a+s.w,0);
  const weekHours = hpd*6;                       // 6 study days, 1 day for tests and rest
  const study = [];
  for (let wk=0; wk<S; wk++) {
    const items = subs.map(s=>{
      const n=s.topics.length, from=Math.floor(wk*n/S), to=Math.floor((wk+1)*n/S);
      return {subject:s.name, hours:Math.max(0.5, Math.round(weekHours*s.w/totalW*2)/2), topics:s.topics.slice(from,to)};
    });
    study.push({week:wk+1, items, test: wk < S/2 ? "Day 7: sectional tests on this week's topics." : "Day 7: one full mock test, then review every mistake."});
  }
  const weakNames = subs.filter(s=>s.level==="Weak").map(s=>s.name);
  const focus = (weakNames.length ? weakNames : subs.map(s=>s.name)).join(", ");
  const revision = [];
  for (let r=0; r<rev; r++) revision.push({week:S+r+1, text:`Revision week. Revise short notes and formulas. Focus on: ${focus}. Solve previous year papers and take a full mock test every 2 days.`});
  return {study, revision, weekHours};
}

function generateStudyPlan(enc) {
  const name = decodeURIComponent(enc), ex = GOV_SYLLABUS[name]; if (!ex) return;
  const weeks = Math.min(52, Math.max(2, Math.round(Number($("gpWeeks").value)||12)));
  const hpd = Math.min(12, Math.max(1, Number($("gpHours").value)||3));
  const levels = ex.subjects.map((_,i)=>$("gpLvl"+i).value);
  const plan = buildStudyPlan(ex, weeks, hpd, levels);
  lastPlan = {name, weeks, hpd, levels, plan, tips:null};
  currentUser.studyPlans = currentUser.studyPlans || {};
  currentUser.studyPlans[name] = {weeks, hours:hpd, levels}; saveUser();

  const weekCards = plan.study.map(w=>`<div class="plan-week"><h4>Week ${w.week}</h4>
    ${w.items.map(i=>`<p><strong>${esc(i.subject)}</strong> · ${i.hours} h/week<br><span class="plan-topics">${i.topics.length ? esc(i.topics.join(", ")) : "Practice questions and previous year papers"}</span></p>`).join("")}
    <p class="plan-test">${esc(w.test)}</p></div>`).join("")
    + plan.revision.map(r=>`<div class="plan-week plan-rev"><h4>Week ${r.week}</h4><p>${esc(r.text)}</p></div>`).join("");
  $("gpResult").innerHTML = `<h3>Your plan: ${weeks} weeks · ${hpd} h/day</h3>
    <p class="qz-count">About ${plan.weekHours} study hours per week (6 days). Day 7 is for a test and rest.</p>
    <div class="cv-actions"><button class="success-button" onclick="getStudyTips()">✨ Get AI tips</button><button class="outline-button" onclick="downloadStudyPlan()">⬇ Download</button></div>
    <div id="gpTips"></div>${weekCards}<p class="demo-note">${esc(GOV_NOTE)}</p>`;
}

async function getStudyTips() {
  if (!lastPlan) return;
  const box = $("gpTips"); box.innerHTML = '<p class="qz-count">🧠 Preparing tips...</p>';
  const ex = GOV_SYLLABUS[lastPlan.name], u = currentUser;
  try {
    const r = await callAI("studyplan",{
      exam:lastPlan.name, weeks:lastPlan.weeks, hours:lastPlan.hpd,
      weak:ex.subjects.filter((_,i)=>lastPlan.levels[i]==="Weak").map(s=>s.name),
      strong:ex.subjects.filter((_,i)=>lastPlan.levels[i]==="Strong").map(s=>s.name),
      education:u.education||[], skills:u.skills||[]
    });
    lastPlan.tips = r;
    box.innerHTML = `<div class="settings-card"><p>${esc(r.strategy||"")}</p><ul>${(r.tips||[]).map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>`;
  } catch(e) { box.innerHTML = `<p class="qz-warn">${esc(/fetch|Failed/i.test(e.message)?"Cannot reach the server. Start server.js and try again.":e.message)}</p>`; }
}

function downloadStudyPlan() {
  if (!lastPlan) return;
  const L = [`${lastPlan.name} STUDY PLAN`, `${lastPlan.weeks} weeks · ${lastPlan.hpd} hours/day`, ""];
  lastPlan.plan.study.forEach(w=>{
    L.push(`WEEK ${w.week}`);
    w.items.forEach(i=>L.push(`- ${i.subject} (${i.hours} h): ${i.topics.length ? i.topics.join(", ") : "Practice questions and previous year papers"}`));
    L.push(w.test, "");
  });
  lastPlan.plan.revision.forEach(r=>L.push(`WEEK ${r.week}`, r.text, ""));
  if (lastPlan.tips) { L.push("TIPS", lastPlan.tips.strategy||""); (lastPlan.tips.tips||[]).forEach(t=>L.push("- "+t)); L.push(""); }
  L.push(GOV_NOTE);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([L.join("\n")],{type:"text/plain"}));
  a.download = lastPlan.name.replace(/\s+/g,"_")+"_study_plan.txt"; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
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

async function callAI(task,data,tries=2) {
  let lastErr;
  for (let i=0;i<tries;i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 45000);
    try {
      const r = await fetch(API_BASE, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,data}),signal:ctrl.signal});
      const j = await r.json().catch(()=>({}));
      if (!r.ok || j.error) throw new Error(j.error || "AI server error");
      return j;
    } catch(e) {
      lastErr = e.name==="AbortError" ? new Error("AI took too long. Try again.") : e;
      if (i < tries-1) await new Promise(res=>setTimeout(res,800));
    } finally { clearTimeout(timer); }
  }
  throw lastErr;
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

let cvBusy = false;
async function improveCVWithAI() {
  if (cvBusy) return;
  const text = $("voiceText").value.trim();
  if (!text) return showMessage("Speak or type something first.");
  cvBusy = true;
  $("aiStatus").textContent = "🧠 AI is preparing your CV...";
  try {
    const u = currentUser;
    const r = await callAI("cv",{
      text, goal:u.careerGoal, skills:u.skills, knownSkills:SKILLS,
      current:{summary:u.summary,education:u.education,experience:u.experience,projects:u.projects,certifications:u.certifications,languages:u.languages,hobbies:u.hobbies}
    });
    // Keep old data if AI returns an empty list for a field.
    const keep = (n,o) => (Array.isArray(n) && n.length) ? n : (o || []);
    u.summary = r.summary || u.summary;
    const skills = keep(r.skills,u.skills).map(normalizeSkill);
    u.skills = skills.filter((s,i)=>s && skills.findIndex(x=>String(x).toLowerCase()===String(s).toLowerCase())===i);
    u.education = keep(r.education,u.education);
    u.experience = keep(r.experience,u.experience);
    u.projects = keep(r.projects,u.projects);
    u.certifications = keep(r.certifications,u.certifications);
    u.languages = keep(r.languages,u.languages);
    u.hobbies = keep(r.hobbies,u.hobbies);
    saveUser(); updateUserUI(); updateCVPreview(); updateDashboard();
    $("aiStatus").textContent = "✓ CV updated";
    showMessage("AI updated your CV.");
  } catch(e) {
    $("aiStatus").textContent = "AI unavailable";
    showMessage(/fetch|Failed|network/i.test(e.message) ? "Cannot reach the server. Start server.js and try again." : e.message);
  } finally { cvBusy = false; }
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

function setVoiceUI(on) {
  const btn=$("voiceButton"), box=$("voiceText");
  btn.textContent = on ? "⏹ Stop & Create CV" : "🎙️ Speak";
  btn.classList.toggle("recording", on);
  box.readOnly = on;                 // stops edits fighting with live speech
  $("voiceLang").disabled = on;
}

function stopVoice() {
  listening = false;
  try { recognition.stop(); } catch {}
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status=$("voiceStatus"), box=$("voiceText");
  if (!SR) return status.textContent="Voice needs Chrome or Edge. Or type below.";
  if (listening) return stopVoice();
  if (cvBusy) return;

  let fastFails = 0, netFails = 0, startedAt = 0, errored = false;

  const finish = () => {
    listening = false; setVoiceUI(false);
    box.value = box.value.replace(/\s+/g," ").trim();
    if (box.value) { status.textContent="🧠 Analysing..."; improveCVWithAI(); }
    else if (!errored) status.textContent="No speech heard. Check your microphone and try again.";
  };

  const begin = () => {
    const base = box.value.trim();   // everything captured before this session
    recognition = new SR();
    recognition.lang = $("voiceLang").value;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Rebuild from ALL results of this session each time (avoids duplicated words on some phones).
    recognition.onresult = e => {
      let fin="", interim="";
      for (let i=0;i<e.results.length;i++) {
        const t = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal) fin += " "+t; else interim += " "+t;
      }
      netFails = 0;
      box.value = (base+" "+fin+" "+interim).replace(/\s+/g," ").trim();
    };

    recognition.onerror = e => {
      if (e.error==="no-speech" || e.error==="aborted") return;
      if (e.error==="network" && ++netFails < 3) return;   // try again quietly
      const msgs = {
        "not-allowed":"Microphone is blocked. Allow the mic in the browser address bar.",
        "service-not-allowed":"Microphone is blocked. Allow the mic in the browser address bar.",
        "audio-capture":"No microphone found.",
        "language-not-supported":"This language is not supported by your browser.",
        "network":"Voice needs internet. Check your connection."
      };
      status.textContent = msgs[e.error] || "Voice error: "+e.error;
      errored = true; listening = false;
    };

    recognition.onend = () => {
      if (listening) {
        // The browser ends the session after silence. Restart, but stop if it keeps failing at once.
        fastFails = (Date.now()-startedAt < 1500) ? fastFails+1 : 0;
        if (fastFails < 4) return setTimeout(()=>{ if (listening) { try { begin(); } catch { finish(); } } }, 250);
        listening = false;
      }
      finish();
    };

    startedAt = Date.now();
    recognition.start();
  };

  listening = true; setVoiceUI(true);
  status.textContent = "🔴 Listening... speak clearly, then press Stop.";
  try { begin(); } catch { listening=false; setVoiceUI(false); status.textContent="Could not start the microphone."; }
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