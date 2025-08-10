# Metal Technology Website – Central Google Sheet Setup

Follow these steps to make a single Google Sheet the central data store for quiz results, advanced responses, and scenario submissions.

## 1) Create/prepare the Google Sheet tabs
Create a Google Sheet with the following tabs (sheet names must match):
- Main Theory Sheet
- Support Theory Sheet
- Advanced Theory Sheet
- Scenario Responses

For `Main Theory Sheet` and `Support Theory Sheet`, add a header row:
```
Name | Quiz | Score | Date
```
Other sheets will be auto‑headed by the script.

## 2) Add the Apps Script
Attach an Apps Script to the Sheet (Extensions → Apps Script) and paste the code from `apps-script/Code.gs` in this repo. Deploy as a Web app (Deploy → New deployment):
- Type: Web app
- Who has access: Anyone with the link
- Copy the Web app URL

## 3) Point the website at the Web App URL
Create `config.json` in the site root with your Web App URL:
```
{
  "appsScriptUrl": "https://script.google.com/macros/s/AKfycb.../exec"
}
```
A template is provided at `config.example.json`.

## 4) What gets written where
- Quiz submissions (kind: `quiz`) go to `Main Theory Sheet` by default; if the `quizNumber` starts with `S` they go to `Support Theory Sheet`, and with `A` to `Advanced Theory Sheet`.
- Advanced open‑ended responses (kind: `advanced`) go to `Advanced Theory Sheet`. The script will create/update headers based on the question keys (`q1`, `q2`, ...).
- Scenario responses (kind: `scenario`) go to `Scenario Responses` with dynamic headers as above.

The front‑end loads `config.json` at runtime and posts all submissions to the single Apps Script endpoint.