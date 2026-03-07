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
  canvas { display: block; }
</style>
<script nonce="${nonce}" src="${p5Uri}"></script>
</head>
<body>
<script nonce="${nonce}">
// ─── Pointer Color Palette ──────────────────────────────────
const POINTER_COLORS = [
  [57, 255, 20],
  [255, 16, 240],
  [255, 165, 0],
  [0, 191, 255],
  [255, 255, 0],
  [148, 103, 255],
  [255, 99, 71],
  [0, 255, 200],
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
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.radius = 30;
    this.glowPulse = random(0, TWO_PI);
    this.highlighted = false;
    this.highlightLerp = 0;
    this.discarded = false;
    this.discardLerp = 0;
  }

  moveTo(tx, ty) { this.targetX = tx; this.targetY = ty; }

  update() {
    this.x = lerp(this.x, this.targetX, 0.15);
    this.y = lerp(this.y, this.targetY, 0.15);
    this.glowPulse += 0.03;
    this.highlightLerp = lerp(this.highlightLerp, this.highlighted ? 1 : 0, 0.15);
    this.discardLerp = lerp(this.discardLerp, this.discarded ? 1 : 0, 0.12);
  }

  draw() {
    const glow = map(sin(this.glowPulse), -1, 1, 120, 255);
    const hl = this.highlightLerp;
    const dc = this.discardLerp;

    const baseR = lerp(0, 255, hl);
    const baseG = lerp(glow, 215, hl);
    const baseB = lerp(glow, 0, hl);
    const r = lerp(baseR, 80, dc);
    const g = lerp(baseG, 80, dc);
    const b = lerp(baseB, 80, dc);
    const nodeAlpha = lerp(255, 50, dc);

    push();

    if (hl > 0.05 && dc < 0.5) {
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

    if (dc > 0.3) {
      stroke(255, 50, 50, 80 * dc);
      strokeWeight(1.5);
      line(this.x - this.radius + 5, this.y, this.x + this.radius - 5, this.y);
    }

    noStroke();
    fill(lerp(lerp(0, 255, hl), 80, dc),
         lerp(lerp(255, 215, hl), 80, dc),
         lerp(lerp(255, 0, hl), 80, dc),
         nodeAlpha);
    textAlign(CENTER, CENTER);
    textSize(14);
    textFont('Consolas');
    text(this.val, this.x, this.y);
    pop();
  }
}

// ─── Pointer Class ──────────────────────────────────────────
class GhostPointer {
  constructor(id, label, targetNodeId) {
    this.id = id;
    this.label = label;
    this.targetNodeId = targetNodeId;
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.color = getPointerColor(label);
    this.pulse = random(0, TWO_PI);
  }

  updateTarget(tid) { this.targetNodeId = tid; }

  update(nodeMap, idx, total) {
    const node = nodeMap[this.targetNodeId];
    if (!node) return;
    this.pulse += 0.04;

    const spread = PI * 0.6;
    const startAngle = -HALF_PI - spread / 2;
    const step = total > 1 ? spread / (total - 1) : 0;
    const oa = startAngle + idx * step;
    const od = node.radius + 40;

    this.targetX = node.x + cos(oa) * od;
    this.targetY = node.y + sin(oa) * od;
    this.x = lerp(this.x, this.targetX, 0.15);
    this.y = lerp(this.y, this.targetY, 0.15);
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
    stroke(col[0], col[1], col[2], alpha);
    strokeWeight(2);
    line(this.x, this.y, tipX, tipY);
    const as = 7;
    translate(tipX, tipY);
    rotate(angle);
    fill(col[0], col[1], col[2], alpha);
    noStroke();
    triangle(0, 0, -as, -as / 2, -as, as / 2);
    pop();

    push();
    noStroke();
    fill(20, 20, 20, 190);
    rectMode(CENTER);
    textSize(10);
    textFont('Consolas');
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

// ─── Playback State ────────────────────────────────────────
let playbackFrames = [];
let playbackIndex = 0;
let playbackTimer = null;
let playbackActive = false;
const PLAYBACK_INTERVAL = 1200;

// ─── p5.js Lifecycle ────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Consolas');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();

  drawModeIndicator();

  if (loading) { drawLoadingIndicator(); }

  drawEdges();

  for (const id in nodeMap) {
    nodeMap[id].update();
    nodeMap[id].draw();
  }

  updateAndDrawPointers();

  if (highlightId && nodeMap[highlightId] && traceInfo) {
    drawTraceLabel(nodeMap[highlightId]);
  }

  if (stepLabel) { drawStepLabel(); }
  if (playbackActive) { drawPlaybackProgress(); }

  drawPointerLegend();
  drawWatermark();
}

// ─── Playback Engine ────────────────────────────────────────
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
  if (playbackIndex >= playbackFrames.length) {
    playbackIndex = 0;
  }
  applyPayload(playbackFrames[playbackIndex]);
}

function stopPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  playbackActive = false;
  playbackFrames = [];
  playbackIndex = 0;
}

// ─── Playback Progress Bar ──────────────────────────────────
function drawPlaybackProgress() {
  if (playbackFrames.length === 0) return;

  push();
  const barW = 160;
  const barH = 6;
  const bx = width / 2 - barW / 2;
  const by = 44;
  const progress = (playbackIndex + 1) / playbackFrames.length;

  noStroke();
  fill(40, 40, 40, 150);
  rect(bx, by, barW, barH, 3);

  fill(0, 255, 255, 200);
  rect(bx, by, barW * progress, barH, 3);

  fill(0, 255, 255, 180);
  textSize(10);
  textAlign(CENTER, CENTER);
  textFont('Consolas');
  text('Step ' + (playbackIndex + 1) + '/' + playbackFrames.length, width / 2, by + 16);
  pop();
}

// ─── Pointer Rendering ─────────────────────────────────────
function updateAndDrawPointers() {
  const nodeCounts = {};
  const nodeIndices = {};

  for (const id in pointerMap) {
    const tid = pointerMap[id].targetNodeId;
    nodeCounts[tid] = (nodeCounts[tid] || 0) + 1;
    nodeIndices[tid] = 0;
  }

  for (const id in pointerMap) {
    const ptr = pointerMap[id];
    const tid = ptr.targetNodeId;
    const idx = nodeIndices[tid];
    nodeIndices[tid]++;
    ptr.update(nodeMap, idx, nodeCounts[tid]);
    ptr.draw(nodeMap);
  }
}

// ─── Mode Indicator ─────────────────────────────────────────
function drawModeIndicator() {
  if (!traceActive && !playbackActive) return;
  traceIndicatorPulse += 0.04;
  const alpha = map(sin(traceIndicatorPulse), -1, 1, 80, 200);
  const dotAlpha = map(sin(traceIndicatorPulse * 1.5), -1, 1, 120, 255);

  push();
  noStroke();

  if (playbackActive) {
    fill(0, 255, 255, dotAlpha);
    ellipse(16, 18, 8, 8);
    fill(0, 255, 255, alpha);
    textSize(10);
    textAlign(LEFT, CENTER);
    textFont('Consolas');
    text('PLAYBACK', 24, 18);
  } else {
    fill(255, 215, 0, dotAlpha);
    ellipse(16, 18, 8, 8);
    fill(255, 215, 0, alpha);
    textSize(10);
    textAlign(LEFT, CENTER);
    textFont('Consolas');
    text('TRACE MODE', 24, 18);
  }
  pop();
}

// ─── Trace Info Label ───────────────────────────────────────
function drawTraceLabel(node) {
  push();
  const labelY = node.y - node.radius - 22;
  fill(20, 20, 20, 200);
  stroke(255, 215, 0, 120);
  strokeWeight(1);
  rectMode(CENTER);
  textSize(11);
  textFont('Consolas');
  const tw = textWidth(traceInfo) + 16;
  rect(node.x, labelY, tw, 20, 6);
  noStroke();
  fill(255, 215, 0);
  textAlign(CENTER, CENTER);
  text(traceInfo, node.x, labelY);
  pop();
}

// ─── Step Label ─────────────────────────────────────────────
function drawStepLabel() {
  push();
  noStroke();
  fill(20, 20, 20, 180);
  rectMode(CENTER);
  textSize(11);
  textFont('Consolas');
  const tw = textWidth(stepLabel) + 20;
  const lx = width / 2;
  const ly = height - 36;
  rect(lx, ly, tw, 22, 6);
  stroke(255, 50, 50, 100);
  strokeWeight(1);
  noFill();
  rect(lx, ly, tw, 22, 6);
  noStroke();
  fill(255, 120, 100);
  textAlign(CENTER, CENTER);
  text(stepLabel, lx, ly);
  pop();
}

// ─── Loading Indicator ──────────────────────────────────────
function drawLoadingIndicator() {
  loadingPulse += 0.05;
  const alpha = map(sin(loadingPulse), -1, 1, 40, 180);
  const r = map(sin(loadingPulse), -1, 1, 6, 12);
  push();
  noStroke();
  fill(0, 255, 255, alpha);
  ellipse(width - 30, 25, r * 2);
  fill(0, 255, 255, alpha * 0.6);
  textSize(10);
  textAlign(RIGHT, CENTER);
  text('analyzing...', width - 46, 25);
  pop();
}

// ─── Edge Drawing ───────────────────────────────────────────
function drawEdges() {
  for (const e of edges) {
    const a = nodeMap[e.from];
    const b = nodeMap[e.to];
    if (!a || !b) continue;

    const bothDC = discardedNodeIds.has(e.from) && discardedNodeIds.has(e.to);
    const anyDC = discardedNodeIds.has(e.from) || discardedNodeIds.has(e.to);

    const angle = atan2(b.y - a.y, b.x - a.x);
    const sx = a.x + cos(angle) * a.radius;
    const sy = a.y + sin(angle) * a.radius;
    const ex = b.x - cos(angle) * b.radius;
    const ey = b.y - sin(angle) * b.radius;

    const isHL = (e.from === highlightId || e.to === highlightId);

    if (bothDC) { stroke(80, 80, 80, 60); strokeWeight(1); }
    else if (isHL) { stroke(255, 215, 0, 200); strokeWeight(2); }
    else if (anyDC) { stroke(0, 150, 150, 80); strokeWeight(1.2); }
    else { stroke(0, 200, 200, 160); strokeWeight(1.5); }

    line(sx, sy, ex, ey);
    drawArrowHead(ex, ey, angle, isHL, bothDC);
  }
}

function drawArrowHead(x, y, angle, hl, dc) {
  const s = 8;
  push();
  translate(x, y);
  rotate(angle);
  if (dc) fill(80, 80, 80, 60);
  else if (hl) fill(255, 215, 0, 220);
  else fill(0, 255, 255, 180);
  noStroke();
  triangle(0, 0, -s, -s / 2, -s, s / 2);
  pop();
}

function drawWatermark() {
  push();
  noStroke();
  fill(0, 255, 255, 30);
  textSize(11);
  textAlign(LEFT, BOTTOM);
  text('ZENITH GHOST', 12, height - 10);
  pop();
}

// ─── Pointer Legend ─────────────────────────────────────────
function drawPointerLegend() {
  const activeLabels = new Set();
  for (const id in pointerMap) { activeLabels.add(pointerMap[id].label); }
  const labels = Object.keys(labelColorMap).filter(l => activeLabels.has(l));
  if (labels.length === 0) return;

  push();
  labels.forEach((label, i) => {
    const col = labelColorMap[label];
    const y = 38 + i * 16;
    fill(col[0], col[1], col[2], 200);
    noStroke();
    ellipse(16, y, 6, 6);
    fill(col[0], col[1], col[2], 160);
    textSize(9);
    textAlign(LEFT, CENTER);
    textFont('Consolas');
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

  if (type === 'Empty' || !nodes || nodes.length === 0) {
    nodeMap = {};
    edges = [];
    pointerMap = {};
    return;
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
    else { nodeMap[n.id] = new GhostNode(n.id, n.val, tx, cy); }
  });
}

function layoutBinaryTree(nodes) {
  if (nodes.length === 0) return;
  const cs = new Set();
  for (const e of edges) cs.add(e.to);
  const root = nodes.find(n => !cs.has(n.id)) || nodes[0];
  const adj = {};
  for (const e of edges) { if (!adj[e.from]) adj[e.from] = []; adj[e.from].push(e.to); }
  const pos = {};
  const bx = width / 2, by = 80, yg = 90;
  function assign(id, x, y, sp) {
    if (!id || pos[id]) return;
    pos[id] = { x, y };
    const ch = adj[id] || [];
    if (ch[0]) assign(ch[0], x - sp, y + yg, sp * 0.55);
    if (ch[1]) assign(ch[1], x + sp, y + yg, sp * 0.55);
  }
  assign(root.id, bx, by, width * 0.22);
  nodes.forEach(n => {
    const p = pos[n.id] || { x: width / 2, y: height / 2 };
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(p.x, p.y); }
    else { nodeMap[n.id] = new GhostNode(n.id, n.val, p.x, p.y); }
  });
}

function layoutArray(nodes) {
  const sp = 70, tw = (nodes.length - 1) * sp, sx = (width - tw) / 2, cy = height / 2;
  nodes.forEach((n, i) => {
    const tx = sx + i * sp;
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(tx, cy); }
    else { nodeMap[n.id] = new GhostNode(n.id, n.val, tx, cy); }
  });
}

function layoutStack(nodes) {
  const sp = 70, cx = width / 2, bot = height - 80;
  nodes.forEach((n, i) => {
    const ty = bot - i * sp;
    if (nodeMap[n.id]) { nodeMap[n.id].val = n.val; nodeMap[n.id].moveTo(cx, ty); }
    else { nodeMap[n.id] = new GhostNode(n.id, n.val, cx, ty); }
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
