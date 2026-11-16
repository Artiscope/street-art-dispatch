/* Street Art Dispatch: menu, sticky header, the sign-up box and the archive search.
   Everything is set up by refresh(), so the page editor in Artiscope Digital Home
   can redraw a page and set it up again. */
(function(){
  var html=document.documentElement,watch=null,keys=false;
  function $(s){return document.querySelector(s)}

  function setupNav(){
    var nav=$('#nav'),sentinel=$('#navSentinel');
    if(watch){watch.disconnect();watch=null}
    if(!nav)return;
    if(sentinel&&'IntersectionObserver' in window){
      watch=new IntersectionObserver(function(e){nav.classList.toggle('stuck',!e[0].isIntersecting)});watch.observe(sentinel);
    }else if(!setupNav.scroll){
      setupNav.scroll=true;
      addEventListener('scroll',function(){var n=$('#nav');if(n)n.classList.toggle('stuck',scrollY>8)},{passive:true});
    }
  }

  function setMenu(open){
    var sheet=$('#sheet'),menuBtn=$('#menuBtn'),closeBtn=$('#sheetClose');if(!sheet)return;
    sheet.classList.toggle('open',open);html.classList.toggle('menu-open',open);
    if(menuBtn)menuBtn.setAttribute('aria-expanded',open);
    if(open){if(closeBtn)closeBtn.focus()}else if(menuBtn)menuBtn.focus({preventScroll:true});
  }
  function setupMenu(){
    var sheet=$('#sheet'),menuBtn=$('#menuBtn'),closeBtn=$('#sheetClose');
    if(!sheet||!menuBtn||!closeBtn)return;
    menuBtn.addEventListener('click',function(){setMenu(true)});
    closeBtn.addEventListener('click',function(){setMenu(false)});
    sheet.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
    if(!keys){keys=true;addEventListener('keydown',function(e){var s=$('#sheet');if(e.key==='Escape'&&s&&s.classList.contains('open'))setMenu(false)})}
  }

  /* Sends a request by email until an email provider is connected. */
  function setupSignup(){
    var nl=$('#nl');if(!nl)return;
    nl.addEventListener('submit',function(e){
      e.preventDefault();
      var em=$('#nlEmail').value;
      location.href='mailto:info@grovegallery.com?subject='+encodeURIComponent('Subscribe to the Dispatch')+'&body='+encodeURIComponent('Please add '+em+' to the weekly dispatch.');
      $('#nlMsg').textContent='Your email app should open with a subscription request. Send it and we’ll add you.';
    });
  }

  /* The Intervention Archive: search and filters. */
  function setupArchive(){
    var box=document.getElementById('archive');if(!box)return;
    var one=function(s){return box.querySelector(s)},all=function(s){return [].slice.call(box.querySelectorAll(s))};
    var total=+box.dataset.total,st={q:'',artist:'',city:'',dec:''};
    var q=one('#fQ'),fa=one('#fArtist'),fc=one('#fCity'),count=one('#aCount'),clear=one('#aClear'),empty=one('#aEmpty');
    if(!q||!fa||!fc)return;
    function render(){
      var term=st.q.toLowerCase().trim(),shown=0;
      all('.icard').forEach(function(c){
        var ok=(!st.artist||c.dataset.artist===st.artist)&&(!st.city||c.dataset.city===st.city)&&(!st.dec||c.dataset.dec===st.dec)&&(!term||c.dataset.text.indexOf(term)>-1);
        c.hidden=!ok;if(ok)shown++;
      });
      all('.yr').forEach(function(y){y.hidden=!y.querySelector('.icard:not([hidden])')});
      var active=st.q||st.artist||st.city||st.dec;
      count.textContent=active?'Showing '+shown+' of '+total+' interventions':total+' interventions, newest first';
      clear.hidden=!active;empty.hidden=shown>0;
      q.value=st.q;fa.value=st.artist;fc.value=st.city;
      all('.chip').forEach(function(c){c.setAttribute('aria-pressed',c.dataset.dec===st.dec)});
    }
    var t;q.addEventListener('input',function(){st.q=q.value;clearTimeout(t);t=setTimeout(render,120)});
    fa.addEventListener('change',function(){st.artist=fa.value;render()});
    fc.addEventListener('change',function(){st.city=fc.value;render()});
    one('#decades').addEventListener('click',function(e){var c=e.target.closest('.chip');if(c){st.dec=c.dataset.dec;render()}});
    clear.addEventListener('click',function(){st={q:'',artist:'',city:'',dec:''};render()});
    box.addEventListener('click',function(e){
      var a=e.target.closest('.who a');if(!a||html.classList.contains('adh'))return;
      e.preventDefault();st.artist=(a.getAttribute('href').split('artist=')[1]||'');render();box.scrollIntoView();
    });
    var m=location.search.match(/[?&]artist=([\w-]+)/);
    if(m&&fa.querySelector('option[value="'+m[1]+'"]')){st.artist=m[1];render()}
  }

  /* Announcement bars with more than one message show them in turn, pausing while the pointer is over them. */
  var timers=[];
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setupAnnounce(){
    document.querySelectorAll('[data-announce]').forEach(function(bar){
      var msgs=bar.querySelectorAll('.ann-msg'),count=bar.querySelector('.ann-count'),at=0,hold=false;if(msgs.length<2)return;
      function show(i){at=(i+msgs.length)%msgs.length;msgs.forEach(function(m,k){m.classList.toggle('on',k===at)});if(count)count.textContent=(at+1)+' of '+msgs.length}
      bar.adhShow=function(el){for(var i=0;i<msgs.length;i++)if(msgs[i]===el)show(i)};
      bar.addEventListener('mouseenter',function(){hold=true});bar.addEventListener('mouseleave',function(){hold=false});
      if(!still)timers.push(setInterval(function(){if(!hold&&!html.classList.contains('adh'))show(at+1)},1000*(+bar.dataset.secs||6)));
    });
  }
  /* Slideshows: Previous and Next, and an optional slow turn of their own. */
  function setupSlides(){
    document.querySelectorAll('[data-slides]').forEach(function(box){
      var sl=box.querySelectorAll('.ss-slide'),label=box.querySelector('.ss-at'),at=0;if(sl.length<2)return;
      function show(i){at=(i+sl.length)%sl.length;sl.forEach(function(s,k){s.classList.toggle('on',k===at)});if(label)label.textContent=(at+1)+' of '+sl.length}
      box.adhShow=function(el){for(var k=0;k<sl.length;k++)if(sl[k]===el)show(k)};
      box.addEventListener('click',function(e){var b=e.target.closest('[data-ss]');if(!b)return;show(at+(b.dataset.ss==='next'?1:-1));box.dataset.auto='0'});
      if(!still&&box.dataset.auto==='1')timers.push(setInterval(function(){if(box.dataset.auto==='1'&&!html.classList.contains('adh'))show(at+1)},1000*(+box.dataset.secs||6)));
    });
  }
  /* Galleries: a photo opens larger, with Previous, Next and Close. */
  function setupGalleries(){
    document.querySelectorAll('[data-gallery]').forEach(function(g){
      var items=[].slice.call(g.querySelectorAll('.gl-item'));
      items.forEach(function(it,i){it.addEventListener('click',function(){if(!html.classList.contains('adh'))openBox(items,i)})});
    });
  }
  function openBox(items,i){
    var box=document.createElement('div');box.className='lbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Photo');
    box.innerHTML='<div class="lbox-top"><span class="lbox-at"></span><button type="button" data-lb="close">Close</button></div><div class="lbox-pic"></div><div class="lbox-nav"><button type="button" data-lb="prev">Previous</button><span class="lbox-cap"></span><button type="button" data-lb="next">Next</button></div>';
    function show(k){i=(k+items.length)%items.length;var it=items[i],pic=it.querySelector('img,.ph');box.querySelector('.lbox-pic').innerHTML=pic?pic.outerHTML:'';box.querySelector('.lbox-at').textContent=(i+1)+' of '+items.length;var t=it.querySelector('.gl-t');box.querySelector('.lbox-cap').textContent=t?t.textContent:''}
    function close(){box.remove();html.classList.remove('menu-open');removeEventListener('keydown',key);items[i].focus()}
    function key(e){if(e.key==='Escape')close();if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1)}
    box.addEventListener('click',function(e){var b=e.target.closest('[data-lb]');if(!b)return;if(b.dataset.lb==='close')close();else show(i+(b.dataset.lb==='next'?1:-1))});
    addEventListener('keydown',key);document.body.appendChild(box);html.classList.add('menu-open');show(i);box.querySelector('[data-lb="close"]').focus();
  }
  /* The contact form opens the visitor's own email app with the message ready to send. The site sends and keeps nothing. */
  function setupMailForms(){
    document.querySelectorAll('form[data-mailform]').forEach(function(form){
      form.addEventListener('submit',function(e){
        e.preventDefault();
        var v=function(n){var el=form.elements[n];return el?el.value.trim():''},note=form.querySelector('.mf-note'),to=form.getAttribute('data-email');
        var say=function(t,bad){if(note){note.textContent=t;note.classList.toggle('err',!!bad)}};
        var email=form.elements.email;
        if(email&&(!email.value.trim()||!email.checkValidity())){email.focus();say('We need a working email address, so we can reply.',true);return}
        if(form.elements.message&&!v('message')){form.elements.message.focus();say('Please write your message first.',true);return}
        var subject=(v('topic')||'A message')+' for Street Art Dispatch';
        var url='mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(v('message')+'\n\nName: '+v('name')+'\nEmail: '+v('email'));
        form.setAttribute('data-mailto',url);location.href=url;
        say('Your email app should now be open with the message ready. Send it and it reaches us. If nothing opened, write to '+to+'.');
      });
    });
  }

  /* Each popup shows once a visit, after its delay; Close or Escape puts it away. Never while the page is being edited.
     Its form opens the visitor's own email app, like the sign-up box. */
  function setupPopups(){
    document.querySelectorAll('[data-popup]').forEach(function(p){
      if(p.getAttribute('data-wired'))return;p.setAttribute('data-wired','1');
      var key='sad-popup-'+p.id,seen=function(){try{return sessionStorage.getItem(key)==='1'}catch(e){return false}};
      var shut=function(){p.hidden=true};
      p.querySelectorAll('[data-pop-close]').forEach(function(b){b.addEventListener('click',shut)});
      p.addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
      var f=p.querySelector('[data-popform]'),note=p.querySelector('.mf-note');
      if(f)f.addEventListener('submit',function(e){
        e.preventDefault();var em=f.elements.email,to=f.getAttribute('data-email');
        if(!em.value.trim()||!em.checkValidity()){em.focus();if(note)note.textContent='We need a working email address, so we can add you.';return}
        var url='mailto:'+to+'?subject='+encodeURIComponent('Subscribe to the Dispatch')+'&body='+encodeURIComponent('Please add '+em.value.trim()+' to the weekly dispatch.');
        f.setAttribute('data-mailto',url);location.href=url;
        if(note)note.textContent='Your email app should now be open with the message ready. Send it and we will add you. If nothing opened, write to '+to+'.';
      });
      if(window.ADH_EDIT||seen())return;
      setTimeout(function(){if(!window.ADH_EDIT&&!seen()&&document.body.contains(p)){p.hidden=false;try{sessionStorage.setItem(key,'1')}catch(e){}}},(Number(p.getAttribute('data-delay'))||8)*1000);
    });
  }
  function refresh(){timers.forEach(clearInterval);timers=[];setupNav();setupMenu();setupSignup();setupArchive();setupAnnounce();setupSlides();setupGalleries();setupMailForms();setupPopups()}
  window.SADSite={refresh:refresh};
  refresh();
})();

/* lets Artiscope Digital Home redraw any page as it is edited, and pick or follow what is clicked */
(function () {
  var ok = "https://artiscope.github.io", active = false, me = document.currentScript;
  if (window.parent === window) { return; }
  var ROOT = new URL(".", new URL("..", (me && me.src) || location.href)).href;
  var BLOCKS = { header: ".nav-links li", footer: ".foot-grid nav:last-child li", hero: ".actions a" };
  var view = { kind: "page", key: "home" }, types = {}, grp = {};
  function loadRender(done) {
    if (window.SAD) { done(); return; }
    var s = document.createElement("script"); s.src = ROOT + "assets/render.js"; s.onload = done; document.head.appendChild(s);
  }
  function style() {
    if (document.getElementById("adh-style")) { return; }
    var st = document.createElement("style"); st.id = "adh-style";
    st.textContent = ".adh-picked{outline:2px dashed rgba(42,43,48,.7);outline-offset:-2px}.adh-picked-block{outline:3px solid #2A2B30;outline-offset:3px;box-shadow:0 0 0 8px rgba(242,243,245,.8);position:relative}" +
      ".adh-picked-block[data-adh-label]::before{content:attr(data-adh-label);position:absolute;left:0;top:-30px;z-index:50;background:#2A2B30;color:#F2F3F5;font:600 12px/1 'Libre Franklin',Arial,sans-serif;padding:6px 10px;border-radius:7px;white-space:nowrap;pointer-events:none}";
    document.head.appendChild(st);
  }
  function draw(m) {
    var site = window.SAD.Site(m.data, m.pages, "", { mark: true, show: m.show || "", imageSrc: function (name) { return (m.images || {})[name] || ROOT + "assets/images/" + name; } });
    var at = m.at || { kind: "page", key: "home" }, out = null;
    if (at.kind === "artist") { out = site.artistPage(at.key); }
    else if (at.kind === "article") { out = site.articlePage(at.key); }
    else if (m.pages.pages[at.key]) { out = site.sectionsPage(at.key); }
    if (!out) { out = site.notFound(); }
    view = at; types = {};
    (((m.pages.pages || {})[at.key] || {}).sections || []).forEach(function (x) { types[x.id] = x.type; });
    grp = {}; ["top", "popups", "bottom"].forEach(function (w) { (((m.pages.groups || {})[w]) || []).forEach(function (x) { types[x.id] = x.type; grp[x.id] = 1; }); });
    var moved = out.path !== draw.path; draw.path = out.path;
    var base = document.querySelector("base[data-adh]");
    if (!base) { base = document.createElement("base"); base.setAttribute("data-adh", ""); document.head.insertBefore(base, document.head.firstChild); }
    base.href = ROOT + out.path.replace(/[^\/]*$/, "");
    var doc = new DOMParser().parseFromString(out.html, "text/html");
    doc.querySelectorAll("script").forEach(function (x) { x.remove(); });
    var t = doc.querySelector("title"); if (t) { document.title = t.textContent; }
    var oldCss = document.head.querySelector("style[data-sec-css]"), newCss = doc.head.querySelector("style[data-sec-css]");
    if (oldCss) { oldCss.remove(); }
    if (newCss) { document.head.appendChild(newCss); }
    var y = window.scrollY;
    document.body.innerHTML = doc.body.innerHTML;
    if (window.SADSite) { window.SADSite.refresh(); }
    if (moved) { window.scrollTo(0, 0); } else { window.scrollTo(0, y); }
    return moved;
  }
  function sectionEl(id) {
    if (id === "header") { return document.querySelector("nav#nav"); }
    if (id === "footer") { return document.querySelector("footer.foot"); }
    return document.querySelector('[data-adh="' + id + '"]');
  }
  function blockEls(id) {
    var el = sectionEl(id), sel = BLOCKS[id === "header" || id === "footer" ? id : types[id]];
    return el && sel ? [].slice.call(el.querySelectorAll(sel)) : [];
  }
  // a block the page tags with its kind and place, so hidden ones never shift the count
  function tagged(el, bf, block) { if (!el || !bf) { return null; } return el.querySelector('[data-adh-b="' + bf + "." + block + '"]'); }
  function pick(id, block, label, scroll, bf, bi) {
    document.querySelectorAll(".adh-picked,.adh-picked-block,[data-adh-label]").forEach(function (x) { x.classList.remove("adh-picked", "adh-picked-block"); x.removeAttribute("data-adh-label"); });
    document.querySelectorAll("[data-popup]").forEach(function (p) { p.hidden = true; });
    if (!id) { return; }
    var el = sectionEl(id); if (!el) { return; }
    if (el.hasAttribute("data-popup")) { el.hidden = false; }
    var target = el;
    if ((block != null && block >= 0) || (bf && bi >= 0)) { var b = (bf && bi >= 0 ? tagged(el, bf, bi) : null) || (block >= 0 ? blockEls(id)[block] : null); if (b) { var bar = b.closest("[data-announce],[data-slides]"); if (bar && bar.adhShow) { bar.adhShow(b); } el.classList.add("adh-picked"); b.classList.add("adh-picked-block"); target = b; } else { el.classList.add("adh-picked-block"); } }
    else { el.classList.add("adh-picked-block"); }
    if (label) { target.setAttribute("data-adh-label", label); }
    if (scroll) { try { target.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (x) { target.scrollIntoView(); } }
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== ok || !e.data) { return; }
    if (!active) { active = true; window.ADH_EDIT = true; document.querySelectorAll("[data-popup]").forEach(function (p) { p.hidden = true; }); document.documentElement.classList.add("adh"); style(); }
    if (e.data.type === "adh-pages" && e.data.data && e.data.pages) {
      var m = e.data;
      loadRender(function () { var moved = false; try { moved = draw(m); } catch (x) { } pick(m.pick, m.block, m.label, m.scroll || moved, m.bf, m.bi); });
      return;
    }
    if (e.data.type === "adh-pick") { pick(e.data.id, e.data.block, e.data.label, true, e.data.bf, e.data.bi); }
  });
  // A click on a link inside the site goes to that page; anything else, or a click with Alt held, picks what was clicked.
  document.addEventListener("click", function (e) {
    if (!active) { return; }
    e.preventDefault(); e.stopPropagation();
    var link = e.target.closest("a[href]");
    if (link && !e.altKey) {
      var u; try { u = new URL(link.getAttribute("href"), document.baseURI); } catch (x) { u = null; }
      if (u && u.href.indexOf(ROOT) === 0) { window.parent.postMessage({ type: "adh-nav", path: u.href.slice(ROOT.length).split("#")[0].split("?")[0] }, ok); return; }
    }
    var id = "", block = -1;
    if (e.target.closest("nav#nav, .nameplate, #sheet")) { id = "header"; }
    else if (e.target.closest("footer.foot")) { id = "footer"; }
    else { var sec = e.target.closest("[data-adh]"); if (sec) { id = sec.getAttribute("data-adh"); } }
    if (!id) { return; }
    var bf = "", tag = e.target.closest("[data-adh-b]");
    if (tag) { var bp = tag.getAttribute("data-adh-b").split("."); bf = bp[0]; block = Number(bp[1]); }
    else { var list = blockEls(id); for (var i = 0; i < list.length; i++) { if (list[i].contains(e.target)) { block = i; break; } } }
    window.parent.postMessage({ type: "adh-click", id: id, block: block, bf: bf, view: grp[id] ? "every" : view.kind }, ok);
  }, true);
})();

/* lets Artiscope Digital Home preview a theme before it is published */
(function(){var ok="https://artiscope.github.io";if(window.parent===window)return;window.addEventListener("message",function(e){if(e.origin!==ok||!e.data)return;if(e.data.type==="adh-hello"){e.source.postMessage({type:"adh-ready"},ok);return;}if(e.data.type!=="adh-theme")return;var s=document.getElementById("adh-theme-preview");if(!s){s=document.createElement("style");s.id="adh-theme-preview";document.head.appendChild(s);}s.textContent=String(e.data.css||"");(e.data.fonts||[]).forEach(function(u){if(typeof u!=="string"||u.indexOf("https://fonts.googleapis.com/css2?")!==0)return;var had=false;Array.prototype.forEach.call(document.querySelectorAll("link[data-adh]"),function(l){if(l.getAttribute("data-adh")===u)had=true;});if(had)return;var l=document.createElement("link");l.rel="stylesheet";l.href=u;l.setAttribute("data-adh",u);document.head.appendChild(l);});});})();
