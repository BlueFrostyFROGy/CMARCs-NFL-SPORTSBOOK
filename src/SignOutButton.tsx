import { supabase } from './lib/supabase';

export function SignOutButton() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
