from datetime import date
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from choghadiya import daytime_choghadiya

def test_sunday_choghadiya_matches_traditional_sequence():
    day=date(2026,11,29)  # Sunday
    rows=daytime_choghadiya(day,"06:00","18:00")
    assert [r["name"] for r in rows]==[
        "उद्वेग","चर","लाभ","अमृत","काल","शुभ","रोग","उद्वेग"
    ]
    assert rows[0]["start"]=="06:00"
    assert rows[0]["end"]=="07:30"
    assert rows[-1]["end"]=="18:00"

def test_monday_starts_amrit_and_ends_amrit():
    rows=daytime_choghadiya(date(2026,11,30),"06:25","17:42")
    assert rows[0]["name"]=="अमृत"
    assert rows[-1]["name"]=="अमृत"
    assert all(rows[i]["end"]==rows[i+1]["start"] for i in range(7))
    assert rows[0]["start"]=="06:25"
    assert rows[-1]["end"]=="17:42"

def test_tuesday_first_rog_and_eight_valid_segments():
    rows=daytime_choghadiya(date(2026,12,1),"06:00","18:00")
    assert rows[0]["name"]=="रोग"
    assert rows[-1]["name"]=="रोग"
    assert all(r["start"]<r["end"] for r in rows)
