const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {parseCRECForCongVotes, parseCRECForRelatedItemsWithCongVotes} = require('./scripts/CREC/parseCREC');
const {convertRollCallXMLToObject} = require('./scripts/RollCall/RollCall');

// const knex = require('knex');

// const postgres = knex({
//     client: 'pg',
//     connection: {
//         host: '127.0.0.1',
//         user: 'postgres',
//         password: 'password',
//         database: 'polaigo_test'
//     }
// });


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






