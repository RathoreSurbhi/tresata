# Explainer video source

The 2 minute 44 second explainer video ([`../Virasat_Video.mp4`](../Virasat_Video.mp4)) is generated from code with [Remotion](https://www.remotion.dev). It has no voice-over; every scene is on-screen text and simple animation.

All numbers in the video come from the brief and the prototype: official figures from PIB, the HDFC merger and bonus filings, and the prototype's output for Rajesh's case (test case 14). The company and bank in the demo scene are synthetic.

## How to re-render

```bash
cd video
npm install
npx remotion studio src/index.jsx                                # preview in the browser
npx remotion render src/index.jsx Virasat out/virasat.mp4        # render the MP4
```

Scenes are in `src/Video.jsx`; shared styles and animation helpers are in `src/ui.jsx`.
