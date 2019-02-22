const {
    convertCRECXMLToObject, 
    retrieveCRECSubSections,
    parseCRECForDailyDigest,
    parseDailyDigestForHTMLLinks,
    fetchCRECXMLFromDate,
    } = require('./parseCREC.js');

// let date = "2018-12-21";
let date = "2019-01-03";
// fetchCRECXMLFromDate("2019-01-03");
 
let xmlFilePath = `./test/CREC-${date}.txt`;

//The base result of parsing CREC is an object of size 1 with key "mods".
//Object.keys(result.mods)) returns an array of the unique keys of the keys in the object that is the value to "mods"

let CRECObj = convertCRECXMLToObject(xmlFilePath);
let relatedItems = retrieveCRECSubSections(CRECObj);
let [dailyDigestIDs, dailyDigestContainers] = parseCRECForDailyDigest(relatedItems);
let dailyDigestHTMLLinks = parseDailyDigestForHTMLLinks(dailyDigestContainers);

module.exports = {
    dailyDigestHTMLLinks : dailyDigestHTMLLinks,
    dailyDigestIDs : dailyDigestIDs,
    dailyDigestContainers : dailyDigestContainers,
    relatedItems : relatedItems, 
    CRECObj : CRECObj,
}


