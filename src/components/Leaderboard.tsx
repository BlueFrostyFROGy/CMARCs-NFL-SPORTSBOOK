import { useEffect, useState } from "react";
import { supabase, type Database } from "../lib/supabase";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function Leaderboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .order("lifetime_profit", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setUsers(data ?? []);
        setLoading(false);
      });
  }, []);

  const formatProfit = (profit: number) => {
    const sign = profit >= 0 ? "+" : "";
    return `${sign}$${profit.toFixed(2)}`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-600">Top users by lifetime profit (Supabase)</p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-3">Lifetime Profit</div>
          <div className="col-span-2">Wins</div>
          <div className="col-span-2">Losses</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No users found.</div>
        ) : (
          <div className="divide-y">
            {users.map((user, idx) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
                <div className="col-span-1 font-semibold">{idx + 1}</div>
                <div className="col-span-4 text-sm">{user.email}</div>
                <div className={`col-span-3 font-bold ${getProfitColor(Number(user.lifetime_profit))}`}>
                  {formatProfit(Number(user.lifetime_profit))}
                </div>
                <div className="col-span-2">{user.wins}</div>
                <div className="col-span-2">{user.losses}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
