# Ilerioluwa Goalkeeper Training Center

Official website of the **Ilerioluwa Goalkeeper Training Center** — a
goalkeeper training academy in Ibadan, Nigeria developing the next generation of
goalkeepers through structured coaching, discipline, and opportunity.
*Guardian of Goal.*

**Website:** https://subtiliorars-sys.github.io/Ilerioluwa-GoalKeeper-Training-Institute---Preview/

> **Status:** demonstration build — content marked `SAMPLE` is placeholder data
> pending confirmation by the Center.

## About the Center

The Center provides specialist goalkeeper training — technique,
positioning, distribution, fitness, and the mental side of the position —
for young players (U15–18+) working toward club, academy, and professional
opportunities. Boys and girls train together, 3 sessions per week, at
Marvelous Pitch, Liberty Stadium, Ibadan, Oyo State, Nigeria.

## About this repository

This repo contains the source for the Center's public website:

- Lightweight, mobile-first static site (most visitors are on phones and
  mobile data) — every page well under 200KB
- No build step required — plain HTML/CSS/JS, deployable via GitHub Pages
- Installable PWA with offline support (`manifest.json` + `sw.js`)
- Includes **Guardian of Goal**, an original canvas penalty-save mini-game

```
index.html         Home — free-trial CTA, the game, news teaser
programs.html      Program tiers, curriculum, scholarships, 1-on-1
trials.html        Free-trial funnel + booking form (WhatsApp-first)
coaches.html       Coaching staff + standards
stories.html       Success stories (real, permission-gated)
schedule.html      Weekly timetable + venue
gallery.html       Photo gallery (consent-gated)
faq.html           Parents' questions
drills.html        Free train-at-home goalkeeper drills
glossary.html      "Speak Keeper" — goalkeeper terms
news.html          Announcements + articles
safeguarding.html  Child-safety & photo policy (public commitment)
flyer.html         Print-ready A5 flyer with WhatsApp QR
404.html /offline.html   Branded error + offline pages
assets/            Stylesheet (no frameworks) + minimal JS + images
```

### Working on it

- `main` **is the live site** (GitHub Pages) — work on a branch; merging to
  main publishes.
- Run `./check.sh` before any push to main: validates HTML, links, structured
  data, nav consistency, and that the service-worker precache matches the
  asset versions the pages reference.
- Cache discipline: bumping any `?v=` requires updating the matching
  `PRECACHE` entry in `sw.js`; editing an *unversioned* asset requires
  rotating the `CACHE` name.

### Content rules (non-negotiable)

- No invented testimonials, placements, fees, or dates — unknowns say
  "contact us on WhatsApp."
- No photo in which a child is identifiable without written parental
  permission — see the site's safeguarding page for the public policy.

## Contact

Contact details will be published on the website. For matters relating to
this repository, open an issue.

## License

The website **source code** is available under the MIT License — see
[LICENSE](LICENSE).

The Center's **name, logo, branding, photographs, and written content**
are © 2026 Ilerioluwa Goalkeeper Training Center, all rights reserved,
and are **not** covered by the MIT License.


<!-- Force redeploy -->
