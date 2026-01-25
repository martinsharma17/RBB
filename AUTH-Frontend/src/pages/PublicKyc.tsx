import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import KycFormMaster from "../components/dashboard/user/KycFormMaster";
import DeveloperForm from "../components/dashboard/user/DeveloperForm";
import KycVerification from "../components/dashboard/user/sections/KycVerification";

const PublicKyc = () => {
  const { apiBase } = useAuth();
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Initialize, 2: Verify OTP, 4: Select Session, 3: Form

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if there's an existing session in URL or localStorage to resume
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlSessionId = queryParams.get("sessionId");

    const syncSession = async (sid: number) => {
      try {
        const response = await fetch(
          `${apiBase}/api/KycSession/progress/${sid}`,
        );
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data.session) {
            const verified = res.data.session.emailVerified;
            setIsEmailVerified(verified);
            setSessionId(sid);
            if (verified) setStep(3);
            else setStep(2);
          }
        }
      } catch (err) {
        console.error("Session sync failed:", err);
      }
    };

    if (urlSessionId) {
      syncSession(parseInt(urlSessionId));
    } else {
      const savedSessionId = localStorage.getItem("kyc_session_id");
      const savedEmailVerified =
        localStorage.getItem("kyc_email_verified") === "true";

      if (savedSessionId) {
        setSessionId(parseInt(savedSessionId));
        setIsEmailVerified(savedEmailVerified);
        if (savedEmailVerified) setStep(3);
        else setStep(2);
      }
    }
  }, [apiBase]);

  const handleInitialize = async (e: React.FormEvent, forceNew = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/KycSession/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mobileNo,
          userAgent: navigator.userAgent,
          deviceFingerprint: "browser-public",
          forceNew: forceNew,
        }),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          setSessionId(res.data.sessionId);
          localStorage.setItem("kyc_session_id", res.data.sessionId.toString());
          setStep(2);
        } else {
          setError(res.message || "Failed to initialize KYC session.");
        }
      } else {
        setError("Failed to connect to server.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async (data: any) => {
    setIsEmailVerified(true);
    localStorage.setItem("kyc_email_verified", "true");

    if (data.availableSessions && data.availableSessions.length > 0) {
      setAvailableSessions(data.availableSessions);
      setStep(4); // Move to selection screen
    } else {
      setStep(3); // Go straight to form if no other sessions (shouldn't really happen with new logic)
    }
  };

  const resumeSession = (sid: number) => {
    setSessionId(sid);
    localStorage.setItem("kyc_session_id", sid.toString());
    setStep(3);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sid: number) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this application? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${apiBase}/api/KycSession/${sid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const res = await response.json();

      if (!res.success) {
        alert(res.message || "Failed to delete session.");
        return;
      }

      // ✅ Remove from list
      setAvailableSessions((prev) => prev.filter((s) => s.sessionId !== sid));

      // ✅ If current session deleted → FULL RESET
      if (sessionId === sid) {
        setSessionId(null);
        setIsEmailVerified(false);
        setStep(1);

        localStorage.removeItem("kyc_session_id");
        localStorage.removeItem("kyc_email_verified");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Network error while deleting.");
    }
  };

  const startNewApplication = () => {
    handleInitialize(null as any, true);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            Connecting to Form...
          </h2>
          <p className="text-gray-500">
            Attempting to open the form on your secure device (Port 3000).
          </p>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setIsRedirecting(false);
                setStep(3);
              }}
              className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors"
            >
              Taking too long? Click here to fill form on this device.
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-25 h-25   flex items-center justify-center mx-auto mb-4">
              <img src="./rbb.png" alt="" />
              {/* <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg> */}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Start Your KYC
            </h1>
            <p className="text-gray-500 mt-2">
              Fill out your KYC form securely without logging in.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleInitialize} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Initialing...
                </span>
              ) : (
                "Continue to Verify Email"
              )}
            </button>
          </form>

          <div
            className="mt-8 pt-6 border-t border-gray-100 text-center"
            data-developer="martin sharma | naya code pvt ltd"
          >
            <p className="text-sm text-gray-500 mb-4">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-indigo-600 font-semibold hover:underline"
              >
                Log in here
              </a>
            </p>
            <div className="pt-4 border-t border-gray-50 mt-4">
              <p className="text-xs font-medium text-gray-500">
                © {new Date().getFullYear()} Naya Code Pvt.Ltd. All rights
                reserved.
              </p>
              <p className="sr-only">martin sharma | naya code pvt ltd</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white text-center">
              <h2 className="text-2xl font-bold">Verification Step</h2>
              <p className="opacity-90 mt-1">
                We've sent a code to your email.
              </p>
            </div>
            <div className="p-8">
              <KycVerification
                initialEmail={email}
                sessionId={sessionId}
                apiBase={apiBase}
                onVerified={handleVerified}
              />

              <div
                className="mt-8 pt-6 border-t border-gray-100 text-center"
                data-developer="martin sharma | naya code pvt ltd"
              >
                <p className="text-xs font-medium text-gray-500">
                  © {new Date().getFullYear()} Naya Code Pvt.Ltd. All rights
                  reserved.
                </p>
                <p className="sr-only">martin sharma | naya code pvt ltd</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-indigo-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold">Welcome Back!</h2>
            <p className="opacity-90 mt-1">
              We found existing KYC applications for <b>{email}</b>.
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Continue an existing application:
              </h3>
              {availableSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer group"
                  onClick={() => resumeSession(s.sessionId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 group-hover:border-indigo-200">
                      <svg
                        className="w-6 h-6 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">
                        Form #{s.sessionId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Started: {new Date(s.createdDate).toLocaleDateString()}{" "}
                        | Current Page:{" "}
                        {s.currentStep || s.CurrentStep || s.lastSavedStep + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDeleteSession(e, s.sessionId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Application"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button className="px-5 py-2 bg-white border border-indigo-600 text-indigo-600 font-bold rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      Resume
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-gray-100 mt-6">
                <p className="text-sm text-center text-gray-500 mb-4">
                  Or start a completely new application if needed:
                </p>
                <button
                  onClick={startNewApplication}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black active:transform active:scale-[0.98] transition-all text-lg flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Start Fresh Application</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100"
            data-developer="martin sharma | naya code pvt ltd"
          >
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 hover:text-indigo-600 hover:underline mb-4"
            >
              Use a different email address?
            </button>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500">
                © {new Date().getFullYear()} Naya Code Pvt.Ltd. All rights
                reserved.
              </p>
              <p className="sr-only">martin sharma | naya code pvt ltd</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {window.location.port === "3000" ? (
        <DeveloperForm sessionId={sessionId} />
      ) : (
        <KycFormMaster
          initialSessionId={sessionId}
          initialEmailVerified={isEmailVerified}
        />
      )}
    </div>
  );
};

export default PublicKyc;
