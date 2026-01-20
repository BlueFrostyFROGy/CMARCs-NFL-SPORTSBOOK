export function AdminPanel() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Admin tooling will return after we rebuild it on Supabase.</p>
      </div>

      <div className="rounded-lg border bg-gray-50 p-6 text-gray-700 space-y-2">
        <p>We removed Convex calls that were crashing the page after sign-in.</p>
        <p>Next steps: recreate game/prop creation and grading using Supabase RPCs or row inserts.</p>
      </div>
    </div>
  );
}
