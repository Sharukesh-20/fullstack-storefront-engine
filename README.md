# Forma Mart — Full-Stack E-Commerce Storefront

> **Project Type**: Full-Stack E-Commerce Web Application  
> **Architecture**: React (Vite) Frontend + Node.js/Express Backend  
> **Status**: Production-Ready Full-Stack Experience Complete

Forma Mart is an editorial, minimalist consumer storefront crafted for modern workstation accessories, acoustic devices, and everyday carry pieces. Inspired by clean editorial design and restrained clarity, Forma Mart combines warm ivory surfaces, ink typography, and deliberate art direction.

---

## 🎨 Visual Identity & Design Principles

- **Warm Neutral Foundation**: Warm ivory/off-white background (`#fafaf8`), crisp white surfaces, rich ink-black headings (`#111111`), and subtle border dividers (`#eae8e1`).
- **Editorial Typography**: Pairing of modern sans-serif (`Plus Jakarta Sans`) with elegant serif accents (`Playfair Display`) for headings and philosophical statements.
- **Micro-Interactions**: Gentle image zoom states, tactile button responses, and smooth category transitions adhering to `prefers-reduced-motion`.
- **Responsive Architecture**: Fluid adaptation across desktop, tablet, and mobile screens without horizontal overflow.

---

## 🚀 Implemented Routes & Visual Layouts

| Route | Component | Highlights of the Experience |
| :--- | :--- | :--- |
| `/` | `HomePage` | Cinematic campaign hero, 4 category discovery tiles, curated studio drops, signature collection feature, and material craftsmanship statement. |
| `/products` | `ProductsPage` | Complete catalogue with live sorting (Curated, Price Low-High, Price High-Low, Alphabetical), category filter pills, and inventory counter. |
| `/products/:slug` | `ProductDetailPage` | High-fidelity product showcase, interactive quantity counter, technical specifications table, value guarantees, and related studio pairings. |
| `/cart` | `CartPage` | Responsive shopping bag with persistent global cart state management (`CartContext`). |
| `/*` | `NotFoundPage` | Restrained 404 error page with quick links back to the active catalogue. |

---

## 🛠️ Technology Stack

- **Build Tool**: [Vite 8](https://vite.dev/) — High-speed modern bundler with Hot Module Replacement (HMR).
- **Frontend Framework**: [React 19](https://react.dev/) — Functional components with hooks.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) — Integrated via official `@tailwindcss/vite` plugin.
- **Routing**: [React Router v7](https://reactrouter.com/) (`react-router-dom`) — Declarative client-side routing.
- **Icons**: [Lucide React](https://lucide.dev/) — Consistent, lightweight line icons.
- **Backend API**: Node.js & Express REST API with MongoDB/Mongoose data models and automated seed scripts.
- **Linter**: [Oxlint](https://oxc.rs/) — High-speed linting with React purity checks.

---

## 📦 Prerequisites & Installation

### Prerequisites

- **Node.js**: `v18.0.0` or later
- **npm**: `v9.0.0` or later

### Development & Build Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR at `http://localhost:5173/` |
| `npm run server` | Starts the Express backend API server |
| `npm run build` | Compiles production-ready bundle into `dist/` |
| `npm run lint` | Runs Oxlint across all source files |