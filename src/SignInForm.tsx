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
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await signIn("password", {
        email,
        password,
        flow,
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Authentication failed";
      if (errorMsg.includes("INVALID_PASSWORD")) {
        toast.error("Invalid password. Please try again.");
      } else if (errorMsg.includes("USER_NOT_FOUND")) {
        toast.error("Account not found. Please sign up first.");
      } else if (errorMsg.includes("already exists")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(
          flow === "signIn"
            ? "Could not sign in. Please try again."
            : "Could not sign up. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnonymous = async () => {
    setSubmitting(true);
    try {
      await signIn("anonymous");
    } catch (error: any) {
      toast.error("Anonymous sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handlePasswordAuth} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting
            ? "Loading..."
            : flow === "signIn"
              ? "Sign In"
              : "Sign Up"}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <hr className="flex-1 border-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <button
        onClick={handleAnonymous}
        disabled={submitting}
        className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50"
      >
        {submitting ? "Loading..." : "Continue Anonymously"}
      </button>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {flow === "signIn"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setEmail("");
              setPassword("");
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
