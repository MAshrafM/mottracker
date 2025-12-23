# Motor Tracker

Motor Tracker is a comprehensive full-stack web application designed to track and manage motor equipment histories, maintenance, and relevant documentation. Built with the MERN stack (MongoDB, Express, React, Node.js), it features real-time updates, secure authentication, and robust reporting capabilities.

## Features

*   **Real-time Tracking**: Live updates of motor statuses and changes using Socket.io.
*   **Equipment Management**: Detailed tracking of motors, their history, and assigned equipment.
*   **Authentication & Security**: Secure user registration and login with JWT and Bcryptjs.
*   **Reporting**: Export data to Excel and generate PDF reports.
*   **Modern UI/UX**: Responsive design built with React 19 and Tailwind CSS.
*   **Integration**: Integrated with Google APIs for enhanced functionality.

## Technology Stack

### Client (Frontend)
*   **Framework**: React 19
*   **Styling**: Tailwind CSS (configured with Craco)
*   **State/Network**: Axios, Socket.io-client
*   **Icons**: Lucide React
*   **Routing**: React Router DOM 7

### Server (Backend)
*   **Runtime**: Node.js & Express
*   **Database**: MongoDB with Mongoose ODM
*   **Real-time Engine**: Socket.io
*   **Security**: JWT (JSON Web Tokens), Bcryptjs
*   **Docs & File Handling**: ExcelJS, PDF-lib

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or Atlas connection)

## Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd MotorTracker
    ```

2.  **Server Setup**
    Navigate to the server directory and install dependencies:
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server` root and configure your environment variables (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`).
    *   To seed the database with initial data (optional):
        ```bash
        npm run import
        ```
    *   To start the backend server:
        ```bash
        npm start
        ```

3.  **Client Setup**
    Navigate to the client directory and install dependencies:
    ```bash
    cd ../client
    npm install
    ```
    *   Create a `.env` file in the `client` root to point to your backend API (e.g., `REACT_APP_API_URL=http://localhost:5000`).
    *   To start the frontend development server:
        ```bash
        npm start
        ```

## Usage

*   **Development**: Run both client and server terminals separately using `npm start` in their respective directories.
*   **Building**: To create a production build of the frontend, run `npm run build` in the `client` directory.

## License

This project is licensed under the ISC License.