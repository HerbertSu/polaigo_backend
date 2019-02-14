const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {parseCRECForCongVotes} = require('./scripts/CREC/parseCREC');

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

let votedMeasuresExtensionElements = parseCRECForCongVotes(relatedItems);

console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.failedBills.length)
console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.passedBills.length)
console.log(votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.length)

