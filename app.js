/* ===== Rotating Headline Words (two words, jitter-free width) ===== */
(function(){
  const rotate = document.querySelector('.rotate');
  if(!rotate) return;
  const words = rotate.querySelectorAll('.word');
  let i = 0;

  const start = ()=>{
    let max = 0;
    words.forEach(w=>{
      const prev = w.getAttribute('style') || '';
      w.style.position = 'static';
      w.style.opacity = 0;
      const wWidth = w.getBoundingClientRect().width;
      if(wWidth>max) max = wWidth;
      w.setAttribute('style', prev);
    });
    rotate.style.width = Math.ceil(max) + 'px';

    words.forEach(w=> w.classList.remove('active'));
    words[0]?.classList.add('active');

    setInterval(()=>{
      words[i].classList.remove('active');
      i = (i + 1) % words.length;
      words[i].classList.add('active');
    }, 2000);
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener('load', start);
})();

/* ===== Reveal on Scroll (sections + directional children) ===== */
(function(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        e.target.querySelectorAll('.feature-card, .testi, .fade-pop').forEach((el, index)=>{
          setTimeout(()=> el.classList.add('visible'), index * 120);
        });
        obs.unobserve(e.target);
      }
    });
  }, {threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
})();

/* ===== Testimonials Carousel (for small screens) ===== */
(function(){
  const car = document.getElementById('carousel');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  if(!car) return;
  const cardWidth = ()=> car.querySelector('.testi')?.getBoundingClientRect().width || 320;
  next?.addEventListener('click', ()=> car.scrollBy({left: cardWidth()+18, behavior:'smooth'}));
  prev?.addEventListener('click', ()=> car.scrollBy({left: -(cardWidth()+18), behavior:'smooth'}));
})();

/* ===== FAQ Accordion ===== */
(function(){
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', ()=>{
      const open = a.style.maxHeight && a.style.maxHeight !== '0px';
      document.querySelectorAll('.faq-a').forEach(x=>{x.style.maxHeight = '0px'; x.classList.remove('open');});
      if(!open){ a.style.maxHeight = a.scrollHeight + 'px'; a.classList.add('open'); }
    });
  });
})();


/* ===== Inactivity Popup (10s of no interaction) ===== */
(function(){
  const MODAL_ID = 'inactModal';
  const DISMISSED_KEY = 'ck_inact_popup_dismissed';
  const SUBSCRIBED_KEY = 'ck_inact_popup_subscribed';
  const INACT_MS = 10000; // 10 seconds

  const modal = document.getElementById(MODAL_ID);
  if(!modal) return;

  const dlg   = modal.querySelector('.modal-dialog');
  const back  = document.getElementById('inactBackdrop');
  const close = document.getElementById('inactClose');
  const form  = document.getElementById('inactForm');
  const email = document.getElementById('inactEmail');
  const msg   = document.getElementById('inactMsg');

  let timer = null;
  let shown = false;
  let lastActive = Date.now();

const setBodyLock = (on)=> document.body.classList.toggle('modal-open', !!on);

const show = ()=>{
  modal.classList.add('show');
  setBodyLock(true);
  document.body.classList.add('quiz-open');  // <— add this line
  step=0; mode='questions';
  form.setAttribute('data-mode', mode);
  render();
  focusFirstOption();
};

const hide = ()=>{
  modal.classList.remove('show');
  setBodyLock(false);
  document.body.classList.remove('quiz-open'); // <— add this line
};

  const resetTimer = ()=>{
    lastActive = Date.now();
    if(timer) clearTimeout(timer);
    timer = setTimeout(()=>{
      const idle = Date.now() - lastActive;
      if(idle >= INACT_MS) show();
    }, INACT_MS + 50);
  };

  // User activity that resets inactivity
  ['mousemove','mousedown','keydown','touchstart','scroll'].forEach(ev=>{
    window.addEventListener(ev, resetTimer, {passive:true});
  });
  // Start
  resetTimer();

  // Close handlers
  close?.addEventListener('click', hide);
  back?.addEventListener('click', hide);
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') hide(); });

  // Basic submit handler (replace with your API later)
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = (email?.value || '').trim();
    if(!val || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)){
      msg.textContent = 'Please enter a valid email.';
      return;
    }
    // Simulate success
    localStorage.setItem(SUBSCRIBED_KEY, '1');
    msg.textContent = 'Thanks! You’re on the list.';
    setTimeout(hide, 700);
  });

  // Focus trap (basic)
  modal.addEventListener('keydown', (e)=>{
    if(!shown || e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusables).filter(el=> !el.hasAttribute('disabled') && el.offsetParent !== null);
    if(list.length === 0) return;
    const first = list[0], last = list[list.length-1];
    if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  });
})();




/* ===== Sticky CTA (scroll-trigger only) ===== */
(function(){
  const el = document.getElementById('stickyCta');
  const closeBtn = document.getElementById('closeSticky');
  if(!el) return;
  if(localStorage.getItem('ck_sticky_dismissed')) return;

  let shown = false;
  const show = ()=>{ if(!shown){ el.style.display = 'block'; shown = true; } };

  window.addEventListener('scroll', ()=>{
    const sc = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if(h>0 && sc/h > .5) show();
  }, {passive:true});

  closeBtn?.addEventListener('click', ()=>{
    el.remove();
    localStorage.setItem('ck_sticky_dismissed','1');
  });
})();

/* ===== Floating CTA (FAB): show after 25% scroll; hide if sticky CTA is visible ===== */
(function(){
  const fab = document.getElementById('fabCta');
  const sticky = document.getElementById('stickyCta');
  if(!fab) return;

  const update = ()=>{
    const sc = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const stickyVisible = sticky && window.getComputedStyle(sticky).display !== 'none';
    if(h>0 && sc/h > .25 && !stickyVisible){
      fab.classList.add('show');
    }else{
      fab.classList.remove('show');
    }
  };

  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  setTimeout(update, 300);

  fab.addEventListener('click', ()=>{
    document.querySelector('#download')?.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();


/* ===== 7-Question Quiz (progress + email gate + phased screens) ===== */
(function(){
  const modal  = document.getElementById('quizModal');
  const open   = document.getElementById('openQuiz');
  const close  = document.getElementById('quizClose');
  const back   = document.getElementById('quizBackdrop');
  const form   = document.getElementById('quizForm');
  const stage  = document.getElementById('quizStage');
  const prevB  = document.getElementById('quizPrev');
  const nextB  = document.getElementById('quizNext');
  const bar    = document.getElementById('quizBar');
  const gate   = document.getElementById('quizGate');
  const result = document.getElementById('quizResult');
  const email  = document.getElementById('quizEmail');
  const msg    = document.getElementById('quizMsg');
  const qrSum  = document.getElementById('qrSummary');
  const qrPills= document.getElementById('qrPills');

  if(!modal || !open) return;

  // Quiz model: Control (C), Power (P), Stamina (S)
  const Q = [
    { q:"What’s your primary goal right now?", a:[
      {t:"More control", d:"Dial back reactivity & build command.", v:{C:2}},
      {t:"More stamina", d:"Last longer & regulate arousal.", v:{S:2}},
      {t:"More power",   d:"Stronger base & consistency.",     v:{P:2}}
    ]},
    { q:"Typical session length you can commit to?", a:[
      {t:"5–7 min",  v:{C:1,S:1}},
      {t:"8–12 min", v:{P:1,S:1}},
      {t:"15+ min",  v:{P:2}}
    ]},
    { q:"Breathwork experience?", a:[
      {t:"New to it",        v:{C:1}},
      {t:"Some practice",    v:{S:1}},
      {t:"Very comfortable", v:{S:2}}
    ]},
    { q:"Body training preference?", a:[
      {t:"Minimal effort / discreet", v:{C:1}},
      {t:"Short functional work",     v:{P:1}},
      {t:"I enjoy training",          v:{P:2}}
    ]},
    { q:"Main challenge you feel during intimacy?", a:[
      {t:"Hard to slow down",     v:{S:2}},
      {t:"Hard to ‘hold’ tension",v:{C:2}},
      {t:"Low overall energy",    v:{P:2}}
    ]},
    { q:"How do you track progress best?", a:[
      {t:"Timers / levels",        v:{C:1}},
      {t:"Streaks & minutes",      v:{P:1}},
      {t:"Breath pace & RPE",      v:{S:1}}
    ]},
    { q:"Pick your training style", a:[
      {t:"Guided intervals", v:{C:1,S:1}},
      {t:"Routines + checklists", v:{P:1}},
      {t:"Breath-led sessions", v:{S:2}}
    ]}
  ];

  let step = 0;                 // 0..Q.length-1
  let mode = 'questions';       // 'questions' -> 'gate' -> 'result'
  const answers = new Array(Q.length).fill(null);
  const score = {C:0,P:0,S:0};

  const setBodyLock = (on)=> document.body.classList.toggle('modal-open', !!on);
  const show = ()=>{ modal.classList.add('show'); setBodyLock(true); step=0; mode='questions'; form.setAttribute('data-mode', mode); render(); focusFirstOption(); };
  const hide = ()=>{ modal.classList.remove('show'); setBodyLock(false); };

  // Open/close
  open.addEventListener('click', show);
  close.addEventListener('click', hide);
  back.addEventListener('click', hide);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hide(); });

  function focusFirstOption(){
    const first = stage.querySelector('input[type="radio"]');
    if(first) first.focus();
  }

  function render(){
    form.setAttribute('data-mode', mode);

    // progress bar
    const pct = (mode==='questions') ? Math.round((step/Q.length)*100) : 100;
    bar.style.width = Math.min(100, pct) + '%';

    // reset stage content each render
    stage.innerHTML = '';

    if(mode === 'questions'){
      const item = Q[step];
      const wrap = document.createElement('div');

      const h = document.createElement('div');
      h.className = 'quiz-q';
      h.textContent = `Q${step+1}/${Q.length} — ${item.q}`;
      wrap.appendChild(h);

      const opts = document.createElement('div');
      opts.className = 'quiz-options';
      item.a.forEach((opt, idx)=>{
        const id = `q${step}_${idx}`;
        const row = document.createElement('label');
        row.className = 'quiz-option';
        row.innerHTML = `
          <input type="radio" name="q${step}" id="${id}" value="${idx}" ${answers[step]===idx?'checked':''}/>
          <div>
            <strong>${opt.t}</strong><br/>
            ${opt.d? `<small>${opt.d}</small>`:''}
          </div>
        `;
        opts.appendChild(row);
      });
      wrap.appendChild(opts);
      stage.appendChild(wrap);

      prevB.disabled = step === 0;
      nextB.textContent = step === Q.length-1 ? 'Finish' : 'Next';

      // ensure visibility states
      document.getElementById('quizGate').hidden = true;
      document.getElementById('quizResult').hidden = true;

    } else if (mode === 'gate'){
      prevB.disabled = false;
      nextB.textContent = 'Back';
      document.getElementById('quizGate').hidden = false;
      document.getElementById('quizResult').hidden = true;

    } else if (mode === 'result'){
      prevB.disabled = false;
      nextB.textContent = 'Back';
      document.getElementById('quizGate').hidden = true;
      document.getElementById('quizResult').hidden = false;
    }
  }

  function tally(){
    score.C = score.P = score.S = 0;
    answers.forEach((a, i)=>{
      if(a == null) return;
      const v = Q[i].a[a].v;
      score.C += (v.C || 0);
      score.P += (v.P || 0);
      score.S += (v.S || 0);
    });
  }

  function summaryText(){
    const entries = Object.entries(score).sort((a,b)=> b[1]-a[1]);
    const top = entries[0][0], second = entries[1][0];
    const map = {C:'Control', P:'Power', S:'Stamina'};
    return `Your plan emphasizes ${map[top]} with a secondary focus on ${map[second]}. Expect a mix of ${top==='C'?'timed holds & pulses': top==='P'?'short functional strength':'breath-paced intervals'} with ${second==='C'?'precision control drills': second==='P'?'power stacks':'stamina-oriented breathing'}.`;
  }

  function pillList(){
    qrPills.innerHTML = '';
    const items = [];
    if(score.C>=score.P && score.C>=score.S) items.push('Precision Holds','Interval Control');
    if(score.P>=score.C && score.P>=score.S) items.push('Power Stacks','Mobility Micro-sets');
    if(score.S>=score.C && score.S>=score.P) items.push('Breath Cadence','Down-regulation');
    const all = ['Streak Targets','RPE Tracking','Levelled Timers'];
    while(items.length<3) items.push(all[items.length%all.length]);
    items.slice(0,3).forEach(t=>{
      const pill = document.createElement('span');
      pill.className = 'qr-pill';
      pill.textContent = t;
      qrPills.appendChild(pill);
    });
  }

  // Next / Back
  nextB.addEventListener('click', ()=>{
    if(mode === 'questions'){
      if(step < Q.length-1){
        const picked = stage.querySelector('input[type="radio"]:checked');
        if(!picked){ shake(stage); return; }
        answers[step] = parseInt(picked.value,10);
        step++;
        render();
        focusFirstOption();
      } else {
        // require last answer
        const picked = stage.querySelector('input[type="radio"]:checked');
        if(!picked){ shake(stage); return; }
        answers[step] = parseInt(picked.value,10);
        tally();
        mode = 'gate';   // move to email gate only
        render();
      }
    } else if (mode === 'gate' || mode === 'result'){
      mode = 'questions';
      step = Q.length-1;
      render();
      focusFirstOption();
    }
  });

  prevB.addEventListener('click', ()=>{
    if(mode === 'questions'){
      if(step>0){ step--; render(); focusFirstOption(); }
    } else {
      mode = 'questions';
      step = Q.length-1;
      render();
      focusFirstOption();
    }
  });

  // Email submit => results-only view
  form.addEventListener('submit', (e)=>{
    if(mode !== 'gate'){ return; }
    e.preventDefault();
    const val = (email?.value || '').trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)){
      msg.textContent = 'Please enter a valid email.';
      email?.focus();
      return;
    }
    // TODO: send to your provider
    localStorage.setItem('ck_quiz_email', val);

    qrSum.textContent = summaryText();
    pillList();
    mode = 'result';
    render();
    bar.style.width = '100%';
  });

  function shake(el){
    el.style.transition = 'transform .1s';
    el.style.transform = 'translateX(2px)';
    setTimeout(()=>{ el.style.transform='translateX(-2px)'; }, 60);
    setTimeout(()=>{ el.style.transform=''; el.style.transition=''; }, 140);
  }
})();
