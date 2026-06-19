import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Droplet, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Sparkles, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WineIcon } from '../components/WineIcon';
import { RebsorteIcon } from '../components/RebsorteIcon';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

type SortOrder = 'desc' | 'asc' | null;
type ViewMode = 'grid' | 'list';

export default function WineList() {
  const navigate = useNavigate();
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [sortDate, setSortDate] = useState<SortOrder>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const wines = useLiveQuery(
    () => {
      let collection = db.wines.orderBy('createdAt').reverse();
      
      if (filterColor) {
        collection = collection.filter(w => w.farbe === filterColor);
      }
      if (filterRating) {
        collection = collection.filter(w => (w.noteKirsten || 0) > 7 || (w.noteTorsten || 0) > 7);
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        collection = collection.filter(w => 
          w.name.toLowerCase().includes(lowerSearch) || 
          (w.rebsorte || '').toLowerCase().includes(lowerSearch) ||
          (w.land || '').toLowerCase().includes(lowerSearch)
        );
      }
      
      let results = collection.toArray();
      
      return results.then(arr => {
        if (sortDate) {
          arr.sort((a, b) => {
            const dateA = a.kaufdatum ? new Date(a.kaufdatum).getTime() : 0;
            const dateB = b.kaufdatum ? new Date(b.kaufdatum).getTime() : 0;
            return sortDate === 'asc' ? dateA - dateB : dateB - dateA;
          });
        }
        return arr;
      });
    },
    [filterColor, filterRating, search, sortDate]
  );

  const colors = ['Weiß', 'Rot', 'Rosé', 'Orange'];

  const getColorBadgeClass = (color?: string) => {
    switch(color) {
      case 'Weiß': return 'bg-amber-100 text-amber-800';
      case 'Rot': return 'bg-red-100 text-red-800';
      case 'Rosé': return 'bg-pink-100 text-pink-800';
      case 'Orange': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateAnalysis = async () => {
    if (!wines || wines.length === 0) return;
    
    setShowAnalysis(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const wineData = wines.map(w => {
        return `- ${w.name} (${w.jahrgang || 'k.A.'}): ${w.farbe}, ${w.land}, ${w.anbaugebiet}. Rebsorte: ${w.rebsorte}. Note Kirsten: ${w.noteKirsten}, Note Torsten: ${w.noteTorsten}. Preis: ${w.preis}€.`;
      }).join('\n');

      const prompt = `Du bist ein erfahrener Sommelier. Analysiere den folgenden Weinkeller und erstelle eine übersichtliche Zusammenfassung.
Hebe Trends hervor (z.B. bevorzugte Länder, Rebsorten, Farben), identifiziere die beliebtesten Weine (basierend auf den Noten von Kirsten und Torsten) und gib vielleicht 1-2 kurze Empfehlungen, was in der Sammlung noch fehlen könnte oder was man als nächstes probieren sollte.
Formatiere die Antwort ansprechend mit Markdown (Überschriften, Aufzählungen).

Hier ist der Inhalt des Weinkellers:
${wineData}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysisResult(response.text || 'Keine Analyse generiert.');
    } catch (err: any) {
      console.error("Analysis error:", err);
      setAnalysisError(err.message || 'Fehler bei der Generierung der Analyse.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold">Weine</h1>
        
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#787774]" />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <button
              onClick={generateAnalysis}
              disabled={!wines || wines.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50"
              title="KI-Analyse des Weinkellers"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Keller-Analyse
            </button>

            <div className="flex items-center bg-[#f7f7f5] rounded-md p-0.5 border border-[#e9e9e7]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                title="Rasteransicht"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#37352f]' : 'text-[#787774] hover:text-[#37352f]'}`}
                title="Listenansicht"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                if (sortDate === null) setSortDate('desc');
                else if (sortDate === 'desc') setSortDate('asc');
                else setSortDate(null);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${sortDate ? 'bg-blue-100 text-blue-800' : 'bg-[#f7f7f5] text-[#787774] hover:bg-[#efefed]'}`}
              title="Nach Kaufdatum sortieren"
            >
              {sortDate === 'desc' ? <ArrowDown className="w-3 h-3" /> : sortDate === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3" />}
              Kaufdatum
            </button>
            <button
              onClick={() => setFilterRating(!filterRating)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filterRating ? 'bg-yellow-100 text-yellow-800' : 'bg-[#f7f7f5] text-[#787774] hover:bg-[#efefed]'}`}
            >
              <Star className="w-3 h-3" /> Note &gt; 7
            </button>
            
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setFilterColor(filterColor === c ? null : c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filterColor === c ? getColorBadgeClass(c) : 'bg-[#f7f7f5] text-[#787774] hover:bg-[#efefed]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
        {wines?.map((wine) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={wine.id}
          >
            <div
              onClick={() => navigate(`/edit/${wine.id}`)}
              className={`block group bg-white border border-[#e9e9e7] rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${viewMode === 'list' ? 'flex flex-row h-32 sm:h-40' : ''}`}
            >
              {wine.image ? (
                <div className={viewMode === 'grid' ? "h-48 w-full bg-gray-100 overflow-hidden" : "w-32 sm:w-40 h-full shrink-0 bg-gray-100 overflow-hidden"}>
                  <img src={wine.image} alt={wine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "h-48 w-full bg-[#f7f7f5] flex items-center justify-center" : "w-32 sm:w-40 h-full shrink-0 bg-[#f7f7f5] flex items-center justify-center"}>
                  <WineIcon color={wine.farbe} className="w-16 h-16" />
                </div>
              )}
              <div className={`p-4 space-y-3 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between overflow-hidden' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-lg leading-tight truncate">{wine.name}</h3>
                  {wine.farbe && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${getColorBadgeClass(wine.farbe)}`}>
                      {wine.farbe}
                    </span>
                  )}
                </div>
                
                <div className={`space-y-1.5 ${viewMode === 'list' ? 'flex-1 overflow-hidden' : ''}`}>
                  {wine.rebsorte && (
                    <div className="flex items-center gap-2 text-sm text-[#787774]">
                      <RebsorteIcon rebsorte={wine.rebsorte} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{wine.rebsorte}</span>
                    </div>
                  )}
                  {wine.land && (
                    <div className="flex items-center gap-2 text-sm text-[#787774]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{wine.land}{wine.anbaugebiet ? ` • ${wine.anbaugebiet}` : ''}</span>
                    </div>
                  )}
                  {viewMode === 'grid' && wine.kaufort && (
                    <div className="flex items-center gap-2 text-sm text-[#787774]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {wine.locationCoords ? (
                        <>
                          <span className="truncate">{wine.kaufort}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${wine.locationCoords.lat},${wine.locationCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline ml-1 shrink-0"
                            onClick={e => e.stopPropagation()}
                          >
                            (Karte)
                          </a>
                        </>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wine.kaufort)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline hover:text-blue-500"
                          onClick={e => e.stopPropagation()}
                        >
                          {wine.kaufort}
                        </a>
                      )}
                    </div>
                  )}
                  {viewMode === 'grid' && wine.geschmacksnote && (
                    <div className="flex items-center gap-2 text-sm text-[#787774]">
                      <Droplet className="w-3.5 h-3.5 shrink-0" />
                      <span>{wine.geschmacksnote}</span>
                    </div>
                  )}
                </div>

                <div className={`pt-3 border-t border-[#e9e9e7] flex justify-between items-end ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                  <div className="flex flex-col gap-1.5 w-full max-w-[150px]">
                    <div className="flex items-center gap-2" title="Note Kirsten">
                      <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-rose-600">K</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-[#e9e9e7] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full" style={{ width: `${(wine.noteKirsten || 0) * 10}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#787774] w-4 text-right">{wine.noteKirsten || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2" title="Note Torsten">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-blue-600">T</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-[#e9e9e7] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: `${(wine.noteTorsten || 0) * 10}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#787774] w-4 text-right">{wine.noteTorsten || '-'}</span>
                    </div>
                  </div>
                  {wine.preis && (
                    <span className="font-medium text-[#37352f] shrink-0 text-sm ml-2 mb-0.5">{wine.preis.toFixed(2)} €</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {wines?.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#787774]">
            Keine Weine gefunden.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-[#e9e9e7] bg-[#f7f7f5]">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  KI-Keller-Analyse
                </h2>
                <button onClick={() => setShowAnalysis(false)} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {analysisLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-[#787774] font-medium">Dein Weinkeller wird analysiert...</p>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                    <p className="font-medium">Fehler bei der Analyse:</p>
                    <p className="text-sm mt-1">{analysisError}</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none prose-headings:text-[#37352f] prose-p:text-[#37352f] prose-li:text-[#37352f] prose-strong:text-[#37352f]">
                    <div className="markdown-body">
                      <ReactMarkdown>{analysisResult || ''}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              
              {!analysisLoading && !analysisError && (
                <div className="p-4 border-t border-[#e9e9e7] bg-[#f7f7f5] flex justify-end">
                  <button
                    onClick={generateAnalysis}
                    className="px-4 py-2 bg-white border border-[#e9e9e7] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Neu analysieren
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
