import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'MISSING');
console.log('Supabase Key:', supabaseAnonKey ? 'present' : 'MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          virtual_balance: number;
          is_admin: boolean;
          lifetime_profit: number;
          total_bets: number;
          wins: number;
          losses: number;
          pushes: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          virtual_balance?: number;
          is_admin?: boolean;
          lifetime_profit?: number;
          total_bets?: number;
          wins?: number;
          losses?: number;
          pushes?: number;
        };
        Update: {
          username?: string | null;
          virtual_balance?: number;
          lifetime_profit?: number;
          total_bets?: number;
          wins?: number;
          losses?: number;
          pushes?: number;
        };
      };
      games: {
        Row: {
          id: string;
          external_id: string;
          home_team: string;
          away_team: string;
          start_time: string;
          status: string;
          home_score: number | null;
          away_score: number | null;
          created_at: string;
        };
        Insert: {
          external_id: string;
          home_team: string;
          away_team: string;
          start_time: string;
          status: string;
          home_score?: number | null;
          away_score?: number | null;
        };
        Update: {
          status?: string;
          home_score?: number | null;
          away_score?: number | null;
        };
      };
      props: {
        Row: {
          id: string;
          game_id: string;
          external_game_id: string;
          type: string;
          description: string;
          over: number;
          under: number;
          current_line: number;
          created_at: string;
        };
        Insert: {
          game_id: string;
          external_game_id: string;
          type: string;
          description: string;
          over: number;
          under: number;
          current_line: number;
        };
        Update: {
          over?: number;
          under?: number;
          current_line?: number;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          prop_id: string;
          amount: number;
          prediction: string;
          odds: number;
          settled: boolean;
          result: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          prop_id: string;
          amount: number;
          prediction: string;
          odds: number;
          settled?: boolean;
          result?: string | null;
        };
        Update: {
          settled?: boolean;
          result?: string | null;
        };
      };
    };
  };
};
