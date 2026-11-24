"""Read the public Supabase Auth settings via the project's publishable key.
This is a diagnostic only, never emits tokens and never changes the project.
"""
import json
import urllib.request
import urllib.error
from urllib.parse import urlencode, urlsplit

PROJECT_URL = "https://ipqejplvpmznhhtcmozz.supabase.co"
PUBLIC_KEY = "sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-"

def main():
    request = urllib.request.Request(
        PROJECT_URL + "/auth/v1/settings",
        headers={"apikey": PUBLIC_KEY, "accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            data=json.loads(response.read(100_000))
        provider = data.get("external", {})
        status = provider.get("google")
        print("Google OAuth provider enabled:", status)
        print("Email signup enabled:", data.get("disable_signup") is False)
        if status is not True:
            print("ACTION NEEDED: Enable Google provider and configure OAuth Client ID/Secret in Supabase.")
        else:
            # A working authorization route should redirect to Google's consent flow.
            # Only check the redirect hostname, never output OAuth state or Client ID.
            class NoFollow(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):
                    return None
            query=urlencode({
                "provider":"google",
                "redirect_to":"https://hindu-tithi-darshan.pages.dev/mera-account/"
            })
            req=urllib.request.Request(
                PROJECT_URL+"/auth/v1/authorize?"+query,
                headers={"apikey":PUBLIC_KEY}
            )
            try:
                res=urllib.request.build_opener(NoFollow()).open(req,timeout=12)
                redirect=res.headers.get("location","")
                code=res.status
            except urllib.error.HTTPError as err:
                redirect=err.headers.get("location","")
                code=err.code
            host=urlsplit(redirect).hostname
            works=code in (301,302,303,307,308) and host in ("accounts.google.com","google.com")
            print("Google OAuth authorization redirects to Google:", works)
            if not works:
                print("CHECK: Google Client credentials or authorized redirect settings may still need adjustment.")
    except Exception as exc:
        print("Could not verify Google OAuth provider settings:", type(exc).__name__, str(exc)[:150])

if __name__=="__main__":
    main()
