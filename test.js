const gis = require('g-i-s');



// function logResults(error, results) {
//     if (error) {
//       console.log(error);
//     }
//     else {
//       console.log(JSON.stringify(results, null, '  '));
//     }
//   }

const imageSearch = (error, results) => {
    var result = (JSON.stringify(results, null, '  '));
    console.log(results[1].url);
}

gis ('cats', imageSearch);
