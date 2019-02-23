const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {
    parseCRECForCongVotes, 
    parseCRECForRelatedItemsWithCongVotes,
    getDataOfCREC,
    } = require('./scripts/CREC/parseCREC');
const {
    convertRollCallXMLToObject,
    fetchAndWriteRollCall,
    } = require('./scripts/RollCall/RollCall');
const {
    convertHRMemberXMLToObj, 
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    updateVoteHistoriesActiveBioGuideIds,
    } = require('./scripts/HR/HR');
const {ACCESS_ARRAY} = require("./constants/constants");

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


/*****
//For populating representatives_of_hr_active table
let representativesObj = convertHRMemberXMLToObj('./test/HR-Representatives-Data-February-11-2019.txt');
let HRMemberList = parseHRMemberDataObj(representativesObj);
updateRepresentativesActiveTable(HRMemberList, postgres);
*****/

//***** For Updating the vote histories 
// updateVoteHistoriesActiveBioGuideIds(postgres);
//*****

// fetchAndWriteRollCall('2019', '3');

let relatedItems = CREC.relatedItems;
let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);
let {CRECVolumeAndNumber, congressionalTermCREC, sessionCREC} = getDataOfCREC(CREC.CRECObj);
let listOfCRECCongVotes = [];

votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.forEach((voteExtensionObj) => {
    let dateOfVote = voteExtensionObj.granuleDate[ACCESS_ARRAY];
    let chamber = voteExtensionObj.chamber[ACCESS_ARRAY];
    let timeOfVote = voteExtensionObj.time[ACCESS_ARRAY].attr;
    voteExtensionObj.congVote.forEach((voteObj) => {
        let rollNumber = voteObj.attr.number;
        // delete voteObj.congMember;
        listOfCRECCongVotes.push({
            CRECVolumeAndNumber,
            congressionalTermCREC,
            sessionCREC,
            chamber,
            dateOfVote,
            timeOfVote,
            rollNumber,
            ...voteObj,
        })
    })

})

listOfCRECCongVotes.forEach((congVote) => {
    let yearOfVote = new Date(congVote.dateOfVote).getFullYear();
    let roll = congVote.rollNumber;
    fetchAndWriteRollCall(yearOfVote, roll);
})








