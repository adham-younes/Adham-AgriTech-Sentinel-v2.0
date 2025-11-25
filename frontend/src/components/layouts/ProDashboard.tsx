'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Map as MapIcon,
    Sprout,
    CloudRain,
    Settings,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProDashboardProps {
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Map', href: '/dashboard/map', icon: MapIcon },
    { label: 'Crops', href: '/dashboard/crops', icon: Sprout },
    { label: 'Weather', href: '/dashboard/weather', icon: CloudRain },
    { label: 'Assistant', href: '/dashboard/assistant', icon: Bot },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function ProDashboard({ children }: ProDashboardProps) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out z-30",
                    isSidebarCollapsed ? "w-[80px]" : "w-[280px]"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                    {!isSidebarCollapsed && (
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                            Adham AgriTech
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="ml-auto text-muted-foreground hover:text-primary"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </Button>
                </div>

                <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(0,255,157,0.3)]"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    size={24}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />
                                {!isSidebarCollapsed && (
                                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className={cn(
                        "flex items-center gap-3",
                        isSidebarCollapsed ? "justify-center" : ""
                    )}>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            A
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Adham User</span>
                                <span className="text-xs text-muted-foreground">Pro Plan</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40">
                    <span className="text-lg font-bold text-primary">Adham AgriTech</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 scroll-smooth">
                    {children}
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] z-50">
                    <div className="flex justify-around items-center h-16 px-2">
                        {NAV_ITEMS.slice(0, 5).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-full h-full gap-1",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" : ""} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </main>
        </div>
    );
}
