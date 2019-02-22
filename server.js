const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {parseCRECForCongVotes, parseCRECForRelatedItemsWithCongVotes} = require('./scripts/CREC/parseCREC');
const {convertRollCallXMLToObject} = require('./scripts/RollCall/RollCall');
const {
    convertHRMemberXMLToObj, 
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    updateVoteHistoriesActiveBioGuideIds,
    } = require('./scripts/HR/HR');

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

 
//TODO Fetch and parse senate roll call votes from (example): 
    //https://www.senate.gov/legislative/LIS/roll_call_votes/vote1141/vote_114_1_00002.xml
    //but may not be needed as CREC for Senate may be enough.

//TODO find a way to link roll call votes to the bills/resolutions that they're associated with


//*****For grabbing voted bills/resolutions
let relatedItems = CREC.relatedItems;

// let relatedItemsWithCongVotesList = parseCRECForRelatedItemsWithCongVotes(relatedItems);
// console.log(relatedItemsWithCongVotesList[0].identifier[4])
let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);

// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.failedBills.length)

votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.forEach(measure => {
    console.log(measure);
})
// console.log(votedMeasuresExtensionElements.senateVotedMeasuresObj)
// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.length)
//*****


/*****
//For populating representatives_of_hr_active table
let representativesObj = convertHRMemberXMLToObj('./test/HR-Representatives-Data-February-11-2019.txt');
let HRMemberList = parseHRMemberDataObj(representativesObj);
updateRepresentativesActiveTable(HRMemberList, postgres);
*****/

// updateVoteHistoriesActiveBioGuideIds(postgres);


