import { useEffect, useState } from "react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Sportsbook } from "./components/Sportsbook";
import { AdminPanel } from "./components/AdminPanel";
import { Dashboard } from "./components/Dashboard";
import { Leaderboard } from "./components/Leaderboard";
import { supabase } from "./lib/supabase";
import type { Database } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Database['public']['Tables']['users']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    "sportsbook" | "dashboard" | "leaderboard" | "admin"
  >("sportsbook");

  useEffect(() => {
    // initial session
    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session ?? null);
        setLoading(false);
      }).catch((err) => {
        console.error("Auth error:", err);
        setError(err?.message || "Auth failed");
        setLoading(false);
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });

      return () => {
        listener?.subscription.unsubscribe();
      };
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err?.message || "Setup failed");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .catch(() => ({ data: null }));
      
      if (!data) {
        // Check if this is the first user (make them admin)
        const { count } = await supabase
          .from("users")
          .select("*", { count: "exact" })
          .catch(() => ({ count: 0 }));
        
        const isFirstUser = count === 0;

        // Create user profile
        const { data: newUser } = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email,
            virtual_balance: 100000,
            is_admin: isFirstUser,
          })
          .select()
          .single()
          .catch(() => ({ data: null }));
        
        setUser(newUser);
      } else {
        setUser(data);
      }
      setLoading(false);
    };

    fetchUser();
  }, [session]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-blue-600">
            NFL Paper Sportsbook
          </h2>
          <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            PRACTICE ONLY - NO REAL MONEY
          </span>
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView("sportsbook")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  currentView === "sportsbook"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Sportsbook
              </button>
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  currentView === "dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("leaderboard")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  currentView === "leaderboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Leaderboard
              </button>
              {user?.is_admin && (
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    currentView === "admin"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Admin
                </button>
              )}
            </nav>

            {user && (
              <div className="text-sm">
                <span className="text-gray-600">Balance: </span>
                <span className="font-semibold text-green-600">
                  ${user.virtual_balance.toLocaleString()}
                </span>
              </div>
            )}

            <SignOutButton />
          </div>
        )}
      </header>

      <main className="flex-1">
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">Check browser console for details.</p>
          </div>
        )}
        
        {!session ? (
          <div className="flex items-center justify-center min-h-[80vh] p-8">
            <div className="w-full max-w-md mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                NFL Paper Sportsbook
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Practice betting with no real money. Perfect your strategy risk-free!
              </p>
              <SignInForm />
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {currentView === "sportsbook" && session?.user && (
              <Sportsbook userId={session.user.id} />
            )}
            {currentView === "dashboard" && user && <Dashboard user={user} />}
            {currentView === "leaderboard" && <Leaderboard />}
            {currentView === "admin" && user?.is_admin && <AdminPanel />}
          </>
        )}
      </main>
    </div>
  );
}

