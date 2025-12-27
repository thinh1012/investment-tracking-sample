
# Crypto Investment Tracking

A robust, local-first portfolio tracking application built with React, Vite, and Clean Architecture principles.

## Features
*   **Portfolio Tracking**: Track current holdings across Wallets and Liquidity Pools (LP).
*   **Accumulation Goals**: Set targets and track your progress automatically.
*   **Performance Analytics**: PnL calculation, Average Buy Price, and ROI tracking.
*   **Data Privacy**: All core portfolio data is stored locally in your browser (IndexedDB).
*   **Intelligence Engine**: Native **SQLite**-powered ecosystem research with high-density data persistence.
*   **Desktop App**: Electron-powered desktop experience with native filesystem access.
*   **Notifications**: Set price alerts via Telegram or Email.

## Getting Started

Follow these instructions to run the application on your local machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (Version 20+ recommended)
*   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd investment-tracking
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## Data Migration (Moving to a new PC)

Since data is stored locally, you need to manually export/import it when switching devices.

### On the Old PC:
1.  Go to **Settings** > **Data Management**.
2.  Click **Export Backup**.
3.  Save the `.json` file to a USB drive or cloud storage.

### On the New PC:
1.  Install and run the app as described above.
2.  Go to **Settings** > **Data Management**.
3.  Click **Restore Backup** and select your `.json` file.
4.  Confirm the restore action. The app will reload with all your data intact.

## Tech Stack
*   **Frontend**: React (v19), TypeScript, Vite
*   **Desktop**: Electron
*   **Storage**: SQLite (`better-sqlite3`), IndexedDB (`idb`)
*   **Styling**: Tailwind CSS (v4)
*   **Analytics/Charts**: Recharts
*   **Icons**: Lucide React
*   **Testing**: Vitest

## License
MIT