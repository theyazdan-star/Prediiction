// app.js - WC 2026 Knockout Predictor (full bracket: R32 -> R16 -> QF -> SF -> Final)

// ---- Round of 32 (starting data) ----
const round0Left = [
    { id: "l-0-1", home: "Germany", away: "Paraguay", flagH: "🇩🇪", flagA: "🇵🇾" },
    { id: "l-0-2", home: "France", away: "Sweden", flagH: "🇫🇷", flagA: "🇸🇪" },
    { id: "l-0-3", home: "South Africa", away: "Canada", flagH: "🇿🇦", flagA: "🇨🇦" },
    { id: "l-0-4", home: "Netherlands", away: "Morocco", flagH: "🇳🇱", flagA: "🇲🇦" },
    { id: "l-0-5", home: "Portugal", away: "Croatia", flagH: "🇵🇹", flagA: "🇭🇷" },
    { id: "l-0-6", home: "Spain", away: "Austria", flagH: "🇪🇸", flagA: "🇦🇹" },
    { id: "l-0-7", home: "USA", away: "Bosnia and Herzegovina", flagH: "🇺🇸", flagA: "🇧🇦" },
    { id: "l-0-8", home: "Belgium", away: "Senegal", flagH: "🇧🇪", flagA: "🇸🇳" }
];

const round0Right = [
    { id: "r-0-1", home: "Brazil", away: "Japan", flagH: "🇧🇷", flagA: "🇯🇵" },
    { id: "r-0-2", home: "Ivory Coast", away: "Norway", flagH: "🇨🇮", flagA: "🇳🇴" },
    { id: "r-0-3", home: "Mexico", away: "Ecuador", flagH: "🇲🇽", flagA: "🇪🇨" },
    { id: "r-0-4", home: "England", away: "DR Congo", flagH: "🇬🇧", flagA: "🇨🇩" },
    { id: "r-0-5", home: "Argentina", away: "Cape Verde", flagH: "🇦🇷", flagA: "🇨🇻" },
    { id: "r-0-6", home: "Australia", away: "Egypt", flagH: "🇦🇺", flagA: "🇪🇬" },
    { id: "r-0-7", home: "Switzerland", away: "Algeria", flagH: "🇨🇭", flagA: "🇩🇿" },
    { id: "r-0-8", home: "Colombia", away: "Ghana", flagH: "🇨🇴", flagA: "🇬🇭" }
];

// ---- Auto-generate every later round from the previous one ----
function buildRounds(round0, prefix) {
    const rounds = [round0];
    let prev = round0;
    let roundIndex = 1;
    while (prev.length > 1) {
        const next = [];
        for (let i = 0; i < prev.length; i += 2) {
            next.push({
                id: `${prefix}-${roundIndex}-${next.length + 1}`,
                homeRef: prev[i].id,
                awayRef: prev[i + 1].id
            });
        }
        rounds.push(next);
        prev = next;
        roundIndex++;
    }
    return rounds;
}

const leftRounds = buildRounds(round0Left, "l");
const rightRounds = buildRounds(round0Right, "r");

const finalMatch = {
    id: "final",
    homeRef: leftRounds[leftRounds.length - 1][0].id,
    awayRef: rightRounds[rightRounds.length - 1][0].id
};

const ROUND_LABELS = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals"];

const allMatches = [].concat(...leftRounds, ...rightRounds, [finalMatch]);

const teamFlags = {};
[...round0Left, ...round0Right].forEach(m => {
    teamFlags[m.home] = m.flagH;
    teamFlags[m.away] = m.flagA;
});

let currentUser = null;
let predictions = {};

function startPrediction() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (!username) {
        alert("Please enter a username!");
        return;
    }
    currentUser = username;
    predictions = {};
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    renderBrackets();
}

function getTeam(match, slot) {
    if (slot === 'home' && match.home) return { name: match.home, flag: match.flagH };
    if (slot === 'away' && match.away) return { name: match.away, flag: match.flagA };
    const ref = slot === 'home' ? match.homeRef : match.awayRef;
    if (!ref) return null;
    const winner = predictions[ref];
    if (!winner) return null;
    return { name: winner, flag: teamFlags[winner] || "🏳️" };
}

function findDependents(matchId) {
    return allMatches
        .filter(m => m.homeRef === matchId || m.awayRef === matchId)
        .map(m => m.id);
}

function clearDownstream(matchId) {
    findDependents(matchId).forEach(depId => {
        if (predictions[depId]) {
            delete predictions[depId];
        }
        clearDownstream(depId);
    });
}

function selectWinner(matchId, winner) {
    predictions[matchId] = winner;
    clearDownstream(matchId);
    renderBrackets();
}

function escapeForAttr(str) {
    return String(str).replace(/'/g, "&#39;");
}

// Renders one team row inside a match pair. `flip` mirrors the flag/name order for right-side columns
// so the bracket reads as mirrored toward the center, matching the reference layout.
// `clickable` is false until BOTH teams in the match are known, so a decided team can't be
// picked while its opponent is still TBD.
function teamRowHTML(match, team, flip, clickable, delay) {
    const locked = !team || !clickable;
    if (!team) {
        const flagPart = `<span class="team-flag-mini bg-zinc-800 flex items-center justify-center text-xs">❔</span>`;
        const namePart = `<span class="team-name text-zinc-500">TBD</span>`;
        return `
            <div class="team-row locked anim-in" style="--delay:${delay}s">
                ${flip ? namePart + flagPart : flagPart + namePart}
            </div>
        `;
    }

    const attr = escapeForAttr(team.name);
    const isPicked = predictions[match.id] === team.name;
    const flagPart = `<span class="team-flag-mini flex items-center justify-center text-lg">${team.flag}</span>`;
    const namePart = `<span class="team-name">${team.name}</span>`;
    const clickAttr = clickable ? `onclick="selectWinner('${match.id}', '${attr}')"` : '';

    return `
        <div ${clickAttr}
             class="team-row ${isPicked ? 'picked' : ''} ${locked ? 'locked' : ''} anim-in" style="--delay:${delay}s">
            ${flip ? namePart + flagPart : flagPart + namePart}
        </div>
    `;
}

// One "slot-pair" = the two team rows for a single match, with a connector line drawn via CSS.
function matchPairHTML(match, flip, delayBase) {
    const homeTeam = getTeam(match, 'home');
    const awayTeam = getTeam(match, 'away');
    const bothKnown = !!(homeTeam && awayTeam);
    return `
        <div class="slot-pair">
            ${teamRowHTML(match, homeTeam, flip, bothKnown, delayBase)}
            ${teamRowHTML(match, awayTeam, flip, bothKnown, delayBase + 0.05)}
        </div>
    `;
}

// Renders one full column of matches for a round (left side flows left->right, right side mirrors).
function columnHTML(matches, label, accentClass, flip, delayOffset) {
    const flipClass = flip ? 'flip' : '';
    const pairs = matches.map((m, i) => matchPairHTML(m, flip, delayOffset + i * 0.06)).join('');
    return `
        <div class="bracket-col ${flipClass}">
            <div class="col-label ${accentClass}">${label}</div>
            <div class="match-stack">${pairs}</div>
        </div>
    `;
}

function renderBrackets() {
    const cols = [];

    // Left side: R32 -> R16 -> QF -> SF, flowing toward center
    cols.push(columnHTML(leftRounds[0], 'Round of 32', 'accent-32', false, 0));
    cols.push(columnHTML(leftRounds[1], 'Round of 16', 'accent-16', false, 0.1));
    cols.push(columnHTML(leftRounds[2], 'Quarterfinals', 'accent-qf', false, 0.2));
    cols.push(columnHTML(leftRounds[3], 'Semifinals', 'accent-sf', false, 0.3));

    // Center: Final + Champion
    const champion = predictions['final'];
    cols.push(`
        <div class="bracket-col" style="width:220px; align-items:center; justify-content:center; gap:1.5rem;">
            <div class="col-label accent-final">Final</div>
            <div style="width:100%;">${matchPairHTML(finalMatch, false, 0.4)}</div>
            <div id="champion-box" class="champion-box ${champion ? 'revealed' : 'champion-empty'}">
                <div class="champion-trophy">🏆</div>
                <div class="text-xs uppercase tracking-wider text-zinc-500 font-bold mt-1">Champion</div>
                <div class="text-xl font-extrabold mt-1 ${champion ? 'text-amber-400' : 'text-zinc-600'}">${champion || '???'}</div>
            </div>
        </div>
    `);

    // Right side: mirrors left, flowing from center outward (SF -> QF -> R16 -> R32)
    cols.push(columnHTML(rightRounds[3], 'Semifinals', 'accent-sf', true, 0.3));
    cols.push(columnHTML(rightRounds[2], 'Quarterfinals', 'accent-qf', true, 0.2));
    cols.push(columnHTML(rightRounds[1], 'Round of 16', 'accent-16', true, 0.1));
    cols.push(columnHTML(rightRounds[0], 'Round of 32', 'accent-32', true, 0));

    document.getElementById('bracket-container').innerHTML = cols.join('');
    updateProgress();

    const wasChampion = window.__lastChampion;
    if (champion && champion !== wasChampion) {
        fireConfetti();
    }
    window.__lastChampion = champion;
}

function updateProgress() {
    const count = Object.keys(predictions).length;
    document.getElementById('progress').textContent = `${count}/${allMatches.length} matches predicted`;
}

function fireConfetti() {
    const colors = ['#f59e0b', '#fbbf24', '#22c55e', '#3b82f6', '#ef4444'];
    const piecesCount = 60;
    for (let i = 0; i < piecesCount; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        piece.style.animationDelay = (Math.random() * 0.4) + 's';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
    }
}

function imageMatchRowHTML(match) {
    const homeTeam = getTeam(match, 'home');
    const awayTeam = getTeam(match, 'away');
    const winner = predictions[match.id];
    return `
        <div style="background:rgba(39,39,42,0.9); padding:14px; margin:8px 0; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:16px;">
            <span style="font-size:18px;">${homeTeam.flag} ${homeTeam.name} <span style="color:#71717a">vs</span> ${awayTeam.flag} ${awayTeam.name}</span>
            <span style="color:#4ade80; font-weight:bold; font-size:16px; white-space:nowrap;">🏆 ${winner}</span>
        </div>
    `;
}

function generateBracketImage() {
    if (Object.keys(predictions).length < allMatches.length) {
        alert("Please predict all matches first, all the way to the Final!");
        return;
    }
    const champion = predictions['final'];
    const element = document.createElement('div');
    element.style.cssText = `position: fixed; top: -9999px; left: -9999px; background: linear-gradient(135deg, #18181b, #27272a); color: white; padding: 40px; width: 1100px; font-family: system-ui; border-radius: 20px;`;
    element.innerHTML = `
        <div style="text-align:center; margin-bottom:30px;">
            <h1 style="font-size:38px;">🏆 WC 2026 Knockout Predictions</h1>
            <p style="font-size:20px; color:#a1a1aa;">by <strong>${currentUser}</strong></p>
            <div style="margin-top:20px; background:linear-gradient(135deg,#f59e0b,#fbbf24); color:#1c1917; padding:16px 32px; border-radius:16px; display:inline-block;">
                <div style="font-size:16px; font-weight:600;">CHAMPION</div>
                <div style="font-size:30px; font-weight:800;">${champion}</div>
            </div>
        </div>
        ${ROUND_LABELS.map((label, i) => `
            <div style="margin-bottom:26px;">
                <h2 style="text-align:center; color:#fbbf24; font-size:22px; margin-bottom:10px;">${label}</h2>
                <div style="display:flex; gap:40px;">
                    <div style="flex:1">${leftRounds[i].map(imageMatchRowHTML).join('')}</div>
                    <div style="flex:1">${rightRounds[i].map(imageMatchRowHTML).join('')}</div>
                </div>
            </div>
        `).join('')}
        <div>
            <h2 style="text-align:center; color:#fbbf24; font-size:22px; margin-bottom:10px;">Final</h2>
            <div style="max-width:600px; margin:0 auto;">${imageMatchRowHTML(finalMatch)}</div>
        </div>
    `;
    document.body.appendChild(element);
    html2canvas(element, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${currentUser}_wc2026_bracket.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(element);
    });
}
