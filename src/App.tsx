/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Component, ErrorInfo, ReactNode, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Sparkles, Settings as SettingsIcon, AlertTriangle, Search, Book, Wine, Lock, Star, MoreHorizontal, Clock, Share, X } from 'lucide-react';
import { cn } from './lib/utils';
import { db } from './db';
import { startSync } from './lib/sync';
import { SyncIndicator } from './components/SyncIndicator';
import { useLiveQuery } from 'dexie-react-hooks';
import WineList from './pages/WineList';
import WineForm from './pages/WineForm';
import AISearch from './pages/AISearch';
import Settings from './pages/Settings';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] p-4">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#e9e9e7] max-w-md w-full text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-[#37352f]">Ein Fehler ist aufgetreten</h1>
            <p className="text-sm text-[#787774] break-words">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#37352f] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#2f2d28] transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showLegal, setShowLegal] = useState(false);
  
  const recentWines = useLiveQuery(() => db.wines.orderBy('id').reverse().limit(4).toArray());
  const latestWine = useLiveQuery(() => db.wines.orderBy('createdAt').reverse().first());
  
  const lastEditedText = latestWine?.createdAt 
    ? `Zuletzt bearbeitet: ${new Date(latestWine.createdAt).toLocaleDateString('de-DE')}`
    : 'Noch keine Einträge';

  const handleShare = async () => {
    const match = location.pathname.match(/^\/edit\/(\d+)$/);
    if (match) {
      const wineId = Number(match[1]);
      const wine = await db.wines.get(wineId);
      if (wine) {
        const text = `Schau dir diesen Wein an: ${wine.name} (${wine.jahrgang || 'Ohne Jahrgang'})\nRebsorte: ${wine.rebsorte || '-'}\nBewertung: ${wine.noteKirsten || '-'}/10 (Kirsten), ${wine.noteTorsten || '-'}/10 (Torsten)\n\nNotizen: ${wine.kommentarKirsten || ''} ${wine.kommentarTorsten || ''}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Wein-Empfehlung: ${wine.name}`,
              text: text,
            });
          } catch (err) {
            console.error('Share failed:', err);
          }
        } else {
          window.location.href = `mailto:?subject=Wein-Empfehlung: ${wine.name}&body=${encodeURIComponent(text)}`;
        }
        return;
      }
    }
    
    // Default share (whole app)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wein-Guide von Kirsten & Torsten',
          text: 'Hier ist unser persönlicher Wein-Guide!',
          url: window.location.origin + window.location.pathname,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      window.location.href = `mailto:?subject=Wein-Guide&body=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
    }
  };
  
  const navItems = [
    { path: '/ai', icon: Search, label: 'Suchen (KI)', color: 'text-purple-500' },
    { path: '/', icon: Book, label: 'Bibliothek', color: 'text-gray-500' },
    { path: '/new', icon: PlusCircle, label: 'Neuer Wein', color: 'text-gray-500' },
    { path: '/settings', icon: SettingsIcon, label: 'Einstellungen', color: 'text-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#37352f] font-sans pb-0 md:pb-10 md:pl-64 flex flex-col">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-10 left-0 bg-[#f7f7f5] border-r border-[#e9e9e7] pt-4 px-2 overflow-y-auto custom-scrollbar">
        
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600">
            <Wine className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[15px] text-[#37352f]">Unser Weinkeller</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-0.5 mb-6 mt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1 rounded-md text-[14px] font-medium transition-colors",
                location.pathname === item.path 
                  ? "bg-[#e9e9e7] text-[#37352f]" 
                  : "text-[#37352f] hover:bg-[#efefed]"
              )}
            >
              <item.icon className={cn("w-4 h-4", item.color)} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Recently Used */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 px-2 mb-1 text-[#787774]">
            <Clock className="w-3.5 h-3.5" />
            <h3 className="text-xs font-semibold">Kürzlich hinzugefügt</h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {recentWines?.map((wine) => (
              <Link
                key={wine.id}
                to={`/edit/${wine.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1 rounded-md text-[14px] transition-colors",
                  location.pathname === `/edit/${wine.id}`
                    ? "bg-[#e9e9e7] text-[#37352f] font-medium" 
                    : "text-[#37352f] hover:bg-[#efefed]"
                )}
              >
                <Wine className={cn("w-4 h-4 shrink-0", wine.farbe === 'Rot' ? 'text-red-500' : wine.farbe === 'Weiß' ? 'text-yellow-500' : wine.farbe === 'Rosé' ? 'text-pink-400' : 'text-orange-400')} />
                <span className="truncate">{wine.name}</span>
              </Link>
            ))}
            {recentWines?.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-400">Noch keine Weine vorhanden</div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        
        {/* Top Navigation Bar (Notion Style) */}
        <div className="h-12 border-b border-[#e9e9e7] flex items-center justify-between px-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 text-sm text-[#37352f]">
            <Wine className="w-4 h-4 text-red-500" />
            <span className="font-medium truncate">Wein-Guide<span className="hidden sm:inline"> von Kirsten & Torsten</span></span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#787774]">
            <span className="hidden sm:inline">{lastEditedText}</span>
            <SyncIndicator />
            <div onClick={handleShare} className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">
              <Share className="w-3 h-3" />
              <span>Teilen</span>
            </div>
          </div>
        </div>

        {/* Cover Image & Title Area */}
        <div className="w-full relative">
          <div className="h-24 md:h-64 w-full bg-gradient-to-br from-red-900 via-red-800 to-rose-700 overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=2000&auto=format&fit=crop" 
              alt="Wine Cellar Cover" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="max-w-5xl mx-auto px-4 md:px-8 relative">
            <div className="absolute -top-8 md:-top-16 left-4 md:left-8 text-4xl md:text-7xl bg-white rounded-full p-2 shadow-sm">
              🍷
            </div>
            <div className="pt-10 md:pt-16 pb-4 md:pb-8">
              <h1 className="text-2xl md:text-5xl font-bold text-[#37352f] tracking-tight">
                Wein-Guide von Kirsten & Torsten
              </h1>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 w-full pb-12 flex-1">
          {children}
        </div>

        {/* Mobile Footer (inline at bottom of content) */}
        <footer className="md:hidden w-full border-t border-[#e9e9e7] bg-[#f7f7f5] mt-auto py-4 flex justify-center gap-6 text-xs text-[#787774] pb-20">
          <button onClick={() => setShowLegal(true)} className="hover:text-[#37352f] transition-colors">Rechtlicher Hinweis</button>
        </footer>
      </main>

      {/* Desktop Footer (fixed full width) */}
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 h-10 bg-[#f7f7f5] border-t border-[#e9e9e7] z-50 items-center justify-center gap-8 text-xs text-[#787774]">
        <button onClick={() => setShowLegal(true)} className="hover:text-[#37352f] transition-colors">Rechtlicher Hinweis</button>
      </footer>

      {/* Modals */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLegal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Rechtlicher Hinweis</h2>
              <button onClick={() => setShowLegal(false)} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-sm text-[#37352f] space-y-2">
              <p>
                Dieses Tool und die darin gesammelten Daten (inklusive Bilder und Bewertungen) sind ausschließlich für die private, nicht-kommerzielle Nutzung durch den Betreiber und dessen Freunde bestimmt.
              </p>
              <p>
                Eine kommerzielle Weiterverwendung der Datenbank oder der Inhalte ist ausgeschlossen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#ffffff] border-t border-[#e9e9e7] flex justify-around items-center h-16 px-4 z-50 box-content pb-[env(safe-area-inset-bottom)]">
        <Link to="/" className={cn("flex flex-col items-center justify-center w-full h-full gap-1", location.pathname === '/' ? "text-[#37352f]" : "text-[#787774]")}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/new" className={cn("flex flex-col items-center justify-center w-full h-full gap-1", location.pathname === '/new' ? "text-[#37352f]" : "text-[#787774]")}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Neu</span>
        </Link>
        <Link to="/ai" className={cn("flex flex-col items-center justify-center w-full h-full gap-1", location.pathname === '/ai' ? "text-[#37352f]" : "text-[#787774]")}>
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">KI</span>
        </Link>
        <Link to="/settings" className={cn("flex flex-col items-center justify-center w-full h-full gap-1", location.pathname === '/settings' ? "text-[#37352f]" : "text-[#787774]")}>
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    startSync();
    // Browser bitten, die lokale Datenbank nicht automatisch zu löschen
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  return (
    <HashRouter>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<WineList />} />
            <Route path="/new" element={<WineForm />} />
            <Route path="/edit/:id" element={<WineForm />} />
            <Route path="/ai" element={<AISearch />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </HashRouter>
  );
}
