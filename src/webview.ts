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
    border: 1px solid #ff4040;
    border-radius: 10px;
    padding: 0;
    max-width: 460px;
    width: 90%;
    box-shadow: 0 0 30px rgba(255, 40, 40, 0.3), 0 0 60px rgba(255, 40, 40, 0.1);
    overflow: hidden;
    font-family: Consolas, monospace;
  }
  .ghost-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(90deg, #2a0a0a, #1a1a2e);
    border-bottom: 1px solid #ff4040aa;
  }
  .ghost-code-header span {
    color: #ff6060;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
  }
  .ghost-code-close {
    background: none; border: none; color: #ff6060; font-size: 16px;
    cursor: pointer; padding: 0 4px; line-height: 1;
  }
  .ghost-code-close:hover { color: #ff9090; }

  .ghost-code-body {
    padding: 14px;
  }
  .ghost-code-error {
    color: #ff8080;
    font-size: 11px;
    margin-bottom: 10px;
    padding: 6px 8px;
    background: rgba(255, 40, 40, 0.1);
    border-radius: 4px;
    border-left: 3px solid #ff4040;
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
</style>
<script nonce="${nonce}" src="${p5Uri}"></script>
</head>
<body>

<div id="ghost-overlay">
  <div class="ghost-code-panel">
    <div class="ghost-code-header">
      <span>GHOST FIX</span>
      <button class="ghost-code-close" id="overlay-close">&times;</button>
    </div>
    <div class="ghost-code-body">
      <div class="ghost-code-error" id="overlay-error"></div>
      <div class="ghost-code-block" id="overlay-code"></div>
      <div class="ghost-code-line" id="overlay-line"></div>
    </div>
    <div class="ghost-code-footer">
      <button class="ghost-btn ghost-btn-cancel" id="overlay-cancel">Dismiss</button>
      <button class="ghost-btn ghost-btn-apply" id="overlay-apply">Apply Fix</button>
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

function showOverlay(errorMsg, fix, startLine, endLine) {
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
    this.errorMessage = '';
    this.suggestedFix = '';
    this.fixStartLine = 0;
    this.fixEndLine = 0;
  }

  moveTo(tx, ty) { this.targetX = tx; this.targetY = ty; }

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
  }

  draw() {
    const glow = map(sin(this.glowPulse), -1, 1, 120, 255);
    const hl = this.highlightLerp;
    const dc = this.discardLerp;
    const er = this.errorLerp;

    let r, g, b, nodeAlpha;

    if (er > 0.05) {
      const errPulse = map(sin(this.glowPulse * 2), -1, 1, 180, 255);
      r = lerp(lerp(0, 255, hl), errPulse, er);
      g = lerp(lerp(glow, 215, hl), 30, er);
      b = lerp(lerp(glow, 0, hl), 30, er);
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

    stroke(r, g, b, 40 * (1 - dc));
    strokeWeight(6);
    ellipse(this.x, this.y, this.radius * 2 + 8);

    if (dc > 0.3 && er < 0.3) {
      stroke(255, 50, 50, 80 * dc);
      strokeWeight(1.5);
      line(this.x - this.radius + 5, this.y, this.x + this.radius - 5, this.y);
    }

    noStroke();
    fill(r, g, b, nodeAlpha);
    textAlign(CENTER, CENTER);
    textSize(14);
    textFont('Consolas');
    text(this.val, this.x, this.y);
    pop();
  }

  isMouseOver() {
    return dist(mouseX, mouseY, this.x, this.y) < this.radius + 5;
  }

  getFixBtnBounds() {
    const bw = 36, bh = 16;
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
let guardPulse = 0;

let playbackFrames = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackActive = false;
const PLAYBACK_INTERVAL = 3000;

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
  if (loading) drawLoadingIndicator();

  drawEdges();

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

  drawPointerLegend();
  drawWatermark();
}

// ─── Fix Buttons on Error Nodes ─────────────────────────────
function drawFixButtons() {
  for (const id in nodeMap) {
    const node = nodeMap[id];
    if (!node.isError || !node.suggestedFix) continue;

    const b = node.getFixBtnBounds();
    const hovering = mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h;
    const pulse = map(sin(node.glowPulse * 2), -1, 1, 0.85, 1);

    push();
    rectMode(CORNER);
    noStroke();

    if (hovering) {
      fill(0, 220, 150, 240);
      rect(b.x, b.y, b.w, b.h, 4);
      fill(0, 0, 0);
    } else {
      fill(40, 40, 40, 200 * pulse);
      stroke(0, 200, 140, 160 * pulse);
      strokeWeight(1);
      rect(b.x, b.y, b.w, b.h, 4);
      noStroke();
      fill(0, 220, 150, 220 * pulse);
    }

    textSize(9);
    textAlign(CENTER, CENTER);
    textFont('Consolas');
    text('FIX', b.x + b.w / 2, b.y + b.h / 2);
    pop();
  }
}

function mousePressed() {
  if (overlayEl.classList.contains('visible')) return;

  for (const id in nodeMap) {
    const node = nodeMap[id];
    if (!node.isError || !node.suggestedFix) continue;

    const b = node.getFixBtnBounds();
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      showOverlay(node.errorMessage, node.suggestedFix, node.fixStartLine, node.fixEndLine);
      return;
    }
  }
}

// ─── Error Hover Tooltips ───────────────────────────────────
function drawErrorTooltips() {
  for (const id in nodeMap) {
    const node = nodeMap[id];
    if (node.isError && node.errorMessage && node.isMouseOver()) {
      push();
      textSize(10);
      textFont('Consolas');
      const msg = node.errorMessage;
      const tw = textWidth(msg) + 16;
      const tx = constrain(node.x, tw / 2 + 4, width - tw / 2 - 4);
      const ty = node.y + node.radius + 20;

      fill(40, 10, 10, 220);
      stroke(255, 60, 60, 180);
      strokeWeight(1);
      rectMode(CENTER);
      rect(tx, ty, tw, 20, 5);

      noStroke();
      fill(255, 80, 80);
      textAlign(CENTER, CENTER);
      text(msg, tx, ty);
      pop();
    }
  }
}

// ─── Logic-Guard Indicator ──────────────────────────────────
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
    text('LOGIC ERROR', x - 14, y);
  } else {
    const a = map(sin(guardPulse), -1, 1, 40, 100);
    fill(0, 255, 150, a);
    ellipse(x, y, 8, 8);
    fill(0, 255, 150, a * 0.7);
    textSize(8); textAlign(RIGHT, CENTER); textFont('Consolas');
    text('LOGIC-GUARD', x - 10, y);
  }
  pop();
}

// ─── Playback ───────────────────────────────────────────────
function startPlayback(frames) {
  stopPlayback();
  playbackFrames = frames;
  playbackIndex = 0;
  playbackActive = true;
  applyPayload(playbackFrames[0]);
  playbackTimer = setInterval(advancePlayback, PLAYBACK_INTERVAL);
}
function advancePlayback() {
  playbackIndex++;
  if (playbackIndex >= playbackFrames.length) playbackIndex = 0;
  applyPayload(playbackFrames[playbackIndex]);
}
function stopPlayback() {
  if (playbackTimer) { clearInterval(playbackTimer); playbackTimer = null; }
  playbackActive = false; playbackFrames = []; playbackIndex = 0;
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
}

// ─── Edge Drawing ───────────────────────────────────────────
function drawEdges() {
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

    if (e.isError) {
      stroke(255, 50, 50, 200); strokeWeight(2);
    } else if (bothDC) {
      stroke(80, 80, 80, 60); strokeWeight(1);
    } else if (isHL) {
      stroke(255, 215, 0, 200); strokeWeight(2);
    } else if (anyDC) {
      stroke(0, 150, 150, 80); strokeWeight(1.2);
    } else {
      stroke(0, 200, 200, 160); strokeWeight(1.5);
    }

    line(sx, sy, ex, ey);
    drawArrowHead(ex, ey, angle, isHL, bothDC, e.isError);
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
      stroke(255, 50, 50, alpha);
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

function drawArrowHead(x, y, angle, hl, dc, err) {
  push(); translate(x, y); rotate(angle);
  if (err) fill(255, 50, 50, 220);
  else if (dc) fill(80, 80, 80, 60);
  else if (hl) fill(255, 215, 0, 220);
  else fill(0, 255, 255, 180);
  noStroke(); triangle(0, 0, -8, -4, -8, 4);
  pop();
}

function drawWatermark() {
  push(); noStroke();
  fill(0, 255, 255, 30); textSize(11); textAlign(LEFT, BOTTOM);
  text('ZENITH GHOST', 12, height - 10); pop();
}

// ─── Pointer Legend ─────────────────────────────────────────
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
  const { type, nodes, edges: pe, pointers: pp } = payload;
  currentType = type;
  highlightId = payload.highlightId || null;
  traceInfo = payload.traceInfo || '';
  stepLabel = payload.stepLabel || '';
  discardedNodeIds = new Set(payload.discardedNodeIds || []);
  traceActive = true;

  hasErrors = false;

  if (type === 'Empty' || !nodes || nodes.length === 0) {
    nodeMap = {}; edges = []; pointerMap = {}; return;
  }

  const incomingIds = new Set(nodes.map(n => n.id));
  for (const id in nodeMap) { if (!incomingIds.has(id)) delete nodeMap[id]; }

  edges = pe || [];

  if (type === 'LinkedList') layoutLinkedList(nodes);
  else if (type === 'BinaryTree') layoutBinaryTree(nodes);
  else if (type === 'Array') layoutArray(nodes);
  else if (type === 'Stack') layoutStack(nodes);

  for (const id in nodeMap) {
    nodeMap[id].highlighted = (id === highlightId);
    nodeMap[id].discarded = discardedNodeIds.has(id);
  }

  for (const n of nodes) {
    if (nodeMap[n.id]) {
      nodeMap[n.id].isError = n.isError || false;
      nodeMap[n.id].errorMessage = n.errorMessage || '';
      nodeMap[n.id].suggestedFix = n.suggestedFix || '';
      nodeMap[n.id].fixStartLine = n.fixStartLine || 0;
      nodeMap[n.id].fixEndLine = n.fixEndLine || 0;
      if (n.isError) hasErrors = true;
    }
  }

  for (const e of edges) {
    if (e.isError || e.isDangling) hasErrors = true;
  }

  applyPointers(pp || []);
}

function applyPointers(pointers) {
  const ids = new Set(pointers.map(p => p.id));
  for (const id in pointerMap) { if (!ids.has(id)) delete pointerMap[id]; }
  for (const p of pointers) {
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

function layoutLinkedList(nodes) {
  const sp = 120, sx = 80, cy = height / 2;
  nodes.forEach((n, i) => {
    const tx = sx + i * sp;
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(tx, cy); }
    else nodeMap[n.id] = new GhostNode(n.id, n.val, tx, cy);
  });
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
  nodes.forEach(n => {
    const p = pos[n.id] || { x: width / 2, y: height / 2 };
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(p.x, p.y); }
    else nodeMap[n.id] = new GhostNode(n.id, n.val, p.x, p.y);
  });
}
function layoutArray(nodes) {
  const sp = 70, tw = (nodes.length - 1) * sp, sx = (width - tw) / 2, cy = height / 2;
  nodes.forEach((n, i) => {
    const tx = sx + i * sp;
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(tx, cy); }
    else nodeMap[n.id] = new GhostNode(n.id, n.val, tx, cy);
  });
}
function layoutStack(nodes) {
  const sp = 70, cx = width / 2, bot = height - 80;
  nodes.forEach((n, i) => {
    const ty = bot - i * sp;
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(cx, ty); }
    else nodeMap[n.id] = new GhostNode(n.id, n.val, cx, ty);
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
  } else if (msg.command === 'loading') {
    loading = msg.data;
    if (!loading) loadingPulse = 0;
  }
});
</script>
</body>
</html>`;
}
