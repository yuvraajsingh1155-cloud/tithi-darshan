/* Eight-koota traditional scoring tables, variant v1.
 * Selected scoring conventions adapted from MIT-licensed public project:
 * https://github.com/rajsanjib/jyotish-ashtakoot-gun-milan
 * Copyright (c) 2025, see docs/ASHTAKOOTA-LICENSE.md.
 * Gendered/directional scores follow bride => groom convention, not a judgment
 * of an individual's identity or human worth. Input is 0-based sign/nakshatra.
 */
(() => {
  'use strict';
  const classBySign=[1,2,3,0,1,2,3,0,1,2,3,0];
  const varnaMatrix=[[1,0,0,0],[1,1,0,0],[1,1,1,0],[1,1,1,1]];
  const vasyaBySign=[2,2,0,3,1,0,0,4,0,2,0,3];
  const vasyaMatrix=[[2,.5,1,0,2],[.5,2,0,0,0],[1,0,2,2,2],[0,0,2,2,0],[1,0,1,0,2]];
  const yonis=[0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,11,10,4,11,12,11,13,0,13,7,1];
  const yoniMatrix=[
    [4,2,2,3,2,2,2,1,0,1,1,3,2,1],
    [2,4,3,3,2,2,2,2,3,1,2,3,2,0],
    [2,3,4,3,2,2,2,2,3,1,2,3,2,0],
    [3,3,2,4,2,1,1,1,1,2,2,2,0,2],
    [2,2,1,2,4,2,1,2,2,1,0,2,1,1],
    [2,2,2,1,2,4,0,2,2,1,3,3,2,1],
    [2,2,1,1,1,0,4,2,2,2,2,2,1,2],
    [1,2,3,1,2,2,2,4,3,0,3,2,2,1],
    [0,3,3,1,2,2,2,3,4,1,2,2,2,2],
    [1,1,1,2,1,1,2,0,1,4,1,1,2,1],
    [1,2,2,2,0,3,2,3,2,1,4,2,2,1],
    [3,3,0,2,2,3,2,2,2,1,2,4,3,2],
    [2,2,3,0,1,2,1,2,2,2,2,3,4,2],
    [1,0,1,2,1,1,2,1,2,1,1,2,2,4]
  ];
  const lordBySign=[2,5,3,1,0,3,5,2,4,6,6,4];
  const maitriMatrix=[
    [5,5,5,4,5,0,0],
    [5,5,4,1,4,.5,.5],
    [5,4,5,.5,5,3,.5],
    [4,1,.5,5,.5,5,4],
    [5,4,5,.5,5,.5,3],
    [0,.5,3,5,.5,5,5],
    [0,.5,.5,4,3,5,5]
  ];
  const deva=new Set([0,4,6,7,12,14,16,21,26]);
  const manushya=new Set([1,3,5,10,11,19,20,24,25]);
  const gana=i=>deva.has(i)?0:manushya.has(i)?1:2;
  const ganaMatrix=[[6,3,1],[5,6,3],[0,0,6]];
  // Unidirectional 0-indexed: first person bride, second person groom.
  function score(na,sa,nb,sb){
    if (![na,sa,nb,sb].every(Number.isInteger)||na<0||na>26||nb<0||nb>26||sa<0||sa>11||sb<0||sb>11)
      throw new RangeError('Invalid nakshatra or moon sign');
    const taraPass=(a,b)=>![3,5,7].includes((((b-a+27)%27)%9)+1);
    const tara=(taraPass(na,nb)?1.5:0)+(taraPass(nb,na)?1.5:0);
    const adiNadi=new Set([0,5,6,11,12,17,18,23,24]);
    const madhyaNadi=new Set([1,4,7,10,13,16,19,22,25]);
    const nadiType=i=>adiNadi.has(i)?0:(madhyaNadi.has(i)?1:2);
    const nadi=nadiType(na)===nadiType(nb)?0:8;
    const distance=((sb-sa+12)%12)+1;
    const bhakoot=[2,5,6,8,9,12].includes(distance)?0:7;
    const scores={
      varna:varnaMatrix[classBySign[sa]][classBySign[sb]],
      vasya:vasyaMatrix[vasyaBySign[sa]][vasyaBySign[sb]],
      tara,
      yoni:yoniMatrix[yonis[na]][yonis[nb]],
      graha_maitri:maitriMatrix[lordBySign[sa]][lordBySign[sb]],
      gana:ganaMatrix[gana(na)][gana(nb)],
      bhakoot,nadi
    };
    const max={varna:1,vasya:2,tara:3,yoni:4,graha_maitri:5,gana:6,bhakoot:7,nadi:8};
    for(const key of Object.keys(max)){
      if(!Number.isFinite(scores[key])||scores[key]<0||scores[key]>max[key])
        throw Error('Invalid scoring table: '+key);
    }
    const total=Object.values(scores).reduce((a,b)=>a+b,0);
    return {scores,total,maximum:36,methodology:'ashtakoota-v1-directional-bride-first',
      disclaimer:'परंपरागत 8-कूट नियम; भिन्न पद्धतियों, अपवादों और जन्मकुंडली ग्रह विश्लेषण को शामिल नहीं करता।'};
  }
  globalThis.TithiAshtakoota=Object.freeze({score});
})();
