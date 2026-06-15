# PredictCSM — AI Retention Playbook

Move some sliders on an account's health, get back a 
retention playbook and an email ready to send - both written 
around how bad things actually look for that account.

## What it does

Fill in the account name, contact, segment, and renewal 
timeline, then adjust five sliders: product usage, login 
frequency, NPS/CSAT, support tickets, days since last touch. 
A weighted formula turns those into a risk score - Low, 
Medium, High, or Critical - that updates live as you move 
things around.

Hit generate and Claude writes a playbook (risk summary, why 
this might be happening, what to do about it, when to 
escalate, what success looks like in 30 days) plus an 
outreach email addressed to the contact by name. The tone of 
both shifts with the risk tier - a low-risk account gets a 
casual check-in, a critical one gets language that sounds 
like it actually needs to happen today.

## Tech

Vanilla HTML/JS, Tailwind via CDN. The risk score is computed 
client-side - a weighted formula across the five metrics plus 
renewal timeline - and that score gets handed to Claude 
alongside the raw numbers. So the model isn't guessing how 
bad things are, it already knows. One API call returns both 
the playbook and the email as JSON.

Bring your own API key, entered through the settings icon. 
Stays in the browser.

## Setup

Open `predictcsm.html`, add your Anthropic API key (gear icon, 
top right), fill in the account details, move the sliders, 
hit "Generate Playbook."

## Why I built this

I've seen a lot of retention plans that say the same things 
no matter what's actually going on - "increase engagement," 
"schedule a check-in" - even when the account is two weeks 
from churning. Feeding Claude the actual numbers (23% usage, 
14 days since last touch, NPS of 4) means it writes about 
those numbers instead of generic advice. And the email 
actually reads differently depending on how serious things 
are - a CSM isn't sending the same "just checking in" note to 
an account that's about to walk.
