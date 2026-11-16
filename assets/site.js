/* Street Art Dispatch: menu, sticky header and the sign-up box. */
(function(){
  var $=function(s){return document.querySelector(s)},html=document.documentElement;
  var nav=$('#nav'),sentinel=$('#navSentinel');
  if(sentinel&&'IntersectionObserver' in window){
    new IntersectionObserver(function(e){nav.classList.toggle('stuck',!e[0].isIntersecting)}).observe(sentinel);
  }else if(nav){
    addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>8)},{passive:true});
  }
  var sheet=$('#sheet'),menuBtn=$('#menuBtn'),closeBtn=$('#sheetClose');
  function setMenu(open){
    sheet.classList.toggle('open',open);html.classList.toggle('menu-open',open);
    menuBtn.setAttribute('aria-expanded',open);
    if(open)closeBtn.focus();else menuBtn.focus({preventScroll:true});
  }
  menuBtn.addEventListener('click',function(){setMenu(true)});
  closeBtn.addEventListener('click',function(){setMenu(false)});
  sheet.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('open'))setMenu(false)});
  /* Sends a request by email until an email provider is connected. */
  var nl=$('#nl');
  if(nl)nl.addEventListener('submit',function(e){
    e.preventDefault();
    var em=$('#nlEmail').value;
    location.href='mailto:info@grovegallery.com?subject='+encodeURIComponent('Subscribe to the Dispatch')+'&body='+encodeURIComponent('Please add '+em+' to the weekly dispatch.');
    $('#nlMsg').textContent='Your email app should open with a subscription request. Send it and we’ll add you.';
  });
})();

/* The Intervention Archive: search and filters. */
(function(){
  var box=document.getElementById('archive');if(!box)return;
  var $=function(s){return box.querySelector(s)},all=function(s){return [].slice.call(box.querySelectorAll(s))};
  var total=+box.dataset.total,st={q:'',artist:'',city:'',dec:''};
  var q=$('#fQ'),fa=$('#fArtist'),fc=$('#fCity'),count=$('#aCount'),clear=$('#aClear'),empty=$('#aEmpty');
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
  $('#decades').addEventListener('click',function(e){var c=e.target.closest('.chip');if(c){st.dec=c.dataset.dec;render()}});
  clear.addEventListener('click',function(){st={q:'',artist:'',city:'',dec:''};render()});
  box.addEventListener('click',function(e){
    var a=e.target.closest('.who a');if(!a)return;
    e.preventDefault();st.artist=(a.getAttribute('href').split('artist=')[1]||'');render();box.scrollIntoView();
  });
  var m=location.search.match(/[?&]artist=([\w-]+)/);
  if(m&&fa.querySelector('option[value="'+m[1]+'"]')){st.artist=m[1];render()}
})();
