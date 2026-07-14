(function(){
  var zone   = document.querySelector('.proj-scroll-zone');
  var sticky = document.querySelector('.proj-sticky');
  var grid   = document.querySelector('.proj-grid');
  var rows   = document.querySelectorAll('.proj-row');
  if(!zone || !sticky || !grid) return;

  /* Mobile: ביטול sticky + IntersectionObserver */
  if(window.matchMedia('(max-width:760px)').matches){
    grid.style.transform = 'none';
    rows.forEach(function(r){ r.style.opacity = '1'; });
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting) e.target.classList.add('proj-visible');
      });
    },{threshold:0.2});
    document.querySelectorAll('.proj-card').forEach(function(c){ obs.observe(c); });
    return;
  }

  var startY  = 0;    /* translateY התחלתי (px) */
  var finalY  = 0;    /* translateY סופי (px, שלילי) */
  var rawY    = 0;    /* מיקום יעד גולמי לפי גלילה */
  var smoothY = 0;    /* מיקום מוחלק לתצוגה */
  var isActive = false;
  var rafId    = null;
  var EASE     = 0.15; /* 15% לפריים — מגיב אך לא חד */

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function computeLayout(){
    var vh = window.innerHeight;
    startY = vh;

    grid.style.transform = 'none';
    var stickyTop  = sticky.getBoundingClientRect().top;
    var gridTop    = grid.getBoundingClientRect().top;
    var gridOffset = gridTop - stickyTop;
    var gridH      = grid.offsetHeight;
    grid.style.transform = 'translateY(' + startY + 'px)';

    finalY = vh - gridOffset - gridH;

    var travel = startY - finalY;
    zone.style.height = (vh + travel + Math.round(vh * 0.25)) + 'px';
  }

  function readRawY(){
    var rect  = zone.getBoundingClientRect();
    var track = zone.offsetHeight - window.innerHeight;
    if(track <= 0) return startY;
    var p = clamp(-rect.top / track, 0, 1);

    /* opacity stagger — ישיר, ללא easing */
    var n = rows.length;
    rows.forEach(function(row, i){
      row.style.opacity = clamp((p - i/n) / (1/n), 0, 1);
    });

    return startY + (finalY - startY) * p;
  }

  function loop(){
    rawY = readRawY();
    var diff = rawY - smoothY;
    if(Math.abs(diff) < 0.08){
      smoothY = rawY;
      grid.style.transform = 'translateY(' + smoothY + 'px)';
      rafId = null;
      return;
    }
    smoothY += diff * EASE;
    grid.style.transform = 'translateY(' + smoothY + 'px)';
    rafId = requestAnimationFrame(loop);
  }

  function scheduleLoop(){
    if(isActive && !rafId) rafId = requestAnimationFrame(loop);
  }

  computeLayout();
  rawY    = startY;
  smoothY = startY;
  grid.style.transform = 'translateY(' + smoothY + 'px)';

  window.addEventListener('resize', function(){
    computeLayout();
    rawY    = readRawY();
    smoothY = rawY;
    grid.style.transform = 'translateY(' + smoothY + 'px)';
  });

  new IntersectionObserver(function(entries){
    isActive = entries[0].isIntersecting;
    if(isActive) scheduleLoop();
  },{threshold:0}).observe(zone);

  window.addEventListener('scroll', scheduleLoop, {passive:true});
})();

/* ===== next script ===== */

/* ===== HERO — עיגול שמטייל ברשת ומחליף מקומות עם החצים (Swap) ===== */
(function(){
  var field = document.getElementById('heroField');
  var stage = document.getElementById('heroStage');
  if (!field || !stage) return;

  /* צפיפות הרשת לפי גודל מסך */
  var COLS = 11, ROWS = 7;
  if (window.matchMedia('(max-width:760px)').matches){ COLS = 6; ROWS = 6; }
  if (window.matchMedia('(max-width:460px)').matches){ COLS = 4; ROWS = 7; }
  var N = COLS * ROWS;

  /* אזור נקי במרכז-תחתון עבור הטקסט והכפתור (כמו ב-Desktop.png) — רק בדסקטופ */
  var HAS_HOLE = !window.matchMedia('(max-width:760px)').matches;
  var blocked = new Array(N);
  if (HAS_HOLE){
    /* שורות הטקסט (4-5) נקיות לרוחב מלא; בשורת הכפתור (6) חוסמים רק את המרכז,
       כך שנשארים ~2 חיצים מכל צד של הכפתור (כמו ב-Desktop.png) */
    for (var hc=2; hc<=8; hc++){ blocked[4*COLS+hc] = true; blocked[5*COLS+hc] = true; }
    for (var hc2=4; hc2<=6; hc2++){ blocked[6*COLS+hc2] = true; }
  }

  /* אך ורק Arrow.svg ו-Circle.svg — ללא איקונים חדשים */
  var ARROW  = '<svg class="arrow" viewBox="0 0 57 42" aria-hidden="true"><path d="M48.3889 22.4885L2.65762 22.4659C1.6642 22.4659 -0.412998 20.7387 0.0724243 20.2646C0.557846 19.7904 2.31902 18.5825 3.00764 18.5825L48.3889 18.4132L32.878 1.95401C32.2119 1.2541 35.6212 -0.540837 36.2986 0.159074L56.2009 20.75L36.1518 40.6636C35.6212 41.1829 34.052 41.6119 33.3859 41.3635C28.1931 39.4896 46.0182 27.9862 48.3889 22.4772V22.4885Z" fill="#FFF1F1"/></svg>';
  var CIRCLE = '<svg viewBox="0 0 68 68" aria-hidden="true"><path d="M33.95 67.9C52.7001 67.9 67.9 52.7001 67.9 33.95C67.9 15.1999 52.7001 0 33.95 0C15.1999 0 0 15.1999 0 33.95C0 52.7001 15.1999 67.9 33.95 67.9Z" fill="#E14E50"/></svg>';
  var DIRS = ['a-r','a-ur','a-u','a-ul','a-l','a-dl','a-d','a-dr'];

  var homeSlot = Math.floor(ROWS/2)*COLS + Math.floor(COLS/2);
  var slotOccupant = new Array(N);   /* איזה element יושב בכל משבצת */
  var circleEl, circleSlot = homeSlot;

  for (var i=0;i<N;i++){
    if (blocked[i]){ slotOccupant[i] = null; continue; }  /* אזור נקי — ללא חץ */
    var el = document.createElement('div');
    el.className = 'hero-item';
    if (i === homeSlot){
      el.className += ' hero-circle';
      el.innerHTML = CIRCLE;
      circleEl = el;
    } else {
      el.innerHTML = ARROW;
      el.firstChild.classList.add(DIRS[(i*3 + (i%5)) % 8]); /* כיוון קבוע ומגוון */
    }
    field.appendChild(el);
    slotOccupant[i] = el;
  }

  /* חישוב מרכזי המשבצות + מיקום ראשוני */
  var slots = [];
  function calc(){
    var w = field.clientWidth, h = field.clientHeight;
    var cw = w/COLS, ch = h/ROWS;
    slots = [];
    for (var i=0;i<N;i++){
      slots.push({ x:((i%COLS)+0.5)*cw, y:(Math.floor(i/COLS)+0.5)*ch, r:Math.floor(i/COLS), c:i%COLS });
    }
    for (var j=0;j<N;j++){ if (slotOccupant[j]) place(slotOccupant[j], j); }
  }
  function place(el, slot){
    var s = slots[slot];
    el.style.transform = 'translate('+s.x+'px,'+s.y+'px) translate(-50%,-50%)';
  }
  calc();

  var reTimer;
  window.addEventListener('resize', function(){ clearTimeout(reTimer); reTimer = setTimeout(calc, 150); });

  /* מובייל / ללא עכבר — העיגול נשאר במרכז, ללא אינטראקציה */
  if (!window.matchMedia('(hover:hover)').matches) return;

  var pointerSlot = homeSlot;
  stage.addEventListener('mousemove', function(e){
    var fr = field.getBoundingClientRect();
    var c = Math.max(0, Math.min(COLS-1, Math.floor((e.clientX - fr.left) / (fr.width/COLS))));
    var r = Math.max(0, Math.min(ROWS-1, Math.floor((e.clientY - fr.top)  / (fr.height/ROWS))));
    pointerSlot = r*COLS + c;
  });
  stage.addEventListener('mouseleave', function(){ pointerSlot = homeSlot; });

  /* צעד יחיד לכיוון הסמן — העיגול נכנס למשבצת הבאה, והחץ שם עובר למשבצת שהתפנתה */
  function step(){
    var cs = slots[circleSlot], ts = slots[pointerSlot];
    var dr = Math.sign(ts.r - cs.r), dc = Math.sign(ts.c - cs.c);
    /* מועמדים לצעד — ציר דומיננטי קודם, ואז הציר השני (לניתוב סביב האזור הנקי) */
    var cands = [];
    if (Math.abs(ts.c - cs.c) >= Math.abs(ts.r - cs.r)){
      if (dc !== 0) cands.push([cs.r, cs.c + dc]);
      if (dr !== 0) cands.push([cs.r + dr, cs.c]);
    } else {
      if (dr !== 0) cands.push([cs.r + dr, cs.c]);
      if (dc !== 0) cands.push([cs.r, cs.c + dc]);
    }
    for (var k=0;k<cands.length;k++){
      var nr = cands[k][0], nc = cands[k][1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      var next = nr*COLS + nc;
      if (blocked[next] || next === circleSlot) continue;  /* לא נכנסים לאזור הנקי */
      var arrowEl = slotOccupant[next];
      slotOccupant[circleSlot] = arrowEl;  if (arrowEl) place(arrowEl, circleSlot);  /* החץ ממלא את מקום העיגול */
      slotOccupant[next] = circleEl;        place(circleEl, next);                     /* העיגול נכנס למשבצת החדשה */
      circleSlot = next;
      return;
    }
  }

  var STEP_MS = 70, last = 0;
  function loop(t){
    if (circleSlot !== pointerSlot && (t - last) > STEP_MS){ last = t; step(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ===== mobile menu wiring (was inline onclick in the original) ===== */
(function(){
  var mm = document.querySelector('.mobile-menu');
  var burger = document.querySelector('.hamburger');
  if (burger && mm) burger.addEventListener('click', function(){ mm.classList.toggle('open'); });
  if (mm) mm.querySelectorAll('.mobile-close, a').forEach(function(el){
    el.addEventListener('click', function(){ mm.classList.remove('open'); });
  });
})();

/* ===== Reveal on scroll — entrance animations for the pills-block, "הגעת", and the CTA buttons =====
   Adds/removes .in-view via a single IntersectionObserver so entrance animations replay every
   time the element re-enters the viewport. The animation styles live in turningpoint.css under .anim-ready. */
(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.pills-block, .hero2-pill-solid, .anim-cta');

  if(reduceMotion || !('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('in-view'); });
    return;
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.intersectionRatio >= 0.25){
        entry.target.classList.add('in-view');
      } else if(!entry.isIntersecting){
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold:[0, 0.25] });

  targets.forEach(function(el){ io.observe(el); });
})();
