/* Theme toggle — persists to localStorage, dispatches `themechange`. */
(function(){
  var root=document.documentElement;
  var btn=document.getElementById('themeToggle');
  function paint(){
    var dark=root.getAttribute('data-theme')==='dark';
    if(!btn)return;
    btn.querySelector('.ico').innerHTML=dark
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    btn.querySelector('.lbl').textContent=dark?'Light':'Dark';
  }
  function set(t){
    root.setAttribute('data-theme',t);
    try{localStorage.setItem('sc-theme',t);}catch(e){}
    paint();
    window.dispatchEvent(new CustomEvent('themechange',{detail:{theme:t}}));
  }
  if(btn){
    btn.addEventListener('click',function(){
      set(root.getAttribute('data-theme')==='dark'?'light':'dark');
    });
  }
  paint();
})();
