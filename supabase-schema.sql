-- CLEAN FRESH SCHEMA FOR NFL SPORTSBOOK
-- Simple, no RLS, no triggers, no constraints
-- First signup = auto admin

DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.props CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT '',
  virtual_balance NUMERIC DEFAULT 100000,
  is_admin BOOLEAN DEFAULT false,
  lifetime_profit NUMERIC DEFAULT 0,
  total_bets INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  home_score INTEGER DEFAULT NULL,
  away_score INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Props table
CREATE TABLE public.props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  external_game_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  over NUMERIC NOT NULL,
  under NUMERIC NOT NULL,
  current_line NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  prop_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  prediction TEXT NOT NULL,
  odds NUMERIC NOT NULL,
  settled BOOLEAN DEFAULT false,
  result TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_external_id ON public.games(external_id);
CREATE INDEX idx_props_game_id ON public.props(game_id);
CREATE INDEX idx_bets_user_id ON public.bets(user_id);
CREATE INDEX idx_bets_game_id ON public.bets(game_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_lifetime_profit ON public.users(lifetime_profit DESC);
