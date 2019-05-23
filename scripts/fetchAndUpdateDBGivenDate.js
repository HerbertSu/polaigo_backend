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
const {gatherAndUpsertRollCallData} = require('./scripts');

/**
 * General function for fetching the roll call votes delivered at a given date and updating 'roll_call_votes_hr', 'vote_histories_hr_active', and 'vote_histories_hr_inactive' SQL tables.
 * @param {string} date Date, preferrably in the format of yyyy-mm-dd.
 * @param {*} postgres 
 */
const fetchAndUpdateDBGivenDate = async (date, postgres) =>{
    try{
        date = dateify(date);
    let filepath = await fetchAndWriteCRECXMLFromDate(date);
    let CRECObj = convertCRECXMLToObject(filepath);
    let relatedItems = retrieveCRECSubSections(CRECObj);
    let metadataOfCREC = getDataOfCREC(CRECObj);
    let congVotes = parseCRECForCongVotes(relatedItems);
    let rollCallsHRCREC = getAllHRRollCallsFromCREC(congVotes, CRECObj);
    let rollCallsSenateCREC = getAllSenateRollCallsFromCREC(congVotes, CRECObj);

    await gatherAndUpsertRollCallData(rollCallsHRCREC, postgres);

    return `Vote data for ${date} CREC has been fetched and updated in DB.`;
    } 
    catch(err){
        console.log(`${err}. Error located in fetchAndUpdateDBGivenDate().`);
    };
};

module.exports = {
    fetchAndUpdateDBGivenDate,
}