"""Integration smoke test: reject unauthenticated requests to private kundli matching.
Uses public project key only and synthetic indexes, no personal data.
"""
import json
from urllib.request import Request,urlopen
from urllib.error import HTTPError

API='https://ipqejplvpmznhhtcmozz.supabase.co/functions/v1/kundli-match'
KEY='sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-'

def main():
  body=json.dumps({'nakshatra_a':0,'moon_sign_a':0,'nakshatra_b':1,'moon_sign_b':0}).encode()
  req=Request(API,data=body,method='POST',headers={
    'Content-Type':'application/json',
    'apikey':KEY,
    'Origin':'https://hindu-tithi-darshan.pages.dev',
  })
  try:
    with urlopen(req,timeout=15) as resp:
      code=resp.status
  except HTTPError as exc:
    code=exc.code
  if code!=401:
    raise RuntimeError(f'Expected HTTP 401 for unauthenticated Kundli calculation; got {code}')
  print('PASS: unauthenticated Kundli requests are rejected with HTTP 401')

if __name__=='__main__':
  main()
