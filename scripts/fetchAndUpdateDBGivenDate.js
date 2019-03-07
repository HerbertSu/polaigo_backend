const {dateify} = require('./dateify');
const {
    fetchAndWriteCRECXMLFromDate,
    convertCRECXMLToObject,
    retrieveCRECSubSections,
    parseCRECForCongVotes,
    getDataOfCREC,
    getAllHRRollCallsFromCREC,
    getAllSenateRollCallsFromCREC,
} = require('./CREC/parseCREC');

const fetchAndUpdateDBGivenDate = async (date) =>{
    date = dateify(date);
    let filepath = await fetchAndWriteCRECXMLFromDate(date);
    let CRECObj = convertCRECXMLToObject(filepath);
    let relatedItems = retrieveCRECSubSections(CRECObj);
    let metadataOfCREC = getDataOfCREC(CRECObj);
    let congVotes = parseCRECForCongVotes(relatedItems);
    let rollCallsHRCREC = getAllHRRollCallsFromCREC(congVotes, CRECObj);
    let rollCallsSenateCREC = getAllSenateRollCallsFromCREC(congVotes, CRECObj);


    return rollCallsSenateCREC;
    // return congVotes.senateVotedMeasuresObj.votedMeasures;
}

module.exports = {
    fetchAndUpdateDBGivenDate,
}