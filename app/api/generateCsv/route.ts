import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Interface pour votre format de données interne
interface MatchAction {
    period: string;
    time: string;
    type: string;
    success: boolean;
    score: string;
}

interface MatchData {
    actions: MatchAction[];
}

// 🔥 NOUVELLES INTERFACES POUR L'API FIBA
// Interface pour une action individuelle de l'API FIBA
interface FibaAction {
    pId: string | number; // L'ID du joueur
    SB?: number;          // Score de l'équipe B (ou période ?)
    Time?: string;        // Le temps de jeu
    ac?: string;          // Le code de l'action (ex: "2pt")
    made?: boolean;       // Action réussie (tir) ?
    SA?: number;          // Score de l'équipe A
}

// Interface pour la structure globale de la réponse FIBA
interface FibaResponse {
    gamePlayByPlay?: {
        content?: {
            actions: FibaAction[]; // Un tableau d'actions FIBA
        };
    };
}


export async function POST(req: Request) {
    try {
        const { url, playerId } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
        }
        if (!playerId) {
            return NextResponse.json({ error: 'playerId manquant' }, { status: 400 });
        }

        // 🔥 CAS 1 : FIBA LINK
        if (url.includes("fiba.basketball")) {
            console.log("➡️ Mode FIBA activé");

            const response = await fetch(url);
            if (!response.ok) {
                return NextResponse.json({ error: "Impossible de charger FIBA" }, { status: 500 });
            }

            // 👇 CORRECTION : On type la réponse JSON
            const fiba = await response.json() as FibaResponse;

            // TypeScript sait maintenant que 'actions' est de type FibaAction[] | undefined
            const actions = fiba?.gamePlayByPlay?.content?.actions;
            
            if (!actions) {
                return NextResponse.json({ error: "Actions FIBA introuvables" }, { status: 500 });
            }

            // 🟦 FILTRAGE DU JOUEUR PAR pId
            // 'a' est maintenant correctement typé comme FibaAction
            const filtered = actions.filter(a => a.pId === playerId);

            // 🟦 Conversion en ton format interne MatchData
            // 'a' est maintenant correctement typé comme FibaAction
            const matchData: MatchData = {
                actions: filtered.map(a => ({
                    period: a.SB?.toString() ?? "", // Assumant que SB est la période
                    time: a.Time ?? "",
                    type: a.ac ?? "",
                    success: a.made ?? false,
                    score: `${a.SA ?? 0}-${a.SB ?? 0}` // Ajout de ?? 0 pour la sécurité
                }))
            };

            const csvContent = generateCSV(matchData);

            const filePath = path.join(process.cwd(), 'public', 'match_data.csv');
            fs.writeFileSync(filePath, csvContent);

            return NextResponse.json({ success: true, file: '/match_data.csv' });
        }

        // 🔥 CAS 2 : FFBB (SYSTÈME ACTUEL)
        // ... (votre logique FFBB)
        // Note : Cette partie n'utilise pas le playerId pour filtrer.
        const jsonUrl = url
            .replace(/\/u\/FFBB\//, '/data/')
            .replace(/\/bs\.html\/?/, '/')
            .replace(/\/$/, '') + '/data.json';

        const response = await fetch(jsonUrl);
        if (!response.ok) {
            return NextResponse.json({ error: 'Données FFBB introuvables' }, { status: 500 });
        }

        // Ici, vous affirmez que la réponse est DÉJÀ au bon format MatchData
        // Si ce n'est pas le cas, cela plantera dans generateCSV
        const data: MatchData = await response.json();

        const csvContent = generateCSV(data);

        const filePath = path.join(process.cwd(), 'public', 'match_data.csv');
        fs.writeFileSync(filePath, csvContent);

        return NextResponse.json({ success: true, file: '/match_data.csv' });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateCSV(data: MatchData): string {
    let csv = 'Période,Horodatage,Action,Success,Score\n';

    data.actions.forEach((action) => {
        csv += `${action.period},${action.time},${action.type},${action.success ? '1' : '0'},${action.score}\n`;
    });

    return csv;
}