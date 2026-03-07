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
  }

  moveTo(tx, ty) {
    this.targetX = tx;
    this.targetY = ty;
  }

  update() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
    this.glowPulse += 0.03;

    const hlTarget = this.highlighted ? 1 : 0;
    this.highlightLerp = lerp(this.highlightLerp, hlTarget, 0.12);
  }

  draw() {
    const glow = map(sin(this.glowPulse), -1, 1, 120, 255);
    const hl = this.highlightLerp;

    const r = lerp(0, 255, hl);
    const g = lerp(glow, 215, hl);
    const b = lerp(glow, 0, hl);

    push();

    if (hl > 0.05) {
      const pulseSize = map(sin(this.glowPulse * 1.5), -1, 1, 12, 20);
      noFill();
      stroke(255, 215, 0, 30 * hl);
      strokeWeight(pulseSize * hl);
      ellipse(this.x, this.y, this.radius * 2 + 20);
    }

    noFill();
    stroke(r, g, b);
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius * 2);

    stroke(r, g, b, 40);
    strokeWeight(6);
    ellipse(this.x, this.y, this.radius * 2 + 8);

    noStroke();
    fill(lerp(0, 255, hl), lerp(255, 215, hl), lerp(255, 0, hl));
    textAlign(CENTER, CENTER);
    textSize(14);
    textFont('Consolas');
    text(this.val, this.x, this.y);
    pop();
  }
}

// ─── State ──────────────────────────────────────────────────
let nodeMap = {};
let edges = [];
let currentType = null;
let loading = false;
let loadingPulse = 0;
let highlightId = null;
let traceInfo = '';
let traceActive = false;
let traceIndicatorPulse = 0;

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

  drawTraceIndicator();

  if (loading) {
    drawLoadingIndicator();
  }

  drawEdges();

  for (const id in nodeMap) {
    nodeMap[id].update();
    nodeMap[id].draw();
  }

  if (highlightId && nodeMap[highlightId] && traceInfo) {
    drawTraceLabel(nodeMap[highlightId]);
  }

  drawWatermark();
}

// ─── Trace Mode Indicator ───────────────────────────────────
function drawTraceIndicator() {
  if (!traceActive) return;
  traceIndicatorPulse += 0.04;
  const alpha = map(sin(traceIndicatorPulse), -1, 1, 80, 200);
  const dotAlpha = map(sin(traceIndicatorPulse * 1.5), -1, 1, 120, 255);

  push();
  noStroke();

  fill(255, 215, 0, dotAlpha);
  ellipse(16, 18, 8, 8);

  fill(255, 215, 0, alpha);
  textSize(10);
  textAlign(LEFT, CENTER);
  textFont('Consolas');
  text('TRACE MODE ACTIVE', 24, 18);
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

    const angle = atan2(b.y - a.y, b.x - a.x);
    const startX = a.x + cos(angle) * a.radius;
    const startY = a.y + sin(angle) * a.radius;
    const endX = b.x - cos(angle) * b.radius;
    const endY = b.y - sin(angle) * b.radius;

    const isHighlighted = (e.from === highlightId || e.to === highlightId);
    if (isHighlighted) {
      stroke(255, 215, 0, 200);
      strokeWeight(2);
    } else {
      stroke(0, 200, 200, 160);
      strokeWeight(1.5);
    }
    line(startX, startY, endX, endY);

    drawArrowHead(endX, endY, angle, isHighlighted);
  }
}

function drawArrowHead(x, y, angle, highlighted) {
  const size = 8;
  push();
  translate(x, y);
  rotate(angle);
  if (highlighted) {
    fill(255, 215, 0, 220);
  } else {
    fill(0, 255, 255, 180);
  }
  noStroke();
  triangle(0, 0, -size, -size / 2, -size, size / 2);
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

// ─── Data Mapping ───────────────────────────────────────────
function applyPayload(payload) {
  const { type, nodes, edges: payloadEdges } = payload;
  currentType = type;

  highlightId = payload.highlightId || null;
  traceInfo = payload.traceInfo || '';
  traceActive = true;

  if (type === 'Empty' || !nodes || nodes.length === 0) {
    nodeMap = {};
    edges = [];
    return;
  }

  const incomingIds = new Set(nodes.map(n => n.id));

  for (const id in nodeMap) {
    if (!incomingIds.has(id)) {
      delete nodeMap[id];
    }
  }

  for (const id in nodeMap) {
    nodeMap[id].highlighted = (id === highlightId);
  }

  edges = payloadEdges || [];

  if (type === 'LinkedList') {
    layoutLinkedList(nodes);
  } else if (type === 'BinaryTree') {
    layoutBinaryTree(nodes);
  } else if (type === 'Array') {
    layoutArray(nodes);
  } else if (type === 'Stack') {
    layoutStack(nodes);
  }
}

function layoutLinkedList(nodes) {
  const spacing = 120;
  const startX = 80;
  const cy = height / 2;

  nodes.forEach((n, i) => {
    const tx = startX + i * spacing;
    const ty = cy;

    if (nodeMap[n.id]) {
      nodeMap[n.id].val = n.val;
      nodeMap[n.id].moveTo(tx, ty);
    } else {
      nodeMap[n.id] = new GhostNode(n.id, n.val, tx, ty);
    }
    nodeMap[n.id].highlighted = (n.id === highlightId);
  });
}

function layoutBinaryTree(nodes) {
  if (nodes.length === 0) return;

  const childSet = new Set();
  for (const e of edges) { childSet.add(e.to); }
  const root = nodes.find(n => !childSet.has(n.id)) || nodes[0];

  const adj = {};
  for (const e of edges) {
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push(e.to);
  }

  const positions = {};
  const baseX = width / 2;
  const baseY = 60;
  const yGap = 90;

  function assignPositions(id, x, y, spread) {
    if (!id || positions[id]) return;
    positions[id] = { x, y };
    const children = adj[id] || [];
    if (children[0]) assignPositions(children[0], x - spread, y + yGap, spread * 0.55);
    if (children[1]) assignPositions(children[1], x + spread, y + yGap, spread * 0.55);
  }

  assignPositions(root.id, baseX, baseY, width * 0.22);

  nodes.forEach(n => {
    const pos = positions[n.id] || { x: width / 2, y: height / 2 };

    if (nodeMap[n.id]) {
      nodeMap[n.id].val = n.val;
      nodeMap[n.id].moveTo(pos.x, pos.y);
    } else {
      nodeMap[n.id] = new GhostNode(n.id, n.val, pos.x, pos.y);
    }
    nodeMap[n.id].highlighted = (n.id === highlightId);
  });
}

function layoutArray(nodes) {
  const spacing = 70;
  const totalWidth = (nodes.length - 1) * spacing;
  const startX = (width - totalWidth) / 2;
  const cy = height / 2;

  nodes.forEach((n, i) => {
    const tx = startX + i * spacing;
    const ty = cy;

    if (nodeMap[n.id]) {
      nodeMap[n.id].val = n.val;
      nodeMap[n.id].moveTo(tx, ty);
    } else {
      nodeMap[n.id] = new GhostNode(n.id, n.val, tx, ty);
    }
    nodeMap[n.id].highlighted = (n.id === highlightId);
  });
}

function layoutStack(nodes) {
  const spacing = 70;
  const cx = width / 2;
  const bottomY = height - 80;

  nodes.forEach((n, i) => {
    const tx = cx;
    const ty = bottomY - i * spacing;

    if (nodeMap[n.id]) {
      nodeMap[n.id].val = n.val;
      nodeMap[n.id].moveTo(tx, ty);
    } else {
      nodeMap[n.id] = new GhostNode(n.id, n.val, tx, ty);
    }
    nodeMap[n.id].highlighted = (n.id === highlightId);
  });
}

// ─── Message Listener ───────────────────────────────────────
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'updateStructure') {
    applyPayload(msg.data);
  } else if (msg.command === 'loading') {
    loading = msg.data;
    if (!loading) { loadingPulse = 0; }
  }
});
</script>
</body>
</html>`;
}
