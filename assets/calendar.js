(() => {
  'use strict';
  const form=document.getElementById('month-calendar-form');
  if(!form)return;
  form.addEventListener('submit',ev=>{
    ev.preventDefault();
    const city=document.getElementById('calendar-city')?.value;
    const month=document.getElementById('calendar-month')?.value;
    if(!/^[a-z-]+$/.test(city)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return;
    location.assign('/calendar/'+city+'/'+month+'/');
  });
})();