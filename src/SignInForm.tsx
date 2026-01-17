"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password");
      return;
    }

    setSubmitting(true);
    try {
      console.log(`[Auth] Starting ${flow} with email:`, email);
      const result = await signIn("password", {
        email,
        password,
        flow,
      });
      console.log(`[Auth] ${flow} succeeded`, result);
      // On success, the ConvexAuthProvider will handle the redirect
    } catch (error: any) {
      console.error(`[Auth] ${flow} failed:`, error);
      const errorMsg = error?.message || "Authentication failed";
      console.error(`[Auth] Error message:`, errorMsg);
      
      if (errorMsg.includes("INVALID_PASSWORD")) {
        toast.error("Invalid email or password");
      } else if (errorMsg.includes("USER_NOT_FOUND")) {
        toast.error("No account found. Try signing up.");
      } else if (errorMsg.includes("already exists")) {
        toast.error("Email already registered. Try signing in.");
      } else if (errorMsg.includes("Invalid username")) {
        toast.error("Invalid email format");
      } else {
        toast.error(errorMsg || `${flow} failed. Please try again.`);
      }
      setSubmitting(false);
    }
  };

  const handleAnonymous = async () => {
    setSubmitting(true);
    try {
      console.log("[Auth] Starting anonymous sign-in");
      const result = await signIn("anonymous");
      console.log("[Auth] Anonymous sign-in succeeded", result);
      // On success, ConvexAuthProvider will handle the app state
    } catch (error: any) {
      console.error("[Auth] Anonymous sign-in failed:", error);
      toast.error(
        error?.message || "Anonymous sign-in failed. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handlePasswordAuth} className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition"
        >
          {submitting
            ? "Loading..."
            : flow === "signIn"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAnonymous}
        disabled={submitting}
        className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 transition"
      >
        {submitting ? "Loading..." : "Continue Anonymously"}
      </button>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setEmail("");
            setPassword("");
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {flow === "signIn"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
