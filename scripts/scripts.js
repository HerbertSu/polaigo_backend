const {binarySearchListOfObjects} = require('./searchAlgorithms');
const {
    fetchAndWriteRollCall,
    getRollCallDataFromHRClerk,
} = require('./RollCall/RollCall');
const {
    insertIntoTable_roll_call_votes_hr,
} = require('./postgresql/psql');
const {
    ACCESS_ARRAY
} = require('../constants/constants');


/**
 * A function meant to contain the logic for fetching vote data from clerk.house.gov and inserting/updating the correct tables.
 * Specfically, this code potentially inserts/updates data in 'roll_call_votes_hr', 'vote_histories_hr_active', and 'vote_histories_hr_inactive'.
 * @param {Array} rollCallHRListCREC List of CREC-extension xml container-elements that contains a roll call vote. It is the list returned from getAllHRRollCallsFromCREC()
 * @param {*} postgres 
 */
let gatherAndUpsertRollCallData = async (rollCallHRListCREC, postgres) => {
    for(const congVote of rollCallHRListCREC){
        let potentialVoteHistoriesInsert = [];
        let dateOfVote = new Date(congVote.dateOfVote);
        let yearOfVote = dateOfVote.getFullYear();
        let roll = congVote.rollNumber;
        let xmlFileName = await fetchAndWriteRollCall(yearOfVote, roll);
        let rollDataClerk = getRollCallDataFromHRClerk(xmlFileName);
        let {representativesVotesList} = rollDataClerk;
        
        insertIntoTable_roll_call_votes_hr(rollDataClerk, congVote, postgres);

        let rollString = String(roll);
        if(rollString.length < 3){
            rollString = rollString.padStart(3, "0");
        }

        let congressTerm = rollDataClerk.congressTerm;
        let session = rollDataClerk.session;

        let voteHistoryKey = `${congressTerm}_${session}_${rollString}`;
        let vote_histories_hr_active_TableEntries = await postgres.select()
            .from("vote_histories_hr_active")
            .orderBy("bioguideid")
            .catch(err => {
                throw err;
            });

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
                    .catch(err =>{
                        console.log("Error updating vote_histories_hr_active", err);
                        throw err;
                    })
            } else {
                let dateOfLastMemberUpdateFromTable = await postgres("date_of_last_hr_members_update")
                    .select()
                    .catch(err => {
                        throw err;
                    });

                dateOfLastMemberUpdate = new Date(dateOfLastMemberUpdateFromTable[ACCESS_ARRAY].date);

                if(dateOfVote < dateOfLastMemberUpdate){
                    
                    let vote_histories_hr_inactive_TableEntries = await postgres.select()
                        .from("vote_histories_hr_inactive")
                        .orderBy("bioguideid")
                        .catch(err => {
                            throw err;
                        });
                    
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
                            .catch(err => {
                                throw err;
                            });
                    } else {
                        let voteHistoryObj = {};
                        voteHistoryObj[voteHistoryKey] = {voted : repObj.vote};
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
            let inserted = await postgres("vote_histories_hr_inactive")
                .insert(potentialVoteHistoriesInsert)
                .then(res => {
                    console.log("Inserted into vote_histories_hr_inactive");
                })
                .catch(err => {
                    throw err;
                });
        }
    }
}

module.exports = {
    gatherAndUpsertRollCallData,

}