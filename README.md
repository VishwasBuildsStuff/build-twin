# BuildTwin

BuildTwin (AetherTwin Health) is a browser-based digital health twin demo. It lets a user enter health and lifestyle values, explore simulated changes, review organ-level projections, and generate a case report.

> **Demo only:** this project is not a medical device and does not provide medical advice or a diagnosis. The reviewer personas and generated projections are for demonstration only.

## Features

- Local sign-up and sign-in screens.
- A personal health data form for profile details, vitals, daily lifestyle values, and optional simulation parameters.
- A live twin simulator with adjustable lifestyle inputs and projected glucose, heart-rate, and cortisol curves.
- An organ visualization, intervention assistant, and evaluation/report view.
- Per-account settings and entered values saved in the current browser.

### Account and data storage

This is a frontend-only prototype. There is no server, database, account recovery, or cross-device synchronization. Accounts and profile data stay in the browser's local storage on the current device. Passwords are stored as salted PBKDF2 hashes, but this local demo flow is not a substitute for production authentication. Avoid entering sensitive real-world health information.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Open a terminal in the repository root, then run:

```sh
cd aethertwin
npm ci
npm run dev
```

Open the local address Vite prints in the terminal. It is usually <http://localhost:5173/>. Keep the terminal open while using the site; press `Ctrl+C` to stop the development server.

On first use, select **Create account**. Each account sees one personal twin; personal details start blank, while neutral simulation defaults keep the charts usable until values are entered. Saving **My Health Data** updates the simulator and other views.

## Production build and preview

From the `aethertwin` directory:

```sh
npm run build
npm run preview
```

Vite prints a local preview address, usually <http://localhost:4173/>.

## Project layout

```text
build-twin/
├── README.md
├── HOW_TO_START.md
└── aethertwin/
    ├── index.html
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx
        ├── components/
        └── data/
```

The application source is in `aethertwin/src`. The React entry point is `src/main.jsx`; patient presets and simulation calculations are in `src/data/patients.js`.

## Troubleshooting

- If `node` or `npm` is not recognized, install Node.js and reopen the terminal.
- If port 5173 is busy, stop the other dev server or use the alternate address Vite prints.
- If dependencies are in a bad state, run `npm ci` again from `aethertwin`.
- If the page is blank after a source change, check the terminal and browser console for errors, then reload the page.

For the shorter startup checklist, see [HOW_TO_START.md](HOW_TO_START.md).
