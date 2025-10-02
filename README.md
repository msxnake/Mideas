# Mideas - MSX Retro Game IDE

**Version 0.252**

Mideas is a web-based Integrated Development Environment (IDE) designed for creating games for the MSX (MSX1/MSX2) platform. It provides a comprehensive suite of visual editors and tools to streamline the game development process, from asset creation to level design.

## Features

*   **Visual Editors:**
    *   **Tile Editor:** Create and edit game tiles with support for various dimensions.
    *   **Sprite Editor:** Design sprites with a 4-color palette and manage multi-frame animations.
    *   **Screen Map Editor:** Build game levels with multiple layers (background, collision, entities, and effect zones).
    *   **World Map Editor:** Connect multiple screen maps to create larger game worlds.
    *   **Game Flow Editor:** Visually design the game's progression, from menus to world links.
    *   **Main Menu Editor:** Configure the game's main menu, options, and appearance.
    *   **Font Editor:** Edit the MSX1 character set for custom in-game fonts.
*   **Audio Tools:**
    *   **PT3 Music Tracker:** Compose chiptune music with instruments, ornaments, and patterns.
    *   **PSG Sound FX Editor:** Create sound effects for the Programmable Sound Generator.
*   **Entity Component System (ECS) Tools:**
    *   Define reusable **Component Definitions** for game logic.
    *   Create **Entity Templates** by combining components.
    *   Place **Entity Instances** on screen maps and override their properties.
*   **Code & Asset Management:**
    *   **Z80 Code Editor:** Write game logic with syntax highlighting for Z80 assembly.
    *   **File Explorer:** Manage all your project assets (tiles, sprites, maps, code, etc.) in a structured way.
    *   **Tile Banks:** Manage character sets and colors for SCREEN 2 projects.
    *   **Data Exporters:** Export assets to Z80 assembly (`.asm`) or binary (`.bin`) formats.
*   **Backend Services (Optional):**
    *   Includes a Node.js server for compiling Z80 code with the Glass assembler and compressing data with ZX0.

## Getting Started

Follow these steps to get the Mideas IDE running on your local machine.

### Prerequisites

*   **Node.js and npm:** Node.js is the JavaScript runtime environment, and `npm` is its package manager. You can download them from the [official Node.js website](https://nodejs.org/).
*   **Git:** A version control system used to clone the project repository. You can download it from [git-scm.com](https://git-scm.com/).

### Installation

1.  **Clone the Repository**

    Open your terminal or command prompt and run the following command to download the project:
    ```bash
    git clone https://github.com/msxnake/Mideas.git
    ```

2.  **Navigate to the Project Directory**

    Change your current directory to the newly created project folder:
    ```bash
    cd Mideas
    ```

3.  **Install Dependencies**

    Install all the necessary libraries and packages for the frontend application:
    ```bash
    npm install
    ```
    This may take a few minutes.

4.  **Run the Application**

    Start the local development server:
    ```bash
    npm run dev
    ```
    This command will launch the Vite development server. Once it's ready, it will display a local URL in the terminal (usually `http://localhost:5173`). Open this URL in your web browser to start using the IDE.

### Running the Backend Server (Optional)

The backend server provides compilation and compression services. To run it:

1.  **Navigate to the Server Directory**
    ```bash
    cd server
    ```

2.  **Install Server Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    node server.js
    ```
    The server will run on `http://localhost:3001`. The frontend application is configured to communicate with it automatically.

## Usage

*   **Create a New Project:** Use the "New Project" button in the toolbar to clear any existing work and start fresh.
*   **Manage Assets:** Use the "New Asset" dropdown to create tiles, sprites, screen maps, and more. All assets will appear in the "Project Assets" panel on the left.
*   **Edit Assets:** Click on an asset in the Project Assets panel to open its dedicated editor.
*   **View Properties:** When you select an asset or an element within an editor (like an entity on a map), its properties will be displayed in the "Properties Panel" on the right.
*   **Save Your Work:** Use "File > Save Project" or "File > Save As..." to save your entire project as a single `.json` file. Regular autosaving is also enabled by default.
*   **Export:** Most editors have an "Export" button to get your assets in a game-ready format (`.asm` or `.bin`). You can also export all code and binary files as a `.zip` archive from the main toolbar.
