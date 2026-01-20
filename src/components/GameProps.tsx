import { useEffect, useMemo, useState } from "react";
import { supabase, type Database } from "../lib/supabase";
import type { BetSlipLeg } from "./Sportsbook";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type PropRow = Database["public"]["Tables"]["props"]["Row"];

interface GamePropsProps {
  gameId: string;
  onAddToBetSlip: (leg: BetSlipLeg) => void;
  betSlipLegs: BetSlipLeg[];
}

export function GameProps({ gameId, onAddToBetSlip, betSlipLegs }: GamePropsProps) {
  const [game, setGame] = useState<GameRow | null>(null);
  const [props, setProps] = useState<PropRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
      supabase.from("props").select("*").eq("game_id", gameId).order("created_at", { ascending: true })
    ]).then(([gameResult, propsResult]) => {
      setGame(gameResult.data ?? null);
      setProps(propsResult.data ?? []);
      setLoading(false);
    });
  }, [gameId]);

  const grouped = useMemo(() => {
    return props.reduce<Record<string, PropRow[]>>((acc, prop) => {
      const key = prop.type || "other";
      acc[key] = acc[key] ? [...acc[key], prop] : [prop];
      return acc;
    }, {});
  }, [props]);

  const isLegInSlip = (propId: string, side: "over" | "under") =>
    betSlipLegs.some(leg => leg.propId === propId && leg.side === side);

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);
  const formatPropType = (value: string) =>
    value
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-6 text-gray-600">Game not found.</div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {game.away_team} @ {game.home_team}
        </h1>
        <p className="text-gray-600">
          {new Date(game.start_time ?? "").toLocaleString()}
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No props available for this game</p>
          <p className="text-sm mt-1">Props will be added closer to game time</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {formatPropType(type)}
              </h2>

              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-center">Line</div>
                  <div className="col-span-2 text-center">Over</div>
                  <div className="col-span-3 text-center">Under</div>
                </div>

                {list.map(prop => (
                  <div key={prop.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="col-span-5 font-medium">
                      {prop.description}
                    </div>
                    <div className="col-span-2 text-center font-semibold">
                      {prop.current_line}
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() =>
                          onAddToBetSlip({
                            propId: prop.id,
                            gameId: game.id,
                            description: prop.description,
                            type: prop.type,
                            line: prop.current_line,
                            side: "over",
                            odds: Number(prop.over),
                            gameInfo: `${game.away_team} @ ${game.home_team}`,
                          })
                        }
                        className={`w-full py-2 px-3 rounded border text-sm font-medium transition-colors ${
                          isLegInSlip(prop.id, "over")
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Over {formatOdds(Number(prop.over))}
                      </button>
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() =>
                          onAddToBetSlip({
                            propId: prop.id,
                            gameId: game.id,
                            description: prop.description,
                            type: prop.type,
                            line: prop.current_line,
                            side: "under",
                            odds: Number(prop.under),
                            gameInfo: `${game.away_team} @ ${game.home_team}`,
                          })
                        }
                        className={`w-full py-2 px-3 rounded border text-sm font-medium transition-colors ${
                          isLegInSlip(prop.id, "under")
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Under {formatOdds(Number(prop.under))}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
