var moment = require("moment"); // require
const axios = require("axios");
moment().format();

Array.prototype.reFind = function (rx) {
  for (var i in this) {
    if (this[i].toString().match(rx)) {
      return [this[i], parseInt(i)];
    }
  }
  return [null, -1];
};

if (typeof Array.prototype.reFindAll === "undefined") {
  Array.prototype.reFindAll = function (rx) {
    let res = [];
    for (var i in this) {
      if (this[i].toString().match(rx)) {
        res.push({
          index: parseInt(i),
          value: this[i],
        });
      }
    }
    return res;
  };
}

Array.prototype.reMatches = function (rx) {
  var nMatches = 0;
  for (var i in this) {
    if (this[i].toString().match(rx)) {
      nMatches++;
    }
  }
  return nMatches;
};

const col = (c) => {
  return c.charCodeAt() - "A".charCodeAt() + 1;
};

const transpose = (matrix) => {
  return matrix[0].map((x, i) => matrix.map((x) => x[i]));
};

exports.getOrarioInformatica = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://sheets.googleapis.com/v4/spreadsheets/1BBpCDIttGd1K3FY9u-gAW7-E-L-433P8j0lehczoaUk/values/Fondamenti_2021/?alt=json&key=AIzaSyCi-ZWiYpxFJsDN7sjdYpnJSQGxwXoawvk`
      )
      .then((result) => {
        let matrix = result.data.values;

        let longestRowLength = matrix.reduce((prev, cur) =>
          prev > cur.length ? prev : cur.length
        ); // Get longest row length.

        matrix.map((row) => {
          //Make all rows same length.
          while (row.length < longestRowLength) {
            row.push("");
          }
        });

        matrix = transpose(matrix); // Transpose matrix
        matrix = matrix.slice(0, col("T")); // Slice matrix by column (A-->T)

        //matrix = matrix.slice(16, n); // Slice by column.
        //matrix = transpose(transpose(matrix).slice(0, col(m))); // Slice by column.

        let scrapedData = [];
        matrix.forEach((row, m) => {
          let dates = row.reFindAll(/\d{2}-[A-Z][a-z]{2}/);

          if (dates.length <= 0) {
            return;
          }

          let rowScraped = [];
          dates.forEach((date, n) => {
            let nextDate = dates[n + 1];
            let slicedArray = row.slice(date.index, nextDate && nextDate.index);
            let scrapedTimes = slicedArray.reFindAll(/\d{1,2}:\d{2}/);
            if (scrapedTimes.length > 0) {
              var lessons = [];
              scrapedTimes.forEach((t, tIndex) => {
                if (tIndex % 2) {
                  let startTimeNotSliced = date.index + t.index - 1;
                  let endTimeNotSliced = startTimeNotSliced + 1;

                  var name =
                    matrix[m + 2][startTimeNotSliced] +
                    " " +
                    matrix[m + 2][endTimeNotSliced];
                  if (name == " ") name = null;

                  var teacherCode = matrix[m + 3][startTimeNotSliced] || null;

                  var duration = matrix[m + 3][endTimeNotSliced];

                  var startTime = scrapedTimes[tIndex - 1].value;
                  var parsedStartTime = moment(
                    date.value + "-" + startTime,
                    "DD-MMM-hh:mm"
                  ).toDate();

                  var endTime = t.value;
                  var parsedEndTime = moment(
                    date.value + "-" + endTime,
                    "DD-MMM-hh:mm"
                  ).toDate();

                  lessons.push({
                    start: { string: startTime, parsed: parsedStartTime },
                    end: { string: endTime, parsed: parsedEndTime },
                    duration,
                    name: name,
                    teacherCode,
                  });
                }
              });
              //console.log("lessons", lessons, "scrapedTimes", scrapedTimes);
            }
            if (scrapedTimes.length) {
              rowScraped.push({
                date: {
                  string: date.value,
                  parsed: moment(date.value, "DD-MMM").toDate(),
                },
                lessons,
              });
            }
          });
          rowScraped.length && scrapedData.push(...rowScraped);
        });

        scrapedData.sort((a, b) => {
          if (a.date.parsed < b.date.parsed) {
            return -1;
          }
          if (a.date.parsed > b.date.parsed) {
            return 1;
          }
          return 0;
        });

        return resolve(scrapedData);
      })
      .catch((err) => {
        return reject(err);
      });
  });
};
