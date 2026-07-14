/* ===== mobile menu wiring (was inline onclick in the original) ===== */
(function(){
  var mm = document.querySelector('.mobile-menu');
  var burger = document.querySelector('.hamburger');
  if (burger && mm) burger.addEventListener('click', function(){ mm.classList.toggle('open'); });
  if (mm) mm.querySelectorAll('.mobile-close, a').forEach(function(el){
    el.addEventListener('click', function(){ mm.classList.remove('open'); });
  });
})();

/* ===== About Services Sticky — self-contained, scoped to the about-services-sticky-section only =====
   Ported verbatim from prototype/about.html's inline <script>. */
(function(){
  var section = document.querySelector('[data-about-services]');
  if(!section) return;

  var track    = section.querySelector('[data-services-track]');
  var viewport = section.querySelector('.about-services-sticky-viewport');
  var cards    = Array.prototype.slice.call(section.querySelectorAll('.about-services-card'));
  var dots     = Array.prototype.slice.call(section.querySelectorAll('.about-services-dot'));
  if(!track || !viewport || !cards.length) return;

  var COUNT = cards.length;
  var activeIndex = 0;

  function isMobile(){ return window.matchMedia('(max-width:760px)').matches; }

  function setActive(index){
    if(index === activeIndex && cards[index].classList.contains('is-active')) return;
    activeIndex = index;
    cards.forEach(function(card, i){ card.classList.toggle('is-active', i === index); });
    dots.forEach(function(dot, i){
      var on = i === index;
      dot.classList.toggle('is-active', on);
      dot.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  function computeTrackHeight(){
    return Math.round(window.innerHeight * (COUNT + 1));
  }

  function layout(){
    track.style.height = computeTrackHeight() + 'px';
    update();
  }

  function update(){
    var vh = window.innerHeight;
    var rect = track.getBoundingClientRect();
    var scrollable = track.offsetHeight - vh;
    var p = scrollable > 0 ? (-rect.top) / scrollable : 0;
    p = Math.max(0, Math.min(1, p));
    var index = Math.min(COUNT - 1, Math.floor(p * COUNT));
    setActive(index);
  }

  function scrollToIndex(index){
    var vh = window.innerHeight;
    var scrollable = track.offsetHeight - vh;
    var targetP = (index + 0.5) / COUNT;
    var trackTop = window.pageYOffset + track.getBoundingClientRect().top;
    window.scrollTo({top: trackTop + targetP * scrollable, behavior:'smooth'});
  }

  dots.forEach(function(dot, i){
    dot.addEventListener('click', function(){ scrollToIndex(i); });
  });

  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', layout);

  layout();
})();
