import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Sportsbook } from "./components/Sportsbook";
import { AdminPanel } from "./components/AdminPanel";
import { Dashboard } from "./components/Dashboard";
import { Leaderboard } from "./components/Leaderboard";
import { useState, useEffect } from "react";

export default function App() {
  const user = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);
  const [currentView, setCurrentView] = useState<"sportsbook" | "dashboard" | "leaderboard" | "admin">("sportsbook");

  // Auto-create user if authenticated but no user record exists
  useEffect(() => {
    // Temporarily disabled to debug auth issues
    // if (user === null && user !== undefined) {
    //   createUser().catch((error) => {
    //     console.error("Failed to create user:", error);
    //   });
    // }
  }, [user, createUser]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">NFL Paper Sportsbook</h2>
          <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            PRACTICE ONLY - NO REAL MONEY
          </span>
        </div>
        
        <Authenticated>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView("sportsbook")}
                className={`px-3 py-1 rounded ${
                  currentView === "sportsbook" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Sportsbook
              </button>
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-1 rounded ${
                  currentView === "dashboard" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("leaderboard")}
                className={`px-3 py-1 rounded ${
                  currentView === "leaderboard" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Leaderboard
              </button>
              {user?.isAdmin && (
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-1 rounded ${
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
                  ${(user.virtualBalance || 0).toLocaleString()}
                </span>
              </div>
            )}
            
            <SignOutButton />
          </div>
        </Authenticated>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[80vh] p-8">
            <div className="w-full max-w-md mx-auto text-center">
              <h1 className="text-4xl font-bold text-primary mb-4">
                NFL Paper Trading Sportsbook
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Practice betting with no real money. Perfect your strategy risk-free!
              </p>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          {user === undefined ? (
            <div className="flex items-center justify-center min-h-[80vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {currentView === "sportsbook" && <Sportsbook />}
              {currentView === "dashboard" && <Dashboard />}
              {currentView === "leaderboard" && <Leaderboard />}
              {currentView === "admin" && user?.isAdmin && <AdminPanel />}
            </>
          )}
        </Authenticated>
      </main>
      
      <Toaster />
    </div>
  );
}
