const fs = require('fs');
const util = require('util');
const zlib = require('zlib');
const gunzip = util.promisify(zlib.gunzip);

const fsPromises = fs.promises;
const rawDataDir = 'feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/national_summary_results';

async function listStates(stateFilter) {
  const regfile = /(....)(..)(..)T(..)(..)(..)Z\.json.gz/;

  const fileMetadatas = (await fsPromises
    .readdir(rawDataDir))
    .reduce((acc, filename) => {
      const m = filename.match(regfile);
      const ts = Date.UTC(m[1], m[2]-1, m[3], m[4], m[5], m[6]); // month is 0 indexed
      if (m) acc.push({ filename, ts, date: new Date(ts) });
      return acc;
    }, []);
  let candidatesByNpid;
  const trackChangeStateData = await fileMetadatas.reduce(async (acc, fileMetadata) => {
    const nextAcc = await acc;
    const data = await fsPromises.readFile(`${rawDataDir}/${fileMetadata.filename}`)
      .then(gunzip)
      .then(data => (JSON.parse(data.toString())))
      .catch(e => { console.log('parseerror', fileMetadata, e); throw e });

    if (!candidatesByNpid) {
      candidatesByNpid = data.candidates.reduce((acc, candidate) => {
        acc[candidate.npid] = { lastName: candidate.lastName };
        return acc;
      }, {});
    }
    const stateResults = data.stateResults.forEach(stateResult => {
      const stateCode = stateResult.stateCode;
      let stateAcc = nextAcc[stateCode];
      if (!stateAcc) {
        if (stateFilter) {
          return nextAcc;
        }
        stateAcc = { results: [], electoralAreaCode: stateCode };
        nextAcc[stateCode] = stateAcc;
      }
      // console.log(stateResult.results);
      /* check if we're not missing some changes by just looking at the precinctsReporting value
      ... so some changes are missed if we just look at the precinctsReporting value
      if (nextAcc.stateResults.length !== 0) {
        const precinctsReportingChanged = stateResult.precinctsReporting !== nextAcc.stateResults[nextAcc.stateResults.length - 1].precinctsReporting 
        const votesChanged = nextAcc.stateResults[nextAcc.stateResults.length - 1].results.some((result, idx) => (stateResult.results[idx].votes.count !== result.votes.count)) 
        if (precinctsReportingChanged !== votesChanged) {
          console.log(fileMetadata, precinctsReportingChanged, votesChanged)
          console.log(nextAcc.stateResults[nextAcc.stateResults.length - 1].results)
          console.log(stateResult.results)
        }
      }
      */

      const lastStateVoteCounts = (stateAcc.results.length === 0)
        ? undefined
        : stateAcc.results[stateAcc.results.length - 1].voteCounts;
      if (stateAcc.results.length === 0 ||
        stateResult.results.some((result) => result.votes.count !== lastStateVoteCounts[candidatesByNpid[result.candidateNpid].lastName])) {
        stateAcc.results.push({
          // fileMetadata,
          ts: fileMetadata.ts,
          // precinctsReporting: stateResult.precinctsReporting,
          // expectedPercentage: stateResult.expectedPercentage,
          voteCounts: stateResult.results.reduce((acc, result) => {
            acc[candidatesByNpid[result.candidateNpid].lastName] = result.votes.count;
            return acc;
          }, {}),
        });
        stateAcc.availableDelegates = stateResult.availableDelegates;
      }
    });
    return nextAcc;
  }, Promise.resolve((stateFilter || []).reduce((acc, stateCode) => {
    acc[stateCode] = { results: [], electoralAreaCode: stateCode };
    return acc;
  }, {})));
  console.log(JSON.stringify({ stateResults: Object.values(trackChangeStateData) }));
}

const stateFilter = process.argv.length < 3 ? undefined : process.argv[2].split(',')
listStates(stateFilter);
