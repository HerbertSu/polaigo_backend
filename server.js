const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");
const {parseCRECForHRVotedMeasures} = require("./scripts/parseCRECForHRVotedMeasures");

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
const passedMeasureList = DailyDigest.passedMeasureList;
const failedMeasureList = DailyDigest.failedMeasureList;

let votesArray = parseCRECForHRVotedMeasures(failedMeasureList, relatedItems);


// console.log(DailyDigest.passedMeasureList.length)
let count = 1;
votesArray.forEach(element =>{
    console.log(count + " ",element.searchTitle[0] + "\n")
    count++;
})




app.listen(3000);