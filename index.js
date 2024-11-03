const express = require('express');
const { engine } = require('express-handlebars');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();

app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        isGreaterThanFifty: function (value, options) {
            return value > 55 ? options.fn(this) : options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));

function getNameDataset(pathName) {
    let startIndex = pathName.lastIndexOf('\\') + 1;
    let endIndex = pathName.lastIndexOf('.csv');
    let text = pathName.substring(startIndex, endIndex)
    return text
}
app.get('/', (req, res) => {
    const datasetsFolder = './datasets';
    const datasetFiles = fs.readdirSync(datasetsFolder);
    let allStatistics = [];
    let allStatisticsTeam = []
    datasetFiles.forEach(file => {
        const teams = {}
        const referees = {};
        if (file.endsWith('.csv')) {
            const filePath = path.join(datasetsFolder, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);
            let totalGame = data.length;
            let homeWin = 0;
            let awayWin = 0;
            let drawMatch = 0;
            let corner_GT_9 = 0;
            let corner_LT_9 = 0;
            let corner_GT_11 = 0;
            let corner_LT_11 = 0;
            let card_GT_4 = 0;
            let card_LT_4 = 0;
            let totalGoal_GT_2 = 0;
            let totalGoal_LT_2 = 0;
            let totalGoal_GT_3 = 0;
            let totalGoal_LT_3 = 0;
            let bothTeamToScore = 0;
            let halfGame_GT_1 = 0;
            let halfGame_LT_1 = 0;
            let halfGame_2_GT_1 = 0;
            let halfGame_2_LT_1 = 0;
            let halfTime_1 = 0
            data.forEach(row => {
                homeWin = row.FTR == "H" ? homeWin + 1 : homeWin;
                awayWin = row.FTR == "A" ? awayWin + 1 : awayWin;
                drawMatch = row.FTR == "D" ? drawMatch + 1 : drawMatch;
                corner_GT_9 = row.HC + row.AC > 9.5 ? corner_GT_9 + 1 : corner_GT_9;
                corner_LT_9 = row.HC + row.AC < 9.5 ? corner_LT_9 + 1 : corner_LT_9;
                corner_GT_11 = row.HC + row.AC > 11.5 ? corner_GT_11 + 1 : corner_GT_11;
                corner_LT_11 = row.HC + row.AC < 11.5 ? corner_LT_11 + 1 : corner_LT_11;
                card_GT_4 = row.HY + row.AY > 4.5 ? card_GT_4 + 1 : card_GT_4;
                card_LT_4 = row.HY + row.AY < 4.5 ? card_LT_4 + 1 : card_LT_4;
                totalGoal_GT_2 = row.FTHG + row.FTAG > 2.5 ? totalGoal_GT_2 + 1 : totalGoal_GT_2;
                totalGoal_GT_3 = row.FTHG + row.FTAG > 3.5 ? totalGoal_GT_3 + 1 : totalGoal_GT_3;
                totalGoal_LT_2 = row.FTHG + row.FTAG < 2.5 ? totalGoal_LT_2 + 1 : totalGoal_LT_2;
                totalGoal_LT_3 = row.FTHG + row.FTAG < 3.5 ? totalGoal_LT_3 + 1 : totalGoal_LT_3;
                bothTeamToScore = row.FTHG * row.FTAG !== 0 ? bothTeamToScore + 1 : bothTeamToScore;
                halfGame_GT_1 = row.HTHG + row.HTAG > 1.5 ? halfGame_GT_1 + 1 : halfGame_GT_1;
                halfGame_LT_1 = row.HTHG + row.HTAG < 1.5 ? halfGame_LT_1 + 1 : halfGame_LT_1;
                halfGame_2_GT_1 = (row.FTHG + row.FTAG) - (row.HTHG + row.HTAG) > 1.5 ? halfGame_2_GT_1 + 1 : halfGame_2_GT_1;
                halfGame_2_LT_1 = (row.FTHG + row.FTAG) - (row.HTHG + row.HTAG) < 1.5 ? halfGame_2_LT_1 + 1 : halfGame_2_LT_1;
                const homeTeam = row.HomeTeam;
                const awayTeam = row.AwayTeam;

                if (!teams[homeTeam]) {
                    teams[homeTeam] = { matches: 0, goals: 0, goalsAgainst: 0, cards: 0, corners: 0 };
                }
                if (!teams[awayTeam]) {
                    teams[awayTeam] = { matches: 0, goals: 0, goalsAgainst: 0, cards: 0, corners: 0 };
                }

                // Update stats for home team
                teams[homeTeam].matches += 1;
                teams[homeTeam].goals += row.FTHG;
                teams[homeTeam].goalsAgainst += row.FTAG;
                teams[homeTeam].cards += row.HY;
                teams[homeTeam].corners += row.HC;

                // Update stats for away team
                teams[awayTeam].matches += 1;
                teams[awayTeam].goals += row.FTAG;
                teams[awayTeam].goalsAgainst += row.FTHG;
                teams[awayTeam].cards += row.AY;
                teams[awayTeam].corners += row.AC;


                let totalMatches = 0;
                let totalCards = 0;

                const referee = row.Referee;
                const numMatches = 1; // Assuming each row represents one match
                const numCards = parseInt(row.HY) + parseInt(row.AY); // Example calculation, adjust based on actual columns
                // Update referee statistics
                if (!referees[referee]) {
                    referees[referee] = {
                        name: referee,
                        numMatches: 0,
                        numCards: 0,
                        avgCards: 0
                    };
                }

                referees[referee].numMatches += numMatches;
                referees[referee].numCards += numCards;

                totalMatches += numMatches;
                totalCards += numCards;
            });

            // Calculate rates
            const statistics = {
                title: getNameDataset(filePath),
                totalGame: totalGame,
                homeWin: homeWin,
                homeWinRate: Math.round((homeWin / totalGame) * 100),
                awayWin: awayWin,
                awayWinRate: Math.round((awayWin / totalGame) * 100),
                drawMatch: drawMatch,
                drawMatchRate: Math.round((drawMatch / totalGame) * 100),
                corner_GT_9: corner_GT_9,
                corner_GT_9_rate: Math.round((corner_GT_9 / totalGame) * 100),
                corner_LT_9: corner_LT_9,
                corner_LT_9_rate: Math.round((corner_LT_9 / totalGame) * 100),
                corner_GT_11: corner_GT_11,
                corner_GT_11_rate: Math.round((corner_GT_11 / totalGame) * 100),
                corner_LT_11: corner_LT_11,
                corner_LT_11_rate: Math.round((corner_LT_11 / totalGame) * 100),
                card_GT_4: card_GT_4,
                card_GT_4_rate: Math.round((card_GT_4 / totalGame) * 100),
                card_LT_4: card_LT_4,
                card_LT_4_rate: Math.round((card_LT_4 / totalGame) * 100),
                totalGoal_GT_2: totalGoal_GT_2,
                totalGoal_GT_2_rate: Math.round((totalGoal_GT_2 / totalGame) * 100),
                totalGoal_LT_2: totalGoal_LT_2,
                totalGoal_LT_2_rate: Math.round((totalGoal_LT_2 / totalGame) * 100),
                totalGoal_GT_3: totalGoal_GT_3,
                totalGoal_GT_3_rate: Math.round((totalGoal_GT_3 / totalGame) * 100),
                totalGoal_LT_3: totalGoal_LT_3,
                totalGoal_LT_3_rate: Math.round((totalGoal_LT_3 / totalGame) * 100),
                bothTeamToScore: bothTeamToScore,
                bothTeamToScoreRate: Math.round((bothTeamToScore / totalGame) * 100),
                halfGame_GT_1: halfGame_GT_1,
                halfGame_GT_1_rate: Math.round((halfGame_GT_1 / totalGame) * 100),
                halfGame_LT_1: halfGame_LT_1,
                halfGame_LT_1_rate: Math.round((halfGame_LT_1 / totalGame) * 100),
                halfGame_2_GT_1: halfGame_2_GT_1,
                halfGame_2_GT_1_rate: Math.round((halfGame_2_GT_1 / totalGame) * 100),
                halfGame_2_LT_1: halfGame_2_LT_1,
                halfGame_2_LT_1_rate: Math.round((halfGame_2_LT_1 / totalGame) * 100),
            };


            // Calculate averages
            Object.keys(teams).forEach(team => {
                teams[team].avgGoals = teams[team].goals / teams[team].matches;
                teams[team].avgGoalsAgainst = teams[team].goalsAgainst / teams[team].matches;
                teams[team].avgCards = teams[team].cards / teams[team].matches;
                teams[team].avgCorners = teams[team].corners / teams[team].matches;
            });

            // Convert to array and add order
            const teamStatsArray = Object.keys(teams).map((teamName, index) => ({
                order: index + 1,
                teamName: teamName,
                numOfMatches: teams[teamName].matches,
                numOfGoals: teams[teamName].goals,
                goalsAgainst: teams[teamName].goalsAgainst,
                avgGoals: teams[teamName].avgGoals.toFixed(2),
                avgGoalsAgainst: teams[teamName].avgGoalsAgainst.toFixed(2),
                numOfCards: teams[teamName].cards,
                avgCards: teams[teamName].avgCards.toFixed(2),
                numOfCorners: teams[teamName].corners,
                avgCorners: teams[teamName].avgCorners.toFixed(2),
            }));

            Object.keys(referees).forEach(referee => {
                referees[referee].avgCards = referees[referee].numCards / referees[referee].numMatches;
            });





            const refereeStatsArray = Object.keys(referees).map((refereeName, index) => ({
                refereeName: refereeName,
                numOfMatches: referees[refereeName].numMatches,
                numberOfCards: referees[refereeName].numCards,
                avgOfCards: referees[refereeName].avgCards.toFixed(2)
            }));
            refereeStatsArray.sort((a, b) => a.avgOfCards - b.avgOfCards);



            allStatistics.push({ statistics: statistics, teams: teamStatsArray, referees: refereeStatsArray });
        }
    });

    res.render('home', { datasets: allStatistics });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
