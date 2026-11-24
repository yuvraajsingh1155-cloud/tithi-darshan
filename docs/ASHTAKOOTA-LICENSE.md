# Ashtakoota engine: attribution and interpretation

The eight-koota scoring conventions and lookup tables used by `assets/ashtakoota-full.js` were adapted for the Tithi Darshan browser calculator from:

- Repository: https://github.com/rajsanjib/jyotish-ashtakoot-gun-milan
- License: MIT License
- Copyright (c) 2025 (as shown in upstream LICENSE)
- https://github.com/rajsanjib/jyotish-ashtakoot-gun-milan/blob/main/LICENSE

MIT permission notice (preserved):

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Scope and caveats

The calculator uses two **pre-computed birth nakshatras and Moon signs** with the directional bride-first/groom-second rules recorded in the implementation. It does not derive those from time and place of birth and cannot detect Manglik Dosha, planetary placements or astrologically prescribed exceptions. Multiple competing traditional scoring conventions exist. Moon-sign "Varna" is an astrological category, **not** an individual's real-world caste or worth. No scientific evidence establishes Ashtakoota scores as predictors of marital success. Both people's consent, agency and real compatibility matter far more than scores.

Users can view results without logging in; saving a report requires a private authenticated user. The browser sends selected Moon signs and nakshatras to Supabase only when the user deliberately chooses Save. Do not collect DOB/time/place data until a separate secure validated engine exists.
