import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

// FIBA interfaces
interface FibaPlayer {
    personId: number;
    name: string;
}

interface FibaAction {
    pId: number;
    SB?: number;
    Time?: string;
    ac?: string;
    made?: boolean;
    SA?: number;
    
}

interface FibaResponse {
    gamePlayByPlay?: {
        content?: {
            actions: FibaAction[];
            players?: FibaPlayer[];
        };
    };

    gameCompetitors?: {
        content?: {
            playersTeamA?: Array<{
                personId: number;
                firstName: string;
                lastName: string;
            }>;
            playersTeamB?: Array<{
                personId: number;
                firstName: string;
                lastName: string;
            }>;
        };
    };
}


/* --------------------------------------------------------------------- */
/* ----------------------------- ROUTE --------------------------------- */
/* --------------------------------------------------------------------- */

export async function POST(req: Request) {
    try {
        const { url, playerName } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
        }
        if (!playerName) {
            return NextResponse.json({ error: 'Nom joueur manquant' }, { status: 400 });
        }

      /* -------------------------- CAS FIBA -------------------------- */
if (url.includes("fiba.basketball")) {
    console.log("➡️ Mode FIBA activé");

    const response = await fetch(url);
    if (!response.ok) {
        return NextResponse.json({ error: "Impossible de charger FIBA" }, { status: 500 });
    }

    const fiba = await response.json() as FibaResponse;

    // 🔥 récupérer les joueurs Team A + Team B
    const playersTeamA = fiba?.gameCompetitors?.content?.playersTeamA || [];
    const playersTeamB = fiba?.gameCompetitors?.content?.playersTeamB || [];

    const players = [...playersTeamA, ...playersTeamB].map(p => ({
        personId: p.personId,
        name: `${p.firstName} ${p.lastName}`
    }));

    const actions = fiba?.gamePlayByPlay?.content?.actions;
    if (!actions) {
        return NextResponse.json({ error: "Aucune action trouvée" }, { status: 500 });
    }

    /* 🔍 AUTO-DETECTION PLAYER ID */
    const searchKey = playerName.replace(/\./g, "").toLowerCase();

    const found = players.find(p =>
        p.name.toLowerCase().includes(searchKey) ||
        searchKey.includes(p.name.toLowerCase().split(" ").pop()!)
    );

    if (!found) {
        return NextResponse.json({ error: "Joueur introuvable (auto-id)" }, { status: 404 });
    }

    const detectedId = found.personId;
    console.log("🎯 PLAYER-ID détecté:", detectedId);

    /* 🔥 FILTRAGE ACTIONS */
    const filtered = actions.filter(a => a.pId === detectedId);

    const matchData: MatchData = {
        actions: filtered.map(a => ({
            period: a.SB?.toString() ?? "",
            time: a.Time ?? "",
            type: a.ac ?? "",
            success: a.made ?? false,
            score: `${a.SA ?? 0}-${a.SB ?? 0}`
        }))
    };

    const csvContent = generateCSV(matchData);

    const filePath = path.join(process.cwd(), 'public', 'match_data.csv');
    fs.writeFileSync(filePath, csvContent);

    return NextResponse.json({
        success: true,
        file: '/match_data.csv',
        autoId: detectedId
    });
}

        /* -------------------------------------------------------------- */
        /* --------------------------- FFBB ----------------------------- */
        /* -------------------------------------------------------------- */

        const jsonUrl = url
            .replace(/\/u\/FFBB\//, '/data/')
            .replace(/\/bs\.html\/?/, '/')
            .replace(/\/$/, '') + '/data.json';

        const response = await fetch(jsonUrl);
        if (!response.ok) {
            return NextResponse.json({ error: 'Données FFBB introuvables' }, { status: 500 });
        }

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

/* CSV */
function generateCSV(data: MatchData): string {
    let csv = 'Période,Horodatage,Action,Success,Score\n';

    data.actions.forEach((action) => {
        csv += `${action.period},${action.time},${action.type},${action.success ? '1' : '0'},${action.score}\n`;
    });

    return csv;
}
