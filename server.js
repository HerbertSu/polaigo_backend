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
let CRECObj = CREC.CRECObj;

let rollCallHRListCREC = getAllHRRollCallsFromCREC(votedMeasuresExtensionElements, CRECObj);

rollCallHRListCREC.forEach( async (congVote) => {
    let yearOfVote = new Date(congVote.dateOfVote).getFullYear();
    let roll = congVote.rollNumber;
    let xmlFileName = await fetchAndWriteRollCall(yearOfVote, roll);
    let rollDataClerk = getRollCallDataFromHRClerk(xmlFileName);

    // postgres("roll_call_votes_hr").insert({
    //     roll : rollDataClerk.roll,
    //     congressterm : rollDataClerk.congressTerm,
    //     session : rollDataClerk.session,
    //     result : rollDataClerk.voteResult,
    //     crecofvote : congVote.CRECVolumeAndNumber,
    //     date : rollDataClerk.voteDate,
    //     issue : rollDataClerk.legislatureNumber,
    //     question : rollDataClerk.voteQuestion,
    // }
    // ).then(res=>{
    //     console.log("inserted");
    // }).catch(err=>{
    //     if(err.code == '23505'){
    //         console.log("Duplicate key found: ", err.detail);
    //     }else{
    //         console.log(err);
    //     }
    // })

    let {representativesVotesList} = rollDataClerk;

    let rollString = String(roll);
    if(rollString.length < 3){
        roll = rollString.padStart(3, "0");
    }
    let congressTerm = rollDataClerk.congressTerm;
    let session = rollDataClerk.session;

    let voteHistoryKey = `${congressTerm}_${session}_${roll}`;
    
    let bioguideidsList = await postgres.select("bioguideid")
        .from("vote_histories_hr_active")
        .orderBy("bioguideid");
    //Select * from vote_histories_hr_active
    //Search returned list's bioguideid values to see  if member is in there
    //if yes, check the json keys to see if the voteHistoryKey is already there
        //if yes, skip
        //else, add onto the json key
    //else, add a new entry with bioguideid and vote
    
    //Cannot update multiple entries at a time because update doesn't take arrays
    console.log(binarySearchListOfObjects("C001118", bioguideidsList, "bioguideid"));
})



let binarySearchListOfObjects = (item, list, listKey) => {
    while(true){
        let middleIndex = Math.floor((list.length)/2);
        if(item > list[middleIndex][listKey]){
            list = list.slice(middleIndex + 1);
        } else if (item < list[middleIndex][listKey]){
            list = list.slice(0, middleIndex);
        } else {
            if(list.length == 0){
                return false;
            }
            else{
                return true;
            }
        }
    }
}











