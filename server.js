const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {parseCRECForCongVotes, parseCRECForRelatedItemsWithCongVotes} = require('./scripts/CREC/parseCREC');


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


//TODO congVotes can have more than one entry in its array because relatedItems can include
    //multiple votes if certain resolutions/bills are linked together.
    //Need to generalize parseCRECForCongVotes() function to throw everything from HOUSE 
    //into a votedMeasures object like for SENATE.
    //After we have everything then we can match the rollCalls with their congVote counterparts.

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
console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.passedBills[0])
// console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.length)

