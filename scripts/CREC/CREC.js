const {
    convertCRECXMLToObject, 
    retrieveCRECSubSections,
    parseCRECForDailyDigest,
    parseDailyDigestForHTMLLinks,
    } = require('./parseCREC.js');

let xmlFilePath = "./test/CREC-2018-12-21.txt";

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


