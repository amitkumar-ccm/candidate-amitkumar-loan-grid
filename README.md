# Loan Grid Table

A small Vue 3 + TypeScript + Vite project that implements a virtualized/incremental loan table with filtering, sorting, paging and tests.

## Overview

- Table UI: src/components/Table.vue
- Column header component: src/components/Header.vue
- Store/composable: src/composables/useTable.ts (table logic and state)
- Data model/types: src/types/table.ts
- Sample data generator script: scripts/generate-data.ts (produces data/loans.json and data/loans_100.json)
- Test files: src/components/Table.spec.ts and src/components/Header.spec.ts

## Features

- Client-side filtering: simple text search and status filtering
- Sorting: click a column header to toggle sort direction
- Incremental loading: load more / load previous rows with a loading indicator
- Pagination controls: configurable rows per page and page navigation
- Unit tests configured with Vitest

## Quick start

Prerequisites: Node 18+ recommended.

1. Install dependencies

```powershell
npm install
```

2. Start the dev server

```powershell
npm run dev
```

3. Run tests

```powershell
npm test
```

4. Build for production

```powershell
npm run build
npm run preview
```
