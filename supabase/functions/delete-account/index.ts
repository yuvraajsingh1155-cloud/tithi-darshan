import { createClient } from 'npm:@supabase/supabase-js@2.87.3';

const ORIGIN='https://hindu-tithi-darshan.pages.dev';
const headers={
  'Access-Control-Allow-Origin':ORIGIN,
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
  'Cache-Control':'no-store',
  'Vary':'Origin',
};
function reply(body:unknown,status=200){
  return Response.json(body,{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
}
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const origin=req.headers.get('origin');
  if(origin&&origin!==ORIGIN)return reply({error:'Untrusted origin'},403);
  const authorization=req.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(authorization))return reply({error:'Sign in required'},401);
  if(Number(req.headers.get('content-length')||0)>2048)return reply({error:'Body too large'},413);
  let body:unknown;
  try{body=await req.json()}catch{return reply({error:'Invalid JSON'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Invalid request'},400);
  const {email,confirmation}=body as Record<string,unknown>;
  if(typeof email!=='string'||typeof confirmation!=='string'||confirmation!=='DELETE MY ACCOUNT')
    return reply({error:'Explicit deletion confirmation required'},400);
  const url=Deno.env.get('SUPABASE_URL');
  const publishable=Deno.env.get('SUPABASE_ANON_KEY');
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!publishable||!secret)return reply({error:'Deletion service not configured'},503);
  const token=authorization.replace(/^Bearer\s+/i,'');
  const publicClient=createClient(url,publishable,{
    auth:{persistSession:false,autoRefreshToken:false}
  });
  const {data,error}=await publicClient.auth.getUser(token);
  if(error||!data.user||!data.user.email)return reply({error:'Session invalid or expired'},401);
  if(data.user.email.trim().toLowerCase()!==email.trim().toLowerCase())
    return reply({error:'Email confirmation did not match'},400);
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:deleteError}=await admin.auth.admin.deleteUser(data.user.id);
  if(deleteError)return reply({error:'Unable to delete account at this time'},500);
  // Two public user-owned tables have ON DELETE CASCADE on auth.users.
  return reply({deleted:true});
});
