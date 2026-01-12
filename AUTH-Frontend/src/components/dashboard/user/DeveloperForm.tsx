import React from 'react';

interface DeveloperFormProps {
    sessionId: number | null;
}

const DeveloperForm: React.FC<DeveloperFormProps> = ({ sessionId }) => {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-100">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900">Developer Working Form</h1>
                <p className="text-gray-500 mt-2 font-medium">This is the Next Developer's custom form for Session #{sessionId}</p>
            </div>

            <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <h2 className="text-lg font-bold text-blue-800 mb-2">Instructions for Step 2 Developer:</h2>
                    <ul className="list-disc list-inside text-blue-700 space-y-2 text-sm">
                        <li>You have received the <strong>sessionId</strong> from Laptop 1.</li>
                        <li>The user's email is already <strong>verified</strong>.</li>
                        <li>You can now start collecting your own custom data here.</li>
                        <li>Delete this text and build your own UI!</li>
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Custom Field 1</label>
                        <input type="text" placeholder="Developer Data 1" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Custom Field 2</label>
                        <input type="text" placeholder="Developer Data 2" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>

                <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all text-lg">
                    Submit Developer Form
                </button>
            </div>
        </div>
    );
};

export default DeveloperForm;
