const fs = require('fs');
const util = require('util');
const zlib = require('zlib');
const gunzip = util.promisify(zlib.gunzip);

const fsPromises = fs.promises;
const rawDataDir = 'feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/national_summary_results';

async function listDir() {
  const regfile = /(....)(..)(..)T(..)(..)(..)Z\.json.gz/;

  const fileMetadatas = (await fsPromises
    .readdir(rawDataDir))
    .reduce((acc, filename) => {
      const m = filename.match(regfile);
      const ts = Date.UTC(m[1], m[2]-1, m[3], m[4], m[5], m[6]); // month is 0 indexed
      if (m) acc.push({ filename, ts, date: new Date(ts) });
      return acc;
    }, []);

  let step = new Date(Date.UTC(2020, 11-1, 4, 11));
  let previousMeta;
  const resultByDay = fileMetadatas.reduce((acc, meta) => {
    if (meta.ts > step.getTime()) {
      acc.push(previousMeta || meta);
      step.setDate(step.getDate() + 1);
    }
    previousMeta = meta;
    return acc;
  }, []);
  resultByDay.push(fileMetadatas[fileMetadatas.length - 1]);
  const files = await Promise.all(resultByDay.map(meta => {
    return fsPromises.readFile(`${rawDataDir}/${meta.filename}`)
      .then(gunzip)
      .then(data => ({
        meta,
        data: JSON.parse(data.toString()),
      }))
      .catch(e => console.error('meta', meta));
  }));
  const resultsByDay = files.map(({ data, meta }) => {
    const candidatesByNpid = data.candidates.reduce((acc, candidate) => {
      acc[candidate.npid] = { lastName: candidate.lastName };
      return acc;
    }, {});
    return {
      states: data.stateResults.reduce((acc, stateResult) => {
        acc[stateResult.stateCode] = {
          expectedPercentage: stateResult.expectedPercentage,
          results: stateResult.results.reduce((acc, result) => {
            acc[candidatesByNpid[result.candidateNpid].lastName] = result.votes.count;
            return acc;
          }, {}),
          totalCount: stateResult.results.reduce((acc, result) => (acc+result.votes.count), 0),
        };
        return acc;
      }, {}),
      date: meta.date,
    };
  });
  const resultsLastDay = resultsByDay[resultsByDay.length - 1];
  const data = Object.keys(resultsLastDay.states).reduce((acc, stateCode) => {
    let prev;
    const r = resultsByDay.reduce((acc, resultDay) => {
      const resultsState = resultDay.states[stateCode];
      const r = resultsState;
      if (prev && (resultsState.totalCount === prev.totalCount)) { return acc; }
      const totalDayCount = prev ? r.totalCount-prev.totalCount : r.totalCount;
      acc.push({
        date: resultDay.date,
        proportion: totalDayCount /  resultsLastDay.states[stateCode].totalCount,
        totalCount: totalDayCount,
        resultsThatDay: Object.entries(r.results).reduce((acc, [k, v]) => {
          acc[k] = prev ? (v-prev.results[k])/Math.abs(r.totalCount-prev.totalCount) : (v/r.totalCount);
          return acc;
        }, {}),
        countSoFar: Object.entries(r.results).reduce((acc, [k, v]) => {
          acc[k] = v
          return acc;
        }, {}),
        resultsSoFar: Object.entries(r.results).reduce((acc, [k, v]) => {
          acc[k] = v/r.totalCount;
          return acc;
        }, {}),
      });
      prev = r;  
      return acc;
    }, []);
    acc[stateCode] = {
      electoralAreaCode: stateCode,
      results: r,
    }
    return acc;
  }, {});
  console.log(JSON.stringify(data));
}

listDir();
