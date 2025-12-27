# � AUTHApi - Backend Code Documentation

This documentation provides a detailed, file-by-file explanation of the backend codebase. This system is built on **ASP.NET Core 9.0** and uses **Entity Framework Core** for database operations.

---

## 📂 Project Structure Overview

The project is organized into standard architectural layers:

*   **`Controllers/`**: The "Doorway" to the API. Receives HTTP requests and sends responses.
*   **`Data/`**: The "Brain" of the Database. Manages tables and initial data.
*   **`DTOs/`**: "Envelopes" for data. Defines what users send (Input) and what they get back (Output).
*   **`Entities/`**: "Blueprints" for Database tables.
*   **`Services/`**: "Workers". Helper logic (like sending emails) that keeps controllers clean.
*   **`Program.cs`**: The "Start Button". Configures and runs the application.

---

## 📄 File-by-File Breakdown

### 1. 🎮 Controllers (`/Controllers`)
These files handle incoming API requests.

*   **`UserAuthController.cs`**:
    *   **Purpose**: Handles public authentication.
    *   **Endpoints**:
        *   `Register`: Creates a new user.
        *   `Login`: Checks password and issues a JWT Token.
        *   `ForgotPassword` / `ResetPassword`: Handles encryption-based password recovery.
*   **`RolesController.cs`**:
    *   **Purpose**: Manages System Roles (e.g., "Admin", "Manager").
    *   **Key Logic**: Allows creating new roles (e.g., "HR Manager") and managing valid permissions for them.
*   **`PermissionsController.cs`**:
    *   **Purpose**: Returns a list of all possible permissions in the system (e.g., `Permissions.Users.View`).
*   **`AdminController.cs`**:
    *   **Purpose**: Example of a protected controller.
    *   **Restriction**: Accessible only by users with the `Admin` role.
*   **`ManagerController.cs`**:
    *   **Purpose**: Example of a protected controller for Managers.
*   **`SuperAdminController.cs`**:
    *   **Purpose**: The most unrestricted controller. Handles high-level system administrative tasks.
*   **`PasswordResetController.cs`**:
    *   **Purpose**: Logic for verifying reset tokens.

### 2. 💽 Data & Seeding (`/Data`)
These files manage the connection to SQL Server.

*   **`ApplicationDbContext.cs`**:
    *   **Purpose**: Represents the Database Session.
    *   **Function**: Maps C# classes (Entities) to SQL Tables. It inherits from `IdentityDbContext` to automatically handle User tables.
*   **`RoleSeeder.cs`**:
    *   **Purpose**: Runs *once* on startup.
    *   **Function**: checks if standard roles (`SuperAdmin`, `Admin`, `User`) exist. If not, it creates them.
*   **`PermissionSeeder.cs`**:
    *   **Purpose**: Runs on startup.
    *   **Function**: Ensures that all roles have their default permissions assigned.
*   **`SeedRolesAndAdmin.cs`**:
    *   **Purpose**: Specifically ensures the default "SuperAdmin" user exists with the correct password.

### 3. � Data Transfer Objects (`/DTOs`)
Simple classes used to carry data over the network.

*   **`LoginModel.cs`**: Contains `Email` and `Password` (used during Login).
*   **`RegisterModel.cs`**: Contains `Name`, `Email`, `Password` (used during Registration).
*   **`ForgotPasswordDto.cs`**: Contains just `Email` (used when requesting a reset).

### 4. 🧬 Entities (`/Entities`)
The actual data stored in the database.

*   **`ApplicationUser.cs`**:
    *   **Extends**: `IdentityUser`.
    *   **Purpose**: Adds custom fields to the standard user, such as `FullName` or `ProfilePicture`.

### 5. 🛠️ Services (`/Services`)
Background logic helper classes.

*   **`EmailService.cs`**:
    *   **Purpose**: Connects to an SMTP server (like Gmail) to send real emails.
    *   **Usage**: Called by `UserAuthController` when a user forgets their password.

---

## 🔄 System Flow: The Life of a Request

Here is what happens systematically when a user tries to **Login**:

1.  **Frontend Request**:
    *   The React App sends a `POST` request to `https://localhost:5033/api/UserAuth/Login`.
    *   Body: `{ "email": "bob@example.com", "password": "123" }`.

2.  **Controller Layer (`UserAuthController.cs`)**:
    *   Receives the `LoginModel`.
    *   Calls `UserManager` to find the user in the SQL Database.
    *   Calls `SignInManager` to verify the hashed password.

3.  **Token Generation**:
    *   If correct, the Controller builds a **JWT Token**.
    *   It stuffs the token with **Claims**: `[ "id": 1, "role": "User", "email": "bob@..." ]`.

4.  **Response**:
    *   The API returns `200 OK` with the Token.
    *   The Frontend saves this token to `localStorage`.

5.  **Next Request (Protected)**:
    *   When Bob tries to view `AdminController`:
    *   His request header has `Authorization: Bearer <TOKEN>`.
    *   The **Middleware** (in `Program.cs`) checks the Token signature.
    *   It sees Bob only has the "User" role.
    *   The API returns `403 Forbidden`.

---

## ⚙️ Key Configuration Files

*   **`appsettings.json`**:
    *   **`ConnectionStrings`**: Tells the app where the SQL Database is.
    *   **`Jwt`**: Contains the `Key` (Secret password for signing tokens) and `Issuer`.
    *   **`Email`**: SMTP settings for sending emails.
*   **`Program.cs`**:
    *   Sets up Dependency Injection (DI).
    *   Configures Swagger.
    *   Adds Authentication & Authorization Policy Services.

