'use client';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from 'react';
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
    
    const playerMapping: Record<string, string> = {
        "Lucile": "L. JEROME",
        "Carla": "C. LEITE"
    };
    
    const handleGenerate = async () => {
        const url = selectedLink || customUrl;
    
        if (!url) {
            setModalMessage("Sélectionne un Match 😎");
            setIsModalOpen(true);
            return;
          }
    
        try {
            const jsonUrl = url
                .replace(/\/u\/FFBB\//, '/data/')
                .replace(/\/bs\.html\/?/, '/')
                .replace(/\/$/, '') + '/data.json';
    
            console.log("URL JSON générée :", jsonUrl);
    
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(jsonUrl)}`;
            const response = await fetch(proxyUrl);
    
            if (!response.ok) {
                console.error("Erreur de récupération :", response.status, await response.text());
                setModalMessage(`${selectedPlayer === "L. JEROME" ? "Lucile" : "Carla"} s'échauffe 🏀`);
                setIsWaitingModalOpen(true);
                return;
            }
    
            const data: MatchData = await response.json();
            console.log("Données récupérées :", data);
    
            // Filtrer par joueur et trier du plus récent au plus ancien
            const filteredData = data.pbp
                .filter((action) => action.player === selectedPlayer)
                .sort((a, b) => b.gt.localeCompare(a.gt));
    
            console.log("Actions triées pour", selectedPlayer, ":", filteredData);
    
            const csvContent = generateCSV(filteredData);
            console.log("CSV généré :", csvContent);
    
            const rows = csvContent.split('\n').slice(1).map((row) => row.split(','));
            setCsvData(rows);
            setCsvGenerated(true);
        } catch (error) {
            console.error("Erreur dans generateCsv:", error);
            alert('Une erreur est survenue lors de la génération du CSV.');
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-12 gap-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
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
