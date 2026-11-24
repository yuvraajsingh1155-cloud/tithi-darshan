// Verify public 3-koota browser calculator without a browser or personal user data.
// node tests/test_koota_preview.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
class El {
  constructor(tag='div'){this.tag=tag;this.value='';this.textContent='';this.children=[];this.hidden=false;this.disabled=false;this.events={};this.dataset={};this.className='';}
  replaceChildren(...items){this.children=items;if(this.tag==='select')this.value='';}
  addEventListener(name,fn){this.events[name]=fn;}
  append(...items){this.children.push(...items);}
}
const ids=['koota-preview','nak-a','sign-a','nak-b','sign-b','koota-result','save-koota'];
const elems=Object.fromEntries(ids.map(id=>[id,new El(id.startsWith('nak-')||id.startsWith('sign-')?'select':'div')]));
const document={
  getElementById:id=>elems[id]||null,
  createElement:tag=>new El(tag)
};
vm.runInNewContext(fs.readFileSync('assets/koota-preview.js','utf8'),{
  document,window:{},location:{assign(){}},confirm(){return false},alert(){},console
},{filename:'assets/koota-preview.js'});
function run(na,sa,nb,sb){
  elems['nak-a'].value=String(na);elems['nak-a'].events.change();
  elems['sign-a'].value=String(sa);
  elems['nak-b'].value=String(nb);elems['nak-b'].events.change();
  elems['sign-b'].value=String(sb);
  elems['koota-preview'].events.submit({preventDefault(){}});
  const result=elems['koota-result'];
  return {text:result.children.map(c=>c.textContent).join(' | '),rows:result.children.find(c=>c.tag==='table')?.children[0].children||[]};
}
let r=run(0,0,0,0);
assert.ok(r.text.includes('10 / 18'),r.text);
assert.equal(r.rows.length,3);
assert.equal(r.rows[0].children[1].textContent,'3 / 3');
assert.equal(r.rows[1].children[1].textContent,'0 / 8');
assert.equal(r.rows[2].children[1].textContent,'7 / 7');
r=run(0,0,1,0);
assert.ok(r.text.includes('18 / 18'),r.text);
r=run(0,0,2,1); // Krittika can occur in Taurus; Aries–Taurus = Bhakoot 0.
assert.equal(r.rows[2].children[1].textContent,'0 / 7');
assert.equal(elems['save-koota'].hidden,false);
console.log('PASS 3-koota match: same nakshatra, independent nadi, bhakoot dosha, UI');
