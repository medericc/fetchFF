export function transformUrl(url: string): string {
    return url.replace(/\/u\/FFBB\//, '/data/').replace(/\/$/, '') + '/data.json';
}

export function transformWNBAUrl(url: string): string {
    const match = url.match(/\/game\/(\d{10})/);
    if (!match) {
        throw new Error("URL WNBA invalide");
    }
    const gameId = match[1];
    return `https://data.wnba.com/data/10s/v2015/json/mobile_teams/wnba/2025/scores/pbp/${gameId}_full_pbp.json`;
}
