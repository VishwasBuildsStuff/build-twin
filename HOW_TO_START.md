# How to Start BuildTwin

BuildTwin is a Vite and React website. The app is inside the `aethertwin` folder.

## Requirements

- Node.js 18 or newer
- npm (included with Node.js)

## Install and run locally

Open a terminal in the `build-twin` project folder, then run:

```sh
cd aethertwin
npm ci
npm run dev
```

Open the local URL printed by Vite in your browser. It is usually:

```text
http://localhost:5173
```

On first use, choose **Create account**. Each account has one personal twin. Personal details start blank; neutral simulation defaults keep the charts usable until values are entered. Use the **My Health Data** tab to enter personal details, vitals, daily lifestyle values, and optional advanced model inputs. Saved values update the simulator and other twin views.

Accounts and measurements are stored only in the current browser on this device. This demo has no server-backed accounts or cross-device sync; do not enter sensitive real-world health information.

Keep the terminal running while you use the website. Press `Ctrl+C` in that terminal to stop it.

## Build and preview the production site

From the `aethertwin` folder, run:

```sh
npm run build
npm run preview
```

Open the preview URL printed by Vite (usually `http://localhost:4173`).

## Troubleshooting

- If `npm` or `node` is not recognized, install Node.js, close and reopen the terminal, and try again.
- If port `5173` is already in use, stop the other development server or use the alternate URL Vite prints.
- If dependency installation fails, confirm you have an internet connection and run `npm ci` again from `aethertwin`.

BuildTwin is a research/demo simulation. Its projections are not medical advice or a medical device.
