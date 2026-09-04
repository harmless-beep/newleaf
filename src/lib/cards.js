// Quiet celebration cards, drawn straight to a <canvas> so the image is made
// entirely on this device. Emoji render through the system color fonts.

const W = 1080
const H = 1080
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif'
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function paintBackground(ctx) {
  ctx.fillStyle = '#fbf3e7'
  ctx.fillRect(0, 0, W, H)

  const honey = ctx.createRadialGradient(W * 0.92, -60, 40, W * 0.92, -60, 620)
  honey.addColorStop(0, 'rgba(224, 166, 62, 0.30)')
  honey.addColorStop(1, 'rgba(224, 166, 62, 0)')
  ctx.fillStyle = honey
  ctx.fillRect(0, 0, W, H)

  const clay = ctx.createRadialGradient(-40, H * 0.3, 20, -40, H * 0.3, 560)
  clay.addColorStop(0, 'rgba(201, 111, 74, 0.18)')
  clay.addColorStop(1, 'rgba(201, 111, 74, 0)')
  ctx.fillStyle = clay
  ctx.fillRect(0, 0, W, H)

  const sage = ctx.createRadialGradient(W * 0.5, H + 40, 30, W * 0.5, H + 40, 620)
  sage.addColorStop(0, 'rgba(125, 156, 99, 0.20)')
  sage.addColorStop(1, 'rgba(125, 156, 99, 0)')
  ctx.fillStyle = sage
  ctx.fillRect(0, 0, W, H)
}

function openFrame(ctx) {
  roundRect(ctx, 34, 34, W - 68, H - 68, 56)
  ctx.fillStyle = 'rgba(255, 252, 245, 0.62)'
  ctx.fill()
  roundRect(ctx, 50, 50, W - 100, H - 100, 46)
  ctx.strokeStyle = 'rgba(238, 220, 194, 0.95)'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawText(ctx, text, x, y, font, color, align = 'center') {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/)
  const lines = []
  let cur = ''
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word
    if (cur && ctx.measureText(t).width > maxWidth) {
      lines.push(cur)
      cur = word
    } else {
      cur = t
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// Draws a possibly multi-line paragraph, centered on x, starting at y.
function drawWrapped(ctx, text, x, y, font, color, maxWidth, gap = 58) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = wrap(ctx, text, maxWidth).slice(0, 3)
  let cy = y - ((lines.length - 1) * gap) / 2
  for (const line of lines) {
    ctx.fillText(line, x, cy)
    cy += gap
  }
}

function footer(ctx) {
  drawText(ctx, 'made with New Leaf · private, ad-free, on your device', W / 2, 998, `500 30px ${SANS}`, '#9a8471')
}

export function makeCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width = W
  canvas.height = H
  paintBackground(ctx)
  openFrame(ctx)
  drawText(ctx, '🌱 New Leaf', W / 2, 138, `600 36px ${SERIF}`, '#b05c39')
  return ctx
}

export function drawStreakCard(canvas, { name, emoji, tint, days, best, message, filename }) {
  const ctx = makeCanvas(canvas)

  // The goal icon inside a softly tinted tile.
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = tint
  roundRect(ctx, W / 2 - 108, 206, 216, 216, 60)
  ctx.fill()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = tint
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
  ctx.font = `92px ${EMOJI}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, W / 2, 318)

  drawText(ctx, name, W / 2, 500, `700 74px ${SERIF}`, '#46352a')

  if (days > 0) {
    drawText(ctx, String(days), W / 2, 676, `700 230px ${SERIF}`, '#a85533')
    drawText(ctx, days === 1 ? 'day going strong' : 'days going strong', W / 2, 818, `600 46px ${SANS}`, '#6f5a48')
  } else if (best > 0) {
    drawText(ctx, `best ${best}`, W / 2, 676, `700 118px ${SERIF}`, '#a85533')
    drawText(ctx, 'days — your best run', W / 2, 800, `600 44px ${SANS}`, '#6f5a48')
  } else {
    drawText(ctx, 'day one', W / 2, 676, `700 128px ${SERIF}`, '#a85533')
    drawText(ctx, 'begins the moment you choose it', W / 2, 806, `600 40px ${SANS}`, '#6f5a48')
  }

  if (message) drawWrapped(ctx, message, W / 2, 900, `italic 42px ${SERIF}`, '#b05c39', 800, 56)

  footer(ctx)
  return { filename: filename || 'new-leaf-streak.png', kind: 'streak' }
}

export function drawMonthCard(canvas, { monthName, rows, closing, filename }) {
  const ctx = makeCanvas(canvas)

  drawText(ctx, 'your month, in a quiet card', W / 2, 250, `600 40px ${SANS}`, '#b05c39')
  drawText(ctx, monthName, W / 2, 380, `700 112px ${SERIF}`, '#46352a')

  let y = 552
  for (const row of rows) {
    ctx.font = `56px ${EMOJI}`
    ctx.textAlign = 'center'
    ctx.fillText(row.emoji, W / 2 - 296, y)
    ctx.font = `600 43px ${SANS}`
    ctx.fillStyle = '#6f5a48'
    ctx.textAlign = 'left'
    ctx.fillText(row.label, W / 2 - 212, y)
    y += 112
  }

  if (closing) drawWrapped(ctx, closing, W / 2, Math.min(y + 120, 900), `italic 40px ${SERIF}`, '#b05c39', 800, 54)

  footer(ctx)
  return { filename: filename || 'new-leaf-month.png', kind: 'month' }
}
