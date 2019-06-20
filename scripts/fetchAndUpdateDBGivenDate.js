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
        // let metadataOfCREC = getDataOfCREC(CRECObj);

        //Still need to test all possible options.
        //Next steps: Switch branch and make sure data reroutes if new rep shows up
            //old rep's vote history gets moved to old_vote_history table
            //new rep is created in table.
        //If older CREC is received (ie from like 2015), make sure reps who are out of office are only updated in the old vote_history table
        let congVotes = parseCRECForCongVotes(relatedItems);
        if( Object.entries(congVotes.hrVotedMeasuresObj).length !== 0 ){
            let rollCallsHRCREC = getAllHRRollCallsFromCREC(congVotes, CRECObj);
            await gatherAndUpsertRollCallData(rollCallsHRCREC, postgres);

            if( Object.entries(congVotes.senateVotedMeasuresObj).length !== 0 ){
                // let rollCallsSenateCREC = getAllSenateRollCallsFromCREC(congVotes, CRECObj);
                // await gatherAndUpsertRollCallData(rollCallsSenateCREC, postgres);
            } else {
                return {
                    status: 206,
                    message: `No Roll Call votes were made on this day by the Senate, but Roll Call votes were made by the House.`
                };
            };

            return {
                status : 200,
                message : `Vote data for ${date} CREC has been fetched and updated in DB.`
            };
        } else {
            if( Object.entries(congVotes.senateVotedMeasuresObj).length !== 0 ){
                // let rollCallsSenateCREC = getAllSenateRollCallsFromCREC(congVotes, CRECObj);
                // await gatherAndUpsertRollCallData(rollCallsSenateCREC, postgres);
                return {
                    status: 206,
                    message: `No Roll Call votes were made on this day by the House, but Roll Call votes were made by the Senate.`
                }
            } else {
                return {
                    status: 204,
                    message: `No Roll Call votes were made on this day by Congress.`
                };
            };
        };
        
    } 
    catch(err){
        console.log(`${err}. Error located in fetchAndUpdateDBGivenDate().`);
        return {
            status: 404,
            message: `${err}. Error located in fetchAndUpdateDBGivenDate().`
        };
    };
};

module.exports = {
    fetchAndUpdateDBGivenDate,
}