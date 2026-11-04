import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Download, Upload, Key, Database, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getApiKey, setApiKey as storeApiKey } from '../lib/ai';
import { importWines } from '../lib/wineRepo';
import { CloudSyncSection } from '../components/CloudSyncSection';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = () => {
    storeApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const exportDataJSON = async () => {
    const wines = await db.wines.toArray();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(wines));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "wine-guide-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportDataExcel = async () => {
    const wines = await db.wines.toArray();
    
    // Prepare data for Excel (flattening arrays and removing images to keep file size reasonable)
    const excelData = wines.map(wine => ({
      Name: wine.name,
      Farbe: wine.farbe || '',
      Geschmacksnote: wine.geschmacksnote || '',
      Land: wine.land || '',
      Anbaugebiet: wine.anbaugebiet || '',
      Rebsorte: wine.rebsorte || '',
      Winzer: wine.winzer || '',
      Jahrgang: wine.jahrgang || '',
      Preis: wine.preis || '',
      Kaufort: wine.kaufort || '',
      Kaufdatum: wine.kaufdatum || '',
      Besonderheiten: wine.besonderheiten || '',
      Geruch: wine.geruch?.join(', ') || '',
      Geschmack: wine.geschmack?.join(', ') || '',
      'Note Kirsten': wine.noteKirsten || '',
      'Note Torsten': wine.noteTorsten || '',
      'Kommentar Kirsten': wine.kommentarKirsten || '',
      'Kommentar Torsten': wine.kommentarTorsten || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weine");
    XLSX.writeFile(workbook, "wine-guide-export.xlsx");
  };

  const exportDataPDF = async () => {
    const wines = await db.wines.toArray();
    const doc = new jsPDF('landscape');
    
    doc.text("Wine Guide Export", 14, 15);
    
    const tableColumn = ["Name", "Farbe", "Land", "Rebsorte", "Jahrgang", "Preis", "Note K", "Note T"];
    const tableRows = wines.map(wine => [
      wine.name,
      wine.farbe || '',
      wine.land || '',
      wine.rebsorte || '',
      wine.jahrgang?.toString() || '',
      wine.preis ? `${wine.preis.toFixed(2)} €` : '',
      wine.noteKirsten?.toString() || '',
      wine.noteTorsten?.toString() || ''
    ]);

    // @ts-ignore - jspdf-autotable adds autoTable to jsPDF instance
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 53, 47] }
    });

    doc.save("wine-guide-export.pdf");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wines = JSON.parse(event.target?.result as string);
        if (Array.isArray(wines)) {
          const count = await importWines(wines);
          alert(`${count} Weine erfolgreich importiert!`);
        } else {
          alert('Die Datei enthält keine Weinliste.');
        }
      } catch (err) {
        alert('Fehler beim Importieren der Datei.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Einstellungen</h1>
        <p className="text-[#787774] text-sm">Verwalte deine API-Schlüssel und Daten.</p>
      </div>

      <CloudSyncSection />

      <section className="bg-white border border-[#e9e9e7] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#787774]" />
          <h2 className="text-lg font-semibold">KI-Assistent API-Key</h2>
        </div>
        <p className="text-sm text-[#787774]">
          Hinterlege deinen Gemini-API-Key, um die KI-Funktionen (Diktieren, Keller-Analyse, KI-Sommelier, KI-Bild) zu nutzen. Den Key bekommst du kostenlos unter{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">aistudio.google.com/apikey</a>.
          Er wird nur auf diesem Gerät gespeichert und muss auf jedem Handy einmal eingetragen werden.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API-Key eingeben..."
            className="flex-1 p-2 bg-[#f7f7f5] border border-transparent focus:border-[#e9e9e7] focus:bg-white rounded-md text-sm outline-none"
          />
          <button
            onClick={saveApiKey}
            className="bg-[#37352f] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#2f2d28] transition-colors whitespace-nowrap"
          >
            {isSaved ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>
      </section>

      <section className="bg-white border border-[#e9e9e7] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#787774]" />
          <h2 className="text-lg font-semibold">Datenverwaltung</h2>
        </div>
        <p className="text-sm text-[#787774]">
          Sichere deine Weine als JSON, Excel oder PDF-Datei, oder stelle ein Backup (aus einer JSON-Datei) wieder her. Bilder werden nur im JSON-Export mitgesichert.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={exportDataJSON}
            className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors"
          >
            <Download className="w-4 h-4" /> Exportieren (JSON)
          </button>
          
          <button
            onClick={exportDataExcel}
            className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors"
          >
            <Download className="w-4 h-4" /> Exportieren (Excel)
          </button>

          <button
            onClick={exportDataPDF}
            className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors"
          >
            <Download className="w-4 h-4" /> Exportieren (PDF)
          </button>
          
          <label className="flex items-center gap-2 bg-[#f7f7f5] text-[#37352f] border border-[#e9e9e7] px-4 py-2 rounded-md font-medium text-sm hover:bg-[#efefed] transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Importieren (JSON)
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
      </section>
    </div>
  );
}
