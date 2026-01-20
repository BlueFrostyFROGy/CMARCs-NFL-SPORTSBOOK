import { useEffect, useState } from "react";
import { supabase, type Database } from "../lib/supabase";

type BetRow = Database["public"]["Tables"]["bets"]["Row"];

export function PublicBetFeed() {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        setBets(data ?? []);
        setLoading(false);
      });
  }, []);

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Public Bet Feed</h2>
        <p className="text-sm text-gray-600">Recent bets submitted to Supabase</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {bets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No public bets yet</p>
            <p className="text-sm mt-1">Be the first to place a bet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div key={bet.id} className="border rounded-lg p-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm">User: {bet.user_id.slice(0, 6)}...</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{bet.prediction.toUpperCase()}</span>
                      <span>Prop: {bet.prop_id}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">Stake: ${Number(bet.amount).toFixed(2)}</div>
                    <div className="font-medium text-green-600">Odds: {formatOdds(Number(bet.odds))}</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {new Date(bet.created_at ?? "").toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
