"""Optional online speech: the supplied text is sent to Google Translate TTS."""
import sys
from gtts import gTTS
if len(sys.argv) != 4 or sys.argv[1] not in ('si', 'en', 'ta'):
    raise SystemExit('Usage: tts.py si|en|ta output.mp3 text')
if not 1 <= len(sys.argv[3]) <= 1500:
    raise SystemExit('Text must contain 1–1500 characters')
gTTS(text=sys.argv[3], lang=sys.argv[1], timeout=20).save(sys.argv[2])
