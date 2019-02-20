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


// postgres.select('column1').from('test')
//     .then(data => {
//         console.log(data)
//     })
 
//TODO Fetch and parse senate roll call votes from (example): 
    //https://www.senate.gov/legislative/LIS/roll_call_votes/vote1141/vote_114_1_00002.xml
    //but may not be needed as CREC for Senate may be enough.

//TODO find a way to link roll call votes to the bills/resolutions that they're associated with
//TODO: Find the indices of relatedItems that pertain to the pages returned in passedMeasureList and
    //failedMeasureList
    /*
        DailyDigest.passedMeasureList is a list of objects with 
            {
                rollCall: String,
                billDescription: String,
                pages: [ [Array], [Array] ]
            }

        Possible tags to match for <identifier> type = "congressional vote number", check content if
            includes rollCall. If so, grab the accompanying <extension> object
    */

/*
//*****For grabbing voted bills/resolutions
let relatedItems = CREC.relatedItems;

// let relatedItemsWithCongVotesList = parseCRECForRelatedItemsWithCongVotes(relatedItems);
// console.log(relatedItemsWithCongVotesList[0].identifier[4])
let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);

// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.failedBills.length)

votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.forEach(measure => {
    console.log(measure.congVote.length + " " + measure.rollCalls);
})
// console.log(votedMeasuresExtensionElements.senateVotedMeasuresObj)
// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.length)
//*****
*/


//TODO Select from representatives_of_hr_active table, check if there are any differences between
    //new values and table values. If exactly the same, remove from HRMemberList.
    //Only update the ones that are different. Search by district.
//For populating representatives_of_hr_active table
let representativesObj = convertHRMemberXMLToObj('./test/HR-Representatives-Data-February-11-2019.txt');
let HRMemberList = parseHRMemberDataObj(representativesObj);
updateRepresentativesActiveTable(HRMemberList, postgres);


// postgres.insert( { str: "value2"} )
//     .into('test2')
//     .returning('str')
//     .then(str => console.log(str));

// postgres.select('str').from('test2')
//     .then(data => {
//         console.log(data)
//     })



