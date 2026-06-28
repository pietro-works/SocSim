/* ============================================================================
   SOCSIM v0.4 — SPLASH OVERLAY FX  (drives animated FX over the key-art)
   ----------------------------------------------------------------------------
   Two layouts: landscape (desktop) + portrait (mobile/vertical). Each has its
   own FX anchors (fractions of its art image) and a MASK_KEY into the sheen
   luminance sources, which live in mask-data.js (loaded first) so this file
   stays lean. Those data URIs are same-origin, so the chrome-logo sheen works
   even on file://. Call SOCSIM_SPLASH.setLayout('portrait'|'landscape').
   FX: floating hearts, electric zap, logo + subtitle sheen sweep, sparkly gold
   glints, weld sparks, CRT refresh bar.  Breathing zoom is pure CSS.
   ============================================================================ */
(function (root) {
  'use strict';

  var LAYOUTS = {
    landscape: {
      MASK_KEY: 'landscape',
      HEART_SRC: [[0.166,0.357],[0.077,0.598],[0.349,0.620]],
      ZAP:  { x0:0.561, y0:0.552, x1:0.640, y1:0.507 },
      LOGO: { x:0.150, y:0.030, w:0.710, h:0.220 },
      SUBTITLE: { x:0.280, y:0.272, w:0.439, h:0.070 },
      GOLD: { x0:0.828, y0:0.860, x1:0.992, y1:0.992 },
      SPARK: { x:0.374, y:0.822 }
    },
    portrait: {
      MASK_KEY: 'portrait',
      HEART_SRC: [[0.139,0.652],[0.208,0.278],[0.514,0.401],[0.088,0.486]],
      ZAP:  { x0:0.598, y0:0.535, x1:0.704, y1:0.515 },   /* purple marks: cop hand -> predator */
      LOGO: { x:0.049, y:0.037, w:0.909, h:0.092 },
      SUBTITLE: { x:0.173, y:0.140, w:0.653, h:0.024 },
      GOLD: { x0:0.658, y0:0.837, x1:0.993, y1:0.992 },
      SPARK: { x:0.290, y:0.642 }   /* purple mark — dropped hammer spark */
    }
  };
  var A = LAYOUTS.landscape;

  var HEART_GRID = ["0110110","1111111","1111111","1111111","0111110","0011100"];
  function rng(n){ var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }

  function sparkle(c, x, y, s, a, col){
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
    c.fillStyle = col || '#ffffff';
    c.beginPath();
    c.moveTo(x, y - 6*s); c.lineTo(x + 1.4*s, y - 1.4*s);
    c.lineTo(x + 6*s, y); c.lineTo(x + 1.4*s, y + 1.4*s);
    c.lineTo(x, y + 6*s); c.lineTo(x - 1.4*s, y + 1.4*s);
    c.lineTo(x - 6*s, y); c.lineTo(x - 1.4*s, y - 1.4*s);
    c.closePath(); c.fill(); c.restore();
  }
  function pixelHeart(c, cx, cy, cell, a){
    c.save(); c.globalAlpha = a;
    var cols = HEART_GRID[0].length, rows = HEART_GRID.length;
    var ox = cx - (cols*cell)/2, oy = cy - (rows*cell)/2;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++){
      if (HEART_GRID[r][q] !== '1') continue;
      c.fillStyle = (r < 2) ? '#ff6f93' : '#ef2f5e';
      c.fillRect(Math.round(ox + q*cell), Math.round(oy + r*cell), Math.ceil(cell), Math.ceil(cell));
    }
    c.fillStyle = 'rgba(255,220,232,0.95)';
    c.fillRect(Math.round(ox + cell), Math.round(oy + cell), Math.ceil(cell), Math.ceil(cell));
    c.restore();
  }
  function bolt(c, x0, y0, x1, y1, jitter, seed){
    var segs = 8, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    var px = -dy/len, py = dx/len;
    c.beginPath(); c.moveTo(x0, y0);
    for (var s = 1; s < segs; s++){
      var f = s/segs, mx = x0 + dx*f, my = y0 + dy*f;
      var off = (rng(s*7.7 + seed) - 0.5) * 2 * jitter * Math.sin(f*Math.PI);
      c.lineTo(mx + px*off, my + py*off);
    }
    c.lineTo(x1, y1); c.stroke();
  }
  // stable seeded scatter of small twinkling stars within the GOLD box (per layout)
  function goldStars(){
    if (A._stars) return A._stars;
    var b = A.GOLD, N = 26, st = [];
    for (var i = 0; i < N; i++){
      st.push({ x: b.x0 + rng(i*3.1 + 11)*(b.x1-b.x0),
                y: b.y0 + rng(i*7.7 + 3)*(b.y1-b.y0),
                ph: rng(i*5.3 + 1)*6.283,
                sp: 0.10 + rng(i*2.2 + 9)*0.13,
                sz: 0.12 + rng(i*4.4 + 5)*0.15 });
    }
    A._stars = st; return st;
  }

  /* ---- logo luminance mask (built from the displayed splash <img>) ---- */
  var artImg = null, artReady = false;
  function ensureArt(){
    if (artReady) return;
    if (!artImg){
      var src = (root.SOCSIM_SPLASH_MASKS || {})[A.MASK_KEY];   // data URIs live in mask-data.js
      if (src){ artImg = new Image(); artImg.onload = function(){ artReady = true; }; artImg.src = src; }
    }
    if (artImg && artImg.complete && (artImg.naturalWidth || artImg.width)) artReady = true;
  }
  var _cw = 0, _ch = 0, _layers = {};
  function buildLayer(R, W, H){
    var lx = Math.round(R.x*W), ly = Math.round(R.y*H),
        lw = Math.max(1, Math.round(R.w*W)), lh = Math.max(1, Math.round(R.h*H));
    var nw = artImg.naturalWidth || artImg.width || 1, nh = artImg.naturalHeight || artImg.height || 1;
    var mk = document.createElement('canvas'); mk.width = lw; mk.height = lh;
    var mc = mk.getContext('2d');
    mc.drawImage(artImg, R.x*nw, R.y*nh, R.w*nw, R.h*nh, 0, 0, lw, lh);
    var img;
    try { img = mc.getImageData(0, 0, lw, lh); } catch(e){ return null; }
    var d = img.data;
    for (var i = 0; i < d.length; i += 4){
      var lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      var av = (lum - 115) / 80; av = av < 0 ? 0 : (av > 1 ? 1 : av);
      d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = Math.round(av * 255);
    }
    mc.putImageData(img, 0, 0);
    var sh = document.createElement('canvas'); sh.width = lw; sh.height = lh;
    return { mask: mk, sheen: sh, lx: lx, ly: ly, lw: lw, lh: lh };
  }
  function layer(id, R, W, H){
    if (_cw !== W || _ch !== H){ _layers = {}; _cw = W; _ch = H; }
    if (_layers[id] === undefined) _layers[id] = buildLayer(R, W, H);
    return _layers[id];
  }
  function sweep(c, L, p, dir, boost){
    if (!L) return;
    var lw = L.lw, lh = L.lh, s = L.sheen.getContext('2d');
    var prog = dir < 0 ? (1 - p) : p;
    s.clearRect(0, 0, lw, lh);
    s.save();
    s.translate(-lw*0.3 + prog*(lw*1.6), lh/2);
    s.rotate(-0.30);
    var bw = lw * (boost ? 0.09 : 0.07);
    var grad = s.createLinearGradient(-bw, 0, bw, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = grad; s.fillRect(-bw, -lh, bw*2, lh*2);
    s.restore();
    s.globalCompositeOperation = 'destination-in';
    s.drawImage(L.mask, 0, 0);
    s.globalCompositeOperation = 'source-over';
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.filter = 'blur(' + (boost ? 8 : 5) + 'px)';
    c.globalAlpha = boost ? 1.0 : 0.8;
    c.drawImage(L.sheen, L.lx, L.ly);
    c.drawImage(L.sheen, L.lx, L.ly);
    if (boost) c.drawImage(L.sheen, L.lx, L.ly);
    c.filter = 'none';
    c.globalAlpha = 1.0;
    c.drawImage(L.sheen, L.lx, L.ly);
    c.drawImage(L.sheen, L.lx, L.ly);
    if (boost){ c.drawImage(L.sheen, L.lx, L.ly); c.drawImage(L.sheen, L.lx, L.ly); c.drawImage(L.sheen, L.lx, L.ly); }
    c.restore();
  }
  function drawSheen(c, t){
    ensureArt(); if (!artReady) return;
    var W = c.canvas.width, H = c.canvas.height;
    var period = 320, ph = (t % period) / period;
    if (ph < 0.30) sweep(c, layer('logo', A.LOGO, W, H), ph / 0.30, 1, false);
    else if (ph >= 0.36 && ph < 0.52) sweep(c, layer('sub', A.SUBTITLE, W, H), (ph - 0.36) / 0.16, -1, true);
  }

  function drawOverlay(c, t){
    ensureArt();
    var W = c.canvas.width, H = c.canvas.height;
    var u = Math.min(W, H) / 100;
    c.clearRect(0, 0, W, H);

    /* ELECTRIC ZAP */
    (function(){
      var Z = A.ZAP, x0 = Z.x0*W, y0 = Z.y0*H, x1 = Z.x1*W, y1 = Z.y1*H;
      var flick = (t % 8 < 4), seed = Math.floor(t / 3);
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
      var gr = c.createRadialGradient(x0, y0, 0, x0, y0, u * (flick ? 7 : 5));
      gr.addColorStop(0, 'rgba(190,255,255,0.55)');
      gr.addColorStop(0.5, 'rgba(80,200,255,0.22)');
      gr.addColorStop(1, 'rgba(80,200,255,0)');
      c.fillStyle = gr; c.fillRect(x0 - u*9, y0 - u*9, u*18, u*18);
      c.strokeStyle = 'rgba(120,235,255,0.9)'; c.lineWidth = u * 1.4; bolt(c, x0, y0, x1, y1, u*5.2, seed);
      c.strokeStyle = flick ? '#ffffff' : '#dffcff'; c.lineWidth = u * 0.55; bolt(c, x0, y0, x1, y1, u*5.2, seed);
      if (flick){
        c.strokeStyle = 'rgba(160,240,255,0.8)'; c.lineWidth = u * 0.45;
        var bxm = x0 + (x1-x0)*0.55, bym = y0 + (y1-y0)*0.55;
        bolt(c, bxm, bym, bxm + u*5, bym - u*7, u*2.4, seed + 5);
        bolt(c, bxm, bym, bxm - u*4, bym + u*6, u*2.0, seed + 9);
      }
      c.restore();
    })();

    /* HEARTS from the heart-bubbles */
    var period = 170, perSrc = 3;
    for (var hi = 0; hi < A.HEART_SRC.length; hi++){
      var ax = A.HEART_SRC[hi][0]*W, ay = A.HEART_SRC[hi][1]*H;
      for (var j = 0; j < perSrc; j++){
        var pr = (((t + hi*47 + j*(period/perSrc)) % period)) / period;
        var rise = H * 0.16 * pr;
        var sway = Math.sin(pr*6.28 + j + hi) * (u*1.1);
        var aH = pr < 0.16 ? pr/0.16 : (pr > 0.72 ? (1 - pr)/0.28 : 1);
        var cell = u * (0.34 + pr*0.10);
        pixelHeart(c, ax + sway, ay - rise, cell, Math.max(0, aH) * 0.95);
      }
    }

    /* GOLD — many small twinkling stars within the marked coin region */
    var stars = goldStars();
    for (var k = 0; k < stars.length; k++){
      var st = stars[k], tw = Math.sin(t*st.sp + st.ph);
      if (tw <= 0.45) continue;
      sparkle(c, st.x*W, st.y*H, u*st.sz, (tw-0.45)/0.55 * 0.95, (k % 3 ? '#ffe27a' : '#fff6c8'));
    }

    /* WELD SPARKS at the dropped hammer */
    (function(){
      var sx = A.SPARK.x*W, sy = A.SPARK.y*H;
      var period = 108, sd = Math.floor(t / period), f = t % period;
      c.save(); c.globalCompositeOperation = 'lighter';
      if (f < 5){
        var fa = (1 - f/5) * 0.55;
        var fg = c.createRadialGradient(sx, sy, 0, sx, sy, u*5);
        fg.addColorStop(0, 'rgba(255,240,180,' + fa.toFixed(3) + ')');
        fg.addColorStop(1, 'rgba(255,200,80,0)');
        c.fillStyle = fg; c.fillRect(sx - u*6, sy - u*6, u*12, u*12);
      }
      var N = 11, g = u * 0.013;
      for (var w = 0; w < N; w++){
        var a  = -Math.PI/2 + (rng(w + sd*3.1) - 0.5) * 1.1;
        var sp = u * (0.30 + rng(w*2 + sd) * 0.50);
        var life = 38 + rng(w*3 + sd) * 16;
        if (f > life) continue;
        var px = sx + Math.cos(a)*sp*f;
        var py = sy + Math.sin(a)*sp*f + 0.5*g*f*f;
        var al = 1 - f/life;
        var sz = u * (0.5 + 0.4*al);
        c.fillStyle = 'rgba(255,170,55,' + (0.32*al).toFixed(3) + ')';
        c.beginPath(); c.arc(px, py, sz*2.1, 0, 6.283); c.fill();
        c.fillStyle = (w % 2) ? 'rgba(255,246,205,' + al.toFixed(3) + ')' : 'rgba(255,214,90,' + al.toFixed(3) + ')';
        c.beginPath(); c.arc(px, py, sz, 0, 6.283); c.fill();
      }
      c.restore();
    })();

    /* CRT refresh-bar sweep */
    var sw = (t*1.5) % (H+60) - 30, bh = u*1.2 + 8;
    var bar = c.createLinearGradient(0, sw - bh, 0, sw + bh);
    bar.addColorStop(0, 'rgba(180,255,220,0)');
    bar.addColorStop(0.5, 'rgba(180,255,220,0.05)');
    bar.addColorStop(1, 'rgba(180,255,220,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = bar; c.fillRect(0, sw - bh, W, bh*2); c.restore();

    /* SHEEN — drawn last + isolated so a sheen error can't blank the FX */
    try { drawSheen(c, t); }
    catch(e){ if (!drawOverlay._warned){ drawOverlay._warned = true; try{ console.warn('SOCSIM sheen skipped:', e && e.message); }catch(_){} } }
  }

  function kenBurns(t){
    var s = 1.035 + 0.025 * (0.5 - 0.5 * Math.cos(t * 0.0075));
    return 'scale(' + s.toFixed(4) + ')';
  }

  root.SOCSIM_SPLASH = {
    drawOverlay: drawOverlay,
    kenBurns: kenBurns,
    setLayout: function(name){
      if (LAYOUTS[name] && A !== LAYOUTS[name]){
        A = LAYOUTS[name];
        artImg = null; artReady = false; _layers = {}; _cw = 0; _ch = 0;
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SOCSIM_SPLASH;

})(typeof window !== 'undefined' ? window : this);
