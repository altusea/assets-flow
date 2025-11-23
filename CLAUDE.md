# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production (includes TypeScript check)
- `npx vue-tsc --noEmit` - Type checking only
- `npm run tauri dev` - Run as desktop app
- `npm run tauri build` - Build desktop app

## Project Architecture

This is a **weekly asset tracking application** built with Tauri + Vue 3 + TypeScript. The app helps users record their account balances weekly (with Saturday as the record date).

### Core Data Model

- **Account**: Represents financial accounts (bank cards, cash, stocks, etc.)
  - Types: 'bank', 'cash', 'stock', 'other'
  - Stored via swappable storage backends

- **WeeklyRecord**: Weekly balance snapshots for each account
  - `recordDate`: Always Saturday date for the record
  - Links to Account via `accountId`

- **WeeklySummary**: Aggregated view of all accounts for a specific week

### Storage Architecture (Key Recent Feature)

The application now supports **swappable storage backends** with a factory pattern:

- **StorageFactory** (`src/storage-factory.ts`): Central storage service factory
  - Supports 'localStorage' and 'drizzle' storage types
  - Provides unified `IStorageService` interface
  - Handles data migration between backends

- **LocalStorageAdapter**: Original localStorage implementation (now wrapped)
- **DrizzleAdapter**: New Drizzle/SQLite implementation with enhanced type safety

### Key Services & Components

- **StorageFactory** (`src/storage-factory.ts`): Central storage management with swappable backends
  - Manages accounts, weekly records, and notes
  - Provides data migration capabilities
  - Exports `storageService` for backward compatibility

- **Type definitions** (`src/types.ts`): Complete TypeScript interfaces and utility functions
  - Date helpers: `getRecordDate()` handles Saturday-as-record-date logic
  - Currency formatting: `formatCurrency()` for CNY display
  - Account type helpers

### Component Architecture

- **App.vue**: Main container with navigation (Dashboard, Records, Table, Accounts, Settings)
- **Dashboard.vue**: Overview with total assets, distribution charts, recent history
- **WeeklyRecordManager.vue**: Weekly balance recording and history viewing
- **AccountManager.vue**: CRUD operations for accounts
- **DetailedRecordsTable.vue**: Complete historical data table view
- **StorageSettings.vue**: Storage backend configuration and data migration

### Data Flow

1. All data operations go through `StorageFactory` which routes to the active storage backend
2. Components use the exported `storageService` for data operations
3. Storage backends can be switched dynamically via the Settings page
4. Data migration between backends is supported
5. Date calculations use Saturday as record date (business requirement)
6. Currency display is CNY only (no internationalization needed)

### Port Configuration

- Development server configured for port 3000 (not 1420 default)
- Modified in `vite.config.ts` to avoid permission issues

### Tauri Integration

- Basic Tauri setup with opener plugin
- Backend Rust code is minimal (mainly boilerplate)
- All business logic implemented in TypeScript/Vue