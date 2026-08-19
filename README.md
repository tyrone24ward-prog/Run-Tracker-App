# Run Tracker

Phone app for tracking runs, storing 14-day totals, and running interval timers.

## Put it on your phone

This project targets **Expo SDK 54**, which matches Expo Go from the App Store / Play Store. You do not need to log in.

1. Install **Expo Go** from the App Store or Google Play (the store version is fine).
2. On this computer, in this folder, run:

```bash
npm start
```

3. If Expo Go or a website asks you to log in, close that screen. It is Expo’s account page, not the Run Tracker app.
4. Open Expo Go and scan the QR code (Android: scan inside Expo Go. iPhone: Camera app).
5. Allow **location** and **motion/fitness** when asked.

If the QR code does not connect, start with:

```bash
npx expo start --tunnel
```

Keep the computer and phone on while you use Expo Go. For a standalone app later, you can build an installable binary with EAS.

## What it does

- **Run:** Start / pause / stop tracking for distance, speed, pace, steps, and estimated calories.
- **Stats:** 14 days of daily totals, plus average steps, distance, and speed, with a Share button.
- **Timers:** countdown timer, stopwatch with laps, and a configurable Tabata timer (default 20s work / 10s rest × 8).
- **Profile:** weight, height, and miles vs kilometers. Weight is used for calorie estimates.

Data stays on the phone (no account). Calories are an estimate from speed and body weight, not a lab measurement.
