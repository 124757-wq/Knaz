// Демо-данные для тестирования сайта когда OpenDota API недоступен

const demoPlayerData = {
    profile: {
        account_id: 111620041,
        personaname: "Dendi (DEMO)",
        avatarfull: "https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60924fbcf89252_full.jpg"
    },
    rank_tier: 75, // Ancient 5
    leaderboard_rank: null
};

const demoWinLoss = {
    win: 5234,
    lose: 4891
};

const demoTopHeroes = [
    {
        hero_id: 11, // Shadow Fiend
        games: 342,
        win: 198
    },
    {
        hero_id: 74, // Invoker
        games: 289,
        win: 167
    },
    {
        hero_id: 9, // Mirana
        games: 256,
        win: 145
    },
    {
        hero_id: 5, // Crystal Maiden
        games: 234,
        win: 142
    },
    {
        hero_id: 1, // Anti-Mage
        games: 198,
        win: 109
    },
    {
        hero_id: 8, // Juggernaut
        games: 187,
        win: 103
    }
];

const demoRecentMatches = [
    {
        match_id: 7234567890,
        player_slot: 0,
        radiant_win: true,
        duration: 2456,
        hero_id: 11,
        kills: 18,
        deaths: 3,
        assists: 12
    },
    {
        match_id: 7234567889,
        player_slot: 128,
        radiant_win: false,
        duration: 1987,
        hero_id: 74,
        kills: 12,
        deaths: 8,
        assists: 15
    },
    {
        match_id: 7234567888,
        player_slot: 1,
        radiant_win: true,
        duration: 3124,
        hero_id: 9,
        kills: 8,
        deaths: 5,
        assists: 22
    },
    {
        match_id: 7234567887,
        player_slot: 130,
        radiant_win: true,
        duration: 2678,
        hero_id: 5,
        kills: 3,
        deaths: 7,
        assists: 28
    },
    {
        match_id: 7234567886,
        player_slot: 2,
        radiant_win: false,
        duration: 2234,
        hero_id: 1,
        kills: 15,
        deaths: 6,
        assists: 8
    },
    {
        match_id: 7234567885,
        player_slot: 129,
        radiant_win: false,
        duration: 1856,
        hero_id: 8,
        kills: 9,
        deaths: 11,
        assists: 6
    },
    {
        match_id: 7234567884,
        player_slot: 3,
        radiant_win: true,
        duration: 2987,
        hero_id: 11,
        kills: 22,
        deaths: 4,
        assists: 14
    },
    {
        match_id: 7234567883,
        player_slot: 131,
        radiant_win: true,
        duration: 2145,
        hero_id: 74,
        kills: 14,
        deaths: 9,
        assists: 19
    },
    {
        match_id: 7234567882,
        player_slot: 4,
        radiant_win: false,
        duration: 3456,
        hero_id: 9,
        kills: 6,
        deaths: 12,
        assists: 18
    },
    {
        match_id: 7234567881,
        player_slot: 128,
        radiant_win: true,
        duration: 2567,
        hero_id: 5,
        kills: 2,
        deaths: 8,
        assists: 31
    }
];

const demoHeroes = [
    { id: 1, localized_name: "Anti-Mage" },
    { id: 2, localized_name: "Axe" },
    { id: 3, localized_name: "Bane" },
    { id: 4, localized_name: "Bloodseeker" },
    { id: 5, localized_name: "Crystal Maiden" },
    { id: 6, localized_name: "Drow Ranger" },
    { id: 7, localized_name: "Earthshaker" },
    { id: 8, localized_name: "Juggernaut" },
    { id: 9, localized_name: "Mirana" },
    { id: 10, localized_name: "Morphling" },
    { id: 11, localized_name: "Shadow Fiend" },
    { id: 12, localized_name: "Phantom Lancer" },
    { id: 13, localized_name: "Puck" },
    { id: 14, localized_name: "Pudge" },
    { id: 15, localized_name: "Razor" },
    { id: 74, localized_name: "Invoker" }
];

module.exports = {
    demoPlayerData,
    demoWinLoss,
    demoTopHeroes,
    demoRecentMatches,
    demoHeroes
};
