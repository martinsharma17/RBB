// Global TypeScript type definitions for the application
import React from 'react';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  picture?: string | null;
  branchName?: string;
}

export interface DecodedToken {
  email?: string;
  sub?: string;
  name?: string;
  picture?: string;
  role?: string | string[];
  roles?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'?: string | string[];
  'urn:google:picture'?: string;
  [key: string]: unknown;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface PermissionSet {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  sidebar?: boolean;
}

export interface Permissions {
  users?: PermissionSet;
  analytics?: PermissionSet;
  permission_charts?: PermissionSet;
  tasks?: PermissionSet;
  task_list?: PermissionSet;
  task_kanban?: PermissionSet;
  projects?: PermissionSet;
  my_projects?: PermissionSet;
  project_content?: PermissionSet;
  project_team?: PermissionSet;
  project_settings?: PermissionSet;
  reports?: PermissionSet;
  audit?: PermissionSet;
  roles?: PermissionSet;
  policies?: PermissionSet;
  settings?: PermissionSet;
  notifications?: PermissionSet;
  security?: PermissionSet;
  backup?: PermissionSet;

  // Computed permissions
  create_users?: boolean;
  read_users?: boolean;
  update_users?: boolean;
  delete_users?: boolean;

  create_task_list?: boolean;
  read_task_list?: boolean;
  update_task_list?: boolean;
  delete_task_list?: boolean;

  create_task_kanban?: boolean;
  read_task_kanban?: boolean;
  update_task_kanban?: boolean;
  delete_task_kanban?: boolean;

  create_projects?: boolean;
  read_projects?: boolean;
  update_projects?: boolean;
  delete_projects?: boolean;

  // View permissions
  view_users?: boolean;
  view_charts?: boolean;
  view_analytics?: boolean;
  view_projects?: boolean;
  view_my_projects?: boolean;
  view_project_content?: boolean;
  view_project_team?: boolean;
  view_project_settings?: boolean;
  view_tasks?: boolean;
  view_task_list?: boolean;
  view_task_kanban?: boolean;
  view_roles?: boolean;
  view_policies?: boolean;
  view_reports?: boolean;
  view_audit?: boolean;
  view_notifications?: boolean;
  view_settings?: boolean;
  view_security?: boolean;
  view_backup?: boolean;

  dashboard?: boolean;
  [key: string]: any;
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  permissions: Permissions | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  apiBase: string;
  fetchPermissions: (authToken: string) => Promise<void>;
}

// ============================================================================
// API RESPONSE TYPES (Standardized with Backend)
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface LoginData {
  token: string;
  roles: string[];
}

export type LoginResponse = ApiResponse<LoginData>;

export type PermissionsResponse = ApiResponse<string[]>;

// ============================================================================
// KYC FORM TYPES
// ============================================================================

export interface KycPersonalInfo {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  placeOfBirth?: string;
  [key: string]: string | null | undefined;
}

export interface KycAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  residentialStatus?: string;
  yearsAtAddress?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface KycData {
  [key: string]: string | number | boolean | null | undefined;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  url?: string; // Optional URL path for navigation (e.g., '/kyc', '/users')
  children?: SidebarItem[];
}

export interface ViewMapperProps {
  activeView: string;
  onViewChange?: (view: string) => void;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormFieldTouched {
  [key: string]: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface UserFormData {
  email: string;
  role: string;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ADDITIONAL COMPONENT PROP TYPES
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
}

export interface Role {
  id: string;
  name: string;
  Name?: string;
  Id?: string;
}

export interface AccessManagementViewProps {
  admins: AdminUser[];
  onAddUser: () => void;
  onRevokeAdmin: (adminId: string) => void;
}

export interface AddUserModalProps {
  show: boolean;
  newUser: unknown;
  setNewUser: (user: unknown) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export interface AssignRoleModalProps {
  show: boolean;
  user: AdminUser | null;
  roles: Role[];
  onClose: () => void;
  onAssign: (roleId: string) => void;
}

export interface ChartsViewProps {
  regularUsers: number;
  totalAdmins: number;
  totalAccounts: number;
}

export interface DashboardViewProps {
  regularUsers: number;
  totalAdmins: number;
  totalAccounts: number;
  loginTime?: string;
  onViewUsers: () => void;
  onViewAdmins: () => void;
  onViewCharts: () => void;
  onAddUser: () => void;
}

export interface PolicyEditorViewProps {
  roles: Role[];
  onPermissionsUpdated?: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}
