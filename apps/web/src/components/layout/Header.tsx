import { Search, Bell, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from './UserMenu';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-brand-violet-light/30 bg-white px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
          <Input
            type="search"
            placeholder="Search contacts, deals..."
            className="w-80 pl-9 pr-16"
            onClick={() => setCommandPaletteOpen(true)}
            readOnly
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-brand-violet-light bg-flash-white px-1.5 font-mono text-[10px] font-medium text-grey sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-magenta" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
