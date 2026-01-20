import { useEffect, useMemo, useState } from "react";
import { supabase, type Database } from "../lib/supabase";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type BetRow = Database["public"]["Tables"]["bets"]["Row"];

interface DashboardProps {
  user: UserRow;
}

export function Dashboard({ user }: DashboardProps) {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBets(data ?? []);
        setLoading(false);
      });
  }, [user.id]);

  const { openBets, settledBets, totalStaked, totalWon, winRate } = useMemo(() => {
    const open = bets.filter(b => !b.settled);
    const settled = bets.filter(b => b.settled);
    const staked = bets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
    const won = settled.filter(b => b.result === "won").length;
    const totalSettled = settled.length;
    const rate = totalSettled > 0 ? (won / totalSettled) * 100 : 0;
    const totalWonAmount = settled
      .filter(b => b.result === "won")
      .reduce((sum, bet) => sum + Number(bet.amount || 0) * Math.abs(Number(bet.odds) ?? 0) / 100, 0);
    return {
      openBets: open,
      settledBets: settled,
      totalStaked: staked,
      totalWon: totalWonAmount,
      winRate: rate,
    };
  }, [bets]);

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Stats and recent bets from Supabase.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Balance</p>
          <p className="text-2xl font-bold text-green-600">${Number(user.virtual_balance || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Lifetime Profit</p>
          <p className={`text-2xl font-bold ${Number(user.lifetime_profit) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {Number(user.lifetime_profit) >= 0 ? "+" : ""}{Number(user.lifetime_profit).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Win Rate</p>
          <p className="text-2xl font-bold text-blue-600">{winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Staked</p>
          <p className="text-2xl font-bold text-gray-900">${totalStaked.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Bets</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center text-gray-500">No bets yet.</div>
          ) : (
            <div className="space-y-3">
              {bets.slice(0, 10).map(bet => (
                <div key={bet.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm text-gray-700">{bet.prediction.toUpperCase()} @ {formatOdds(Number(bet.odds))}</div>
                    <div className="text-xs text-gray-500">Prop: {bet.prop_id} · Game: {bet.game_id}</div>
                  </div>
                  <div className="text-right text-sm text-gray-700">
                    <div>Stake: ${Number(bet.amount).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{new Date(bet.created_at ?? "").toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
