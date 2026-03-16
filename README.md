# AI_QA_Workbench

## A developer tool for testing, evaluating, and tracking the quality of AI model responses — built with TypeScript, HTML, and CSS.

What's in this project?
The AI QA Workbench is a lightweight web app that gives AI developers and QA testers a structured workflow for evaluating AI model outputs. Instead of copy and pasting prompts into a chat interface and mentally noting what went wrong, you get a full evaluation loop:

Run a test — type a prompt, pick a model, fire it at the real API
Evaluate the response — star rating, pass/fail verdict, written notes
Log bugs — capture failures with severity levels and reproduction steps
Analyse trends — see pass rates, average quality scores, and open bug counts across all your tests


Features

Live AI testing — calls the Anthropic API directly from the browser (bring your own sk-ant- key)
Multi-model support — test claude-sonnet-4-6, claude-opus-4-6, or mock GPT-4o/Gemini for UI testing
Test categories — tag each run as General quality, Edge case, Safety/refusal, Factual accuracy, or Instruction following
5-star rating system — quick quality signal alongside the pass/fail verdict
Bug tracker — log issues with Low/Medium/High severity, toggle open/closed, auto-fill from a failed test
Feedback analysis — aggregated metrics: pass rate %, average rating, bugs by severity
Dark mode — automatic via prefers-color-scheme
No backend required — pure frontend, runs entirely in the browser

## Tech Stack
LayerTechnologyWhyLanguageTypeScript 5.4Type safety, autocomplete, catch bugs at compile timeBuild toolVite 5.2Instant dev server with hot reload, fast production buildsStylingVanilla CSSCSS custom properties, dark mode, zero dependenciesAPIAnthropic Messages APIDirect browser-to-API calls for live testingArchitectureES ModulesClean imports/exports, no framework needed

## Architecture principle
Data flows in one direction:
User action → main.ts → api.ts / state.ts → ui.ts → Screen
Each file has a single responsibility. main.ts coordinates but holds no logic. state.ts owns data but renders nothing. ui.ts renders but stores nothing. This makes each file independently testable and easy to extend.

## Installation:
-Node.js v18 or higher
-An Anthropic API key (starts with sk-ant-) — optional, mock models work without one
-Install dependencies
-npm install

## Start the development server
-npm run dev
-Your browser will open automatically at http://localhost:3000.
-Paste your Anthropic API key into the bar at the top — the dot turns green when valid
-Select a model and test category
-Type a prompt and click Run test
-The app calls the API and displays the response
-Rate the response (1–5 stars), set a verdict (pass/fail/partial), add notes
-Click Save result — or Log as bug if something went wrong
-Check the Results log and Feedback analysis tabs to see trends


## TypeScript Concepts Demonstrated
This project was built as a learning exercise in TypeScript. Key concepts used:
ConceptWhereWhat it doesinterfacetypes.tsDefines the shape of TestResult, Bug, AppStateUnion typestypes.tstype Verdict = 'pass' | 'fail' | 'partial' — limits valid valuesextendstypes.tsTestResult extends TestRun — inherits all fields plus adds new onesOptional fields ?types.tslinkedTestId?: number — field may or may not be presentGenerics <T>ui.tsel<HTMLInputElement>('id') — typed DOM accessOmit<T, K>main.tsRemoves fields from a type to represent a partially-complete objectasync/awaitapi.tsNon-blocking API calls that read like synchronous codePromise<T>api.tsReturn type of every async functionReadonly<T>state.tsPrevents external code from mutating state directlyES Modulesall filesimport/export — each file is a self-contained module

## Available Scripts
bashnpm run dev      # Start development server at localhost:3000 (with hot reload)
npm run build    # Compile TypeScript and bundle for production → dist/
npm run preview  # Preview the production build locally

## Extending the Project
Some ideas for taking this further:

localStorage persistence — save results across browser sessions with JSON.stringify / JSON.parse
CSV export — convert the results array to a downloadable .csv file
Backend API — move the API key to a Node.js/Express server so it is never exposed in the browser
Database — persist results to SQLite or PostgreSQL for multi-user, cross-device access
Charts — add pass rate trend lines per model using Chart.js
Side-by-side comparison — send one prompt to two models simultaneously and compare outputs
Authentication — add login so multiple testers each have their own results


Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Acknowledgements
Built with Vite and the Anthropic Messages API. Developed as a practical TypeScript learning project demonstrating clean architecture, type safety, and separation of concerns.
