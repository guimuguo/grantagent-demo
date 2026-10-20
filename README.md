# GrantAgent — interactive demo

A static, clickable prototype of **GrantAgent**, a weekly federal-funding
matching service for university faculty.

**Live demo:** https://guimuguo.github.io/grantagent-demo/

## What's real and what isn't

- **Opportunities** are real, public grants.gov listings (snapshot of the
  date the demo was built).
- **The demo user is Guimu Guo** (Computer Science, Rowan University) — his
  real publication profile from OpenAlex. His match rationales are
  illustrative examples written for the demo.
- **Suggested collaborators on the BRAIN and eMB matches are real Rowan
  faculty**, identified from their public publication records (name,
  department and one of their own recent papers). The proposal titles and
  team rationales are illustrative.
- **Everyone else is fictional** — colleagues, other subscribers,
  review-queue items and other faculty's agent transcripts are made up. Any
  resemblance to real people is coincidental.
- **There is no backend.** Every API call is answered in the browser from
  `src/demo/fixtures.json` by `src/demo/mock.ts`. Saves, feedback and review
  decisions are kept in your browser's localStorage only ("Reset demo data"
  in the top banner clears them).

## What you can try

| Page | Shows |
| --- | --- |
| `/dashboard` | Weekly matches with fit rationales, score slider, feedback buttons, popular-at-institution, saved list |
| `/browse` | Search / filter / sort all open opportunities by match quality, deadline or award |
| `/opportunities/<id>` | Opportunity detail with summary and eligibility |
| `/profile` | Publication profile pulled from OpenAlex, with "remove misattributed papers" |
| `/admin/*` | Faculty roster, opportunities, weekly matches, human review queue, AI agent transcripts, cost & quality stats |
| `/signup`, `/login` | Magic-link sign-up and login flow |

## Run locally

```bash
npm ci
BASE_PATH="" npx next build   # static export into out/
npx serve out
```

## Deploy

`npm run deploy` builds the static export and force-pushes it to the
`gh-pages` branch, which GitHub Pages serves.
