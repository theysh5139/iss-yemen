# Admin Portal (React)

Implements the admin use-cases:
- A04: Create, edit, cancel/reactivate events
- A05: View event registrations per event (and add test registrations)
- A06: Manage members (list, deactivate/reactivate, add)

Data is stored in `localStorage` for simplicity. No backend required.

## Run locally

1. Install Node.js 18+.
2. Install deps:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

Open the URL printed in the console (usually `http://localhost:5173`).

## Notes
- First run seeds example events and members.
- You can clear browser storage to reset the app.


