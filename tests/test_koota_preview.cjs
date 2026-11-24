// Tests traditional 8-koota engine and UI without personal data/network.
// node tests/test_koota_preview.cjs
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const win={};
const ctx=vm.createContext({window:win,console});
vm.runInContext(fs.readFileSync('assets/ashtakoota-full.js','utf8'),ctx,{filename:'assets/ashtakoota-full.js'});
const full=win.TithiAshtakoota;
assert.ok(full?.score);
const same=full.score(0,0,0,0);
assert.equal(same.maximum,36);
assert.equal(same.total,28);
assert.equal(same.scores.nadi,0);
assert.equal(same.scores.yoni,4);
const other=full.score(0,0,1,0);
assert.equal(other.total,31);
assert.equal(other.scores.nadi,8);
assert.equal(other.scores.gana,3);
const conflict=full.score(0,0,2,1);
assert.equal(conflict.scores.bhakoot,0);
assert.equal(conflict.scores.tara,1.5);
assert.equal(conflict.total,17.5);
for(let a=0;a<27;a++)for(let b=0;b<27;b++){
  const sa=Math.floor(a*4/9),sb=Math.floor(b*4/9);
  const v=full.score(a,sa,b,sb);
  assert.ok(v.total>=0 && v.total<=36);
  assert.equal(v.total,Object.values(v.scores).reduce((x,y)=>x+y,0));
}
assert.throws(()=>full.score(-1,0,0,0),{name:'RangeError'});
class El {
  constructor(tag='div'){this.tag=tag;this.value='';this.textContent='';this.children=[];this.hidden=false;this.disabled=false;this.events={};this.dataset={};this.className='';}
  replaceChildren(...items){this.children=items;if(this.tag==='select')this.value='';}
  addEventListener(name,fn){this.events[name]=fn;}
  append(...items){this.children.push(...items);}
}
const ids=['koota-preview','nak-a','sign-a','nak-b','sign-b','koota-result','save-koota'];
const elems=Object.fromEntries(ids.map(id=>[id,new El(id.startsWith('nak-')||id.startsWith('sign-')?'select':'div')]));
const document={getElementById:id=>elems[id]||null,createElement:tag=>new El(tag)};
ctx.document=document;
ctx.location={assign(){}};
ctx.confirm=()=>false;
ctx.alert=()=>{};
vm.runInContext(fs.readFileSync('assets/koota-preview.js','utf8'),ctx,{filename:'assets/koota-preview.js'});
elems['nak-a'].value='0';elems['nak-a'].events.change();elems['sign-a'].value='0';
elems['nak-b'].value='1';elems['nak-b'].events.change();elems['sign-b'].value='0';
elems['koota-preview'].events.submit({preventDefault(){}});
const result=elems['koota-result'];
assert.equal(result.hidden,false);
assert.ok(result.children[0].textContent.includes('31 / 36'));
assert.equal(result.children.find(c=>c.tag==='table')?.children[0]?.children?.length,8);
assert.equal(elems['save-koota'].hidden,false);
console.log('PASS 8-koota engine, 729 pairs, full 36-point UI, invalid inputs');
