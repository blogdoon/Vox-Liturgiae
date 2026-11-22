# Vox Liturgiae

A dependency-free, mobile-first Latin tutor delivered as a static Progressive Web App. It can be hosted on GitHub Pages and caches its application shell and bundled reference audio for use offline after one successful online visit.

## Deploy

Publish this folder as the root of a GitHub Pages site (repository root or `/docs`). Serve over HTTPS. Open it once while online and wait for the service worker to cache its resources; install from Chrome's browser menu when offered. PWA installation is optional: the site remains usable in a browser.

## Privacy and device capabilities

- Lessons, quiz history, flashcard scheduling, and self-assessments are saved in this browser's local storage. Export/import is local JSON. No account, analytics, API, or remote script is used.
- Microphone access is requested only after tapping Record. A recording stays in the current page's memory and is discarded when the page closes.
- Bundled ecclesiastical Latin prayer recordings are the pronunciation authority. Device speech synthesis voices are enumerated and optional local voices may be tried, but Latin support or ecclesiastical quality cannot be inferred from a voice's name/language tag.
- Speech recognition is never allowed to use the browser's default processing mode. It is offered only when the browser exposes `processLocally`, `available()`, and language-pack installation APIs, and Latin is reported available locally. Current MDN compatibility data says Chrome for Android does not support `processLocally`; absent that API, recording and self-assessment remain available.
- Android Gemini Nano/AICore and ML Kit GenAI are native Android APIs; a GitHub Pages document cannot call their native SDK. Chrome's built-in Prompt API documentation excludes Chrome for Android. Study recommendations therefore use a small deterministic offline scheduler.

## Why no bundled recognition model

A website-bundled model was evaluated and rejected for this version. Vosk's recommended small models are about 50 MB and use about 300 MB at runtime, and its official catalogue has no ready Latin model. Whisper's tiny multilingual model is MIT-licensed and includes a Latin token, but quantized browser builds still add tens of megabytes and hundreds of megabytes of runtime memory; Whisper's own model card warns of uneven low-resource-language accuracy and hallucinated text. That tradeoff is too large for an optional enhancement on ordinary Android phones, and would risk presenting weak transcript output as pronunciation assessment. The app therefore uses verified browser-local recognition only, or the recording/self-assessment workflow otherwise.

## Reference audio credit

- “Ave Maria in Latin language” by OrbiliusMagister: <https://commons.wikimedia.org/wiki/File:Ave_Maria_in_Latin_language.ogg>
- “Gloria Patri recitato da voce italiana” by Antonella Nigro: <https://commons.wikimedia.org/wiki/File:Gloria_Patri_recitato_da_voce_italiana.ogg>
- “Salve regina” by Geremia: <https://commons.wikimedia.org/wiki/File:Salve_regina.ogg>

All three recordings are public domain on Wikimedia Commons and bundled as Ogg Vorbis files; the service worker caches them with the rest of the app.

## Official capability references

- [Chrome built-in AI — Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [MDN — SpeechRecognition `processLocally`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)
- [MDN — SpeechRecognition `available()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static)
- [MDN — SpeechSynthesisVoice `localService`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
- [Android — Gemini Nano and ML Kit GenAI](https://developer.android.com/ai/gemini-nano)
- [Vosk — official model catalogue](https://alphacephei.com/vosk/models)
- [OpenAI Whisper — model card](https://github.com/openai/whisper/blob/main/model-card.md)

Android Chrome installation, microphone permission, installed voices, and airplane-mode behavior require a physical Android device for final acceptance testing.
