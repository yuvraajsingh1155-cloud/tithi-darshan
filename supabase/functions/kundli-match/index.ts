import './ashtakoota.js';
import { createClient } from 'npm:@supabase/supabase-js@2.87.3';

const ORIGIN='https://hindu-tithi-darshan.pages.dev';
function cors(req:Request){
  const origin=req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin':origin===ORIGIN?origin:ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type',
    'Vary':'Origin',
    'Cache-Control':'no-store',
  };
}
function json(req:Request,body:unknown,status=200){
  return Response.json(body,{status,headers:{...cors(req),'Content-Type':'application/json; charset=utf-8'}});
}
Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  const bearer=req.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(bearer))return json(req,{error:'Login required'},401);
  const token=bearer.replace(/^Bearer\s+/i,'');
  try{
    const auth=createClient(
      Deno.env.get('SUPABASE_URL')||'',
      Deno.env.get('SUPABASE_ANON_KEY')||'',
      {auth:{persistSession:false,autoRefreshToken:false}}
    );
    const {data,error}=await auth.auth.getUser(token);
    if(error||!data.user)return json(req,{error:'Your login has expired; please sign in again'},401);
    if(Number(req.headers.get('content-length')||0)>4096)return json(req,{error:'Invalid request size'},413);
    let payload:unknown;
    try{payload=await req.json()}catch{return json(req,{error:'Invalid JSON'},400)}
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return json(req,{error:'Invalid input'},400);
    const b=payload as Record<string,unknown>;
    const ints=['nakshatra_a','moon_sign_a','nakshatra_b','moon_sign_b'];
    if(!ints.every(x=>typeof b[x]==='number'&&Number.isInteger(b[x])))
      return json(req,{error:'All four inputs must be integer indexes'},400);
    const [na,sa,nb,sb]=ints.map(x=>b[x] as number);
    const possibleSigns=(i:number)=>{
      const start=i*40/3,end=(i+1)*40/3;
      return Array.from({length:12},(_,s)=>s)
       .filter(s=>start<((s+1)*30-1e-7)&&end>(s*30+1e-7));
    };
    if(na<0||na>26||nb<0||nb>26||sa<0||sa>11||sb<0||sb>11||
       !possibleSigns(na).includes(sa)||!possibleSigns(nb).includes(sb))
      return json(req,{error:'Nakshatra and Moon sign do not match'},400);
    const score=(globalThis as typeof globalThis & {TithiAshtakoota:{score:(...args:number[])=>unknown}})
      .TithiAshtakoota.score(na,sa,nb,sb);
    return json(req,score);
  }catch{
    return json(req,{error:'Matching calculation temporarily unavailable'},500);
  }
});
