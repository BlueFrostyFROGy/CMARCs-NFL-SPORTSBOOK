#!/usr/bin/env node
import https from 'https';
import { URL } from 'url';

// Supabase config
const SUPABASE_URL = 'https://nqruiqrhyqipcsscgdkq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnVpcXJoeXFpcGNzc2NnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY2NjQyMSwiZXhwIjoyMDg0MjQyNDIxfQ.F7aP2SAvqNtbHE84aVdUCf6OtSi-WviqPpv6aVP8lxo';

// Helper to make Supabase requests
async function supabaseRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  // Step 1: Create sample games
  console.log('🏈 Creating sample games...');
  const games = [
    {
      external_id: 'nfl_2024_01_kc_sf',
      home_team: 'San Francisco 49ers',
      away_team: 'Kansas City Chiefs',
      start_time: new Date('2024-02-11T23:30:00Z').toISOString(),
      status: 'scheduled',
    },
    {
      external_id: 'nfl_2024_02_dal_gb',
      home_team: 'Green Bay Packers',
      away_team: 'Dallas Cowboys',
      start_time: new Date('2024-01-15T20:30:00Z').toISOString(),
      status: 'scheduled',
    },
    {
      external_id: 'nfl_2024_03_lv_buf',
      home_team: 'Buffalo Bills',
      away_team: 'Las Vegas Raiders',
      start_time: new Date('2024-01-20T13:00:00Z').toISOString(),
      status: 'scheduled',
    },
  ];

  let gameIds = [];
  for (const game of games) {
    try {
      const result = await supabaseRequest('POST', '/rest/v1/games', game);
      if (result.status === 201) {
        console.log(`  ✅ Created game: ${game.away_team} @ ${game.home_team}`);
        if (result.data && result.data[0]) gameIds.push(result.data[0].id);
      }
    } catch (err) {
      console.error(`  ❌ Error creating game:`, err.message);
    }
  }

  // Step 2: Create sample props
  console.log('\n📊 Creating sample props...');
  const props = [
    {
      game_id: gameIds[0],
      external_game_id: 'nfl_2024_01_kc_sf',
      type: 'player_passing_yards',
      description: 'Patrick Mahomes Pass Yards Over/Under',
      over: 2.1,
      under: 1.9,
      current_line: 275.5,
    },
    {
      game_id: gameIds[0],
      external_game_id: 'nfl_2024_01_kc_sf',
      type: 'player_rushing_yards',
      description: 'Christian McCaffrey Rush Yards Over/Under',
      over: 2.0,
      under: 2.0,
      current_line: 80.5,
    },
    {
      game_id: gameIds[1],
      external_game_id: 'nfl_2024_02_dal_gb',
      type: 'team_total_points',
      description: 'Green Bay Packers Total Points Over/Under',
      over: 2.1,
      under: 1.9,
      current_line: 27.5,
    },
  ];

  for (const prop of props) {
    try {
      const result = await supabaseRequest('POST', '/rest/v1/props', prop);
      if (result.status === 201) {
        console.log(`  ✅ Created prop: ${prop.description}`);
      }
    } catch (err) {
      console.error(`  ❌ Error creating prop:`, err.message);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart the dev server: npm run dev');
  console.log('2. Sign up with: cadenarch@outlook.com / Password123!');
  console.log('3. User profile will be auto-created in Supabase');
  console.log('4. Then run this SQL in Supabase to make them admin:');
  console.log(`
UPDATE public.users
SET is_admin = true
WHERE email = 'cadenarch@outlook.com';
  `);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
