# MotoSales CRM

A comprehensive Customer Relationship Management (CRM) system designed for motorcycle dealerships. This application helps manage sales, track prospects through a Kanban funnel, inventory control, and performance reporting.

## 🚀 Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
*   **Backend / Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 🛠️ Setup & Installation

### Prerequisites

*   Node.js 18+ installed.
*   A Firebase project created in the [Firebase Console](https://console.firebase.google.com/).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd motosales-crm
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your Firebase configuration keys. You can find these in your Firebase Project Settings.

    ```env
    NEXT_PUBLIC_API_KEY=your_api_key
    NEXT_PUBLIC_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_PROJECT_ID=your_project_id
    NEXT_PUBLIC_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_APP_ID=your_app_id
    NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id
    ```

    > **Note:** If these are not set, the application will show a configuration error screen.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📂 Architecture

The project follows a modular structure focusing on separation of concerns:

*   **`src/app`**: Next.js App Router pages and layouts.
    *   `dashboard/`: Protected routes for the main application.
*   **`src/components`**: UI components.
    *   `ui/`: Reusable primitive components (shadcn/ui).
    *   `prospects/`, `inventory/`, `sales/`: Feature-specific components.
*   **`src/firebase`**: Firebase configuration and service layer.
    *   `services/`: dedicated modules for Firestore operations (e.g., `prospects.ts`, `sales.ts`). This decouples data fetching from UI components.
*   **`src/hooks`**: Custom React hooks (e.g., `useDashboardData`, `useUser`).
*   **`src/lib`**: Utilities, constants, and type definitions.

## ✨ Key Features

*   **Dashboard**: Real-time overview of sales performance, commissions, and KPIs.
*   **Prospects Funnel**: Kanban board to track leads from "Potential" to "Closed". Supports drag-and-drop.
*   **Inventory Management**: Manage motorcycle models and stock/SKUs.
*   **Sales Recording**: Record sales with support for Cash or Financing (with credit providers).
*   **Reports**: Detailed sales reports filterable by Sprint (month).
*   **Sprint Management**: Monthly sprint cycles with historical data preservation.

## 🤝 Contributing

1.  Ensure you have the latest dependencies.
2.  Run `npm run typecheck` to verify TypeScript types.
3.  Run `npm run lint` to catch code style issues.
