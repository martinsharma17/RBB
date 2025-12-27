# Authentication & Role-Based System Documentation

This repository contains a full-stack application demonstrating secure authentication and role-based access control (RBAC).

## 🏗 System Architecture

The system consists of two main parts:

1.  **Backend (AUTHApi)**: built with **.NET Core (C#)**. It handles:
    *   Database interactions (SQL Server via Entity Framework Core).
    *   User Identity Management (ASP.NET Core Identity).
    *   JWT Token Generation & Validation.
    *   API Endpoints protected by Role Policies.

2.  **Frontend (AUTH-Frontend)**: built with **React (Vite)**. It handles:
    *   User Interface for Login, Registration, and Dashboards.
    *   JWT Token Storage (localStorage).
    *   Role-Based Routing (Redirecting users to correct pages).
    *   Protecting routes using a global Authentication Context.

---

## 🔐 Data Flow & API Usage

How the Frontend talks to the Backend:

1.  **Registration**:
    *   Frontend sends `POST { name, email, password }` to `/api/UserAuth/Register`.
    *   Backend creates user and **automatically assigns the 'User' role**.

2.  **Login**:
    *   Frontend sends `POST { email, password }` to `/api/UserAuth/Login`.
    *   Backend verifies credentials and returns a **JWT (JSON Web Token)** containing the user's ID, Email, and **Roles**.

3.  **Authenticated Requests**:
    *   For subsequent requests (e.g., getting user data), the Frontend attaches the Token to the request headers: `Authorization: Bearer <TOKEN>`.
    *   Backend middleware validates the signature and expiration of the token.

---

## 🛡 Roles & Permission System

The system defines 4 hierarchy levels. Each level has access to its own dashboard and potentially lower levels.

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **SuperAdmin** | Highest | Can manage everything, including creating/deleting other admins and roles. |
| **Admin** | High | Can manage users under their department. Access to `/api/Roles` endpoints. |
| **Manager** | Medium | Can view reports and manage team data. |
| **User** | Basic | Standard access. Can view their own profile. |

### Frontend Logic
*   **`src/context/AuthContext.jsx`**: Decodes the JWT token to extract the role list.
*   **`src/App.jsx`**: Checks the role list to decide which Dashboard component to render.
    *   *Example*: If `isSuperAdmin` is true -> Render `<SuperAdminDashboard />`.
    *   *Example*: If user tries to access `/dashboard` but has no role -> Redirect to Login.

### Backend Logic
*   **Attributes**: Controllers use `[Authorize(Roles = "SuperAdmin")]` to lock down endpoints.
*   **Policies**: Defined in `Program.cs` (e.g., `policy.RequireRole("Admin")`) for more complex rules.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### 📋 Prerequisites

Ensure you have the following installed:

*   **Doenet SDK 9.0**: [Download .NET 9.0](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
*   **Node.js (LTS)**: [Download Node.js](https://nodejs.org/) (v18+ recommended)
*   **SQL Server**: [Download SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (or use a local instance)
*   **Git**: [Download Git](https://git-scm.com/downloads)

### 📥 Cloning the Repository

```bash
git clone https://github.com/your-username/UserManagement.git
cd UserManagement
```

### ⚙️ Backend Setup (AUTHApi)

1.  **Navigate to the backend directory**:
    ```bash
    cd AUTHApi
    ```

2.  **Configure Database**:
    *   Open `appsettings.json`.
    *   Update the `DefaultConnection` string if your SQL Server instance is different from `Server=localhost\\SQLEXPRESS`.

3.  **Restore Dependencies & Database**:
    ```bash
    dotnet restore
    dotnet ef database update
    ```
    *This command applies migrations and seeds the initial SuperAdmin user and Roles.*

4.  **Run the Server**:
    ```bash
    dotnet run
    ```
    *The API will start at `http://localhost:5033` (or similar, check terminal output).*

### 🎨 Frontend Setup (AUTH-Frontend)

1.  **Open a new terminal** and navigate to the frontend directory:
    ```bash
    cd AUTH-Frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    *The application will be accessible at `http://localhost:5173`.*

### 1. Database Setup
1.  Make sure you have **SQL Server** installed.
2.  Update the connection string in `AUTHApi/appsettings.json`.
3.  Open a terminal in `AUTHApi/` and run migrations:
    ```bash
    dotnet ef database update
    ```
    *This creates the database and seeds the default roles and SuperAdmin user.*

### 2. Running the Backend
1.  Open `AUTHApi/` in your terminal.
2.  Run the server:
    ```bash
    dotnet run
    ```
    *Server usually starts on http://localhost:5033 or https://localhost:7147 (check terminal output).*

### 3. Running the Frontend
1.  Open `AUTH-Frontend/` in a new terminal.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
    *App runs on http://localhost:5173.*

---

## 📂 Key Files to Review

*   **Backend**:
---

## 🛠 How to Add a New Menu Item (Sidebar)

Adding a new page to the sidebar requires a 3-step process to ensure the icon, the page content, and the database link are all synchronized.

### 1. Define the Icon (Frontend)
Open `AUTH-Frontend/src/components/dashboard/SidebarIcons.jsx` and export a new SVG component.
```javascript
export const MyNewIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} ...> ... </svg>
);
```

### 2. Map the View (Frontend)
Open `AUTH-Frontend/src/components/dashboard/ViewMapper.jsx` and add a case for your new `ViewId`.
```javascript
case 'my_new_view': 
    return <MyNewComponent {...props} />;
```

### 3. Seed the Menu (Backend)
Open `AUTHApi/Data/MenuSeeder.cs` and add your new item to the `items` list.
```csharp
new MenuItem { 
    Title = "My New Page", 
    ViewId = "my_new_view", // Must match ViewMapper
    Icon = "MyNewIcon",    // Must match SidebarIcons
    Permission = null,      // Use NULL for public, or a string for restricted access
    Order = 15              // Sorting position
}


form databse   : 

INSERT INTO MenuItems (Title, ViewId, Icon, Permission, [Order], IsVisible, ParentId)
VALUES ('Support', 'support_view', 'SupportIcon', NULL, 15, 1, NULL);


DELETE FROM MenuItems
```
**Restart the Backend**: The seeder wipes and re-creates the menu table on every startup during development to stay in sync with your code.

> [!TIP]
> **Direct Database Alternative**: You can also insert directly into the `MenuItems` table via SQL, but remember that the Seeder will overwrite manual SQL changes on the next backend restart unless you comment out the `context.MenuItems.RemoveRange` lines.
