const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {
    parseCRECForCongVotes, 
    parseCRECForRelatedItemsWithCongVotes,
    getDataOfCREC,
    getAllHRRollCallsFromCREC,
    } = require('./scripts/CREC/parseCREC');
const {
    convertRollCallXMLToObject,
    fetchAndWriteRollCall,
    getRollCallDataFromHRClerk,
    } = require('./scripts/RollCall/RollCall');
const {
    convertHRMemberXMLToObj, 
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    updateVoteHistoriesActiveBioGuideIds,
    fetchAndWriteRepresentativesData,
    getDateOfClerksMemberXML,
    } = require('./scripts/HR/HR');
const {
    insertIntoTable_roll_call_votes_hr, 
    fetchRepresentativeGivenDistrict,
} = require('./scripts/postgresql/psql');
const {
    gatherAndUpsertRollCallData
} = require('./scripts/scripts');
const {fetchCongressionalDistrictFromAddress} = require('./scripts/API/GoogleCivicInfo');
const {ACCESS_ARRAY} = require("./constants/constants");

const {dateify} = require('./scripts/dateify');
const { fetchAndUpdateDBGivenDate } = require('./scripts/fetchAndUpdateDBGivenDate');

const knex = require('knex');

const postgres = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'polaigo_test'
    }
});

// TODO: Create a table that maps the representative districts to zipcodes of cities. 

// TODO Fetch and parse senate roll call votes from (example): 
    //https://www.senate.gov/legislative/LIS/roll_call_votes/vote1141/vote_114_1_00002.xml
    //but may not be needed as CREC for Senate may be enough.



//*****For grabbing voted bills/resolutions
// getDataOfCREC(CREC.CRECObj)
// let relatedItems = CREC.relatedItems;

// let relatedItemsWithCongVotesList = parseCRECForRelatedItemsWithCongVotes(relatedItems);
// console.log(relatedItemsWithCongVotesList[0].identifier[4])
// let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);

// votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.forEach(measure => {
//     console.log(measure);
// })

// votedMeasuresExtensionElements.senateVotedMeasuresObj.votedMeasures.forEach(measure => {
//     console.log(measure);
// })
// console.log(votedMeasuresExtensionElements.senateVotedMeasuresObj)
// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures[votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.length - 1].congVote[1])
//*****



//For populating representatives_of_hr_active table
// ( async () => {
//     let xmlFilePath = await fetchAndWriteRepresentativesData();
//     let representativesObj = convertHRMemberXMLToObj(xmlFilePath);
//     let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);
//     let HRMemberList = parseHRMemberDataObj(representativesObj);
//     updateRepresentativesActiveTable(HRMemberList, dateOfMemberData, postgres);
// })();




//***** For Updating the vote history bioguideids 
// updateVoteHistoriesActiveBioGuideIds(postgres);
//*****

// fetchAndWriteRollCall('2019', '3');
// let relatedItems = CREC.relatedItems;
// let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);
// let CRECObj = CREC.CRECObj;

// let rollCallHRListCREC = getAllHRRollCallsFromCREC(votedMeasuresExtensionElements, CRECObj);


// updateVoteHistoriesActiveBioGuideIds(postgres)
// let data = gatherAndUpsertRollCallData(rollCallHRListCREC, postgres);


//***** For fetching a representative's information given an address
// (async () => {
//     let district = await fetchCongressionalDistrictFromAddress("50 north illinois street Indianapolis Indiana 46204");
//     console.log(district);
//     let representative = await fetchRepresentativeGivenDistrict(district.state, district.districtNumber, postgres );
//     console.log(representative);
// })()
//*****

(async ()=> {
    console.log( await fetchAndUpdateDBGivenDate("Dec 21, 2018"));
})()












