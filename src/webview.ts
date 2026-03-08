export function getWebviewContent(p5Uri: string, nonce: string, cspSource: string): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'nonce-${nonce}' ${cspSource}; style-src 'unsafe-inline';" />
<title>Zenith Ghost</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: transparent !important;
    overflow: hidden;
    width: 100%; height: 100%;
    color: white;
    font-family: 'Segoe UI', Consolas, monospace;
  }
  canvas { display: block; position: absolute; top: 0; left: 0; z-index: 1; }

  #ghost-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 10;
    background: rgba(0, 0, 0, 0.65);
    justify-content: center;
    align-items: center;
  }
  #ghost-overlay.visible { display: flex; }

  .ghost-code-panel {
    background: #1a1a2e;
    border: 1px solid #d4a830;
    border-radius: 10px;
    padding: 0;
    max-width: 460px;
    width: 90%;
    box-shadow: 0 0 30px rgba(210, 170, 50, 0.2), 0 0 60px rgba(210, 170, 50, 0.08);
    overflow: hidden;
    font-family: Consolas, monospace;
  }
  .ghost-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(90deg, #2a2210, #1a1a2e);
    border-bottom: 1px solid #d4a830aa;
  }
  .ghost-code-header span {
    color: #f0c850;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
  }
  .ghost-code-close {
    background: none; border: none; color: #f0c850; font-size: 16px;
    cursor: pointer; padding: 0 4px; line-height: 1;
  }
  .ghost-code-close:hover { color: #ffe080; }

  .ghost-code-body {
    padding: 14px;
  }
  .ghost-code-error {
    color: #f0d070;
    font-size: 11px;
    margin-bottom: 10px;
    padding: 6px 8px;
    background: rgba(210, 170, 50, 0.1);
    border-radius: 4px;
    border-left: 3px solid #d4a830;
  }
  .ghost-code-block {
    background: #0d0d1a;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 12px;
    font-size: 12px;
    color: #00ffc8;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 160px;
    overflow-y: auto;
  }
  .ghost-code-line {
    color: #555;
    font-size: 10px;
    margin-top: 8px;
  }

  .ghost-code-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid #333;
    background: #111;
  }
  .ghost-btn {
    padding: 6px 16px;
    border: none;
    border-radius: 5px;
    font-size: 11px;
    font-family: Consolas, monospace;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.15s;
  }
  .ghost-btn-cancel {
    background: #2a2a2a;
    color: #aaa;
  }
  .ghost-btn-cancel:hover { background: #3a3a3a; color: #fff; }
  .ghost-btn-apply {
    background: linear-gradient(135deg, #00c896, #00a67d);
    color: #000;
    font-weight: 700;
  }
  .ghost-btn-apply:hover {
    background: linear-gradient(135deg, #00e6a8, #00c896);
    box-shadow: 0 0 12px rgba(0, 200, 150, 0.4);
  }

  #roadmap-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 20;
    background: rgba(5, 5, 20, 0.95);
    justify-content: center;
    align-items: center;
    overflow-y: auto;
  }
  #roadmap-overlay.visible { display: flex; }

  .roadmap-panel {
    background: linear-gradient(135deg, #0d0d2b, #1a1a3e);
    border: 1px solid #00ffc8;
    border-radius: 14px;
    padding: 0;
    max-width: 520px;
    width: 92%;
    box-shadow: 0 0 40px rgba(0, 255, 200, 0.15), 0 0 80px rgba(0, 255, 200, 0.05);
    overflow: hidden;
    font-family: Consolas, monospace;
  }
  .roadmap-header {
    padding: 20px 20px 10px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 255, 200, 0.2);
    background: linear-gradient(180deg, rgba(0,255,200,0.08), transparent);
  }
  .roadmap-header h2 {
    color: #00ffc8;
    font-size: 20px;
    margin: 0 0 4px;
    letter-spacing: 2px;
  }
  .roadmap-header .completed-label {
    color: #7a8aaa;
    font-size: 11px;
  }
  .roadmap-header .completed-topic {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    margin-top: 2px;
  }

  .roadmap-body {
    padding: 16px 20px;
  }
  .roadmap-next {
    background: rgba(0, 255, 200, 0.06);
    border: 1px solid rgba(0, 255, 200, 0.15);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 14px;
  }
  .roadmap-next .next-label {
    color: #00ffc8;
    font-size: 10px;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .roadmap-next .next-topic {
    color: #fff;
    font-size: 16px;
    font-weight: 700;
  }
  .roadmap-next .next-reason {
    color: #8a9ab5;
    font-size: 11px;
    margin-top: 6px;
    line-height: 1.4;
  }

  .roadmap-protip {
    background: rgba(255, 215, 0, 0.06);
    border: 1px solid rgba(255, 215, 0, 0.15);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 14px;
  }
  .roadmap-protip .protip-label {
    color: #ffd700;
    font-size: 10px;
    letter-spacing: 1px;
    margin-bottom: 4px;
    font-weight: 700;
  }
  .roadmap-protip .protip-text {
    color: #c8b870;
    font-size: 11px;
    line-height: 1.5;
  }

  .roadmap-pseudocode {
    background: #0a0a18;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 14px;
    max-height: 140px;
    overflow-y: auto;
  }
  .roadmap-pseudocode .pseudo-label {
    color: #00ffc8;
    font-size: 10px;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .roadmap-pseudocode pre {
    color: #a0b8c8;
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: Consolas, monospace;
  }

  .roadmap-links {
    margin-bottom: 14px;
  }
  .roadmap-links .section-label {
    color: #7a8aaa;
    font-size: 10px;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .roadmap-links a {
    display: block;
    color: #00d4ff;
    font-size: 12px;
    text-decoration: none;
    padding: 5px 8px;
    border-radius: 4px;
    margin-bottom: 3px;
    transition: background 0.15s;
  }
  .roadmap-links a:hover {
    background: rgba(0, 212, 255, 0.1);
    color: #50e8ff;
  }
  .roadmap-links a.gfg-link {
    color: #4caf50;
    margin-top: 8px;
    border-top: 1px solid #222;
    padding-top: 10px;
  }
  .roadmap-links a.gfg-link:hover {
    background: rgba(76, 175, 80, 0.1);
    color: #66cc6a;
  }

  .roadmap-footer {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid #222;
    background: rgba(0,0,0,0.3);
  }
  .roadmap-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-family: Consolas, monospace;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.15s;
  }
  .roadmap-btn-dismiss {
    background: #2a2a2a;
    color: #aaa;
  }
  .roadmap-btn-dismiss:hover { background: #3a3a3a; color: #fff; }
  .roadmap-btn-start {
    background: linear-gradient(135deg, #00c896, #00a67d);
    color: #000;
    font-weight: 700;
  }
  .roadmap-btn-start:hover {
    background: linear-gradient(135deg, #00e6a8, #00c896);
    box-shadow: 0 0 16px rgba(0, 200, 150, 0.4);
  }
</style>
<script nonce="${nonce}" src="${p5Uri}"></script>
</head>
<body>

<div id="ghost-overlay">
  <div class="ghost-code-panel">
    <div class="ghost-code-header">
      <span>BEST PRACTICE SUGGESTION</span>
      <button class="ghost-code-close" id="overlay-close">&times;</button>
    </div>
    <div class="ghost-code-body">
      <div class="ghost-code-error" id="overlay-error"></div>
      <div class="ghost-code-block" id="overlay-code"></div>
      <div class="ghost-code-line" id="overlay-line"></div>
    </div>
    <div class="ghost-code-footer">
      <button class="ghost-btn ghost-btn-cancel" id="overlay-cancel">Dismiss</button>
      <button class="ghost-btn ghost-btn-apply" id="overlay-apply">Apply Recommendation</button>
    </div>
  </div>
</div>

<div id="roadmap-overlay">
  <div class="roadmap-panel">
    <div class="roadmap-header">
      <h2>SESSION COMPLETE</h2>
      <div class="completed-label">YOU PRACTICED</div>
      <div class="completed-topic" id="rm-completed"></div>
    </div>
    <div class="roadmap-body">
      <div class="roadmap-next">
        <div class="next-label">NEXT UP</div>
        <div class="next-topic" id="rm-next-topic"></div>
        <div class="next-reason" id="rm-reason"></div>
      </div>
      <div class="roadmap-protip" id="rm-protip-box">
        <div class="protip-label">PRO-TIP</div>
        <div class="protip-text" id="rm-protip"></div>
      </div>
      <div class="roadmap-pseudocode" id="rm-pseudo-box">
        <div class="pseudo-label">PSEUDOCODE GUIDE</div>
        <pre id="rm-pseudocode"></pre>
      </div>
      <div class="roadmap-links">
        <div class="section-label">LEETCODE PROBLEMS</div>
        <div id="rm-leetcode"></div>
        <a class="gfg-link" id="rm-gfg" href="#" target="_blank">GeeksforGeeks Tutorial</a>
      </div>
    </div>
    <div class="roadmap-footer">
      <button class="roadmap-btn roadmap-btn-dismiss" id="rm-dismiss">Dismiss</button>
      <button class="roadmap-btn roadmap-btn-start" id="rm-start">Start Next Topic</button>
    </div>
  </div>
</div>

<script nonce="${nonce}">
const vscodeApi = acquireVsCodeApi();

// ─── Overlay Logic ──────────────────────────────────────────
let overlayFix = '';
let overlayStartLine = 0;
let overlayEndLine = 0;

const overlayEl = document.getElementById('ghost-overlay');
const overlayErrorEl = document.getElementById('overlay-error');
const overlayCodeEl = document.getElementById('overlay-code');
const overlayLineEl = document.getElementById('overlay-line');

const overlayHeader = document.querySelector('.ghost-code-header span');
const overlayApplyBtn = document.getElementById('overlay-apply');

function showOverlay(errorMsg, fix, startLine, endLine, isHardError) {
  overlayFix = fix;
  overlayStartLine = startLine;
  overlayEndLine = endLine;
  overlayErrorEl.textContent = errorMsg;
  overlayCodeEl.textContent = fix;
  if (startLine > 0 && endLine > 0) {
    overlayLineEl.textContent = startLine === endLine
      ? 'Replaces line ' + startLine
      : 'Replaces lines ' + startLine + '-' + endLine;
  } else {
    overlayLineEl.textContent = '';
  }

  const panel = document.querySelector('.ghost-code-panel');
  if (isHardError) {
    overlayHeader.textContent = 'ERROR FIX';
    overlayApplyBtn.textContent = 'Apply Fix';
    panel.style.borderColor = '#ff4040';
    panel.style.boxShadow = '0 0 30px rgba(255,40,40,0.3), 0 0 60px rgba(255,40,40,0.1)';
    document.querySelector('.ghost-code-header').style.background = 'linear-gradient(90deg, #2a0a0a, #1a1a2e)';
    document.querySelector('.ghost-code-header').style.borderBottomColor = '#ff4040aa';
    overlayHeader.style.color = '#ff6060';
    overlayErrorEl.style.color = '#ff8080';
    overlayErrorEl.style.background = 'rgba(255,40,40,0.1)';
    overlayErrorEl.style.borderLeftColor = '#ff4040';
  } else {
    overlayHeader.textContent = 'BEST PRACTICE SUGGESTION';
    overlayApplyBtn.textContent = 'Apply Recommendation';
    panel.style.borderColor = '#d4a830';
    panel.style.boxShadow = '0 0 30px rgba(210,170,50,0.2), 0 0 60px rgba(210,170,50,0.08)';
    document.querySelector('.ghost-code-header').style.background = 'linear-gradient(90deg, #2a2210, #1a1a2e)';
    document.querySelector('.ghost-code-header').style.borderBottomColor = '#d4a830aa';
    overlayHeader.style.color = '#f0c850';
    overlayErrorEl.style.color = '#f0d070';
    overlayErrorEl.style.background = 'rgba(210,170,50,0.1)';
    overlayErrorEl.style.borderLeftColor = '#d4a830';
  }

  overlayEl.classList.add('visible');
}

function hideOverlay() {
  overlayEl.classList.remove('visible');
  overlayFix = '';
  overlayStartLine = 0;
  overlayEndLine = 0;
}

document.getElementById('overlay-close').addEventListener('click', hideOverlay);
document.getElementById('overlay-cancel').addEventListener('click', hideOverlay);
document.getElementById('overlay-apply').addEventListener('click', () => {
  if (overlayFix && overlayStartLine > 0 && overlayEndLine > 0) {
    vscodeApi.postMessage({ command: 'applyFix', data: { fix: overlayFix, startLine: overlayStartLine, endLine: overlayEndLine } });
  }
  hideOverlay();
});

// ─── Roadmap Overlay Logic ───────────────────────────────────
const roadmapOverlay = document.getElementById('roadmap-overlay');
const rmCompleted = document.getElementById('rm-completed');
const rmNextTopic = document.getElementById('rm-next-topic');
const rmReason = document.getElementById('rm-reason');
const rmProTip = document.getElementById('rm-protip');
const rmProTipBox = document.getElementById('rm-protip-box');
const rmPseudocode = document.getElementById('rm-pseudocode');
const rmPseudoBox = document.getElementById('rm-pseudo-box');
const rmLeetcode = document.getElementById('rm-leetcode');
const rmGfg = document.getElementById('rm-gfg');
let roadmapTemplate = '';
let roadmapPseudocode = '';
let roadmapNextTopic = '';
let roadmapVisible = false;

function showRoadmap(data) {
  rmCompleted.textContent = data.completedTopic || 'Unknown';
  rmNextTopic.textContent = data.nextTopic || 'Unknown';
  rmReason.textContent = data.reason || '';
  roadmapTemplate = data.template || '';
  roadmapPseudocode = data.pseudocode || '';
  roadmapNextTopic = data.nextTopic || '';

  if (data.proTip) {
    rmProTip.textContent = data.proTip;
    rmProTipBox.style.display = 'block';
  } else {
    rmProTipBox.style.display = 'none';
  }

  if (data.pseudocode) {
    rmPseudocode.textContent = data.pseudocode;
    rmPseudoBox.style.display = 'block';
  } else {
    rmPseudoBox.style.display = 'none';
  }

  rmLeetcode.innerHTML = '';
  if (data.leetcode && data.leetcode.length > 0) {
    data.leetcode.forEach(function(lc) {
      const a = document.createElement('a');
      a.href = lc.url || '#';
      a.target = '_blank';
      a.textContent = lc.title || 'Problem';
      rmLeetcode.appendChild(a);
    });
  }

  if (data.gfgUrl) {
    rmGfg.href = data.gfgUrl;
    rmGfg.style.display = 'block';
  } else {
    rmGfg.style.display = 'none';
  }

  roadmapOverlay.classList.add('visible');
  roadmapVisible = true;
}

function hideRoadmap() {
  roadmapOverlay.classList.remove('visible');
  roadmapVisible = false;
  roadmapTemplate = '';
  roadmapPseudocode = '';
  roadmapNextTopic = '';
}

document.getElementById('rm-dismiss').addEventListener('click', hideRoadmap);
document.getElementById('rm-start').addEventListener('click', function() {
  if (roadmapTemplate) {
    vscodeApi.postMessage({ command: 'startNextTopic', data: { template: roadmapTemplate, pseudocode: roadmapPseudocode, nextTopic: roadmapNextTopic } });
  }
  hideRoadmap();
});

// ─── Pointer Color Palette ──────────────────────────────────
const POINTER_COLORS = [
  [57,255,20],[255,16,240],[255,165,0],[0,191,255],
  [255,255,0],[148,103,255],[255,99,71],[0,255,200],
];
const labelColorMap = {};
let colorIndex = 0;
function getPointerColor(label) {
  if (!labelColorMap[label]) {
    labelColorMap[label] = POINTER_COLORS[colorIndex % POINTER_COLORS.length];
    colorIndex++;
  }
  return labelColorMap[label];
}

// ─── Node Class ─────────────────────────────────────────────
class GhostNode {
  constructor(id, val, x, y) {
    this.id = id;
    this.val = val;
    this.x = x; this.y = y;
    this.targetX = x; this.targetY = y;
    this.radius = 30;
    this.glowPulse = random(0, TWO_PI);
    this.highlighted = false;
    this.highlightLerp = 0;
    this.discarded = false;
    this.discardLerp = 0;
    this.isError = false;
    this.errorLerp = 0;
    this.isSuggestion = false;
    this.suggestionLerp = 0;
    this.errorMessage = '';
    this.suggestedFix = '';
    this.fixStartLine = 0;
    this.fixEndLine = 0;
    this.accessCount = 0;
    this.heatLerp = 0;
    this.pingAlpha = 0;
    this.pingRadius = 0;
    this.wasPinged = false;
    this.selectionLerp = 0;
    this.focusLerp = 0;
  }

  moveTo(tx, ty) { this.targetX = tx; this.targetY = ty; }

  triggerPing() {
    this.pingAlpha = 255;
    this.pingRadius = this.radius;
    this.wasPinged = true;
  }

  update() {
    let tx = this.targetX, ty = this.targetY;
    if (this.isError) {
      tx += random(-2, 2);
      ty += random(-2, 2);
    }
    this.x = lerp(this.x, tx, 0.25);
    this.y = lerp(this.y, ty, 0.25);
    this.glowPulse += 0.03;
    this.highlightLerp = lerp(this.highlightLerp, this.highlighted ? 1 : 0, 0.25);
    this.discardLerp = lerp(this.discardLerp, this.discarded ? 1 : 0, 0.25);
    this.errorLerp = lerp(this.errorLerp, this.isError ? 1 : 0, this.isError ? 0.2 : 0.35);
    this.suggestionLerp = lerp(this.suggestionLerp, this.isSuggestion ? 1 : 0, this.isSuggestion ? 0.15 : 0.25);
    const heatTarget = constrain(this.accessCount / maxAccessCount, 0, 1);
    this.heatLerp = lerp(this.heatLerp, heatTarget, 0.15);
    const isFocused = (this.id === highlightId && !playbackActive);
    this.focusLerp = lerp(this.focusLerp, isFocused ? 1 : 0, 0.3);
    const isSelected = selectionNodeIds.has(this.id);
    this.selectionLerp = lerp(this.selectionLerp, isSelected ? 1 : 0, 0.25);
    if (this.pingAlpha > 0) {
      this.pingRadius += 2.5;
      this.pingAlpha = max(0, this.pingAlpha - 6);
    }
  }

  draw() {
    const glow = map(sin(this.glowPulse), -1, 1, 120, 255);
    const hl = this.highlightLerp;
    const dc = this.discardLerp;
    const er = this.errorLerp;
    const sg = this.suggestionLerp;
    const ht = this.heatLerp;

    let r, g, b, nodeAlpha;

    if (er > 0.05) {
      const errPulse = map(sin(this.glowPulse * 2), -1, 1, 180, 255);
      r = lerp(lerp(0, 255, hl), errPulse, er);
      g = lerp(lerp(glow, 215, hl), 30, er);
      b = lerp(lerp(glow, 0, hl), 30, er);
      nodeAlpha = 255;
    } else if (sg > 0.05) {
      const mentorPulse = map(sin(this.glowPulse * 1.2), -1, 1, 200, 255);
      r = lerp(lerp(0, 255, hl), mentorPulse, sg);
      g = lerp(lerp(glow, 215, hl), 180, sg);
      b = lerp(lerp(glow, 0, hl), 40, sg);
      nodeAlpha = 255;
    } else if (ht > 0.02 && dc < 0.5) {
      const coolR = 0, coolG = 180, coolB = 216;
      const hotR = 255, hotG = 77, hotB = 0;
      r = lerp(coolR, hotR, ht);
      g = lerp(coolG, hotG, ht);
      b = lerp(coolB, hotB, ht);
      r = lerp(r, 255, hl * 0.4);
      g = lerp(g, 215, hl * 0.3);
      nodeAlpha = 255;
    } else {
      const baseR = lerp(0, 255, hl);
      const baseG = lerp(glow, 215, hl);
      const baseB = lerp(glow, 0, hl);
      r = lerp(baseR, 80, dc);
      g = lerp(baseG, 80, dc);
      b = lerp(baseB, 80, dc);
      nodeAlpha = lerp(255, 50, dc);
    }

    push();

    if (er > 0.1) {
      const errGlow = map(sin(this.glowPulse * 2.5), -1, 1, 8, 16);
      noFill();
      stroke(255, 40, 40, 50 * er);
      strokeWeight(errGlow * er);
      ellipse(this.x, this.y, this.radius * 2 + 20);
    } else if (sg > 0.1) {
      const haloSize = map(sin(this.glowPulse * 1.2), -1, 1, 14, 22);
      drawingContext.shadowBlur = haloSize * sg;
      drawingContext.shadowColor = 'rgba(255,200,60,0.4)';
      noFill();
      stroke(255, 200, 60, 40 * sg);
      strokeWeight(haloSize * sg * 0.6);
      ellipse(this.x, this.y, this.radius * 2 + 20);
      drawingContext.shadowBlur = 0;
    } else if (ht > 0.05 && dc < 0.5) {
      const heatGlow = ht * 18 + 4;
      drawingContext.shadowBlur = heatGlow;
      drawingContext.shadowColor = 'rgba(' + floor(r) + ',' + floor(g) + ',' + floor(b) + ',0.6)';
    } else if (hl > 0.05 && dc < 0.5) {
      const ps = map(sin(this.glowPulse * 1.5), -1, 1, 12, 20);
      noFill();
      stroke(255, 215, 0, 30 * hl * (1 - dc));
      strokeWeight(ps * hl);
      ellipse(this.x, this.y, this.radius * 2 + 20);
    }

    noFill();
    stroke(r, g, b, nodeAlpha);
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius * 2);

    drawingContext.shadowBlur = 0;

    stroke(r, g, b, 40 * (1 - dc));
    strokeWeight(6);
    ellipse(this.x, this.y, this.radius * 2 + 8);

    if (dc > 0.3 && er < 0.3 && sg < 0.3) {
      stroke(200, 150, 50, 80 * dc);
      strokeWeight(1.5);
      line(this.x - this.radius + 5, this.y, this.x + this.radius - 5, this.y);
    }

    noStroke();
    fill(r, g, b, nodeAlpha);
    textAlign(CENTER, CENTER);
    textSize(14);
    textFont('Consolas');
    text(this.val, this.x, this.y);

    if (this.selectionLerp > 0.02) {
      const sa = this.selectionLerp;
      fill(40, 120, 255, 35 * sa);
      stroke(60, 140, 255, 100 * sa);
      strokeWeight(1.5);
      ellipse(this.x, this.y, this.radius * 2 + 6);
      noFill();
      stroke(60, 160, 255, 50 * sa);
      strokeWeight(4);
      ellipse(this.x, this.y, this.radius * 2 + 14);
    }

    if (this.focusLerp > 0.02) {
      const fl = this.focusLerp;
      const ringSize = map(sin(this.glowPulse * 2.5), -1, 1, 0, 4);
      noFill();
      drawingContext.shadowBlur = 14 * fl;
      drawingContext.shadowColor = 'rgba(255,215,0,0.6)';
      stroke(255, 215, 0, 200 * fl);
      strokeWeight(2.5);
      ellipse(this.x, this.y, this.radius * 2 + 16 + ringSize);
      stroke(255, 215, 0, 80 * fl);
      strokeWeight(1);
      ellipse(this.x, this.y, this.radius * 2 + 26 + ringSize);
      drawingContext.shadowBlur = 0;
    }

    if (this.pingAlpha > 1) {
      noFill();
      stroke(255, 215, 0, this.pingAlpha);
      strokeWeight(2);
      ellipse(this.x, this.y, this.pingRadius * 2);
      stroke(255, 215, 0, this.pingAlpha * 0.4);
      strokeWeight(1);
      ellipse(this.x, this.y, this.pingRadius * 2 + 12);
    }

    pop();
  }

  isMouseOver() {
    return dist(mouseX, mouseY, this.x, this.y) < this.radius + 5;
  }

  getFixBtnBounds() {
    const bw = 28, bh = 16;
    const bx = this.x + this.radius + 6;
    const by = this.y - bh / 2;
    return { x: bx, y: by, w: bw, h: bh };
  }
}

// ─── Pointer Class ──────────────────────────────────────────
class GhostPointer {
  constructor(id, label, targetNodeId) {
    this.id = id; this.label = label; this.targetNodeId = targetNodeId;
    this.x = 0; this.y = 0; this.targetX = 0; this.targetY = 0;
    this.color = getPointerColor(label);
    this.pulse = random(0, TWO_PI);
  }
  updateTarget(tid) { this.targetNodeId = tid; }
  update(nodeMap, idx, total) {
    const node = nodeMap[this.targetNodeId];
    if (!node) return;
    this.pulse += 0.04;
    const spread = PI * 0.6;
    const sa = -HALF_PI - spread / 2;
    const step = total > 1 ? spread / (total - 1) : 0;
    const oa = sa + idx * step;
    const od = node.radius + 40;
    this.targetX = node.x + cos(oa) * od;
    this.targetY = node.y + sin(oa) * od;
    this.x = lerp(this.x, this.targetX, 0.25);
    this.y = lerp(this.y, this.targetY, 0.25);
  }
  draw(nodeMap) {
    const node = nodeMap[this.targetNodeId];
    if (!node) return;
    const col = this.color;
    const alpha = map(sin(this.pulse), -1, 1, 160, 255);
    const angle = atan2(node.y - this.y, node.x - this.x);
    const tipX = node.x - cos(angle) * (node.radius + 4);
    const tipY = node.y - sin(angle) * (node.radius + 4);
    push();
    stroke(col[0], col[1], col[2], alpha); strokeWeight(2);
    line(this.x, this.y, tipX, tipY);
    translate(tipX, tipY); rotate(angle);
    fill(col[0], col[1], col[2], alpha); noStroke();
    triangle(0, 0, -7, -3.5, -7, 3.5);
    pop();
    push(); noStroke();
    fill(20, 20, 20, 190); rectMode(CENTER);
    textSize(10); textFont('Consolas');
    const tw = textWidth(this.label) + 10;
    rect(this.x, this.y, tw, 16, 4);
    fill(col[0], col[1], col[2], alpha);
    textAlign(CENTER, CENTER);
    text(this.label, this.x, this.y);
    pop();
  }
}

// ─── Layout Cache ───────────────────────────────────────────
const layoutCache = {};
function cacheLayout() {
  for (const id in nodeMap) {
    layoutCache[id] = { x: nodeMap[id].targetX, y: nodeMap[id].targetY };
  }
}
function getCachedPos(id) {
  return layoutCache[id] || null;
}

// ─── State ──────────────────────────────────────────────────
let nodeMap = {};
let pointerMap = {};
let edges = [];
let currentType = null;
let loading = false;
let loadingPulse = 0;
let highlightId = null;
let traceInfo = '';
let traceActive = false;
let traceIndicatorPulse = 0;
let discardedNodeIds = new Set();
let stepLabel = '';
let hasErrors = false;
let hasSuggestions = false;
let guardPulse = 0;
let maxAccessCount = 1;
let complexity = '';
let activePathPulse = 0;
let scalarVariables = [];

let cursorActiveLine = 0;
let selectionNodeIds = new Set();
let focusRingPulse = 0;

let playbackFrames = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackActive = false;
const PLAYBACK_INTERVAL = 3000;

// ─── Node Repulsion ─────────────────────────────────────────
const REPULSION_RADIUS = 70;
const REPULSION_STRENGTH = 2.5;

function applyRepulsion() {
  const ids = Object.keys(nodeMap);
  const len = ids.length;
  if (len < 2) return;
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      const a = nodeMap[ids[i]], b = nodeMap[ids[j]];
      const dx = a.targetX - b.targetX;
      const dy = a.targetY - b.targetY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < REPULSION_RADIUS && d > 0.1) {
        const force = (REPULSION_RADIUS - d) / REPULSION_RADIUS * REPULSION_STRENGTH;
        const nx = dx / d, ny = dy / d;
        a.targetX += nx * force;
        a.targetY += ny * force;
        b.targetX -= nx * force;
        b.targetY -= ny * force;
      }
    }
  }
}

// ─── p5.js Lifecycle ────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Consolas');
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  clear();

  drawModeIndicator();
  drawLogicGuard();
  drawComplexityBadge();
  drawClearHeatButton();
  if (loading) drawLoadingIndicator();

  drawEdges();

  applyRepulsion();
  for (const id in nodeMap) {
    nodeMap[id].update();
    nodeMap[id].draw();
  }

  updateAndDrawPointers();
  drawFixButtons();
  drawErrorTooltips();

  if (highlightId && nodeMap[highlightId] && traceInfo) {
    drawTraceLabel(nodeMap[highlightId]);
  }

  if (stepLabel) drawStepLabel();
  if (playbackActive) drawPlaybackProgress();

  drawVariablesTray();
  drawPointerLegend();
  drawFinishButton();
  drawWatermark();
}

// ─── Fix / Recommendation Buttons ───────────────────────────
function drawFixButtons() {
  for (const id in nodeMap) {
    const node = nodeMap[id];
    if ((!node.isError && !node.isSuggestion) || !node.suggestedFix) continue;

    const b = node.getFixBtnBounds();
    const hovering = mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h;
    const pulse = map(sin(node.glowPulse * (node.isError ? 2 : 1.2)), -1, 1, 0.85, 1);

    push();
    rectMode(CORNER);
    noStroke();

    if (node.isError) {
      if (hovering) {
        fill(255, 80, 60, 240);
        rect(b.x, b.y, b.w, b.h, 4);
        fill(255);
      } else {
        fill(50, 20, 20, 200 * pulse);
        stroke(255, 60, 50, 160 * pulse);
        strokeWeight(1);
        rect(b.x, b.y, b.w, b.h, 4);
        noStroke();
        fill(255, 80, 60, 220 * pulse);
      }
      textSize(9); textAlign(CENTER, CENTER); textFont('Consolas');
      text('FIX', b.x + b.w / 2, b.y + b.h / 2);
    } else {
      if (hovering) {
        fill(255, 200, 60, 240);
        rect(b.x, b.y, b.w, b.h, 4);
        fill(30, 20, 0);
      } else {
        fill(40, 36, 20, 200 * pulse);
        stroke(210, 180, 60, 160 * pulse);
        strokeWeight(1);
        rect(b.x, b.y, b.w, b.h, 4);
        noStroke();
        fill(255, 210, 80, 220 * pulse);
      }
      textSize(8); textAlign(CENTER, CENTER); textFont('Consolas');
      text('\u2728', b.x + b.w / 2, b.y + b.h / 2);
    }
    pop();
  }
}

function mousePressed() {
  if (overlayEl.classList.contains('visible')) return;
  if (roadmapVisible) return;

  const fb = FINISH_BTN;
  if (mouseX >= fb.x && mouseX <= fb.x + fb.w && mouseY >= fb.y && mouseY <= fb.y + fb.h) {
    vscodeApi.postMessage({ command: 'finishSession' });
    return;
  }

  const cb = CLEAR_HEAT_BTN;
  if (mouseX >= cb.x && mouseX <= cb.x + cb.w && mouseY >= cb.y && mouseY <= cb.y + cb.h) {
    for (const id in nodeMap) { nodeMap[id].accessCount = 0; nodeMap[id].heatLerp = 0; }
    maxAccessCount = 1;
    return;
  }

  for (const id in nodeMap) {
    const node = nodeMap[id];
    if ((!node.isError && !node.isSuggestion) || !node.suggestedFix) continue;

    const b = node.getFixBtnBounds();
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      showOverlay(node.errorMessage, node.suggestedFix, node.fixStartLine, node.fixEndLine, node.isError);
      return;
    }
  }

  if (!playbackActive && Object.keys(nodeMap).length > 0) {
    vscodeApi.postMessage({ command: 'requestPlayback' });
  }
}

// ─── Error & Suggestion Tooltips ─────────────────────────────
function drawErrorTooltips() {
  for (const id in nodeMap) {
    const node = nodeMap[id];
    const hasIssue = (node.isError || node.isSuggestion) && node.errorMessage;
    if (hasIssue && node.isMouseOver()) {
      push();
      textSize(10);
      textFont('Consolas');
      const msg = node.errorMessage;

      if (node.isError) {
        const tw = textWidth(msg) + 16;
        const tx = constrain(node.x, tw / 2 + 4, width - tw / 2 - 4);
        const ty = node.y + node.radius + 22;
        fill(40, 10, 10, 220);
        stroke(255, 60, 60, 180);
        strokeWeight(1);
        rectMode(CENTER);
        rect(tx, ty, tw, 22, 5);
        noStroke();
        fill(255, 80, 80);
        textAlign(CENTER, CENTER);
        text(msg, tx, ty);
      } else {
        const whyLabel = 'Why?';
        const msgW = textWidth(msg);
        const whyW = textWidth(whyLabel);
        const totalW = msgW + whyW + 30;
        const tx = constrain(node.x, totalW / 2 + 4, width - totalW / 2 - 4);
        const ty = node.y + node.radius + 22;
        fill(25, 22, 10, 230);
        stroke(210, 180, 60, 140);
        strokeWeight(1);
        rectMode(CENTER);
        rect(tx, ty, totalW, 22, 6);
        noStroke();
        fill(255, 210, 80);
        textAlign(LEFT, CENTER);
        text(msg, tx - totalW / 2 + 8, ty);
        fill(100, 180, 255, 200);
        textAlign(RIGHT, CENTER);
        text(whyLabel, tx + totalW / 2 - 8, ty);
      }
      pop();
    }
  }
}

// ─── Guard & Mentor Indicator ────────────────────────────────
function drawLogicGuard() {
  guardPulse += 0.04;
  const x = width - 16;
  const y = 48;

  push();
  noStroke();

  if (hasErrors) {
    const a = map(sin(guardPulse * 2), -1, 1, 150, 255);
    fill(255, 40, 40, a);
    triangle(x - 8, y + 6, x + 8, y + 6, x, y - 8);
    fill(255, 255, 255, a);
    textSize(10); textAlign(CENTER, CENTER); textFont('Consolas');
    text('!', x, y + 1);
    fill(255, 80, 80, a * 0.7);
    textSize(8); textAlign(RIGHT, CENTER);
    text('ERROR', x - 14, y);
  } else if (hasSuggestions) {
    const a = map(sin(guardPulse * 1.5), -1, 1, 150, 255);
    fill(255, 200, 60, a);
    ellipse(x, y, 14, 14);
    fill(30, 20, 0, a);
    textSize(10); textAlign(CENTER, CENTER); textFont('Consolas');
    text('\u2728', x, y);
    fill(255, 210, 80, a * 0.7);
    textSize(8); textAlign(RIGHT, CENTER);
    text('SUGGESTION', x - 14, y);
  } else {
    const a = map(sin(guardPulse), -1, 1, 40, 100);
    fill(0, 255, 150, a);
    ellipse(x, y, 8, 8);
    fill(0, 255, 150, a * 0.7);
    textSize(8); textAlign(RIGHT, CENTER); textFont('Consolas');
    text('MENTOR', x - 10, y);
  }
  pop();
}

// ─── Complexity Badge ────────────────────────────────────────
function drawComplexityBadge() {
  if (!complexity) return;
  push();
  textFont('Consolas'); textSize(12);
  const tw = textWidth(complexity) + 20;
  const bx = width - tw - 10, by = 70;
  noStroke();
  fill(15, 15, 30, 200);
  rect(bx, by, tw, 24, 6);
  stroke(0, 180, 216, 120); strokeWeight(1); noFill();
  rect(bx, by, tw, 24, 6);
  noStroke();
  fill(0, 220, 255, 220);
  textAlign(CENTER, CENTER);
  text(complexity, bx + tw / 2, by + 12);
  pop();
}

// ─── Clear Heat Button ──────────────────────────────────────
const CLEAR_HEAT_BTN = { x: 0, y: 0, w: 72, h: 20 };

function drawClearHeatButton() {
  let anyHeat = false;
  for (const id in nodeMap) { if (nodeMap[id].accessCount > 0) { anyHeat = true; break; } }
  if (!anyHeat) return;

  const bx = width - CLEAR_HEAT_BTN.w - 10;
  const by = complexity ? 100 : 70;
  CLEAR_HEAT_BTN.x = bx; CLEAR_HEAT_BTN.y = by;

  const hovering = mouseX >= bx && mouseX <= bx + CLEAR_HEAT_BTN.w && mouseY >= by && mouseY <= by + CLEAR_HEAT_BTN.h;

  push();
  rectMode(CORNER); noStroke();
  if (hovering) {
    fill(0, 180, 216, 180);
    rect(bx, by, CLEAR_HEAT_BTN.w, CLEAR_HEAT_BTN.h, 4);
    fill(0);
  } else {
    fill(30, 30, 40, 200);
    rect(bx, by, CLEAR_HEAT_BTN.w, CLEAR_HEAT_BTN.h, 4);
    stroke(0, 180, 216, 100); strokeWeight(1); noFill();
    rect(bx, by, CLEAR_HEAT_BTN.w, CLEAR_HEAT_BTN.h, 4);
    noStroke();
    fill(0, 200, 230, 180);
  }
  textSize(9); textAlign(CENTER, CENTER); textFont('Consolas');
  text('CLEAR HEAT', bx + CLEAR_HEAT_BTN.w / 2, by + CLEAR_HEAT_BTN.h / 2);
  pop();
}

// ─── Playback ───────────────────────────────────────────────
const SETTLE_THRESHOLD = 2.0;
const MIN_HOLD_MS = 800;
let playbackSettleStart = 0;

function nodesSettled() {
  for (const id in nodeMap) {
    const n = nodeMap[id];
    if (abs(n.x - n.targetX) > SETTLE_THRESHOLD || abs(n.y - n.targetY) > SETTLE_THRESHOLD) return false;
  }
  return true;
}

function startPlayback(frames) {
  stopPlayback();
  playbackFrames = frames;
  playbackIndex = 0;
  playbackActive = true;
  applyPayload(playbackFrames[0]);
  triggerPingsForActivePath();
  playbackSettleStart = 0;
  playbackTimer = setInterval(checkPlaybackAdvance, 100);
}
function checkPlaybackAdvance() {
  if (!playbackActive || playbackFrames.length === 0) return;
  if (nodesSettled()) {
    if (playbackSettleStart === 0) { playbackSettleStart = Date.now(); return; }
    if (Date.now() - playbackSettleStart >= MIN_HOLD_MS) {
      playbackIndex++;
      if (playbackIndex >= playbackFrames.length) playbackIndex = 0;
      applyPayload(playbackFrames[playbackIndex]);
      triggerPingsForActivePath();
      playbackSettleStart = 0;
    }
  } else {
    playbackSettleStart = 0;
  }
}
function stopPlayback() {
  if (playbackTimer) { clearInterval(playbackTimer); playbackTimer = null; }
  playbackActive = false; playbackFrames = []; playbackIndex = 0;
}

function triggerPingsForActivePath() {
  for (const e of edges) {
    if (e.isActivePath && nodeMap[e.to]) {
      nodeMap[e.to].triggerPing();
    }
  }
}

function drawPlaybackProgress() {
  if (playbackFrames.length === 0) return;
  push();
  const bw = 160, bh = 6, bx = width / 2 - bw / 2, by = 44;
  const prog = (playbackIndex + 1) / playbackFrames.length;
  noStroke();
  fill(40, 40, 40, 150); rect(bx, by, bw, bh, 3);
  fill(0, 255, 255, 200); rect(bx, by, bw * prog, bh, 3);
  fill(0, 255, 255, 180); textSize(10);
  textAlign(CENTER, CENTER); textFont('Consolas');
  text('Step ' + (playbackIndex + 1) + '/' + playbackFrames.length, width / 2, by + 16);
  pop();
}

// ─── Pointer Rendering ─────────────────────────────────────
function updateAndDrawPointers() {
  const nc = {}, ni = {};
  for (const id in pointerMap) {
    const tid = pointerMap[id].targetNodeId;
    nc[tid] = (nc[tid] || 0) + 1; ni[tid] = 0;
  }
  for (const id in pointerMap) {
    const ptr = pointerMap[id], tid = ptr.targetNodeId;
    ptr.update(nodeMap, ni[tid], nc[tid]); ni[tid]++;
    ptr.draw(nodeMap);
  }
}

// ─── Mode Indicator ─────────────────────────────────────────
function drawModeIndicator() {
  if (!traceActive && !playbackActive) return;
  traceIndicatorPulse += 0.04;
  const a = map(sin(traceIndicatorPulse), -1, 1, 80, 200);
  const da = map(sin(traceIndicatorPulse * 1.5), -1, 1, 120, 255);
  push(); noStroke();
  if (playbackActive) {
    fill(0, 255, 255, da); ellipse(16, 18, 8, 8);
    fill(0, 255, 255, a); textSize(10); textAlign(LEFT, CENTER); textFont('Consolas');
    text('PLAYBACK', 24, 18);
  } else {
    fill(255, 215, 0, da); ellipse(16, 18, 8, 8);
    fill(255, 215, 0, a); textSize(10); textAlign(LEFT, CENTER); textFont('Consolas');
    text('TRACE MODE', 24, 18);
  }
  pop();
}

function drawTraceLabel(node) {
  push();
  const ly = node.y - node.radius - 22;
  fill(20, 20, 20, 200); stroke(255, 215, 0, 120); strokeWeight(1);
  rectMode(CENTER); textSize(11); textFont('Consolas');
  rect(node.x, ly, textWidth(traceInfo) + 16, 20, 6);
  noStroke(); fill(255, 215, 0); textAlign(CENTER, CENTER);
  text(traceInfo, node.x, ly);
  pop();
}

function drawStepLabel() {
  push();
  rectMode(CENTER); textSize(11); textFont('Consolas');
  const tw = textWidth(stepLabel) + 20, lx = width / 2, ly = height - 36;
  noStroke(); fill(20, 20, 20, 180); rect(lx, ly, tw, 22, 6);
  stroke(255, 50, 50, 100); strokeWeight(1); noFill(); rect(lx, ly, tw, 22, 6);
  noStroke(); fill(255, 120, 100); textAlign(CENTER, CENTER);
  text(stepLabel, lx, ly);
  pop();
}

function drawLoadingIndicator() {
  loadingPulse += 0.05;
  const a = map(sin(loadingPulse), -1, 1, 40, 180);
  const r = map(sin(loadingPulse), -1, 1, 6, 12);
  push(); noStroke();
  fill(0, 255, 255, a); ellipse(width - 30, 25, r * 2);
  fill(0, 255, 255, a * 0.6); textSize(10); textAlign(RIGHT, CENTER);
  text('analyzing...', width - 46, 25); pop();

  if (Object.keys(nodeMap).length === 0) {
    drawPredictiveGhost();
  }
}

function drawPredictiveGhost() {
  const ids = Object.keys(layoutCache);
  if (ids.length === 0) return;
  const ghostAlpha = map(sin(loadingPulse * 1.5), -1, 1, 15, 35);
  push();
  noFill();
  strokeWeight(1);
  for (const id of ids) {
    const p = layoutCache[id];
    stroke(0, 255, 255, ghostAlpha);
    ellipse(p.x, p.y, 60);
    stroke(0, 255, 255, ghostAlpha * 0.5);
    ellipse(p.x, p.y, 68);
  }
  pop();
}

// ─── Edge Drawing ───────────────────────────────────────────
function drawEdges() {
  activePathPulse += 0.05;

  for (const e of edges) {
    if (e.isDangling) {
      drawDanglingEdge(e);
      continue;
    }

    const a = nodeMap[e.from], b = nodeMap[e.to];
    if (!a || !b) continue;

    const bothDC = discardedNodeIds.has(e.from) && discardedNodeIds.has(e.to);
    const anyDC = discardedNodeIds.has(e.from) || discardedNodeIds.has(e.to);
    const isHL = (e.from === highlightId || e.to === highlightId);

    const angle = atan2(b.y - a.y, b.x - a.x);
    const sx = a.x + cos(angle) * a.radius;
    const sy = a.y + sin(angle) * a.radius;
    const ex = b.x - cos(angle) * b.radius;
    const ey = b.y - sin(angle) * b.radius;

    if (e.isActivePath) {
      const pa = map(sin(activePathPulse * 2), -1, 1, 180, 255);
      const pw = map(sin(activePathPulse * 2), -1, 1, 3, 5);
      push();
      drawingContext.shadowBlur = 12;
      drawingContext.shadowColor = 'rgba(255,215,0,0.5)';
      stroke(255, 215, 0, pa); strokeWeight(pw);
      line(sx, sy, ex, ey);
      drawingContext.shadowBlur = 0;
      pop();
      drawArrowHead(ex, ey, angle, true, false, false, false);
    } else if (e.isError) {
      stroke(255, 50, 50, 200); strokeWeight(2);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, false, true, false);
    } else if (e.isSuggestion) {
      stroke(210, 170, 50, 180); strokeWeight(1.8);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, false, false, true);
    } else if (bothDC) {
      stroke(80, 80, 80, 60); strokeWeight(1);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, true, false, false);
    } else if (isHL) {
      stroke(255, 215, 0, 200); strokeWeight(2);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, true, false, false, false);
    } else if (anyDC) {
      stroke(0, 150, 150, 80); strokeWeight(1.2);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, false, false, false);
    } else if (e._selectionHighlight) {
      stroke(60, 140, 255, 180); strokeWeight(2.2);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, false, false, false);
    } else {
      stroke(0, 200, 200, 160); strokeWeight(1.5);
      line(sx, sy, ex, ey);
      drawArrowHead(ex, ey, angle, false, false, false, false);
    }
  }
}

function drawDanglingEdge(e) {
  const a = nodeMap[e.from];
  if (!a) return;

  const angle = random(0, TWO_PI);
  const fadeLen = 60;
  const sx = a.x + cos(angle) * a.radius;
  const sy = a.y + sin(angle) * a.radius;

  push();
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments, t1 = (i + 1) / segments;
    const alpha = lerp(200, 0, t1);
    if (i % 2 === 0) {
      stroke(210, 170, 50, alpha);
      strokeWeight(1.5);
      const x0 = sx + cos(angle) * fadeLen * t0;
      const y0 = sy + sin(angle) * fadeLen * t0;
      const x1 = sx + cos(angle) * fadeLen * t1;
      const y1 = sy + sin(angle) * fadeLen * t1;
      line(x0, y0, x1, y1);
    }
  }
  pop();
}

function drawArrowHead(x, y, angle, hl, dc, err, sug) {
  push(); translate(x, y); rotate(angle);
  if (err) fill(255, 50, 50, 220);
  else if (sug) fill(210, 170, 50, 200);
  else if (dc) fill(80, 80, 80, 60);
  else if (hl) fill(255, 215, 0, 220);
  else fill(0, 255, 255, 180);
  noStroke(); triangle(0, 0, -8, -4, -8, 4);
  pop();
}

// ─── Finish Button ──────────────────────────────────────────
const FINISH_BTN = { x: 0, y: 0, w: 110, h: 24 };

function drawFinishButton() {
  if (roadmapVisible) return;
  const bx = 12, by = height - 42;
  FINISH_BTN.x = bx; FINISH_BTN.y = by;

  const hovering = mouseX >= bx && mouseX <= bx + FINISH_BTN.w && mouseY >= by && mouseY <= by + FINISH_BTN.h;

  push();
  rectMode(CORNER); noStroke();
  if (hovering) {
    fill(0, 200, 150, 200);
    rect(bx, by, FINISH_BTN.w, FINISH_BTN.h, 5);
    fill(0);
  } else {
    fill(20, 20, 30, 180);
    rect(bx, by, FINISH_BTN.w, FINISH_BTN.h, 5);
    stroke(0, 200, 150, 80); strokeWeight(1); noFill();
    rect(bx, by, FINISH_BTN.w, FINISH_BTN.h, 5);
    noStroke();
    fill(0, 200, 150, 160);
  }
  textSize(10); textAlign(CENTER, CENTER); textFont('Consolas');
  text('FINISH & RESET', bx + FINISH_BTN.w / 2, by + FINISH_BTN.h / 2);
  pop();
}

function drawWatermark() {
  push(); noStroke();
  fill(0, 255, 255, 30); textSize(11); textAlign(LEFT, BOTTOM);
  text('ZENITH GHOST', 12, height - 10); pop();
}

// ─── Pointer Legend ─────────────────────────────────────────
// ─── Variables Tray (Scalar Variables not on canvas) ────────
function drawVariablesTray() {
  if (!scalarVariables || scalarVariables.length === 0) return;
  const trayX = width - 10;
  const startY = 90;
  const lineH = 18;
  const pad = 8;
  const headerH = 20;
  const trayH = headerH + scalarVariables.length * lineH + pad;
  const trayW = 140;

  push();
  fill(10, 14, 20, 180);
  stroke(0, 180, 216, 80);
  strokeWeight(1);
  rectMode(CORNER);
  rect(trayX - trayW, startY, trayW, trayH, 6);

  noStroke();
  fill(0, 180, 216, 200);
  textSize(9);
  textAlign(LEFT, TOP);
  textFont('Consolas');
  text('VARIABLES', trayX - trayW + pad, startY + 5);

  fill(100, 110, 120, 120);
  rect(trayX - trayW + pad, startY + headerH - 2, trayW - pad * 2, 1);

  for (let i = 0; i < scalarVariables.length; i++) {
    const v = scalarVariables[i];
    const y = startY + headerH + i * lineH + 2;
    fill(180, 190, 200, 200);
    textSize(10);
    textAlign(LEFT, TOP);
    text(v.name, trayX - trayW + pad, y);
    fill(0, 255, 200, 220);
    textAlign(RIGHT, TOP);
    text(v.value, trayX - pad, y);
  }
  pop();
}

function drawPointerLegend() {
  const al = new Set();
  for (const id in pointerMap) al.add(pointerMap[id].label);
  const labels = Object.keys(labelColorMap).filter(l => al.has(l));
  if (labels.length === 0) return;
  push();
  labels.forEach((label, i) => {
    const col = labelColorMap[label], y = 38 + i * 16;
    fill(col[0], col[1], col[2], 200); noStroke(); ellipse(16, y, 6, 6);
    fill(col[0], col[1], col[2], 160); textSize(9); textAlign(LEFT, CENTER); textFont('Consolas');
    text(label, 24, y);
  });
  pop();
}

// ─── Data Mapping ───────────────────────────────────────────
function applyPayload(payload) {
  const { type, edges: pe, pointers: pp } = payload;
  let nodes = payload.nodes || [];
  currentType = type;
  highlightId = payload.highlightId || null;
  traceInfo = payload.traceInfo || '';
  stepLabel = payload.stepLabel || '';
  complexity = payload.complexity || '';
  discardedNodeIds = new Set(payload.discardedNodeIds || []);
  scalarVariables = Array.isArray(payload.variables) ? payload.variables : [];
  traceActive = true;

  hasErrors = false;
  hasSuggestions = false;

  nodes = nodes.filter(n => {
    if (!n.id || !n.val) return false;
    const v = String(n.val).toLowerCase();
    if (v === 'undefined' || v === 'null' || v === 'uninitialized' || v === '?') return false;
    return true;
  });

  if (type === 'Empty' || nodes.length === 0) {
    nodeMap = {}; edges = []; pointerMap = {}; return;
  }

  const incomingIds = new Set(nodes.map(n => n.id));
  for (const id in nodeMap) { if (!incomingIds.has(id)) delete nodeMap[id]; }

  edges = (pe || []).filter(e => incomingIds.has(e.from) && (incomingIds.has(e.to) || e.isDangling));

  if (type === 'LinkedList') layoutLinkedList(nodes);
  else if (type === 'BinaryTree') layoutBinaryTree(nodes);
  else if (type === 'Array') layoutArray(nodes);
  else if (type === 'Stack') layoutStack(nodes);

  let mx = 1;
  for (const n of nodes) {
    const ac = typeof n.accessCount === 'number' ? n.accessCount : 0;
    if (ac > mx) mx = ac;
  }
  maxAccessCount = mx;

  for (const id in nodeMap) {
    nodeMap[id].highlighted = (id === highlightId);
    nodeMap[id].discarded = discardedNodeIds.has(id);
  }

  for (const n of nodes) {
    if (nodeMap[n.id]) {
      nodeMap[n.id].accessCount = typeof n.accessCount === 'number' ? n.accessCount : 0;
      nodeMap[n.id].isError = n.isError || false;
      nodeMap[n.id].isSuggestion = n.isSuggestion || false;
      nodeMap[n.id].errorMessage = n.errorMessage || '';
      nodeMap[n.id].suggestedFix = n.suggestedFix || '';
      nodeMap[n.id].fixStartLine = n.fixStartLine || 0;
      nodeMap[n.id].fixEndLine = n.fixEndLine || 0;
      if (n.isError) hasErrors = true;
      if (n.isSuggestion) hasSuggestions = true;
    }
  }

  for (const e of edges) {
    if (e.isError) hasErrors = true;
    if (e.isSuggestion || e.isDangling) hasSuggestions = true;
    if (e.isActivePath && nodeMap[e.to] && !nodeMap[e.to].wasPinged) {
      nodeMap[e.to].triggerPing();
    }
  }

  for (const id in nodeMap) { nodeMap[id].wasPinged = false; }

  cacheLayout();
  applyPointers(pp || []);
}

function applyPointers(pointers) {
  const valid = pointers.filter(p => p.targetNodeId && nodeMap[p.targetNodeId]);
  const ids = new Set(valid.map(p => p.id));
  for (const id in pointerMap) { if (!ids.has(id)) delete pointerMap[id]; }
  for (const p of valid) {
    if (pointerMap[p.id]) {
      pointerMap[p.id].label = p.label;
      pointerMap[p.id].color = getPointerColor(p.label);
      pointerMap[p.id].updateTarget(p.targetNodeId);
    } else {
      const gp = new GhostPointer(p.id, p.label, p.targetNodeId);
      const t = nodeMap[p.targetNodeId];
      if (t) { gp.x = t.x; gp.y = t.y - t.radius - 40; }
      pointerMap[p.id] = gp;
    }
  }
}

function createOrMoveNode(n, tx, ty) {
  if (nodeMap[n.id]) {
    nodeMap[n.id].val = n.val;
    nodeMap[n.id].moveTo(tx, ty);
  } else {
    const cached = getCachedPos(n.id);
    const startX = cached ? cached.x : tx;
    const startY = cached ? cached.y : ty;
    const node = new GhostNode(n.id, n.val, startX, startY);
    node.moveTo(tx, ty);
    nodeMap[n.id] = node;
  }
}

function layoutLinkedList(nodes) {
  const sp = 120, sx = 80, cy = height / 2;
  nodes.forEach((n, i) => createOrMoveNode(n, sx + i * sp, cy));
}
function layoutBinaryTree(nodes) {
  if (!nodes.length) return;
  const cs = new Set();
  for (const e of edges) if (!e.isDangling) cs.add(e.to);
  const root = nodes.find(n => !cs.has(n.id)) || nodes[0];
  const adj = {};
  for (const e of edges) { if (e.isDangling) continue; if (!adj[e.from]) adj[e.from] = []; adj[e.from].push(e.to); }
  const pos = {};
  const bx = width / 2, by = 80, yg = 90;
  function assign(id, x, y, sp) {
    if (!id || pos[id]) return; pos[id] = { x, y };
    const ch = adj[id] || [];
    if (ch[0]) assign(ch[0], x - sp, y + yg, sp * 0.55);
    if (ch[1]) assign(ch[1], x + sp, y + yg, sp * 0.55);
  }
  assign(root.id, bx, by, width * 0.22);
  const unpositioned = [];
  nodes.forEach(n => {
    const p = pos[n.id];
    if (p) { createOrMoveNode(n, p.x, p.y); }
    else { unpositioned.push(n); }
  });
  if (unpositioned.length > 0) {
    layoutCircularFallback(unpositioned);
  }
}
function layoutArray(nodes) {
  const sp = 70, tw = (nodes.length - 1) * sp, sx = (width - tw) / 2, cy = height / 2;
  nodes.forEach((n, i) => createOrMoveNode(n, sx + i * sp, cy));
}
function layoutStack(nodes) {
  const sp = 70, cx = width / 2, bot = height - 80;
  nodes.forEach((n, i) => createOrMoveNode(n, cx, bot - i * sp));
}
function layoutCircularFallback(nodes) {
  const cx = width / 2, cy = height / 2;
  const r = Math.min(width, height) * 0.3;
  nodes.forEach((n, i) => {
    const angle = (TWO_PI / nodes.length) * i - HALF_PI;
    createOrMoveNode(n, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  });
}

// ─── Message Listener ───────────────────────────────────────
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'updateStructure') {
    if (playbackActive) stopPlayback();
    applyPayload(msg.data);
  } else if (msg.command === 'playback') {
    startPlayback(msg.data);
  } else if (msg.command === 'stopPlayback') {
    stopPlayback();
  } else if (msg.command === 'roadmap') {
    stopPlayback();
    nodeMap = {}; edges = []; pointerMap = {};
    showRoadmap(msg.data);
  } else if (msg.command === 'hideRoadmap') {
    hideRoadmap();
  } else if (msg.command === 'clearHeat') {
    for (const id in nodeMap) { nodeMap[id].accessCount = 0; nodeMap[id].heatLerp = 0; }
    maxAccessCount = 1;
  } else if (msg.command === 'cursorSync') {
    const { activeLine, selectedText, selStartLine, selEndLine } = msg.data;
    cursorActiveLine = activeLine;
    selectionNodeIds = new Set();
    if (selectedText && selectedText.length > 0) {
      for (const id in nodeMap) {
        const node = nodeMap[id];
        if (selectedText.indexOf(node.val) !== -1) {
          selectionNodeIds.add(id);
        }
      }
      for (const e of edges) {
        if (selectionNodeIds.has(e.from) && selectionNodeIds.has(e.to)) {
          e._selectionHighlight = true;
        } else {
          e._selectionHighlight = false;
        }
      }
    } else {
      for (const e of edges) { e._selectionHighlight = false; }
    }
  } else if (msg.command === 'loading') {
    loading = msg.data;
    if (!loading) loadingPulse = 0;
  }
});
</script>
</body>
</html>`;
}
