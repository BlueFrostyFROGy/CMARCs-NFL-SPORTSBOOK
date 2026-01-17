import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"games" | "props" | "grading">("games");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("games")}
              className={`px-6 py-4 font-medium ${
                activeTab === "games"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Games Management
            </button>
            <button
              onClick={() => setActiveTab("props")}
              className={`px-6 py-4 font-medium ${
                activeTab === "props"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Props Management
            </button>
            <button
              onClick={() => setActiveTab("grading")}
              className={`px-6 py-4 font-medium ${
                activeTab === "grading"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Bet Grading
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "games" && <GamesManagement />}
          {activeTab === "props" && <PropsManagement />}
          {activeTab === "grading" && <BetGrading />}
        </div>
      </div>
    </div>
  );
}

function GamesManagement() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState("");

  const games = useQuery(api.games.listGames);
  const createGame = useMutation(api.games.createGame);
  const updateGameStatus = useMutation(api.games.updateGameStatus);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeTeam || !awayTeam || !startTime) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createGame({
        homeTeam,
        awayTeam,
        startTime: new Date(startTime).getTime(),
      });
      
      toast.success("Game created successfully");
      setHomeTeam("");
      setAwayTeam("");
      setStartTime("");
    } catch (error) {
      toast.error("Failed to create game");
    }
  };

  const handleStatusUpdate = async (gameId: Id<"games">, status: "upcoming" | "live" | "final") => {
    try {
      await updateGameStatus({ gameId, status });
      toast.success("Game status updated");
    } catch (error) {
      toast.error("Failed to update game status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
        <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Away Team"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Home Team"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Game
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Games</h2>
        {!games ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <p className="text-gray-500">No games created yet</p>
        ) : (
          <div className="space-y-2">
            {games.map(game => (
              <div key={game._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {game.awayTeam} @ {game.homeTeam}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(game.startTime).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    game.status === "upcoming" ? "bg-blue-100 text-blue-800" :
                    game.status === "live" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {game.status.toUpperCase()}
                  </span>
                  <select
                    value={game.status}
                    onChange={(e) => handleStatusUpdate(game._id, e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropsManagement() {
  const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | "">("");
  const [playerName, setPlayerName] = useState("");
  const [propType, setPropType] = useState<"passing_yards" | "rushing_yards" | "receiving_yards" | "receptions" | "anytime_td">("passing_yards");
  const [lineValue, setLineValue] = useState("");
  const [overOdds, setOverOdds] = useState("");
  const [underOdds, setUnderOdds] = useState("");

  const games = useQuery(api.games.listGames);
  const props = useQuery(api.props.getGameProps, selectedGameId ? { gameId: selectedGameId } : "skip");
  const createProp = useMutation(api.props.createProp);

  const handleCreateProp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGameId || !playerName || !lineValue || !overOdds || !underOdds) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createProp({
        gameId: selectedGameId,
        playerName,
        propType,
        lineValue: parseFloat(lineValue),
        overOdds: parseInt(overOdds),
        underOdds: parseInt(underOdds),
      });
      
      toast.success("Prop created successfully");
      setPlayerName("");
      setLineValue("");
      setOverOdds("");
      setUnderOdds("");
    } catch (error) {
      toast.error("Failed to create prop");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Create New Prop</h2>
        <form onSubmit={handleCreateProp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value as Id<"games">)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Game</option>
              {games?.map(game => (
                <option key={game._id} value={game._id}>
                  {game.awayTeam} @ {game.homeTeam}
                </option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="passing_yards">Passing Yards</option>
              <option value="rushing_yards">Rushing Yards</option>
              <option value="receiving_yards">Receiving Yards</option>
              <option value="receptions">Receptions</option>
              <option value="anytime_td">Anytime TD</option>
            </select>
            
            <input
              type="number"
              placeholder="Line Value"
              value={lineValue}
              onChange={(e) => setLineValue(e.target.value)}
              step="0.5"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <input
              type="number"
              placeholder="Over Odds (e.g. -110)"
              value={overOdds}
              onChange={(e) => setOverOdds(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <input
              type="number"
              placeholder="Under Odds (e.g. -110)"
              value={underOdds}
              onChange={(e) => setUnderOdds(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Prop
          </button>
        </form>
      </div>

      {selectedGameId && props && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Props for Selected Game</h2>
          {props.length === 0 ? (
            <p className="text-gray-500">No props created for this game yet</p>
          ) : (
            <div className="space-y-2">
              {props.map(prop => (
                <div key={prop._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {prop.playerName} - {prop.propType.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Line: {prop.lineValue} | Over: {prop.overOdds > 0 ? '+' : ''}{prop.overOdds} | Under: {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    prop.result === "pending" ? "bg-blue-100 text-blue-800" :
                    prop.result === "over_win" ? "bg-green-100 text-green-800" :
                    prop.result === "under_win" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {prop.result.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BetGrading() {
  const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | "">("");
  
  const games = useQuery(api.games.listGames);
  const props = useQuery(api.props.getGameProps, selectedGameId ? { gameId: selectedGameId } : "skip");
  const gradeProp = useMutation(api.props.gradeProp);

  const handleGradeProp = async (propId: Id<"props">, result: "over_win" | "under_win" | "push") => {
    try {
      await gradeProp({ propId, result });
      toast.success("Prop graded successfully");
    } catch (error) {
      toast.error("Failed to grade prop");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Grade Props</h2>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value as Id<"games">)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Game to Grade</option>
          {games?.map(game => (
            <option key={game._id} value={game._id}>
              {game.awayTeam} @ {game.homeTeam} ({game.status})
            </option>
          ))}
        </select>
      </div>

      {selectedGameId && props && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Props to Grade</h3>
          {props.length === 0 ? (
            <p className="text-gray-500">No props found for this game</p>
          ) : (
            <div className="space-y-3">
              {props.map(prop => (
                <div key={prop._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        {prop.playerName} - {prop.propType.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Line: {prop.lineValue} | Over: {prop.overOdds > 0 ? '+' : ''}{prop.overOdds} | Under: {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      prop.result === "pending" ? "bg-blue-100 text-blue-800" :
                      prop.result === "over_win" ? "bg-green-100 text-green-800" :
                      prop.result === "under_win" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {prop.result.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {prop.result === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGradeProp(prop._id, "over_win")}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Over Wins
                      </button>
                      <button
                        onClick={() => handleGradeProp(prop._id, "under_win")}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Under Wins
                      </button>
                      <button
                        onClick={() => handleGradeProp(prop._id, "push")}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Push
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
