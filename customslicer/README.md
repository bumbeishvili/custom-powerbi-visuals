# Custom Slicer (Power BI Visual)

## Prerequisites
- Node.js (LTS recommended)
- npm
- Power BI Desktop (for local testing) or Power BI Service (app.powerbi.com)

## Install
1. Open a terminal in the project folder.
2. Install dependencies:
   npm install

## Run (Development)
1. Start the dev server:
   pbiviz start
2. Trust the local HTTPS certificate in your browser:
   - Open https://localhost:8080/assets/status
   - Click Advanced → Proceed (or equivalent)
3. Open Power BI and add the Developer Visual (</> icon). It connects to https://localhost:8080 by default.

## Power BI Service (app.powerbi.com)
- If localhost doesn’t work, use your local network IP (shown in the terminal when pbiviz starts), e.g.:
  https://192.168.x.x:8080
- Open https://192.168.x.x:8080/assets/status in the same browser and accept the certificate warning.

## Build Package
Create a distributable .pbiviz package:
   pbiviz package

## Troubleshooting
- If you see “Can’t contact visual server”, ensure:
  - pbiviz is running
  - The HTTPS certificate is trusted in the same browser
  - You are using the correct URL (localhost or your LAN IP)
