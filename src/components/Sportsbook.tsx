import { useState } from "react";
import { GamesList } from "./GamesList";
import { GameProps } from "./GameProps";
import { BetSlip } from "./BetSlip";
import { PublicBetFeed } from "./PublicBetFeed";

export interface BetSlipLeg {
  propId: string;
  gameId: string;
  description: string;
  type: string;
  line: number;
  side: "over" | "under";
  odds: number;
  gameInfo: string;
}

interface SportsbookProps {
  userId: string;
}

export function Sportsbook({ userId }: SportsbookProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [betSlipLegs, setBetSlipLegs] = useState<BetSlipLeg[]>([]);
  const [showPublicFeed, setShowPublicFeed] = useState(false);

  const addToBetSlip = (leg: BetSlipLeg) => {
    setBetSlipLegs(prev => {
      const filtered = prev.filter(
        existing => !(existing.propId === leg.propId && existing.side === leg.side)
      );
      return [...filtered, leg];
    });
  };

  const removeFromBetSlip = (propId: string, side: "over" | "under") => {
    setBetSlipLegs(prev => prev.filter(leg => !(leg.propId === propId && leg.side === side)));
  };

  const clearBetSlip = () => setBetSlipLegs([]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r bg-white overflow-y-auto">
        <GamesList selectedGameId={selectedGameId} onSelectGame={setSelectedGameId} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedGameId ? (
          <GameProps
            gameId={selectedGameId}
            onAddToBetSlip={addToBetSlip}
            betSlipLegs={betSlipLegs}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Select a Game</h3>
              <p>Choose a game from the left to view props</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 border-l bg-white flex flex-col">
        <div className="flex border-b">
          <button
            onClick={() => setShowPublicFeed(false)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              !showPublicFeed ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Bet Slip ({betSlipLegs.length})
          </button>
          <button
            onClick={() => setShowPublicFeed(true)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              showPublicFeed ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Public Feed
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {showPublicFeed ? (
            <PublicBetFeed />
          ) : (
            <BetSlip
              legs={betSlipLegs}
              onRemoveLeg={removeFromBetSlip}
              onClearSlip={clearBetSlip}
              userId={userId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
