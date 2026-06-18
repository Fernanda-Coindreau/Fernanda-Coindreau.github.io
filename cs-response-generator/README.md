# CS Response Generator

Paste in a client message and get a ready-to-send reply that catches everything in it, not just the first thing mentioned.

## What it does

Paste a client email or message, plus any background info the AI should know - prior agreements, numbers, dates already discussed. The app works through two steps.

First it classifies the message: detects the language, the tone (casual, neutral, or formal), and every distinct topic inside it - a complaint, a billing question, a recommendation request, whatever's actually in there, not just one category. Then it drafts a single reply that addresses everything it found, matching the tone the client used, and staying consistent with whatever context you gave it.

## Tech

Vanilla HTML/CSS/JS, no build step. Two Claude calls back to back - the first returns structured JSON (language, formality level, an array of topics each with its own category, urgency, and sentiment), the second takes that and drafts the reply, weaving every topic into one coherent message instead of just answering the loudest one.

Bring your own API key. Stays in the browser, never sent anywhere else.

## Setup

Open index.html, paste in an Anthropic API key, paste the client's message (and any context if you have it), hit "Generate Response."

## Why I built this

Real client emails rarely have just one ask - they mix a complaint with a question with a request for advice, all in one message, and treating it as a single category means something gets missed. This catches multiple topics in the same message and matches how the person actually wrote, in Spanish, English, or French.
