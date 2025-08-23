1# Project Overview

This project is a comprehensive, web-based Integrated Development Environment (IDE) specifically designed for creating games and applications for the MSX home computer system. It's built as a modern single-page application using React and TypeScript, with a Node.js backend providing essential services.

The IDE, named "Mideas," offers a rich suite of tools for retro game development, including:

*   **Asset Editors:**
    *   Tile Editor
    *   Sprite Editor (with animation support)
    *   Screen Editor (for building game levels/maps)
    *   Font Editor
    *   Sound and Music Tracker (PT3)
    *   Behavior Script Editor
*   **Entity Component System (ECS):** A system for defining component definitions and entity templates, allowing for a structured approach to game object creation.
*   **Code Editor:** An integrated editor for Z80 assembly language with syntax highlighting.
*   **Project Management:** Features for creating, saving, loading, and exporting projects, including all assets and code.
*   **Compilation and Compression:** The backend server integrates Java-based tools (`glass.jar` for Z80 assembly, `zx0.jar` for compression) to compile and compress game data.

The architecture is client-server:
*   **Frontend:** A React application built with Vite. It manages the entire UI, state, and various editors. The main application logic is contained within `App.tsx`.
*   **Backend:** A Node.js/Express server that exposes endpoints for compiling Z80 assembly code and compressing assets.

# Building and Running

The project consists of a frontend application and a backend server. Both need to be running for the IDE to be fully functional.

## Frontend

1.  **Install Dependencies:**
    Navigate to the project root and run:
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically available at `http://localhost:3000`.

## Backend

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Server:**
    ```bash
    node server.js
    ```
    The server will start and listen for requests on port 3001.

# Development Conventions

*   **Technology Stack:** The project uses React with TypeScript for the frontend and Node.js with Express for the backend.
*   **State Management:** The main application state is managed within the `App.tsx` component using React hooks (`useState`, `useCallback`, `useEffect`).
*   **Component Structure:** Components are organized by feature/editor type within the `src/components` directory.
*   **Styling:** (Inferring from file structure and typical React projects) Styling is likely handled on a per-component basis, possibly using CSS modules or a CSS-in-JS library, though no explicit styling files were read.
*   **Code Style:** The code follows modern JavaScript/TypeScript conventions, including the use of functional components and hooks.
*   **Backend Services:** The backend provides distinct services for compilation and compression, which are called from the frontend via API requests.
