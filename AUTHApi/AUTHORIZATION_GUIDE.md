# Simple Role-Based & Policy-Based Authorization Guide

This guide explains how to use Role-Based and Policy-Based Authorization in this API.

## 📚 Table of Contents
1. [What is Authorization?](#what-is-authorization)
2. [Roles in This API](#roles-in-this-api)
3. [How to Use Role-Based Authorization](#how-to-use-role-based-authorization)
4. [How to Use Policy-Based Authorization](#how-to-use-policy-based-authorization)
5. [Step-by-Step Examples](#step-by-step-examples)
6. [API Endpoints](#api-endpoints)

---

## What is Authorization?

**Authentication** = "Who are you?" (Login)
**Authorization** = "What can you do?" (Permissions)

After a user logs in, authorization determines what endpoints they can access based on their role.

---

## Roles in This API

### Available Roles:
- **Admin**: Full access to all endpoints
- **User**: Standard user access

### How Roles Work:
1. When a user registers, they automatically get the **"User"** role
2. Admins can assign the **"Admin"** role to other users
3. Roles are stored in the JWT token when you login

---

## How to Use Role-Based Authorization

### Method 1: Using `[Authorize(Roles = "RoleName")]`

```csharp
[HttpGet("AdminEndpoint")]
[Authorize(Roles = "Admin")]  // Only Admin can access
public IActionResult AdminEndpoint()
{
    return Ok("Only Admin can see this");
}
```

### Method 2: Multiple Roles

```csharp
[HttpGet("AdminOrUserEndpoint")]
[Authorize(Roles = "Admin,User")]  // Admin OR User can access
public IActionResult AdminOrUserEndpoint()
{
    return Ok("Admin or User can see this");
}
```

---

## How to Use Policy-Based Authorization

Policies are defined once in `Program.cs` and can be reused.

### Step 1: Define Policy in Program.cs

```csharp
builder.Services.AddAuthorization(options =>
{
    // Policy: Only Admin can access
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    
    // Policy: Only User can access
    options.AddPolicy("UserOnly", policy => 
        policy.RequireRole("User"));
    
    // Policy: Admin OR User can access
    options.AddPolicy("AdminOrUser", policy => 
        policy.RequireRole("Admin", "User"));
});
```

### Step 2: Use Policy in Controller

```csharp
[HttpGet("MyEndpoint")]
[Authorize(Policy = "AdminOnly")]  // Use the policy
public IActionResult MyEndpoint()
{
    return Ok("Only Admin can see this");
}
```

---

## Step-by-Step Examples

### Example 1: Create a Public Endpoint (No Authorization)

```csharp
[HttpGet("Public")]
public IActionResult PublicEndpoint()
{
    return Ok("Anyone can access this");
}
```

**Test:** `GET /api/Example/Public` (No token needed)

---

### Example 2: Require Authentication Only

```csharp
[HttpGet("Authenticated")]
[Authorize]  // Any logged-in user can access
public IActionResult AuthenticatedEndpoint()
{
    return Ok("Any authenticated user can see this");
}
```

**Test:** `GET /api/Example/Authenticated` (Need login token)

---

### Example 3: Require Admin Role

```csharp
[HttpGet("AdminOnly")]
[Authorize(Roles = "Admin")]  // Only Admin role
public IActionResult AdminOnlyEndpoint()
{
    return Ok("Only Admin can see this");
}
```

**Test:** `GET /api/Example/AdminOnly` (Need Admin token)

---

### Example 4: Require User Role

```csharp
[HttpGet("UserOnly")]
[Authorize(Roles = "User")]  // Only User role
public IActionResult UserOnlyEndpoint()
{
    return Ok("Only User can see this");
}
```

**Test:** `GET /api/Example/UserOnly` (Need User token)

---

### Example 5: Use a Policy

```csharp
[HttpGet("PolicyExample")]
[Authorize(Policy = "AdminOnly")]  // Use policy from Program.cs
public IActionResult PolicyExample()
{
    return Ok("Policy-based authorization");
}
```

**Test:** `GET /api/Example/PolicyExample` (Need Admin token)

---

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/UserAuth/Register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
**Result:** User is created with "User" role automatically

---

#### Login
```http
POST /api/UserAuth/Login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["User"]
}
```

---

### Role Management Endpoints (Admin Only)

#### Get All Roles
```http
GET /api/Roles
Authorization: Bearer {admin_token}
```

#### Assign Role to User
```http
POST /api/Roles/AssignRole
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "john@example.com",
  "roleName": "Admin"
}
```

#### Remove Role from User
```http
POST /api/Roles/RemoveRole
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "john@example.com",
  "roleName": "Admin"
}
```

#### Get User Roles
```http
GET /api/Roles/UserRoles/john@example.com
Authorization: Bearer {admin_token}
```

---

### Example Endpoints (Testing Authorization)

#### Public Endpoint
```http
GET /api/Example/Public
```
**No token needed**

#### Authenticated Endpoint
```http
GET /api/Example/Authenticated
Authorization: Bearer {any_user_token}
```

#### Admin Only Endpoint
```http
GET /api/Example/AdminOnly
Authorization: Bearer {admin_token}
```

#### User Only Endpoint
```http
GET /api/Example/UserOnly
Authorization: Bearer {user_token}
```

---

## Quick Reference

### Authorization Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `[Authorize]` | Requires authentication | Any logged-in user |
| `[Authorize(Roles = "Admin")]` | Requires specific role | Only Admin |
| `[Authorize(Roles = "Admin,User")]` | Requires one of the roles | Admin OR User |
| `[Authorize(Policy = "PolicyName")]` | Uses a policy | Policy defined in Program.cs |

### Common Patterns

```csharp
// Public endpoint (no authorization)
[HttpGet("Public")]
public IActionResult Public() { }

// Any authenticated user
[HttpGet("Protected")]
[Authorize]
public IActionResult Protected() { }

// Only Admin
[HttpGet("Admin")]
[Authorize(Roles = "Admin")]
public IActionResult Admin() { }

// Admin or User
[HttpGet("Both")]
[Authorize(Roles = "Admin,User")]
public IActionResult Both() { }

// Using a policy
[HttpGet("Policy")]
[Authorize(Policy = "AdminOnly")]
public IActionResult Policy() { }
```

---

## How to Test

1. **Register a user:**
   ```bash
   POST /api/UserAuth/Register
   ```

2. **Login and get token:**
   ```bash
   POST /api/UserAuth/Login
   ```

3. **Use token in requests:**
   ```bash
   GET /api/Example/AdminOnly
   Authorization: Bearer {your_token}
   ```

4. **Assign Admin role (if you have admin access):**
   ```bash
   POST /api/Roles/AssignRole
   Authorization: Bearer {admin_token}
   ```

---

## Summary

- **Roles** = Groups of users (Admin, User)
- **Policies** = Reusable authorization rules
- **`[Authorize]`** = Requires authentication
- **`[Authorize(Roles = "Admin")]`** = Requires Admin role
- **`[Authorize(Policy = "PolicyName")]`** = Uses a policy

That's it! Simple and straightforward. 🎉

