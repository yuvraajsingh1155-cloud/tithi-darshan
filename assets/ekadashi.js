(() => {
  'use strict';
  const form=document.getElementById('ekadashi-select');
  if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const city=document.getElementById('ekadashi-city')?.value;
    if(!/^[a-z-]+$/.test(city))return;
    window.TithiPrefs?.set({preferred_city:city});
    location.assign('/ekadashi/'+city+'/');
  });
})();