/**
 * Tamagotchi Sprite Generator
 * Generates 32x32 pixel art sprites programmatically using Node.js Canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Color palettes
const COLORS = {
  egg: {
    light: '#A8D8EA',
    dark: '#AA96DA',
    spot: '#8B7AB8'
  },
  baby: {
    body: '#FFB6B9',
    bodyLight: '#FFC7D8',
    bodyDark: '#FF9AA0',
    eye: '#000000',
    eyeHighlight: '#FFFFFF',
    antenna: '#FF9AA0'
  },
  child: {
    body: '#92E3A9',
    bodyLight: '#A8E6CF',
    bodyDark: '#7AD699',
    eye: '#000000',
    eyeHighlight: '#FFFFFF',
    antenna: '#7AD699',
    limb: '#7AD699'
  },
  adult: {
    body: '#FF9A56',
    bodyLight: '#FFB366',
    bodyDark: '#FF8543',
    eye: '#000000',
    eyeHighlight: '#FFFFFF',
    antenna: '#FF8543',
    limb: '#FF8543',
    wing: '#FFC794'
  },
  item: {
    food: '#FF6B6B',
    foodHighlight: '#FF8E8E',
    ball: '#FFFFFF',
    ballSegment: '#4A90E2',
    poop: '#6B5310',
    poopHighlight: '#8B7320',
    heart: '#FF6B9D',
    heartHighlight: '#FF8FB3',
    particle: '#FFD700',
    particleHighlight: '#FFED4E'
  }
};

// Output directories
const SPRITE_DIR = path.join(__dirname, '../public/assets/sprites');
const TAMA_DIR = path.join(SPRITE_DIR, 'tamagotchi');
const ITEMS_DIR = path.join(SPRITE_DIR, 'items');
const EFFECTS_DIR = path.join(SPRITE_DIR, 'effects');

// Utility function to create directories
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Utility function to save canvas as PNG
function saveCanvas(canvas, filepath) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated: ${filepath}`);
}

// Utility function to draw a filled circle
function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Utility function to draw an ellipse
function drawEllipse(ctx, x, y, radiusX, radiusY, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Utility function to draw a pixel
function drawPixel(ctx, x, y, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

// ==================== PIXEL ART HELPERS ====================

// Draw pixel-perfect filled circle using Bresenham's algorithm
function drawPixelCircle(ctx, cx, cy, radius, color) {
  ctx.fillStyle = color;
  let x = 0;
  let y = radius;
  let d = 3 - 2 * radius;

  const drawCirclePixels = (xc, yc, x, y) => {
    ctx.fillRect(xc + x, yc + y, 1, 1);
    ctx.fillRect(xc - x, yc + y, 1, 1);
    ctx.fillRect(xc + x, yc - y, 1, 1);
    ctx.fillRect(xc - x, yc - y, 1, 1);
    ctx.fillRect(xc + y, yc + x, 1, 1);
    ctx.fillRect(xc - y, yc + x, 1, 1);
    ctx.fillRect(xc + y, yc - x, 1, 1);
    ctx.fillRect(xc - y, yc - x, 1, 1);
  };

  while (y >= x) {
    // Fill horizontal lines for filled circle
    for (let i = -x; i <= x; i++) {
      ctx.fillRect(cx + i, cy + y, 1, 1);
      ctx.fillRect(cx + i, cy - y, 1, 1);
    }
    for (let i = -y; i <= y; i++) {
      ctx.fillRect(cx + i, cy + x, 1, 1);
      ctx.fillRect(cx + i, cy - x, 1, 1);
    }

    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
  }
}

// Draw pixel-perfect circle outline
function strokePixelCircle(ctx, cx, cy, radius, color, thickness = 1) {
  ctx.fillStyle = color;
  let x = 0;
  let y = radius;
  let d = 3 - 2 * radius;

  const drawCirclePixels = (xc, yc, x, y) => {
    for (let t = 0; t < thickness; t++) {
      ctx.fillRect(xc + x, yc + y + t, 1, 1);
      ctx.fillRect(xc - x, yc + y + t, 1, 1);
      ctx.fillRect(xc + x, yc - y - t, 1, 1);
      ctx.fillRect(xc - x, yc - y - t, 1, 1);
      ctx.fillRect(xc + y, yc + x + t, 1, 1);
      ctx.fillRect(xc - y, yc + x + t, 1, 1);
      ctx.fillRect(xc + y, yc - x - t, 1, 1);
      ctx.fillRect(xc - y, yc - x - t, 1, 1);
    }
  };

  while (y >= x) {
    drawCirclePixels(cx, cy, x, y);
    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
  }
}

// Add black outline to current path
function addOutline(ctx, thickness = 1) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = thickness;
  ctx.stroke();
}

// ==================== EGG SPRITE ====================

function generateEgg() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Draw egg body (oval shape) - base color
  ctx.fillStyle = COLORS.egg.light;
  ctx.beginPath();
  ctx.ellipse(16, 16, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add darker shading on bottom-right
  ctx.fillStyle = COLORS.egg.dark;
  ctx.beginPath();
  ctx.ellipse(20, 20, 6, 8, 0.5, 0, Math.PI);
  ctx.fill();

  // Add light highlight on top-left
  ctx.fillStyle = '#C8E6EA';
  ctx.beginPath();
  ctx.arc(13, 11, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline (2px thick for retro look)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, 16, 10, 13, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Add spots
  drawCircle(ctx, 12, 10, 1.5, COLORS.egg.spot);
  drawCircle(ctx, 20, 14, 1, COLORS.egg.spot);
  drawCircle(ctx, 15, 20, 1.2, COLORS.egg.spot);

  // Add subtle crack lines (just a hint)
  ctx.strokeStyle = COLORS.egg.dark;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(18, 8);
  ctx.lineTo(20, 11);
  ctx.stroke();

  return canvas;
}

// ==================== BABY SPRITES ====================

function generateBabyBase(mood = 'neutral', frame = 1) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Calculate squash/stretch for animation frames
  let scaleY = 1;
  let offsetY = 0;
  if (frame === 2) {
    scaleY = 0.9; // Squashed
    offsetY = 1;
  } else if (frame === 3) {
    scaleY = 1.1; // Stretched
    offsetY = -1;
  }

  const bodyY = 18 + offsetY;
  const bodyRadiusY = 12 * scaleY;

  // Draw blob body - base color
  ctx.fillStyle = COLORS.baby.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, bodyRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight (top-left)
  ctx.fillStyle = COLORS.baby.bodyLight;
  ctx.beginPath();
  ctx.arc(12, bodyY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Dark shadow (bottom-right)
  ctx.fillStyle = COLORS.baby.bodyDark;
  drawPixel(ctx, 22, bodyY + 6, COLORS.baby.bodyDark, 2);
  drawPixel(ctx, 21, bodyY + 8, COLORS.baby.bodyDark, 2);

  // Black outline (2px thick for retro look)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, bodyRadiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw tiny antenna
  drawCircle(ctx, 16, 6, 1, COLORS.baby.antenna);
  ctx.strokeStyle = COLORS.baby.antenna;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.lineTo(16, 10);
  ctx.stroke();

  // Draw smaller eyes
  const eyeY = bodyY - 2;

  // Left eye
  drawCircle(ctx, 11, eyeY, 3, COLORS.baby.eye);
  drawCircle(ctx, 13, eyeY - 1, 1, COLORS.baby.eyeHighlight);

  // Right eye
  drawCircle(ctx, 21, eyeY, 3, COLORS.baby.eye);
  drawCircle(ctx, 23, eyeY - 1, 1, COLORS.baby.eyeHighlight);

  // Draw mouth based on mood
  ctx.strokeStyle = COLORS.baby.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  if (mood === 'happy') {
    // Wide smile
    ctx.arc(16, bodyY + 4, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    // Sparkle in eyes
    drawPixel(ctx, 9, eyeY - 4, COLORS.baby.eyeHighlight);
    drawPixel(ctx, 19, eyeY - 4, COLORS.baby.eyeHighlight);
  } else if (mood === 'sad') {
    // Frown
    ctx.arc(16, bodyY + 12, 6, 1.2 * Math.PI, 1.8 * Math.PI);
  } else {
    // Small smile
    ctx.arc(16, bodyY + 6, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  }
  ctx.stroke();

  return canvas;
}

function generateBabyBlink(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const bodyY = 18;

  // Draw blob body - base color
  ctx.fillStyle = COLORS.baby.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight (top-left)
  ctx.fillStyle = COLORS.baby.bodyLight;
  ctx.beginPath();
  ctx.arc(12, bodyY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Dark shadow (bottom-right)
  ctx.fillStyle = COLORS.baby.bodyDark;
  drawPixel(ctx, 22, bodyY + 6, COLORS.baby.bodyDark, 2);
  drawPixel(ctx, 21, bodyY + 8, COLORS.baby.bodyDark, 2);

  // Black outline (2px thick for retro look)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antenna
  drawCircle(ctx, 16, 6, 1, COLORS.baby.antenna);
  ctx.strokeStyle = COLORS.baby.antenna;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.lineTo(16, 10);
  ctx.stroke();

  const eyeY = bodyY - 2;

  if (frame === 1) {
    // Eyes open
    drawCircle(ctx, 11, eyeY, 3, COLORS.baby.eye);
    drawCircle(ctx, 13, eyeY - 1, 1, COLORS.baby.eyeHighlight);
    drawCircle(ctx, 21, eyeY, 3, COLORS.baby.eye);
    drawCircle(ctx, 23, eyeY - 1, 1, COLORS.baby.eyeHighlight);
  } else if (frame === 2) {
    // Half closed
    ctx.fillStyle = COLORS.baby.eye;
    ctx.fillRect(9, eyeY, 4, 2);
    ctx.fillRect(19, eyeY, 4, 2);
  } else {
    // Closed
    ctx.strokeStyle = COLORS.baby.eye;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, eyeY);
    ctx.lineTo(12, eyeY);
    ctx.moveTo(20, eyeY);
    ctx.lineTo(22, eyeY);
    ctx.stroke();
  }

  // Small smile
  ctx.strokeStyle = COLORS.baby.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(16, bodyY + 6, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  return canvas;
}

function generateBabyEat(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const bodyY = 18;

  // Draw blob body - base color
  ctx.fillStyle = COLORS.baby.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight (top-left)
  ctx.fillStyle = COLORS.baby.bodyLight;
  ctx.beginPath();
  ctx.arc(12, bodyY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Dark shadow (bottom-right)
  ctx.fillStyle = COLORS.baby.bodyDark;
  drawPixel(ctx, 22, bodyY + 6, COLORS.baby.bodyDark, 2);
  drawPixel(ctx, 21, bodyY + 8, COLORS.baby.bodyDark, 2);

  // Black outline (2px thick for retro look)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 12, 12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antenna
  drawCircle(ctx, 16, 6, 1, COLORS.baby.antenna);
  ctx.strokeStyle = COLORS.baby.antenna;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.lineTo(16, 10);
  ctx.stroke();

  // Draw eyes
  const eyeY = bodyY - 2;
  drawCircle(ctx, 11, eyeY, 3, COLORS.baby.eye);
  drawCircle(ctx, 13, eyeY - 1, 1, COLORS.baby.eyeHighlight);
  drawCircle(ctx, 21, eyeY, 3, COLORS.baby.eye);
  drawCircle(ctx, 23, eyeY - 1, 1, COLORS.baby.eyeHighlight);

  // Draw mouth based on eating frame
  ctx.fillStyle = COLORS.baby.eye;

  if (frame === 1) {
    // Closed
    ctx.strokeStyle = COLORS.baby.eye;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, bodyY + 6, 4, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (frame === 2) {
    // Opening
    ctx.beginPath();
    ctx.ellipse(16, bodyY + 6, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (frame === 3) {
    // Wide open
    ctx.beginPath();
    ctx.ellipse(16, bodyY + 6, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closing
    ctx.beginPath();
    ctx.ellipse(16, bodyY + 6, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// ==================== CHILD SPRITES ====================

function generateChildBase(mood = 'neutral', frame = 1) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Calculate squash/stretch for animation
  let scaleY = 1;
  let offsetY = 0;
  if (frame === 2) {
    scaleY = 0.95;
    offsetY = 1;
  } else if (frame === 3) {
    scaleY = 1.05;
    offsetY = -1;
  }

  const headY = 12 + offsetY;
  const bodyY = 22 + offsetY;

  // Draw body - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7 * scaleY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(14, bodyY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7 * scaleY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw small stubby limbs
  ctx.fillStyle = COLORS.child.limb;
  // Left arm
  ctx.fillRect(7, bodyY - 2, 2, 4);
  // Right arm
  ctx.fillRect(23, bodyY - 2, 2, 4);
  // Legs (just nubs at bottom)
  ctx.fillRect(12, bodyY + 6, 2, 3);
  ctx.fillRect(18, bodyY + 6, 2, 3);

  // Draw head - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw TWO antennae
  ctx.strokeStyle = COLORS.child.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // Left antenna
  ctx.beginPath();
  ctx.moveTo(12, headY - 8);
  ctx.lineTo(10, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 10, headY - 12, 1.5, COLORS.child.antenna);
  // Right antenna
  ctx.beginPath();
  ctx.moveTo(20, headY - 8);
  ctx.lineTo(22, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 22, headY - 12, 1.5, COLORS.child.antenna);

  // Draw smaller eyes
  const eyeY = headY;
  drawCircle(ctx, 12, eyeY, 2, COLORS.child.eye);
  drawCircle(ctx, 13, eyeY - 1, 0.8, COLORS.child.eyeHighlight);
  drawCircle(ctx, 20, eyeY, 2, COLORS.child.eye);
  drawCircle(ctx, 21, eyeY - 1, 0.8, COLORS.child.eyeHighlight);

  // Draw mouth based on mood
  ctx.strokeStyle = COLORS.child.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  if (mood === 'happy') {
    ctx.arc(16, headY + 3, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    drawPixel(ctx, 10, eyeY - 3, COLORS.child.eyeHighlight);
    drawPixel(ctx, 18, eyeY - 3, COLORS.child.eyeHighlight);
  } else if (mood === 'sad') {
    ctx.arc(16, headY + 9, 5, 1.2 * Math.PI, 1.8 * Math.PI);
  } else {
    ctx.arc(16, headY + 4, 3, 0.2 * Math.PI, 0.8 * Math.PI);
  }
  ctx.stroke();

  return canvas;
}

function generateChildBlink(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const headY = 12;
  const bodyY = 22;

  // Draw body - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(14, bodyY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw limbs
  ctx.fillStyle = COLORS.child.limb;
  ctx.fillRect(7, bodyY - 2, 2, 4);
  ctx.fillRect(23, bodyY - 2, 2, 4);
  ctx.fillRect(12, bodyY + 6, 2, 3);
  ctx.fillRect(18, bodyY + 6, 2, 3);

  // Draw head - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antennae
  ctx.strokeStyle = COLORS.child.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(12, headY - 8);
  ctx.lineTo(10, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 10, headY - 12, 1.5, COLORS.child.antenna);
  ctx.beginPath();
  ctx.moveTo(20, headY - 8);
  ctx.lineTo(22, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 22, headY - 12, 1.5, COLORS.child.antenna);

  // Draw eyes based on blink frame
  const eyeY = headY;

  if (frame === 1) {
    drawCircle(ctx, 12, eyeY, 4, COLORS.child.eye);
    drawCircle(ctx, 13, eyeY - 1, 1.5, COLORS.child.eyeHighlight);
    drawCircle(ctx, 20, eyeY, 4, COLORS.child.eye);
    drawCircle(ctx, 21, eyeY - 1, 1.5, COLORS.child.eyeHighlight);
  } else if (frame === 2) {
    ctx.fillStyle = COLORS.child.eye;
    ctx.fillRect(10, eyeY, 4, 2);
    ctx.fillRect(18, eyeY, 4, 2);
  } else {
    ctx.strokeStyle = COLORS.child.eye;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, eyeY);
    ctx.lineTo(14, eyeY);
    ctx.moveTo(18, eyeY);
    ctx.lineTo(22, eyeY);
    ctx.stroke();
  }

  // Draw mouth
  ctx.strokeStyle = COLORS.child.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(16, headY + 4, 3, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  return canvas;
}

function generateChildEat(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const headY = 12;
  const bodyY = 22;

  // Draw body - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(14, bodyY - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 7, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw limbs
  ctx.fillStyle = COLORS.child.limb;
  ctx.fillRect(7, bodyY - 2, 2, 4);
  ctx.fillRect(23, bodyY - 2, 2, 4);
  ctx.fillRect(12, bodyY + 6, 2, 3);
  ctx.fillRect(18, bodyY + 6, 2, 3);

  // Draw head - base color
  ctx.fillStyle = COLORS.child.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.child.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antennae
  ctx.strokeStyle = COLORS.child.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(12, headY - 8);
  ctx.lineTo(10, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 10, headY - 12, 1.5, COLORS.child.antenna);
  ctx.beginPath();
  ctx.moveTo(20, headY - 8);
  ctx.lineTo(22, headY - 12);
  ctx.stroke();
  drawCircle(ctx, 22, headY - 12, 1.5, COLORS.child.antenna);

  // Draw eyes
  const eyeY = headY;
  drawCircle(ctx, 12, eyeY, 4, COLORS.child.eye);
  drawCircle(ctx, 13, eyeY - 1, 1.5, COLORS.child.eyeHighlight);
  drawCircle(ctx, 20, eyeY, 4, COLORS.child.eye);
  drawCircle(ctx, 21, eyeY - 1, 1.5, COLORS.child.eyeHighlight);

  // Draw mouth based on eating frame
  ctx.fillStyle = COLORS.child.eye;

  if (frame === 1) {
    ctx.strokeStyle = COLORS.child.eye;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, headY + 4, 3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (frame === 2) {
    ctx.beginPath();
    ctx.ellipse(16, headY + 4, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (frame === 3) {
    ctx.beginPath();
    ctx.ellipse(16, headY + 4, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(16, headY + 4, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// ==================== ADULT SPRITES ====================

function generateAdultBase(mood = 'neutral', frame = 1) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Calculate squash/stretch
  let scaleY = 1;
  let offsetY = 0;
  if (frame === 2) {
    scaleY = 0.95;
    offsetY = 1;
  } else if (frame === 3) {
    scaleY = 1.05;
    offsetY = -1;
  }

  const headY = 10 + offsetY;
  const bodyY = 20 + offsetY;

  // Draw tail/wing
  ctx.fillStyle = COLORS.adult.wing;
  ctx.beginPath();
  ctx.moveTo(6, bodyY);
  ctx.lineTo(2, bodyY - 3);
  ctx.lineTo(4, bodyY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, bodyY);
  ctx.lineTo(30, bodyY - 3);
  ctx.lineTo(28, bodyY + 2);
  ctx.closePath();
  ctx.fill();

  // Draw body - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8 * scaleY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, bodyY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8 * scaleY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw limbs
  ctx.fillStyle = COLORS.adult.limb;
  // Arms
  ctx.fillRect(6, bodyY - 2, 2, 6);
  ctx.fillRect(24, bodyY - 2, 2, 6);
  // Legs
  ctx.fillRect(11, bodyY + 7, 2, 5);
  ctx.fillRect(19, bodyY + 7, 2, 5);

  // Draw head - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw THREE antennae/crown
  ctx.strokeStyle = COLORS.adult.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // Left antenna
  ctx.beginPath();
  ctx.moveTo(11, headY - 7);
  ctx.lineTo(9, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 9, headY - 11, 1.5, COLORS.adult.antenna);
  // Center antenna (tallest)
  ctx.beginPath();
  ctx.moveTo(16, headY - 7);
  ctx.lineTo(16, headY - 13);
  ctx.stroke();
  drawCircle(ctx, 16, headY - 13, 2, COLORS.adult.antenna);
  // Right antenna
  ctx.beginPath();
  ctx.moveTo(21, headY - 7);
  ctx.lineTo(23, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 23, headY - 11, 1.5, COLORS.adult.antenna);

  // Draw proportional eyes (6x6 pixels - 25% of face)
  const eyeY = headY;
  drawCircle(ctx, 12, eyeY, 3, COLORS.adult.eye);
  drawCircle(ctx, 13, eyeY - 1, 1, COLORS.adult.eyeHighlight);
  drawCircle(ctx, 20, eyeY, 3, COLORS.adult.eye);
  drawCircle(ctx, 21, eyeY - 1, 1, COLORS.adult.eyeHighlight);

  // Draw mouth based on mood
  ctx.strokeStyle = COLORS.adult.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  if (mood === 'happy') {
    ctx.arc(16, headY + 2, 4, 0.2 * Math.PI, 0.8 * Math.PI);
    drawPixel(ctx, 10, eyeY - 2, COLORS.adult.eyeHighlight);
    drawPixel(ctx, 18, eyeY - 2, COLORS.adult.eyeHighlight);
  } else if (mood === 'sad') {
    ctx.arc(16, headY + 7, 4, 1.2 * Math.PI, 1.8 * Math.PI);
  } else {
    ctx.arc(16, headY + 3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
  }
  ctx.stroke();

  return canvas;
}

function generateAdultBlink(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const headY = 10;
  const bodyY = 20;

  // Draw wings
  ctx.fillStyle = COLORS.adult.wing;
  ctx.beginPath();
  ctx.moveTo(6, bodyY);
  ctx.lineTo(2, bodyY - 3);
  ctx.lineTo(4, bodyY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, bodyY);
  ctx.lineTo(30, bodyY - 3);
  ctx.lineTo(28, bodyY + 2);
  ctx.closePath();
  ctx.fill();

  // Draw body - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, bodyY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw limbs
  ctx.fillStyle = COLORS.adult.limb;
  ctx.fillRect(6, bodyY - 2, 2, 6);
  ctx.fillRect(24, bodyY - 2, 2, 6);
  ctx.fillRect(11, bodyY + 7, 2, 5);
  ctx.fillRect(19, bodyY + 7, 2, 5);

  // Draw head - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antennae
  ctx.strokeStyle = COLORS.adult.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(11, headY - 7);
  ctx.lineTo(9, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 9, headY - 11, 1.5, COLORS.adult.antenna);
  ctx.beginPath();
  ctx.moveTo(16, headY - 7);
  ctx.lineTo(16, headY - 13);
  ctx.stroke();
  drawCircle(ctx, 16, headY - 13, 2, COLORS.adult.antenna);
  ctx.beginPath();
  ctx.moveTo(21, headY - 7);
  ctx.lineTo(23, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 23, headY - 11, 1.5, COLORS.adult.antenna);

  // Draw eyes based on blink frame
  const eyeY = headY;

  if (frame === 1) {
    drawCircle(ctx, 12, eyeY, 3, COLORS.adult.eye);
    drawCircle(ctx, 13, eyeY - 1, 1, COLORS.adult.eyeHighlight);
    drawCircle(ctx, 20, eyeY, 3, COLORS.adult.eye);
    drawCircle(ctx, 21, eyeY - 1, 1, COLORS.adult.eyeHighlight);
  } else if (frame === 2) {
    ctx.fillStyle = COLORS.adult.eye;
    ctx.fillRect(10, eyeY, 4, 2);
    ctx.fillRect(18, eyeY, 4, 2);
  } else {
    ctx.strokeStyle = COLORS.adult.eye;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, eyeY);
    ctx.lineTo(14, eyeY);
    ctx.moveTo(18, eyeY);
    ctx.lineTo(22, eyeY);
    ctx.stroke();
  }

  // Draw mouth
  ctx.strokeStyle = COLORS.adult.eye;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(16, headY + 3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  return canvas;
}

function generateAdultEat(frame) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const headY = 10;
  const bodyY = 20;

  // Draw wings
  ctx.fillStyle = COLORS.adult.wing;
  ctx.beginPath();
  ctx.moveTo(6, bodyY);
  ctx.lineTo(2, bodyY - 3);
  ctx.lineTo(4, bodyY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, bodyY);
  ctx.lineTo(30, bodyY - 3);
  ctx.lineTo(28, bodyY + 2);
  ctx.closePath();
  ctx.fill();

  // Draw body - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on body
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, bodyY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on body
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, bodyY, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw limbs
  ctx.fillStyle = COLORS.adult.limb;
  ctx.fillRect(6, bodyY - 2, 2, 6);
  ctx.fillRect(24, bodyY - 2, 2, 6);
  ctx.fillRect(11, bodyY + 7, 2, 5);
  ctx.fillRect(19, bodyY + 7, 2, 5);

  // Draw head - base color
  ctx.fillStyle = COLORS.adult.body;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Light highlight on head
  ctx.fillStyle = COLORS.adult.bodyLight;
  ctx.beginPath();
  ctx.arc(13, headY - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Black outline on head
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, headY, 7, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw antennae
  ctx.strokeStyle = COLORS.adult.antenna;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(11, headY - 7);
  ctx.lineTo(9, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 9, headY - 11, 1.5, COLORS.adult.antenna);
  ctx.beginPath();
  ctx.moveTo(16, headY - 7);
  ctx.lineTo(16, headY - 13);
  ctx.stroke();
  drawCircle(ctx, 16, headY - 13, 2, COLORS.adult.antenna);
  ctx.beginPath();
  ctx.moveTo(21, headY - 7);
  ctx.lineTo(23, headY - 11);
  ctx.stroke();
  drawCircle(ctx, 23, headY - 11, 1.5, COLORS.adult.antenna);

  // Draw eyes
  const eyeY = headY;
  drawCircle(ctx, 12, eyeY, 3, COLORS.adult.eye);
  drawCircle(ctx, 13, eyeY - 1, 1, COLORS.adult.eyeHighlight);
  drawCircle(ctx, 20, eyeY, 3, COLORS.adult.eye);
  drawCircle(ctx, 21, eyeY - 1, 1, COLORS.adult.eyeHighlight);

  // Draw mouth based on eating frame
  ctx.fillStyle = COLORS.adult.eye;

  if (frame === 1) {
    ctx.strokeStyle = COLORS.adult.eye;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, headY + 3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (frame === 2) {
    ctx.beginPath();
    ctx.ellipse(16, headY + 3, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (frame === 3) {
    ctx.beginPath();
    ctx.ellipse(16, headY + 3, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(16, headY + 3, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// ==================== ITEM SPRITES ====================

function generateBurger() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Bottom bun
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(12, 36, 24, 6);
  ctx.fillRect(9, 39, 30, 3);

  // Patty (brown meat)
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(12, 30, 24, 6);
  ctx.fillRect(9, 33, 30, 3);

  // Cheese (yellow, slightly melted)
  ctx.fillStyle = '#FFC107';
  ctx.fillRect(12, 27, 24, 3);
  ctx.fillRect(9, 27, 3, 3);
  ctx.fillRect(33, 27, 3, 3);

  // Lettuce (green, wavy)
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(12, 24, 24, 3);
  ctx.fillRect(9, 24, 3, 3);
  ctx.fillRect(18, 21, 6, 3);
  ctx.fillRect(27, 21, 6, 3);

  // Top bun (brown)
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(15, 15, 18, 6);
  ctx.fillRect(12, 18, 24, 3);
  ctx.fillRect(18, 12, 12, 3);

  // Sesame seeds (beige/white)
  ctx.fillStyle = '#F5F5DC';
  ctx.fillRect(18, 15, 3, 3);
  ctx.fillRect(27, 15, 3, 3);
  ctx.fillRect(21, 18, 3, 3);

  // Black outline
  ctx.fillStyle = '#000000';
  // Top outline
  ctx.fillRect(18, 9, 12, 3);
  ctx.fillRect(15, 12, 18, 3);
  // Side outlines
  ctx.fillRect(9, 21, 3, 18);
  ctx.fillRect(36, 21, 3, 18);
  // Bottom outline
  ctx.fillRect(9, 42, 30, 3);

  return canvas;
}

function generateBall() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // White ball body (pixel-perfect circle)
  drawPixelCircle(ctx, 24, 24, 15, '#FFFFFF');

  // Blue stripes/segments (pixel art style)
  ctx.fillStyle = '#2196F3';

  // Vertical stripe
  ctx.fillRect(24, 12, 3, 27);
  ctx.fillRect(21, 15, 3, 21);
  ctx.fillRect(27, 15, 3, 21);

  // Horizontal stripe
  ctx.fillRect(12, 24, 27, 3);
  ctx.fillRect(15, 21, 21, 3);
  ctx.fillRect(15, 27, 21, 3);

  // Light gray shading (bottom-right)
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(33, 30, 6, 6);
  ctx.fillRect(30, 33, 3, 3);

  // Black outline
  strokePixelCircle(ctx, 24, 24, 15, '#000000', 1);

  return canvas;
}

function generatePoop() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Bottom coil (largest)
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(15, 33, 18, 9);
  ctx.fillRect(12, 36, 24, 6);
  ctx.fillRect(18, 30, 12, 3);

  // Middle coil
  ctx.fillRect(18, 24, 12, 9);
  ctx.fillRect(15, 27, 18, 6);

  // Top coil (smallest)
  ctx.fillRect(21, 18, 6, 6);
  ctx.fillRect(18, 18, 12, 3);

  // Light brown highlight (top of each coil)
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(21, 15, 6, 3);
  ctx.fillRect(18, 24, 9, 3);
  ctx.fillRect(15, 33, 12, 3);

  // Dark brown outline/shadow
  ctx.fillStyle = '#4E342E';
  // Bottom outline
  ctx.fillRect(12, 42, 24, 3);
  ctx.fillRect(9, 39, 3, 3);
  ctx.fillRect(36, 39, 3, 3);
  // Separation lines between coils
  ctx.fillRect(15, 30, 18, 3);
  ctx.fillRect(18, 21, 12, 3);

  return canvas;
}

function generateHeart() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Pixel art heart shape
  ctx.fillStyle = '#E91E63';

  // Top left lobe
  ctx.fillRect(12, 15, 12, 12);
  ctx.fillRect(15, 12, 6, 3);

  // Top right lobe
  ctx.fillRect(24, 15, 12, 12);
  ctx.fillRect(27, 12, 6, 3);

  // Middle connecting section
  ctx.fillRect(18, 27, 12, 6);

  // Bottom triangle point
  ctx.fillRect(21, 33, 6, 3);
  ctx.fillRect(21, 36, 6, 3);
  ctx.fillRect(24, 39, 3, 3);

  // Pink highlight (top-left lobe)
  ctx.fillStyle = '#F8BBD0';
  ctx.fillRect(15, 15, 6, 6);
  ctx.fillRect(18, 12, 3, 3);

  // Dark pink shadow (bottom-right)
  ctx.fillStyle = '#AD1457';
  ctx.fillRect(30, 21, 6, 6);
  ctx.fillRect(24, 30, 6, 3);

  // Black outline
  ctx.fillStyle = '#000000';
  // Top lobes outline
  ctx.fillRect(15, 9, 6, 3);
  ctx.fillRect(12, 12, 3, 3);
  ctx.fillRect(9, 15, 3, 12);
  ctx.fillRect(27, 9, 6, 3);
  ctx.fillRect(33, 12, 3, 3);
  ctx.fillRect(36, 15, 3, 12);
  // Bottom point outline
  ctx.fillRect(18, 33, 3, 3);
  ctx.fillRect(21, 39, 3, 3);
  ctx.fillRect(27, 33, 3, 3);

  return canvas;
}

function generatePill() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Capsule pill shape (10x6 vertical capsule)
  // White bottom half
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(18, 30, 12, 12);
  ctx.fillRect(15, 33, 18, 6);

  // Red top half
  ctx.fillStyle = '#F44336';
  ctx.fillRect(18, 18, 12, 12);
  ctx.fillRect(15, 21, 18, 6);

  // Round ends for capsule shape
  ctx.fillStyle = '#F44336';
  ctx.fillRect(21, 15, 6, 3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(21, 42, 6, 3);

  // Pink highlight on red part
  ctx.fillStyle = '#FFCDD2';
  ctx.fillRect(21, 21, 6, 3);

  // Light gray highlight on white part
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(21, 33, 6, 3);

  // Black outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;

  // Outline the capsule shape
  ctx.beginPath();
  ctx.rect(15, 21, 18, 18);
  ctx.stroke();

  // Top and bottom caps
  ctx.fillStyle = '#000000';
  // Top outline pixels
  ctx.fillRect(21, 15, 6, 3);
  ctx.fillRect(18, 18, 3, 3);
  ctx.fillRect(27, 18, 3, 3);
  // Bottom outline pixels
  ctx.fillRect(21, 42, 6, 3);
  ctx.fillRect(18, 39, 3, 3);
  ctx.fillRect(27, 39, 3, 3);

  return canvas;
}

function generateParticle() {
  const canvas = createCanvas(8, 8);
  const ctx = canvas.getContext('2d');

  // Draw star
  ctx.fillStyle = COLORS.item.particle;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(5, 3);
  ctx.lineTo(8, 4);
  ctx.lineTo(5, 5);
  ctx.lineTo(4, 8);
  ctx.lineTo(3, 5);
  ctx.lineTo(0, 4);
  ctx.lineTo(3, 3);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = COLORS.item.particleHighlight;
  ctx.fillRect(3, 3, 2, 2);

  return canvas;
}

// ==================== JSON ATLAS GENERATION ====================

function generateAtlas(frameName, width, height, frames) {
  const atlas = {
    frames: {},
    meta: {
      image: `${frameName}.png`,
      format: 'RGBA8888',
      size: { w: width * frames.length, h: height },
      scale: 1
    }
  };

  frames.forEach((frame, index) => {
    atlas.frames[frame] = {
      frame: { x: index * width, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
      spriteSourceSize: { x: 0, y: 0, w: width, h: height }
    };
  });

  return atlas;
}

function generateSpriteSheet(canvases) {
  const width = 32;
  const height = 32;
  const cols = Math.ceil(Math.sqrt(canvases.length));
  const rows = Math.ceil(canvases.length / cols);

  const sheet = createCanvas(width * cols, height * rows);
  const ctx = sheet.getContext('2d');

  canvases.forEach((canvas, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    ctx.drawImage(canvas, col * width, row * height);
  });

  return sheet;
}

function generateDetailedAtlas(baseName, canvases, frameNames) {
  const width = 32;
  const height = 32;
  const cols = Math.ceil(Math.sqrt(canvases.length));

  const atlas = {
    frames: {},
    meta: {
      image: `${baseName}.png`,
      format: 'RGBA8888',
      size: { w: width * cols, h: height * Math.ceil(canvases.length / cols) },
      scale: 1
    }
  };

  frameNames.forEach((frame, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    atlas.frames[frame] = {
      frame: { x: col * width, y: row * height, w: width, h: height },
      sourceSize: { w: width, h: height },
      spriteSourceSize: { x: 0, y: 0, w: width, h: height }
    };
  });

  return atlas;
}

// ==================== MAIN GENERATION ====================

function main() {
  console.log('\n🎨 Tamagotchi Sprite Generator\n');

  // Create directories
  ensureDir(SPRITE_DIR);
  ensureDir(TAMA_DIR);
  ensureDir(ITEMS_DIR);
  ensureDir(EFFECTS_DIR);

  // Generate EGG
  console.log('Generating EGG...');
  ensureDir(path.join(TAMA_DIR, 'egg'));
  const egg = generateEgg();
  saveCanvas(egg, path.join(TAMA_DIR, 'egg', 'egg-idle.png'));

  const eggAtlas = {
    frames: {
      'egg-idle': {
        frame: { x: 0, y: 0, w: 32, h: 32 },
        sourceSize: { w: 32, h: 32 },
        spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
      }
    },
    meta: {
      image: 'egg-idle.png',
      format: 'RGBA8888',
      size: { w: 32, h: 32 },
      scale: 1
    }
  };
  fs.writeFileSync(
    path.join(TAMA_DIR, 'egg', 'egg.json'),
    JSON.stringify(eggAtlas, null, 2)
  );
  console.log('✓ Generated: egg/egg.json\n');

  // Generate BABY
  console.log('Generating BABY...');
  ensureDir(path.join(TAMA_DIR, 'baby'));

  const babyCanvases = [];
  const babyFrames = [];

  // Idle frames
  for (let i = 1; i <= 4; i++) {
    babyCanvases.push(generateBabyBase('neutral', i));
    babyFrames.push(`idle-${i}`);
  }

  // Blink frames
  for (let i = 1; i <= 3; i++) {
    babyCanvases.push(generateBabyBlink(i));
    babyFrames.push(`blink-${i}`);
  }

  // Eat frames
  for (let i = 1; i <= 4; i++) {
    babyCanvases.push(generateBabyEat(i));
    babyFrames.push(`eat-${i}`);
  }

  // Mood variants
  babyCanvases.push(generateBabyBase('happy', 1));
  babyFrames.push('happy');
  babyCanvases.push(generateBabyBase('neutral', 1));
  babyFrames.push('neutral');
  babyCanvases.push(generateBabyBase('sad', 1));
  babyFrames.push('sad');

  // Save each frame as individual PNG file
  babyCanvases.forEach((canvas, index) => {
    const frameName = babyFrames[index];
    saveCanvas(canvas, path.join(TAMA_DIR, 'baby', `${frameName}.png`));
  });
  console.log('✓ Generated: baby/* (individual frames)\n');

  // Generate CHILD
  console.log('Generating CHILD...');
  ensureDir(path.join(TAMA_DIR, 'child'));

  const childCanvases = [];
  const childFrames = [];

  // Idle frames
  for (let i = 1; i <= 4; i++) {
    childCanvases.push(generateChildBase('neutral', i));
    childFrames.push(`idle-${i}`);
  }

  // Blink frames
  for (let i = 1; i <= 3; i++) {
    childCanvases.push(generateChildBlink(i));
    childFrames.push(`blink-${i}`);
  }

  // Eat frames
  for (let i = 1; i <= 4; i++) {
    childCanvases.push(generateChildEat(i));
    childFrames.push(`eat-${i}`);
  }

  // Mood variants
  childCanvases.push(generateChildBase('happy', 1));
  childFrames.push('happy');
  childCanvases.push(generateChildBase('neutral', 1));
  childFrames.push('neutral');
  childCanvases.push(generateChildBase('sad', 1));
  childFrames.push('sad');

  // Save each frame as individual PNG file
  childCanvases.forEach((canvas, index) => {
    const frameName = childFrames[index];
    saveCanvas(canvas, path.join(TAMA_DIR, 'child', `${frameName}.png`));
  });
  console.log('✓ Generated: child/* (individual frames)\n');

  // Generate ADULT
  console.log('Generating ADULT...');
  ensureDir(path.join(TAMA_DIR, 'adult'));

  const adultCanvases = [];
  const adultFrames = [];

  // Idle frames
  for (let i = 1; i <= 4; i++) {
    adultCanvases.push(generateAdultBase('neutral', i));
    adultFrames.push(`idle-${i}`);
  }

  // Blink frames
  for (let i = 1; i <= 3; i++) {
    adultCanvases.push(generateAdultBlink(i));
    adultFrames.push(`blink-${i}`);
  }

  // Eat frames
  for (let i = 1; i <= 4; i++) {
    adultCanvases.push(generateAdultEat(i));
    adultFrames.push(`eat-${i}`);
  }

  // Mood variants
  adultCanvases.push(generateAdultBase('happy', 1));
  adultFrames.push('happy');
  adultCanvases.push(generateAdultBase('neutral', 1));
  adultFrames.push('neutral');
  adultCanvases.push(generateAdultBase('sad', 1));
  adultFrames.push('sad');

  // Save each frame as individual PNG file
  adultCanvases.forEach((canvas, index) => {
    const frameName = adultFrames[index];
    saveCanvas(canvas, path.join(TAMA_DIR, 'adult', `${frameName}.png`));
  });
  console.log('✓ Generated: adult/* (individual frames)\n');

  // Generate ITEMS
  console.log('Generating ITEMS...');
  saveCanvas(generateBurger(), path.join(ITEMS_DIR, 'burger.png'));
  saveCanvas(generateBall(), path.join(ITEMS_DIR, 'ball.png'));
  saveCanvas(generatePoop(), path.join(ITEMS_DIR, 'poop.png'));
  saveCanvas(generatePill(), path.join(ITEMS_DIR, 'pill.png'));
  saveCanvas(generateHeart(), path.join(ITEMS_DIR, 'heart.png'));
  console.log('');

  // Generate EFFECTS
  console.log('Generating EFFECTS...');
  saveCanvas(generateParticle(), path.join(EFFECTS_DIR, 'particle-star.png'));
  console.log('');

  console.log('✨ All sprites generated successfully!\n');
}

// Run the generator
main();
