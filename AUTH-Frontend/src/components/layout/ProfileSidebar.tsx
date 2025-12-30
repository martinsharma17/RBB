// // // src/components/ProfileSidebar.js
// // import React, { useState, useEffect } from "react";

// // export default function ProfileSidebar({ apiBase, token }) {
// //     const [profile, setProfile] = useState(null);
// //     const [editing, setEditing] = useState(false);
// //     const [form, setForm] = useState({ userName: "", email: "" });

// //     useEffect(() => {
// //         if (!token) return;
// //         fetch(`${apiBase}/User/profile`, {
// //             headers: { Authorization: `Bearer ${token}` }
// //         }).then(r => r.json()).then(data => {
// //             setProfile(data);
// //             setForm({ userName: data.userName || "", email: data.email || "" });
// //         });
// //     }, [token]);

// //     const save = async () => {
// //         await fetch(`${apiBase}/User/profile`, {
// //             method: "PUT",
// //             headers: {
// //                 'Content-Type': 'application/json',
// //                 Authorization: `Bearer ${token}`
// //             },
// //             body: JSON.stringify({ userName: form.userName, email: form.email })
// //         });
// //         setEditing(false);
// //         // refresh
// //         const r = await fetch(`${apiBase}/User/profile`, {
// //             headers: { Authorization: `Bearer ${token}` }
// //         });
// //         setProfile(await r.json());
// //     };

// //     if (!profile) return <div style={{ padding: 12 }}>Loading profile...</div>;

// //     return (
// //         <aside style={{ width: 280, padding: 16, borderLeft: "1px solid #eee" }}>
// //             <h3>Profile</h3>
// //             <div><strong>Email:</strong> {profile.email}</div>
// //             <div><strong>Username:</strong> {profile.userName}</div>
// //             <div><strong>Roles:</strong> {(profile.roles || []).join(", ")}</div>

// //             {editing ? (
// //                 <>
// //                     <div style={{ marginTop: 10 }}>
// //                         <input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} placeholder="Username" />
// //                     </div>
// //                     <div style={{ marginTop: 8 }}>
// //                         <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
// //                     </div>
// //                     <div style={{ marginTop: 10 }}>
// //                         <button onClick={save}>Save</button>
// //                         <button onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>Cancel</button>
// //                     </div>
// //                 </>
// //             ) : (
// //                 <div style={{ marginTop: 10 }}>
// //                     <button onClick={() => setEditing(true)}>Edit Profile</button>
// //                 </div>
// //             )}
// //         </aside>
// //     );
// // }






// // src/components/ProfileSidebar.jsx
// import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';

// // Inline SVG Icons
//   </svg>
// );

// const EditIcon = ({ className = "h-5 w-5" }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//   </svg>
// );

// const CheckIcon = ({ className = "h-5 w-5" }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//   </svg>
// );

// const CancelIcon = ({ className = "h-5 w-5" }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//   </svg>
// );

// export default function ProfileSidebar({ apiBase }) {
//     const { token } = useAuth();
//     const [profile, setProfile] = useState(null);
//     const [editing, setEditing] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [form, setForm] = useState({ userName: "", email: "" });
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState("");

//     useEffect(() => {
//         if (!token) return;
//         fetchProfile();
//     }, [token]);

//     const fetchProfile = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch(`${apiBase}/User/profile`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             const data = await response.json();
//             setProfile(data);
//             setForm({ userName: data.userName || "", email: data.email || "" });
//             setError("");
//         } catch (err) {
//             setError("Failed to load profile");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSave = async () => {
//         if (!form.userName.trim() || !form.email.trim()) {
//             setError("All fields are required");
//             return;
//         }

//         setSaving(true);
//         setError("");
//         setSuccess("");
        
//         try {
//             await fetch(`${apiBase}/User/profile`, {
//                 method: "PUT",
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${token}`
//                 },
//                 body: JSON.stringify({ 
//                     userName: form.userName.trim(), 
//                     email: form.email.trim() 
//                 })
//             });
            
//             setSuccess("Profile updated successfully!");
//             setEditing(false);
//             await fetchProfile(); // Refresh profile data
            
//             // Auto-hide success message
//             setTimeout(() => setSuccess(""), 3000);
//         } catch (err) {
//             setError("Failed to update profile");
//         } finally {
//             setSaving(false);
//         }
//     };

//     const handleCancel = () => {
//         setForm({ 
//             userName: profile?.userName || "", 
//             email: profile?.email || "" 
//         });
//         setEditing(false);
//         setError("");
//         setSuccess("");
//     };

//     if (loading) {
//         return (
//             <aside className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 h-full p-6 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                     <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
//                 </div>
//             </aside>
//         );
//     }

//     if (!profile) {
//         return (
//             <aside className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 h-full p-6">
//                 <div className="text-center text-gray-500">
//                     <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
//                     <p>No profile data available</p>
//                 </div>
//             </aside>
//         );
//     }

//     return (
//         <aside className="w-80 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 h-full overflow-y-auto">
//             <div className="p-6">
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-6">
//                     <div className="flex items-center space-x-3">
//                         <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
//                             <UserIcon className="h-5 w-5 text-white" />
//                         </div>
//                         <div>
//                             <h3 className="text-lg font-bold text-gray-900">Profile Details</h3>
//                             <p className="text-xs text-gray-500">Manage your account</p>
//                         </div>
//                     </div>
                    
//                     {!editing && (
//                         <button
//                             onClick={() => setEditing(true)}
//                             className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
//                         >
//                             <EditIcon className="h-4 w-4" />
//                             <span>Edit</span>
//                         </button>
//                     )}
//                 </div>

//                 {/* Success Message */}
//                 {success && (
//                     <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
//                         <div className="flex items-center">
//                             <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
//                             <p className="text-sm font-medium text-green-800">{success}</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {error && (
//                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
//                         <div className="flex items-center">
//                             <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                             <p className="text-sm font-medium text-red-800">{error}</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Profile Info */}
//                 <div className="space-y-4">
//                     {/* Email */}
//                     <div className="bg-white rounded-lg border border-gray-200 p-4">
//                         <div className="flex items-center justify-between mb-2">
//                             <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</span>
//                             <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
//                                 Verified
//                             </span>
//                         </div>
//                         {editing ? (
//                             <input
//                                 type="email"
//                                 value={form.email}
//                                 onChange={e => setForm({ ...form, email: e.target.value })}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
//                                 placeholder="Enter your email"
//                             />
//                         ) : (
//                             <p className="text-gray-900 font-medium">{profile.email}</p>
//                         )}
//                     </div>

//                     {/* Username */}
//                     <div className="bg-white rounded-lg border border-gray-200 p-4">
//                         <div className="flex items-center justify-between mb-2">
//                             <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</span>
//                         </div>
//                         {editing ? (
//                             <input
//                                 type="text"
//                                 value={form.userName}
//                                 onChange={e => setForm({ ...form, userName: e.target.value })}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
//                                 placeholder="Enter your username"
//                             />
//                         ) : (
//                             <p className="text-gray-900 font-medium">{profile.userName}</p>
//                         )}
//                     </div>

//                     {/* Roles */}
//                     <div className="bg-white rounded-lg border border-gray-200 p-4">
//                         <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Roles</span>
//                         <div className="flex flex-wrap gap-2">
//                             {(profile.roles || []).map((role, index) => (
//                                 <span 
//                                     key={index}
//                                     className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
//                                 >
//                                     {role}
//                                 </span>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Account Info */}
//                     <div className="bg-white rounded-lg border border-gray-200 p-4">
//                         <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Account Info</span>
//                         <div className="space-y-2">
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Member Since</span>
//                                 <span className="text-sm font-medium text-gray-900">
//                                     {new Date().toLocaleDateString('en-US', { 
//                                         year: 'numeric', 
//                                         month: 'short' 
//                                     })}
//                                 </span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Status</span>
//                                 <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
//                                     Active
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Action Buttons */}
//                 {editing && (
//                     <div className="mt-6 flex space-x-3">
//                         <button
//                             onClick={handleSave}
//                             disabled={saving}
//                             className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//                         >
//                             {saving ? (
//                                 <>
//                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                                     <span>Saving...</span>
//                                 </>
//                             ) : (
//                                 <>
//                                     <CheckIcon className="h-4 w-4" />
//                                     <span>Save Changes</span>
//                                 </>
//                             )}
//                         </button>
//                         <button
//                             onClick={handleCancel}
//                             disabled={saving}
//                             className="flex items-center justify-center space-x-2 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
//                         >
//                             <CancelIcon className="h-4 w-4" />
//                             <span>Cancel</span>
//                         </button>
//                     </div>
//                 )}
//             </div>

//             <style jsx>{`
//                 @keyframes fade-in {
//                     from { opacity: 0; transform: translateY(-5px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//                 .animate-fade-in {
//                     animation: fade-in 0.3s ease-out;
//                 }
//             `}</style>
//         </aside>
//     );
// }