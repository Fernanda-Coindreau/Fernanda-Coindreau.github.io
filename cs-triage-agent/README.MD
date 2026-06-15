# CS Triage Agent

Paste in a support ticket and watch an AI agent think through 
it step by step, then draft a response based on what it 
decided.

## What it does

Pick a sample ticket - Fintech, HR Tech, Health Tech, or B2B 
SaaS - or paste your own. The agent works through three 
steps, showing its thinking at each one instead of just 
spitting out a final answer:

First it figures out what the customer is actually saying 
versus what they need, and rates how urgent it is. Then it 
decides what to do - reply directly, escalate to someone 
senior, ask for more info, or log it as a bug - and says why. 
Then it drafts whatever that decision calls for: a customer 
reply, an escalation email, a request for details, or a bug 
report.

Each step types out on screen as it finishes, so you can see 
the reasoning happen instead of staring at a spinner.

## Tech

Vanilla HTML/CSS/JS, no build step. Two Claude calls back to 
back - the first analyzes the ticket and returns structured 
JSON (analysis, decision, urgency, why), the second takes 
that and drafts whatever the decision calls for.

Bring your own API key. Stays in the browser, never sent 
anywhere else.

## Setup

Open `index.html`, paste in an Anthropic API key, pick a 
ticket or write your own, hit "Analyze Ticket."

## Why I built this

What usually gets lost when CS automates ticket routing is 
the "why" - something gets escalated and nobody can tell you 
the reasoning behind it. This shows the reasoning at every 
step, not just the outcome. The tickets are deliberately not 
hospitality - fintech, HR, health tech - because this kind of 
triage doesn't actually care what industry it's in.
