"""Read the public Supabase Auth settings via the project's publishable key.
This is a diagnostic only, never emits tokens and never changes the project.
"""
import json
import urllib.request

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
    except Exception as exc:
        print("Could not verify Google OAuth provider settings:", type(exc).__name__, str(exc)[:150])

if __name__=="__main__":
    main()
