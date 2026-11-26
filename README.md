# 🏏 Cricket Scorer

A live scoreboard web app for local T10 / T20 cricket matches. Score every ball, track the target in the 2nd innings, and share the final scorecard. It runs fully in the browser with plain **HTML, CSS and JavaScript** (no frameworks, no backend).

**Live demo:** https://your-username.github.io/cricket-scorer/

![Cricket Scorer screenshot](screenshot.png)

## Features

- Match setup with team names, number of overs, number of wickets and toss (who bats first)
- Ball-by-ball scoring: 0, 1, 2, 3, 4, 6, Wide, No Ball and Wicket
- Correct cricket rules: wides and no balls add a run but are not counted as legal balls, and an over is 6 legal balls
- Live run rate, overs, and a colour-coded "this over" display
- 2nd innings shows the target, runs needed, balls left and required run rate
- Automatic result: wins by runs or wickets (with balls left), ties, and all-out handling
- **Undo** any ball
- Match is saved with `localStorage`, so a page refresh does not lose the score
- "Copy Scorecard" button to share the result (for example on WhatsApp)
- Keyboard shortcuts for fast scoring
- Fully responsive, so it works on a phone at the ground

## Tech used

- HTML5
- CSS3 (Grid, Flexbox, CSS variables, animations)
- Vanilla JavaScript (DOM manipulation, state management, localStorage, Clipboard API)

## How it works

The whole match is stored in one `state` object. Every ball updates that object, then `render()` redraws the screen from it. Before each ball a snapshot of the state is pushed to a `history` stack, which makes **Undo** simple and reliable.

## Run locally

1. Download or clone this repo
2. Open `index.html` in any browser

```bash
git clone https://github.com/your-username/cricket-scorer.git
cd cricket-scorer
```

## Deploy on GitHub Pages

1. Push the project to a GitHub repo
2. Go to **Settings → Pages**
3. Under Source choose **Deploy from a branch**, select **main** and **/ (root)**, then Save
4. Your site will be live at `https://your-username.github.io/cricket-scorer/`

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| 0–4, 6 | Add runs |
| E | Wide |
| N | No ball |
| W | Wicket |
| U | Undo |

## Future improvements

- Batsman and bowler wise scorecard
- Super over and Duckworth-Lewis
- Match history and tournament points table
- Export scorecard as PDF

## Author

**Pradyumna** · [GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-username)