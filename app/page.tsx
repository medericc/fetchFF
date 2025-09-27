'use client';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState,useEffect } from 'react';
import Image from 'next/image';
import VideoHeader from './components/VideoHeader';
import InputForm from './components/InputForm';
import MatchTable from './components/MatchTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
interface MatchAction {
    period: string;
    gt: string; // Game time
    actionType: string;
    success: boolean;
    s1: string; // Score team 1
    s2: string; // Score team 2
    player: string; // Nom du joueur
}
interface WNBAAction {
  cl: string; // clock
  p: string;  // player
  de: string; // description
  locX?: number;
  locY?: number;
  t?: string; // team
}
interface MatchData {
    pbp: MatchAction[]; // Play-by-play data
}

export default function Home() {
    const [csvGenerated, setCsvGenerated] = useState(false);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string>("L. JEROME"); // État pour le joueur sélectionné
    const [selectedLink, setSelectedLink] = useState<string>(''); // État pour le lien sélectionné
    const [customUrl, setCustomUrl] = useState(''); // État pour l'URL personnalisée
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);

    const matchLinksByPlayer: Record<string, { name: string; url: string }[]> = {
        "L. JEROME": [  
          { name: "Basket Landes", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2713761/bs.html" },
          { name: "Toulouse", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2653903/bs.html" }, 
          { name: "Feytiat 3", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2648652/bs.html" },
         
          { name: "Feytiat 2", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2648648/bs.html" },
          { name: "Feytiat", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2648644/bs.html" },
       
          { name: "Saint Amand", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513466/bs.html" },
       
         { name: "Montbrison", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513433/bs.html" },
          { name: "Le Havre", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513442/bs.html" },
          { name: "Feytiat", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513421/bs.html" },
            { name: "Aulnoye", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513405/bs.html" },
            { name: "Toulouse", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513395/bs.html" },

            // { name: "Match 2", url: "https://example.com/lucile2" },
        ],
        "C. LEITE": [
        
 { name: "Montpellier", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513303/bs.html" },
          
          { name: "Chartres", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513288/bs.html" },
          

          { name: "Basket Landes", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513275/bs.html" },
            { name: "Roche Vendée", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513252/bs.html" },
            { name: "Charnay", url: "https://fibalivestats.dcd.shared.geniussports.com/u/FFBB/2513238/bs.html" },
            // { name: "Match 2", url: "https://example.com/carla2" },
        ]
    }; 
    useEffect(() => {
      setSelectedLink('');
      setCsvGenerated(false);
      setCsvData([]);
    }, [selectedPlayer]);
    
    const playerMapping: Record<string, string> = {
        "Lucile": "L. JEROME",
        "Carla": "C. LEITE"
    };
    
    const handleGenerate = async () => {
      const url = selectedLink || customUrl;
      let effectivePlayer = selectedPlayer;
if ((url.includes("wnba.com") || url.includes("data.wnba.com")) && selectedPlayer === "C. LEITE") {
    effectivePlayer = "Okonkwo";
}
  
      if (!url) {
          setModalMessage("Sélectionne un Match 😎");
          setIsModalOpen(true);
          return;
      }
  
      try {
          let jsonUrl = "";
          let data: any;
  
          // 🔁 Cas 1 : FFBB
          if (url.includes("fibalivestats.dcd.shared.geniussports.com")) {
              jsonUrl = url
                  .replace(/\/u\/FFBB\//, '/data/')
                  .replace(/\/bs\.html\/?/, '/')
                  .replace(/\/$/, '') + '/data.json';
  
              const proxyUrl = `/api/proxy?url=${encodeURIComponent(jsonUrl)}`;
              const response = await fetch(proxyUrl);
              if (!response.ok) throw new Error("Erreur FFBB");
              data = await response.json();
  
              const filteredData = data.pbp
                  .filter((action) => action.player === selectedPlayer)
                  .sort((a, b) => b.gt.localeCompare(a.gt));
  
              const csvContent = generateCSV(filteredData);
              const rows = csvContent.split('\n').slice(1).map((row) => row.split(','));
              setCsvData(rows);
              setCsvGenerated(true);
  
          // 🔁 Cas 2 : WNBA JSON direct
        } else if (url.includes("data.wnba.com")) {
          jsonUrl = url;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(jsonUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Erreur WNBA (JSON direct)");
      
          data = await response.json();
          console.log("📦 [WNBA JSON direct] Données JSON brutes:", data);
      
          const playByPlay = data?.g?.pl;
          if (!Array.isArray(playByPlay)) {
              throw new Error("Format inattendu des données WNBA (JSON direct)");
          }
      
          const filteredData = playByPlay
              .filter((action: any) => action.p === effectivePlayer)
              .sort((a: any, b: any) => b.cl.localeCompare(a.cl));
      
          const csvContent = generateWNBACSV(filteredData);
          const rows = csvContent.split('\n').slice(1).map((row) => row.split(','));
          setCsvData(rows);
          setCsvGenerated(true);
      
  
          // 🔁 Cas 3 : WNBA via www.wnba.com/game/xxx
          } else if (url.includes("wnba.com/game/")) {
            const match = url.match(/\/game\/(\d{10})/);
            if (!match) throw new Error("URL WNBA invalide");
        
            const gameId = match[1];
            jsonUrl = `https://data.wnba.com/data/10s/v2015/json/mobile_teams/wnba/2025/scores/pbp/${gameId}_full_pbp.json`;
            console.log("💡 [WNBA transformée] URL du JSON:", jsonUrl);
        
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(jsonUrl)}`;
            console.log("💡 [WNBA transformée] Appel proxy URL:", proxyUrl);
        
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error("Erreur WNBA (transformée)");
        
            data = await response.json();
            console.log("📦 [WNBA transformée] Données JSON brutes:", data);
        
            const playByPlay = data.g.pl;
            const playerName = effectivePlayer;
            console.log("🎯 [WNBA transformée] Joueur recherché:", playerName);
        
            const filteredData = playByPlay
                .filter((action: any) => new RegExp(`\\b${playerName}\\b`, 'i').test(action.de || ''))
                .sort((a: any, b: any) => b.cl.localeCompare(a.cl))
                .map((action: any) => ({
                    ...action,
                    p: playerName
                }));
        
            console.log("📊 [WNBA transformée] Actions filtrées:", filteredData);
        
            const csvContent = generateWNBACSV(filteredData);
            console.log("🧾 [WNBA transformée] CSV généré:\n", csvContent);
        
            const rows = csvContent.split('\n').slice(1).map((row) => row.split(','));
            setCsvData(rows);
            setCsvGenerated(true);
  
          } else {
              throw new Error("Source inconnue");
          }
  
      } catch (error) {
          console.error("Erreur :", error);
          alert("Erreur lors de la génération du CSV.");
      }
  };
  
    

    const generateCSV = (data: MatchAction[]): string => {
        let csv = 'Période,Horodatage,Action,Réussite,Score\n';
        
        data.forEach((action) => {
            if (action.player === selectedPlayer) {  // Utilisez le joueur sélectionné
                csv += `${action.period},${action.gt},${action.actionType},${action.success ? '1' : '0'},${action.s1}-${action.s2}\n`;
            }
        });
    
        return csv;
    };
    function generateWNBACSV(actions: WNBAAction[]): string {
      let csv = 'Horloge,Joueur,Événement,X,Y,Équipe\n';
      actions.forEach((action) => {
        csv += `${action.cl},${action.p},${action.de},${action.locX ?? ''},${action.locY ?? ''},${action.t ?? ''}\n`;
      });
      return csv;
    }
    
    return (
        <div className="flex  flex-col items-center justify-center min-h-screen p-6 sm:p-12 gap-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white         ">
        <VideoHeader className="absolute top-0 left-0 w-full" />
      
        <main className="flex flex-col items-center gap-6 w-full max-w-lg sm:max-w-2xl md:max-w-4xl">
          {/* Menus déroulants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionne une joueuse" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(playerMapping).map(([displayName, realName]) => (
                  <SelectItem key={realName} value={realName}>
                    {displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
      
            <Select value={selectedLink} onValueChange={setSelectedLink}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionne un match" />
              </SelectTrigger>
              <SelectContent>
                {matchLinksByPlayer[selectedPlayer]?.map((link) => (
                  <SelectItem key={link.url} value={link.url}>
                    {link.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      
          {/* Champ de saisie du lien personnalisé */}
          <InputForm 
            value={customUrl} 
            onChange={(e) => setCustomUrl(e.target.value)} 
            onGenerate={handleGenerate} 
            
          />
      
          {/* Table des stats */}
          {csvGenerated && (
            <div className="w-full overflow-x-auto">
              <MatchTable data={csvData} />
            </div>
          )}
        </main>
      
        {/* Modale d'erreur */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="w-[80%] max-w-xs rounded-lg shadow-lg bg-white dark:bg-gray-800 p-6">
    <DialogHeader>
      <DialogTitle className="text-center mb-4">⚠️ Erreur</DialogTitle>
      <DialogDescription className="text-center mt-4">{modalMessage}</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>

<Dialog open={isWaitingModalOpen} onOpenChange={setIsWaitingModalOpen}>
<DialogContent className="w-[80%] max-w-xs rounded-lg shadow-lg bg-white dark:bg-gray-800 p-6">
                    <DialogHeader>
                        <DialogTitle  className="flex items-center justify-center gap-2 mb-2">⏳ Patiente</DialogTitle>
                        <DialogDescription className="text-center mt-2"   >{modalMessage}</DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            
        <footer className="text-sm text-gray-900 mt-8">
          <a href="https://www.youtube.com/@fan_lucilej" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Produit par @fan_carla
          </a>
        </footer>
      </div>
      

    );
}
