// ===== Cricket Scorer =====
const KEY = "cricket-scorer-v1";
const $ = (id) => document.getElementById(id);

let state = null;   // the whole match
let history = [];   // snapshots for undo

// ---------- helpers ----------
function newInnings() {
    return { runs: 0, wkts: 0, balls: 0, extras: 0, thisOver: [], newOver: false };
}
const oversText = (balls) => Math.floor(balls / 6) + "." + (balls % 6);
const rate = (runs, balls) => (balls ? ((runs / balls) * 6).toFixed(2) : "0.00");
const battingIdx = () => (state.innings === 0 ? state.batFirst : 1 - state.batFirst);

function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ state, history })); } catch (e) { }
}
function load() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));
        if (data && data.state) { state = data.state; history = data.history || []; return true; }
    } catch (e) { }
    return false;
}
function clearSaved() {
    try { localStorage.removeItem(KEY); } catch (e) { }
}
function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- match setup ----------
function updateTossOptions() {
    const a = $("teamA").value.trim() || "Team 1";
    const b = $("teamB").value.trim() || "Team 2";
    const sel = $("batFirst");
    const keep = sel.value || "0";
    sel.innerHTML = "";
    [a, b].forEach((name, i) => {
        const o = document.createElement("option");
        o.value = i; o.textContent = name;
        sel.appendChild(o);
    });
    sel.value = keep;
}
$("teamA").addEventListener("input", updateTossOptions);
$("teamB").addEventListener("input", updateTossOptions);

$("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const a = $("teamA").value.trim() || "Team 1";
    const b = $("teamB").value.trim() || "Team 2";
    const overs = Math.min(50, Math.max(1, parseInt($("overs").value) || 10));
    const wickets = Math.min(11, Math.max(1, parseInt($("wickets").value) || 10));
    state = {
        teams: [a, b],
        overs,
        maxWkts: wickets,
        batFirst: parseInt($("batFirst").value) || 0,
        innings: 0,
        inn: [newInnings(), newInnings()],
        target: null,
        onBreak: false,
        over: false,
        result: ""
    };
    history = [];
    save();
    render();
});

// ---------- scoring ----------
function score(type, r) {
    if (!state || state.over || state.onBreak) return;
    history.push(JSON.stringify(state));
    if (history.length > 400) history.shift();

    const inn = state.inn[state.innings];
    if (inn.newOver) { inn.thisOver = []; inn.newOver = false; }

    let label, legal = true;
    if (type === "run") { inn.runs += r; label = String(r); }
    else if (type === "wd") { inn.runs += 1; inn.extras += 1; legal = false; label = "Wd"; }
    else if (type === "nb") { inn.runs += 1; inn.extras += 1; legal = false; label = "Nb"; }
    else if (type === "w") { inn.wkts += 1; label = "W"; }

    if (legal) {
        inn.balls += 1;
        if (inn.balls % 6 === 0) inn.newOver = true;
    }
    inn.thisOver.push(label);

    checkEnd();
    save();
    render();
}

function checkEnd() {
    const inn = state.inn[state.innings];
    const maxBalls = state.overs * 6;
    const allOut = inn.wkts >= state.maxWkts;
    const oversDone = inn.balls >= maxBalls;

    if (state.innings === 0) {
        if (allOut || oversDone) {
            state.target = inn.runs + 1;
            state.onBreak = true;
        }
        return;
    }

    // 2nd innings
    const chasing = state.teams[battingIdx()];
    const defending = state.teams[1 - battingIdx()];
    if (inn.runs >= state.target) {
        const wl = state.maxWkts - inn.wkts;
        const bl = maxBalls - inn.balls;
        state.over = true;
        state.result = `${chasing} won by ${wl} wicket${wl === 1 ? "" : "s"} (${bl} ball${bl === 1 ? "" : "s"} left)`;
    } else if (allOut || oversDone) {
        state.over = true;
        const diff = state.target - 1 - inn.runs;
        state.result = diff === 0 ? "Match tied!" : `${defending} won by ${diff} run${diff === 1 ? "" : "s"}`;
    }
}

function startSecondInnings() {
    if (!state || !state.onBreak) return;
    history.push(JSON.stringify(state));
    state.innings = 1;
    state.onBreak = false;
    save();
    render();
}

function undo() {
    if (!history.length) { toast("Nothing to undo"); return; }
    state = JSON.parse(history.pop());
    save();
    render();
}

// ---------- render ----------
function ballClass(label) {
    if (label === "4") return "b4";
    if (label === "6") return "b6";
    if (label === "W") return "bw";
    if (label === "Wd" || label === "Nb") return "bx";
    return "";
}

function render() {
    const live = !!state;
    $("setup").classList.toggle("hidden", live);
    $("match").classList.toggle("hidden", !live);
    if (!live) return;

    const inn = state.inn[state.innings];
    const maxBalls = state.overs * 6;

    $("innTag").textContent = state.innings === 0 ? "1st Innings" : "2nd Innings";
    $("batTeam").textContent = state.teams[battingIdx()];
    $("runs").textContent = inn.runs;
    $("wkts").textContent = inn.wkts;
    $("oversDone").textContent = oversText(inn.balls);
    $("maxOvers").textContent = state.overs;
    $("crr").textContent = rate(inn.runs, inn.balls);

    // target / required rate (2nd innings)
    const tb = $("targetBox");
    if (state.innings === 1 && !state.over) {
        const need = state.target - inn.runs;
        const left = maxBalls - inn.balls;
        tb.classList.remove("hidden");
        tb.innerHTML = `Need <b>${need}</b> from <b>${left}</b> balls · Req. Rate <b>${rate(need, left)}</b>`;
    } else if (state.innings === 1) {
        tb.classList.remove("hidden");
        tb.innerHTML = `Target <b>${state.target}</b>`;
    } else {
        tb.classList.add("hidden");
    }

    // this over
    const strip = $("overStrip");
    strip.innerHTML = "";
    if (!inn.thisOver.length) {
        strip.innerHTML = '<span class="empty">No balls yet</span>';
    } else {
        inn.thisOver.forEach((label) => {
            const s = document.createElement("span");
            s.className = "ball " + ballClass(label);
            s.textContent = label;
            strip.appendChild(s);
        });
    }

    // banner + start 2nd innings
    const banner = $("banner");
    const startBtn = $("startSecond");
    banner.classList.add("hidden");
    banner.classList.remove("win");
    startBtn.classList.add("hidden");
    if (state.over) {
        banner.textContent = "🏆 " + state.result;
        banner.classList.add("win");
        banner.classList.remove("hidden");
    } else if (state.onBreak) {
        const first = state.inn[0];
        banner.textContent =
            `Innings break: ${state.teams[state.batFirst]} scored ${first.runs}/${first.wkts}. ` +
            `${state.teams[1 - state.batFirst]} need ${state.target} to win.`;
        banner.classList.remove("hidden");
        startBtn.classList.remove("hidden");
    }

    // disable scoring when nothing can be scored
    const locked = state.over || state.onBreak;
    document.querySelectorAll("#match .pad button").forEach((b) => {
        if (b.id !== "undoBtn" && b.id !== "copyBtn" && b.id !== "newBtn") b.disabled = locked;
    });

    renderSummary();
}

function renderSummary() {
    const body = $("summaryBody");
    body.innerHTML = "";
    [0, 1].forEach((i) => {
        const inn = state.inn[i];
        const team = state.teams[i === 0 ? state.batFirst : 1 - state.batFirst];
        const started = i === 0 || state.innings === 1;
        const tr = document.createElement("tr");
        tr.innerHTML = started
            ? `<td>${team}</td><td>${inn.runs}/${inn.wkts}</td><td>${oversText(inn.balls)}</td><td>${inn.extras}</td><td>${rate(inn.runs, inn.balls)}</td>`
            : `<td>${team}</td><td colspan="4">Yet to bat</td>`;
        body.appendChild(tr);
    });
}

// ---------- copy scorecard ----------
function scorecardText() {
    const lines = ["🏏 Cricket Scorer"];
    [0, 1].forEach((i) => {
        const inn = state.inn[i];
        const team = state.teams[i === 0 ? state.batFirst : 1 - state.batFirst];
        if (i === 0 || state.innings === 1) {
            lines.push(`${team}: ${inn.runs}/${inn.wkts} (${oversText(inn.balls)} ov)`);
        }
    });
    if (state.over) lines.push("Result: " + state.result);
    return lines.join("\n");
}

$("copyBtn").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(scorecardText());
        toast("Scorecard copied!");
    } catch (e) {
        toast("Copy not supported here");
    }
});

// ---------- events ----------
$("runPad").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-run]");
    if (btn) score("run", parseInt(btn.dataset.run));
});
$("wideBtn").addEventListener("click", () => score("wd"));
$("nbBtn").addEventListener("click", () => score("nb"));
$("wicketBtn").addEventListener("click", () => score("w"));
$("undoBtn").addEventListener("click", undo);
$("startSecond").addEventListener("click", startSecondInnings);
$("newBtn").addEventListener("click", () => {
    if (confirm("Start a new match? The current match will be cleared.")) {
        state = null; history = [];
        clearSaved();
        render();
    }
});

document.addEventListener("keydown", (e) => {
    if (!state || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if ("01234".includes(k) && k.length === 1) score("run", parseInt(k));
    else if (k === "6") score("run", 6);
    else if (k === "e") score("wd");
    else if (k === "n") score("nb");
    else if (k === "w") score("w");
    else if (k === "u") undo();
});

// ---------- start ----------
updateTossOptions();
load();
render();