import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, type Wine } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Save, ArrowLeft, X, Image as ImageIcon, MapPin, Check, Mic, Loader2, Plus, Sparkles } from 'lucide-react';
import { PREDEFINED_REBSORTEN, PREDEFINED_ANBAUGEBIETE, PREDEFINED_LAENDER, PREDEFINED_GESCHMACK, PREDEFINED_GERUCH } from '../data/wineData';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { RebsortenInput } from '../components/RebsortenInput';
import { KaufdatumInput } from '../components/KaufdatumInput';
import { getRebsorten, normalizeWine, rebsortenText } from '../lib/wineFields';
import { Tooltip } from '../components/Tooltip';
import { Type } from '@google/genai';
import { getGemini, MODELS, MissingApiKeyError } from '../lib/ai';
import { saveWine as persistWine, deleteWine as removeWine } from '../lib/wineRepo';
import { compressImage } from '../lib/image';

const GESCHMACKSNOTEN = ['Trocken', 'Halbtrocken', 'Feinherb', 'Lieblich', 'Süß'];
const FARBEN = ['Weiß', 'Rot', 'Rosé', 'Orange'];

export default function WineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wine, setWine] = useState<Partial<Wine>>({
    name: '',
    geruch: [],
    geschmack: [],
    kaufdatum: new Date().toISOString().split('T')[0],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customGeruch, setCustomGeruch] = useState('');
  const [customGeschmack, setCustomGeschmack] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const generateAIImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGeneratingImage(true);
    try {
      const ai = getGemini();
      
      const promptParts = ['A professional, elegant product photography shot of a single wine bottle standing upright against a clean light background.'];
      if (wine.farbe) promptParts.push(`It is a ${wine.farbe} wine.`);
      const sorten = rebsortenText(wine);
      if (sorten) promptParts.push(`The grape variety is ${sorten}.`);
      if (wine.name) promptParts.push(`The wine label has the word "${wine.name}".`);
      promptParts.push('High quality, photorealistic, cinematic studio lighting.');

      const response = await ai.models.generateContent({
        model: MODELS.image,
        contents: {
          parts: [{ text: promptParts.join(' ') }]
        },
        config: {
          imageConfig: { aspectRatio: "3:4" }
        }
      });
      
      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
           const mimeType = part.inlineData.mimeType || 'image/jpeg';
           imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
           break;
        }
      }
      
      if (imageUrl) {
         imageUrl = await compressImage(imageUrl);
         setWine(prev => ({ ...prev, image: imageUrl }));
         setImagePreview(imageUrl);
      } else {
         alert('Das Bild konnte nicht generiert werden.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Fehler bei der Bildgenerierung: ' + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-suggest lists
  const dbRebsorten = useLiveQuery(() => db.wines.orderBy('rebsorten').uniqueKeys()) as string[] | undefined;
  const dbWinzer = useLiveQuery(() => db.wines.orderBy('winzer').uniqueKeys()) as string[] | undefined;
  const dbLaender = useLiveQuery(() => db.wines.orderBy('land').uniqueKeys()) as string[] | undefined;
  const dbAnbaugebiete = useLiveQuery(() => db.wines.orderBy('anbaugebiet').uniqueKeys()) as string[] | undefined;

  const rebsorten = Array.from(new Set([...PREDEFINED_REBSORTEN, ...(dbRebsorten || [])])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'de'));
  
  const laender = Array.from(new Set([...PREDEFINED_LAENDER, ...(dbLaender || [])])).filter(Boolean).sort();
  const anbaugebiete = Array.from(new Set([...PREDEFINED_ANBAUGEBIETE, ...(dbAnbaugebiete || [])])).filter(Boolean).sort();
  const winzerList = (dbWinzer || []).filter(Boolean).sort();

  useEffect(() => {
    if (id) {
      db.wines.get(Number(id)).then(w => {
        if (w) {
          setWine(normalizeWine(w));
          if (w.image) setImagePreview(w.image);
        }
      });
    }
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG, 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(dataUrl);
        setWine(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (field: 'geruch' | 'geschmack', tag: string) => {
    setWine(prev => {
      const current = prev[field] || [];
      if (current.includes(tag)) {
        return { ...prev, [field]: current.filter(t => t !== tag) };
      } else {
        return { ...prev, [field]: [...current, tag] };
      }
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalisierung wird von deinem Browser nicht unterstützt.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setWine({
          ...wine,
          locationCoords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert('Fehler beim Abrufen des Standorts.');
        setIsLocating(false);
      }
    );
  };

  const handleVoiceInput = async () => {
    setVoiceError(null);
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessingVoice(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioMessage = reader.result as string;
          const base64Data = base64AudioMessage.split(',')[1];
          const mimeType = audioBlob.type || 'audio/webm';

          try {
            const ai = getGemini();
            const response = await ai.models.generateContent({
              model: MODELS.text,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType
                    }
                  },
                  {
                    text: `Extrahiere die folgenden Weindaten aus dieser Audioaufnahme und gib sie als JSON zurück.
Mögliche Felder (alle optional):
- name (String)
- farbe (String: "Weiß", "Rot", "Rosé" oder "Orange")
- geschmacksnote (String: "Trocken", "Halbtrocken", "Feinherb", "Lieblich" oder "Süß")
- land (String)
- anbaugebiet (String)
- rebsorten (Array of Strings – eine oder mehrere Rebsorten, bei Cuvées alle genannten)
- winzer (String)
- jahrgang (Number)
- preis (Number)
- kaufort (String)
- besonderheiten (String)
- geruch (Array of Strings)
- geschmack (Array of Strings)
- noteKirsten (Number 1-10)
- noteTorsten (Number 1-10)
- kommentarKirsten (String)
- kommentarTorsten (String)`
                  }
                ]
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    farbe: { type: Type.STRING },
                    geschmacksnote: { type: Type.STRING },
                    land: { type: Type.STRING },
                    anbaugebiet: { type: Type.STRING },
                    rebsorten: { type: Type.ARRAY, items: { type: Type.STRING } },
                    winzer: { type: Type.STRING },
                    jahrgang: { type: Type.INTEGER },
                    preis: { type: Type.NUMBER },
                    kaufort: { type: Type.STRING },
                    besonderheiten: { type: Type.STRING },
                    geruch: { type: Type.ARRAY, items: { type: Type.STRING } },
                    geschmack: { type: Type.ARRAY, items: { type: Type.STRING } },
                    noteKirsten: { type: Type.INTEGER },
                    noteTorsten: { type: Type.INTEGER },
                    kommentarKirsten: { type: Type.STRING },
                    kommentarTorsten: { type: Type.STRING },
                  }
                }
              }
            });

            if (response.text) {
              const extractedData = JSON.parse(response.text);
              setWine(prev => {
                const merged = { ...prev };
                Object.keys(extractedData).forEach(key => {
                  if (extractedData[key] !== undefined && extractedData[key] !== null) {
                    if (Array.isArray(extractedData[key])) {
                      (merged as any)[key] = [...new Set([...((merged as any)[key] as string[] || []), ...extractedData[key]])];
                    } else {
                      (merged as any)[key] = extractedData[key];
                    }
                  }
                });
                return merged;
              });
            }
          } catch (error) {
            console.error('Error processing voice input:', error);
            setVoiceError(error instanceof MissingApiKeyError
              ? error.message
              : 'Fehler bei der Verarbeitung der Spracheingabe. Bitte versuche es erneut.');
          } finally {
            setIsProcessingVoice(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setVoiceError('Mikrofonzugriff verweigert oder nicht verfügbar.');
    }
  };

  const saveWine = async () => {
    if (!wine.name) {
      alert('Bitte einen Namen eingeben.');
      return;
    }

    await persistWine(wine);
    navigate('/');
  };

  const deleteWine = async () => {
    if (id && window.confirm('Wein wirklich löschen?')) {
      await removeWine(Number(id));
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b border-[#e9e9e7]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#f7f7f5] rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold hidden sm:block">{id ? 'Wein bearbeiten' : 'Neuer Wein'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleVoiceInput} 
            disabled={isProcessingVoice}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors border ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f7f7f5]'}`}
            title={isListening ? "Aufnahme stoppen" : "Wein per Spracheingabe erfassen"}
          >
            {isProcessingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : (isListening ? <div className="w-3 h-3 bg-red-600 rounded-sm" /> : <Mic className="w-4 h-4" />)}
            <span className="hidden sm:inline">{isListening ? 'Aufnahme stoppen' : isProcessingVoice ? 'Verarbeitet...' : 'Diktieren'}</span>
          </button>
          <button onClick={saveWine} className="flex items-center gap-2 bg-[#37352f] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#2f2d28] transition-colors">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Speichern</span>
          </button>
        </div>
      </div>

      {voiceError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center justify-between">
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} className="p-1 hover:bg-red-100 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Name des Weins *"
              value={wine.name || ''}
              onChange={e => setWine({ ...wine, name: e.target.value })}
              className="w-full text-3xl font-bold bg-transparent border-none placeholder:text-[#d4d4d2] focus:ring-0 p-0 outline-none"
            />
          </div>

          {/* Image Upload */}
          <div 
            className="relative h-64 w-full bg-[#f7f7f5] rounded-lg border-2 border-dashed border-[#e9e9e7] flex flex-col items-center justify-center hover:bg-[#efefed] transition-colors overflow-hidden"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-3 text-white">
                  <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-md transition-colors text-sm font-medium"
                  >
                    <Camera className="w-4 h-4" /> Eigenes Bild
                  </button>
                  <button 
                    onClick={generateAIImage}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Neues KI-Bild
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#787774] p-4 gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="flex flex-col items-center gap-2 hover:text-[#37352f] transition-colors"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-medium">Etikett fotografieren / hochladen</span>
                </button>
                
                <div className="flex items-center gap-2 w-full max-w-[200px]">
                  <div className="h-px bg-[#d4d4d2] flex-1" />
                  <span className="text-xs text-[#a0a09f] uppercase tracking-wider font-semibold">Oder</span>
                  <div className="h-px bg-[#d4d4d2] flex-1" />
                </div>

                <button 
                  onClick={generateAIImage}
                  disabled={isGeneratingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGeneratingImage ? 'Wird generiert...' : 'Etikett mit KI generieren'}
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
        </section>

        {/* Characteristics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#787774]">Farbe</label>
            <select
              value={wine.farbe || ''}
              onChange={e => setWine({ ...wine, farbe: e.target.value })}
              className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
            >
              <option value="">Auswählen...</option>
              {FARBEN.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#787774]">Geschmacksnote</label>
            <select
              value={wine.geschmacksnote || ''}
              onChange={e => setWine({ ...wine, geschmacksnote: e.target.value })}
              className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
            >
              <option value="">Auswählen...</option>
              {GESCHMACKSNOTEN.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </section>

        {/* Tags */}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#787774]">Geruch</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_GERUCH.map(tag => {
                const isActive = wine.geruch?.includes(tag.term);
                return (
                  <Tooltip key={tag.term} content={tag.description}>
                    <button
                      type="button"
                      onClick={() => toggleTag('geruch', tag.term)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isActive ? 'bg-[#37352f] text-white border-[#37352f]' : 'bg-white text-[#787774] border-[#e9e9e7] hover:bg-[#f7f7f5]'}`}
                    >
                      {tag.term}
                    </button>
                  </Tooltip>
                );
              })}
              {wine.geruch?.filter(t => !PREDEFINED_GERUCH.some(pt => pt.term === t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag('geruch', tag)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  title="Eigenen Begriff entfernen"
                >
                  {tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customGeruch}
                onChange={e => setCustomGeruch(e.target.value)}
                placeholder="Eigener Begriff..."
                className="flex-1 rounded-md border border-[#e9e9e7] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#37352f]/20"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customGeruch.trim()) {
                      if (!wine.geruch?.includes(customGeruch.trim())) {
                        setWine({ ...wine, geruch: [...(wine.geruch || []), customGeruch.trim()] });
                      }
                      setCustomGeruch('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customGeruch.trim()) {
                    if (!wine.geruch?.includes(customGeruch.trim())) {
                      setWine({ ...wine, geruch: [...(wine.geruch || []), customGeruch.trim()] });
                    }
                    setCustomGeruch('');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#f7f7f5] border border-[#e9e9e7] rounded-md text-sm font-medium hover:bg-[#e9e9e7] text-[#37352f] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#787774]">Geschmack</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_GESCHMACK.map(tag => {
                const isActive = wine.geschmack?.includes(tag.term);
                return (
                  <Tooltip key={tag.term} content={tag.description}>
                    <button
                      type="button"
                      onClick={() => toggleTag('geschmack', tag.term)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isActive ? 'bg-[#37352f] text-white border-[#37352f]' : 'bg-white text-[#787774] border-[#e9e9e7] hover:bg-[#f7f7f5]'}`}
                    >
                      {tag.term}
                    </button>
                  </Tooltip>
                );
              })}
              {wine.geschmack?.filter(t => !PREDEFINED_GESCHMACK.some(pt => pt.term === t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag('geschmack', tag)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  title="Eigenen Begriff entfernen"
                >
                  {tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customGeschmack}
                onChange={e => setCustomGeschmack(e.target.value)}
                placeholder="Eigener Begriff..."
                className="flex-1 rounded-md border border-[#e9e9e7] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#37352f]/20"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customGeschmack.trim()) {
                      if (!wine.geschmack?.includes(customGeschmack.trim())) {
                        setWine({ ...wine, geschmack: [...(wine.geschmack || []), customGeschmack.trim()] });
                      }
                      setCustomGeschmack('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customGeschmack.trim()) {
                    if (!wine.geschmack?.includes(customGeschmack.trim())) {
                      setWine({ ...wine, geschmack: [...(wine.geschmack || []), customGeschmack.trim()] });
                    }
                    setCustomGeschmack('');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#f7f7f5] border border-[#e9e9e7] rounded-md text-sm font-medium hover:bg-[#e9e9e7] text-[#37352f] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RebsortenInput
            label="Rebsorte(n)"
            options={rebsorten}
            value={getRebsorten(wine)}
            onChange={(val) => setWine(prev => ({ ...prev, rebsorten: val, rebsorte: val.join(', ') || undefined }))}
          />

          <AutocompleteInput
            label="Winzer"
            options={winzerList}
            value={wine.winzer || ''}
            onValueChange={(val) => setWine({ ...wine, winzer: val })}
          />

          <AutocompleteInput
            label="Land"
            options={laender}
            value={wine.land || ''}
            onValueChange={(val) => setWine({ ...wine, land: val })}
          />

          <AutocompleteInput
            label="Anbaugebiet"
            options={anbaugebiete}
            value={wine.anbaugebiet || ''}
            onValueChange={(val) => setWine({ ...wine, anbaugebiet: val })}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#787774]">Jahrgang</label>
            <input
              type="number"
              value={wine.jahrgang || ''}
              onChange={e => setWine({ ...wine, jahrgang: parseInt(e.target.value) || undefined })}
              className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#787774]">Preis (€)</label>
            <input
              type="number"
              step="0.01"
              value={wine.preis || ''}
              onChange={e => setWine({ ...wine, preis: parseFloat(e.target.value) || undefined })}
              className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
            />
          </div>

          <KaufdatumInput
            value={wine.kaufdatum}
            onChange={(val) => setWine(prev => ({ ...prev, kaufdatum: val }))}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#787774]">Kauf- / Genussort</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={wine.kaufort || ''}
                onChange={e => setWine({ ...wine, kaufort: e.target.value })}
                className="flex-1 p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
                placeholder="Geschäft, Restaurant, Ort..."
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="px-3 py-2 bg-[#f7f7f5] border border-transparent hover:border-[#e9e9e7] rounded-md text-[#37352f] transition-colors flex items-center justify-center"
                title="Aktuellen Standort (GPS) speichern"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
            {wine.locationCoords ? (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> GPS-Koordinaten gespeichert
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${wine.locationCoords.lat},${wine.locationCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  (Karte ansehen)
                </a>
              </p>
            ) : wine.kaufort ? (
              <p className="text-xs mt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wine.kaufort)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Auf Google Maps suchen
                </a>
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-1.5">
          <label className="text-sm font-medium text-[#787774]">Besonderheiten (Bio, Vegan, etc.)</label>
          <input
            type="text"
            value={wine.besonderheiten || ''}
            onChange={e => setWine({ ...wine, besonderheiten: e.target.value })}
            className="w-full p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
          />
        </section>

        {/* Ratings */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#e9e9e7]">
          <div className="space-y-4 bg-[#f7f7f5] p-4 rounded-lg">
            <h3 className="font-semibold">Bewertung Kirsten</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#787774]">Note (1-10)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setWine({ ...wine, noteKirsten: n })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${(wine.noteKirsten || 0) >= n ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-[#787774] hover:bg-yellow-100'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#787774]">Kommentar</label>
              <textarea
                value={wine.kommentarKirsten || ''}
                onChange={e => setWine({ ...wine, kommentarKirsten: e.target.value })}
                rows={3}
                className="w-full p-2 bg-white border border-transparent focus:border-[#e9e9e7] rounded-md text-sm outline-none resize-none"
              />
            </div>
          </div>

          <div className="space-y-4 bg-[#f7f7f5] p-4 rounded-lg">
            <h3 className="font-semibold">Bewertung Torsten</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#787774]">Note (1-10)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setWine({ ...wine, noteTorsten: n })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${(wine.noteTorsten || 0) >= n ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-[#787774] hover:bg-yellow-100'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#787774]">Kommentar</label>
              <textarea
                value={wine.kommentarTorsten || ''}
                onChange={e => setWine({ ...wine, kommentarTorsten: e.target.value })}
                rows={3}
                className="w-full p-2 bg-white border border-transparent focus:border-[#e9e9e7] rounded-md text-sm outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {id && (
          <div className="pt-8 flex justify-end">
            <button onClick={deleteWine} className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-md transition-colors">
              Wein löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
