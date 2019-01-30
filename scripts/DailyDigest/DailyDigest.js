const fs = require('fs');
const {
    downloadDailyDigests, 
    cleanHRDailyDigest, 
    flattenArrayOfDoubleArray,
    createHRDailyDigestObject,
    getPassedOrFailedMeasuresHR,
} = require('../DailyDigest/parseDailyDigest');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;


const dailyDigestHTMLLinks = require("../CREC/CREC");

const hrHTMLFilePath = "./test/CREC-2018-12-21-pt1-PgD1314.htm";

// downloadDailyDigests(dailyDigestHTMLLinks);

// let newLawsDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1317.htm").toString();
// let senateDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1313.htm").toString();
let hrDailyDigest = fs.readFileSync(hrHTMLFilePath).toString();
const dom = new JSDOM(hrDailyDigest);


let body = dom.window.document.querySelector("pre").textContent;
let hrDailyDigestItems = body.split('  ');
let hrDailyDigestParagraphs = hrDailyDigestItems.filter(item => item.length > 0);

cleanHRDailyDigest(hrDailyDigestParagraphs);
flattenArrayOfDoubleArray(hrDailyDigestParagraphs)
hrDailyDigestParagraphs = hrDailyDigestParagraphs.filter(item => item.length > 0);

let hrDailyDigestObject = createHRDailyDigestObject(hrDailyDigestParagraphs);

let passedMeasureList = getPassedOrFailedMeasuresHR(hrDailyDigestObject, true);
let failedMeasureList = getPassedOrFailedMeasuresHR(hrDailyDigestObject, false);

// console.log(passedMeasureList.length)
failedMeasureList.forEach((element)=>{
    console.log(element.pages)
})


