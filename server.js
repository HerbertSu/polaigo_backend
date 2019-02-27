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
let potentialVoteHistoriesInsert = [];

let CHECK = false;

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
    

    //TODO try updating multiple rows and columns at once.
    //Try finding a way to get postgres.queries() to work with async/await
    //Get list of entries currently in vote_histories_hr_active
        //for each roll call vote
            //for each representative who voted in that roll call
                //if rep exists in v_h_h_a
                    //if rep's votinghistory is empty
                        //create an empty object
                    //else
                        //retrieve the json
                        //check if the voteHistoryKey is already in there
                            //if so, return
                    //update votinghistory object  
    postgres.select()
        .from("vote_histories_hr_active")
        .orderBy("bioguideid")
        .then(vote_histories_hr_active_TableEntries => {
            let updateList = [];
            representativesVotesList.forEach( (repObj) => {
                let isRepresentativeInTable = binarySearchListOfObjects(repObj.bioguideid, vote_histories_hr_active_TableEntries, "bioguideid");
                
                if(isRepresentativeInTable !== false){
                    
                    let matchedRep = vote_histories_hr_active_TableEntries[isRepresentativeInTable];
                    if(matchedRep.votinghistory == null){
                        matchedRep.votinghistory = {};
                    } else {
                        let rollVotes = Object.keys(matchedRep.votinghistory);
                        if(rollVotes.includes(voteHistoryKey)){
                            console.log(`${voteHistoryKey} already in vote_histories_hr_active for ${matchedRep.bioguideid}`);
                            return;
                        }
                    }
                    matchedRep.votinghistory[voteHistoryKey] = {voted : repObj.vote};
                    updateList.push({
                        bioguideid : repObj.bioguideid,
                        votinghistory : matchedRep.votinghistory
                    })
                    // postgres("vote_histories_hr_active")
                    //     .where({
                    //         bioguideid : repObj.bioguideid
                    //     })
                    //     .update({
                    //         votinghistory : matchedRep.votinghistory
                    //     })
                    // console.log(`Updated ${updateVoteHistories[0]} with ${voteHistoryKey}`);
                    
                }
            })
            return updateList;
        })
        .then(updateList => {
            console.log(updateList)
            updateList.forEach(voteHistoryObj => {
                postgres("vote_histories_hr_active")
                    .where({
                        bioguideid : voteHistoryObj.bioguideid
                    })
                    .update({
                        votinghistory : voteHistoryObj.votinghistory
                    })
                    .then(res=>{
                        // console.log(res)
                    })
            })
        })

        
    
    //Select * from vote_histories_hr_active
    //Search returned list's bioguideid values to see  if member is in there
    //if yes, check the json keys to see if the voteHistoryKey is already there
        //if yes, skip
        //else, add onto the json key
    //else, add a new entry with bioguideid and vote

    // let check = false;
    // representativesVotesList.forEach( async (repObj) => {
    //     let isRepresentativeInTable = binarySearchListOfObjects(repObj.bioguideid, vote_histories_hr_active_TableEntries, "bioguideid");
        
    //     if(isRepresentativeInTable !== false){
    //         if(!check){
    //             console.log(voteHistoryKey);
    //             check = true;
    //         }
            
    //         let matchedRep = vote_histories_hr_active_TableEntries[isRepresentativeInTable];
    //         if(matchedRep.votinghistory == null){
    //             matchedRep.votinghistory = {};
    //         } else {
    //             let rollVotes = Object.keys(matchedRep.votinghistory);
    //             if(rollVotes.includes(voteHistoryKey)){
    //                 // console.log(`${voteHistoryKey} already in vote_histories_hr_active for ${matchedRep.bioguideid}`);
    //                 return;
    //             }
    //         }
    //         matchedRep.votinghistory[voteHistoryKey] = {voted : repObj.vote};

    //         await postgres("vote_histories_hr_active")
    //             .where({
    //                 bioguideid : repObj.bioguideid
    //             })
    //             .update({
    //                 votinghistory : matchedRep.votinghistory
    //             })
    //         // console.log(`Updated ${updateVoteHistories[0]} with ${voteHistoryKey}`);
            
    //     }
    // })

    //Cannot update multiple entries at a time because update doesn't take arrays
    
})


let selectVoteHistoriesTableEntries = async (postgres) => {
    return await (postgres.select()
        .from("vote_histories_hr_active")
        .orderBy("bioguideid")
    )
}

let test = async () => {
    const res = await selectVoteHistoriesTableEntries(postgres);
    return res;
}


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











