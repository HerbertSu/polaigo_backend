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
} = require('./scripts/postgresql/psql');
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



//For populating representatives_of_hr_active table
// ( async () => {
//     let xmlFilePath = await fetchAndWriteRepresentativesData();
//     let representativesObj = convertHRMemberXMLToObj(xmlFilePath);
//     let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);
//     let HRMemberList = parseHRMemberDataObj(representativesObj);
//     updateRepresentativesActiveTable(HRMemberList, dateOfMemberData, postgres);
// })();




//***** For Updating the vote histories 
// updateVoteHistoriesActiveBioGuideIds(postgres);
//*****

// fetchAndWriteRollCall('2019', '3');
let relatedItems = CREC.relatedItems;
let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);
let CRECObj = CREC.CRECObj;

let rollCallHRListCREC = getAllHRRollCallsFromCREC(votedMeasuresExtensionElements, CRECObj);



//TODO What to do if a member is not in representatives_of_hr_active
    //e.g. Representative retired in February but I am checking out a vote that took place
    //in January.
    //Check if member is in representatives_of_hr_active table. 
        //If so, 
let gatherAndUpsertRollCallData = async (rollCallHRListCREC, postgres) => {
    
    for(const congVote of rollCallHRListCREC){
        let potentialVoteHistoriesInsert = [];
        let dateOfVote = new Date(congVote.dateOfVote);
        let yearOfVote = dateOfVote.getFullYear();
        let roll = congVote.rollNumber;
        let xmlFileName = await fetchAndWriteRollCall(yearOfVote, roll);
        let rollDataClerk = getRollCallDataFromHRClerk(xmlFileName);
        let {representativesVotesList} = rollDataClerk;
        
        insertIntoTable_roll_call_votes_hr(rollDataClerk, congVote);

        let rollString = String(roll);
        if(rollString.length < 3){
            rollString = rollString.padStart(3, "0");
        }

        let congressTerm = rollDataClerk.congressTerm;
        let session = rollDataClerk.session;

        let voteHistoryKey = `${congressTerm}_${session}_${rollString}`;
        let vote_histories_hr_active_TableEntries = await postgres.select()
            .from("vote_histories_hr_active")
            .orderBy("bioguideid");

        for(let repObj of representativesVotesList){
            let isRepresentativeInTable = binarySearchListOfObjects(repObj.bioguideid, vote_histories_hr_active_TableEntries, "bioguideid");
            
            if(isRepresentativeInTable !== false){                
                let matchedRep = vote_histories_hr_active_TableEntries[isRepresentativeInTable];
                if(matchedRep.votinghistory == null){
                    matchedRep.votinghistory = {};
                } else {
                    let rollVotes = Object.keys(matchedRep.votinghistory);
                    //Skips update if roll call is already present in table for the user
                    if(rollVotes.includes(voteHistoryKey)){
                        continue;
                    }
                }
                matchedRep.votinghistory[voteHistoryKey] = {voted : repObj.vote};
                await postgres("vote_histories_hr_active")
                    .where({
                        bioguideid : repObj.bioguideid
                    })
                    .update({
                        votinghistory : matchedRep.votinghistory
                    })
            } else {
                let dateOfLastMemberUpdate = await postgres("date_of_last_hr_members_update")
                    .select()[ACCESS_ARRAY];
                
                dateOfLastMemberUpdate = new Date(dateOfLastMemberUpdate);
                
                if(dateOfVote < dateOfLastMemberUpdate){
                    console.log(dateOfVote)
                    console.log(dateOfLastMemberUpdate)
                    let vote_histories_hr_inactive_TableEntries = await postgres.select()
                        .from("vote_histories_hr_inactive")
                        .orderBy("bioguideid");
                    
                    let isRepresentativeInTable = binarySearchListOfObjects(repObj.bioguideid, vote_histories_hr_inactive_TableEntries, "bioguideid");

                    if(isRepresentativeInTable !== false){
                        let matchedRep = vote_histories_hr_inactive_TableEntries[isRepresentativeInTable];
                        if(matchedRep.votinghistory == null){
                            matchedRep.votinghistory = {};
                        } else {
                            let rollVotes = Object.keys(matchedRep.votinghistory);
                            //Skips update if roll call is already present in table for the user
                            if(rollVotes.includes(voteHistoryKey)){
                                continue;
                            }
                        }
                        matchedRep.votinghistory[voteHistoryKey] = {voted : repObj.vote};
                        await postgres("vote_histories_hr_inactive")
                            .where({
                                bioguideid : repObj.bioguideid
                            })
                            .update({
                                votinghistory : matchedRep.votinghistory
                            })
                    } else {
                        let voteHistoryObj = { voteHistoryKey : {voted : repObj.vote} };
                        potentialVoteHistoriesInsert.push({
                            bioguideid : repObj.bioguideid,
                            votinghistory : voteHistoryObj
                        });
                    }
                } else {
                    throw `Representative ${repObj.bioguideid} is neither in vote_histories_hr_active nor vote_histories_hr_inactive. Please check the date of the roll call vote against the date of the most recently updated Member.xml from clerk.house.gov. Perhaps the list of currently active representatives in the 'representatives_of_hr_active' table needs to be updated.`;
                }  
            }
        }
        if(potentialVoteHistoriesInsert.length > 0){
            let inserted = await postgres("vote_histories_hr_inactive",["bioguideid"])
                .insert(potentialVoteHistoriesInsert);
            console.log(inserted[0]);
        }
    }
}

// updateVoteHistoriesActiveBioGuideIds(postgres)
let data = gatherAndUpsertRollCallData(rollCallHRListCREC, postgres);

// /**
//  * 
//  * @param {Object} repObj An element in the array 'representativesVotesList' generated from getRollCallDataFromHRClerk()
//  * @param {string} voteHistoriesTableName 'vote_histories_hr_active' OR 'vote_histories_hr_inactive'
//  * @param {Array} vote_histories_tableEntries The list returned from a SELECT query on a 'vote_histories_hr_...' table
//  * @param {*} isRepresentativeInTable Return value from binarySearchListOfObjects() for the vote_histories_... table in question.
//  * @param {string} voteHistoryKey Key value for a potential entry into 'votinghistory' JSON of the vote_histories... table in queastion.
//  */
// const insertOrUpdateVotingHistory = (
//         repObj, 
//         voteHistoriesTableName, 
//         vote_histories_tableEntries, 
//         isRepresentativeInTable, 
//         voteHistoryKey
//     ) => {
//     let matchedRep = vote_histories_tableEntries[isRepresentativeInTable];
//     if(matchedRep.votinghistory == null){
//         matchedRep.votinghistory = {};
//     } else {
//         let rollVotes = Object.keys(matchedRep.votinghistory);
//         //Skips update if roll call is already present in table for the user
//         if(rollVotes.includes(voteHistoryKey)){
//             continue;
//         }
//     }
//     matchedRep.votinghistory[voteHistoryKey] = {voted : repObj.vote};
//     await postgres(voteHistoriesTableName)
//         .where({
//             bioguideid : repObj.bioguideid
//         })
//         .update({
//             votinghistory : matchedRep.votinghistory
//         })
// }


//     //Select * from vote_histories_hr_active
//     //Search returned list's bioguideid values to see  if member is in there
//     //if yes, check the json keys to see if the voteHistoryKey is already there
//         //if yes, skip
//         //else, add onto the json key
//     //else, add a new entry with bioguideid and vote

let binarySearchListOfObjects = (item, list, listKey) => {
    let beginningIndex = 0;
    let endIndex = list.length - 1;
    while(true){
        if(beginningIndex > endIndex){
            return false;
        } 
        middleIndex = Math.floor(beginningIndex + (endIndex - beginningIndex)/2);

        if(item > list[middleIndex][listKey]){
            beginningIndex = middleIndex + 1;
        } else if (item < list[middleIndex][listKey]){
            endIndex = middleIndex - 1;
        } else {
            return middleIndex;
        }
    }
}











