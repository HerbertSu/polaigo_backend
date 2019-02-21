const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;

//date format should be a string in yyyy-mm-dd
    //e.g. "2018-12-21"
let fetchCRECXMLFromDate = (date) =>{
    if(!fs.existsSync(`./test/CREC-${date}.txt`)){
        fetch(`https://api.govinfo.gov/packages/CREC-${date}/mods?api_key=DEMO_KEY`)
            .then(res => res.text())
            .then(fullCR => {
                fs.writeFile(`./test/CREC-${date}.txt`, fullCR, err=>{
                    if(err){
                        console.log(err)
                    }
                })
            })
    }
}

//TODO Replace xmlFilePath with the XML string fetched from the govinfo API 
    //for production version.
let convertCRECXMLToObject = (xmlFilePath) => {
    let xmlCR = fs.readFileSync(xmlFilePath).toString();
    let CRECObj = {};

    parseString(xmlCR, {
        trim: true, 
        attrkey: 'attr',
    }, 
    function (err, result){
        let mods = result.mods;
        CRECObj = mods;
    })

    return CRECObj;
}

//Each subsection (headings separated by horizontal lines) in the CREC is 
    //stored/enclosed in a relatedItems element
//relatedItems --- removed
//relatedObjects --- renamed to relatedItems
let retrieveCRECSubSections = (CRECObj) =>{
    let CRECObjEntries = Object.entries(CRECObj);
    let relatedItems = [];
    
    for(let i = 0; i < CRECObjEntries.length; i++){
        if(CRECObjEntries[i][0] === 'relatedItem'){
            relatedItems = CRECObjEntries[i][1];
            break;
        }
    }
    return relatedItems;
}


//Grabbing the items the daily digest items from the cumulative CREC and
    //storing them in arrays
let parseCRECForDailyDigest = (relatedItems) => {
    let dailyDigestIDs = [];
    let dailyDigestContainers = [];

    for(let j = 0; j < relatedItems.length; j++){
        if(relatedItems[j].attr.ID.includes("PgD") ){
            let includes = false;
            for(let z = 0; z < dailyDigestIDs.length; z++){
                if(relatedItems[j].attr.ID.includes(dailyDigestIDs[z])){
                    includes = true;
                    break;
                }
            }
            if(includes === false){
                dailyDigestIDs.push(relatedItems[j].attr.ID);
                dailyDigestContainers.push(relatedItems[j]);
            }
        }
    }

    if(dailyDigestIDs.length > 0 && dailyDigestContainers.length > 0){
        return [dailyDigestIDs, dailyDigestContainers];
    }
}


//Retrieve the html links for all of the daily digest pages referrenced
let parseDailyDigestForHTMLLinks = (dailyDigestContainers) => {
    let dailyDigestHTMLLinks = [];
    dailyDigestContainers.forEach( dailyDigestAttributeObject => {
        let relatedItemsArray = dailyDigestAttributeObject.relatedItem;
    
        for(let i = 0; i < relatedItemsArray.length; i++){
            if(relatedItemsArray[i].attr.type == "otherFormat"){
                if(relatedItemsArray[i].attr['xlink:href'].includes("html")){
                    dailyDigestHTMLLinks.push(relatedItemsArray[i].attr['xlink:href'])
                }
            }
        }
    })
    return dailyDigestHTMLLinks;
}


let parseCRECForRelatedItemsWithCongVotes = (relatedItems) => {
    let relatedItemsWithCongVotesList = [];
    for(let item = 0; item < relatedItems.length; item++){
        if(relatedItems[item].extension !== undefined){
            if(Object.keys(relatedItems[item].extension[0]).includes("congVote")){
                relatedItemsWithCongVotesList.push(relatedItems[item]);
            }
        }
    }
    return relatedItemsWithCongVotesList;
}

let getObjectArrayIndex = (objectName, arrayName) => {
    return objectName[arrayName].length - 1;
}


let populateVotedMeasuresObjCurried = (relatedItemsEntry) => (votedMeasuresObj) =>{
    
    let rollCallList = [];
    for(let i = 0; i < relatedItemsEntry.identifier.length; i++){
        if(relatedItemsEntry.identifier[i].attr.type == "congressional vote number"){
            rollCallList.push(relatedItemsEntry.identifier[i]["_"]);
        }
    }

    if(votedMeasuresObj.votedMeasures == undefined){
        votedMeasuresObj["votedMeasures"] = [relatedItemsEntry.extension[0]];
    } else {
        votedMeasuresObj.votedMeasures.push(relatedItemsEntry.extension[0]);
    }

    //Add list of associated roll calls to the object
    votedMeasuresObj.votedMeasures[getObjectArrayIndex(votedMeasuresObj, "votedMeasures")]["rollCalls"] = rollCallList;
}


let parseCRECForCongVotes = (relatedItemsRaw) => {
    let hrVotedMeasuresObj = {};
    let senateVotedMeasuresObj = {};

    let relatedItems = parseCRECForRelatedItemsWithCongVotes(relatedItemsRaw);
    
    for(let item = 0; item < relatedItems.length; item++){
        if(relatedItems[item].extension[0].granuleClass[0] == "SENATE"){
            populateVotedMeasuresObjCurried(relatedItems[item])(senateVotedMeasuresObj);
        }else if(relatedItems[item].extension[0].granuleClass[0] == "HOUSE"){
            populateVotedMeasuresObjCurried(relatedItems[item])(hrVotedMeasuresObj);
        }
    }
    

    /* Keep until you've taken out the code for retriving passedBills and failedBills from HOUSE
    for(let item = 0; item < relatedItems.length; item++){
        // if(relatedItems[item].extension[0].searchTitle[0].includes("MOTION TO REFER; Congressional Record Vol. 165, No. 1")){
        //     console.log(relatedItems[item].extension[0])
        // }
        let rollCallList = [];
        for(let i = 0; i < relatedItems[item].identifier.length; i++){
            if(relatedItems[item].identifier[i].attr.type == "congressional vote number"){
                rollCallList.push(relatedItems[item].identifier[i]["_"]);
            }
        }
        
        if(relatedItems[item].extension[0].granuleClass[0] == "SENATE"){
            if(senateVotedMeasuresObj.votedMeasures == undefined){
                senateVotedMeasuresObj["votedMeasures"] = [relatedItems[item].extension[0]]
            } else {
                senateVotedMeasuresObj.votedMeasures.push(relatedItems[item].extension[0]);
            }
            //Add list of associated roll calls to the object
            senateVotedMeasuresObj.votedMeasures[getObjectArrayLength(senateVotedMeasuresObj, "votedMeasures") - 1]["rollCalls"] = rollCallList;

        } else if(relatedItems[item].extension[0].granuleClass[0] == "HOUSE" ) {
            let congVote = relatedItems[item].extension[0].congVote[relatedItems[item].extension[0].congVote.length - 1];
            if(congVote.isBillPassageQuestion !== undefined){
                if(congVote.isBillPassageQuestion[0] == "true"){
                    if(hrVotedMeasuresObj.passedBills == undefined){
                        hrVotedMeasuresObj["passedBills"] = [relatedItems[item].extension[0]]
                    } else {
                        hrVotedMeasuresObj.passedBills.push(relatedItems[item].extension[0]);
                    }
                }
                //Add list of associated roll calls to the object
                hrVotedMeasuresObj.passedBills[getObjectArrayLength(hrVotedMeasuresObj, "passedBills") - 1]["rollCalls"] = rollCallList;
            } else if (congVote.result[0].includes("rejected")){
                if(hrVotedMeasuresObj.failedBills == undefined){
                    hrVotedMeasuresObj["failedBills"] = [relatedItems[item].extension[0]]
                } else {
                    hrVotedMeasuresObj.failedBills.push(relatedItems[item].extension[0]);
                }
                //Add list of associated roll calls to the object
                hrVotedMeasuresObj.failedBills[getObjectArrayLength(hrVotedMeasuresObj, "failedBills") - 1]["rollCalls"] = rollCallList;
            } else {
                if(hrVotedMeasuresObj.votedMeasures == undefined){
                    hrVotedMeasuresObj["votedMeasures"] = [relatedItems[item].extension[0]]
                } else {
                    hrVotedMeasuresObj.votedMeasures.push(relatedItems[item].extension[0]);
                }
                //Add list of associated roll calls to the object
                hrVotedMeasuresObj.votedMeasures[getObjectArrayLength(hrVotedMeasuresObj, "votedMeasures") - 1]["rollCalls"] = rollCallList;
            }
        }
    }
    */

    return {
        senateVotedMeasuresObj : senateVotedMeasuresObj,
        hrVotedMeasuresObj : hrVotedMeasuresObj,
    };
}

module.exports = {
    convertCRECXMLToObject : convertCRECXMLToObject,
    retrieveCRECSubSections : retrieveCRECSubSections,
    parseCRECForDailyDigest : parseCRECForDailyDigest,
    parseDailyDigestForHTMLLinks : parseDailyDigestForHTMLLinks,
    parseCRECForCongVotes : parseCRECForCongVotes,
    fetchCRECXMLFromDate : fetchCRECXMLFromDate,
    parseCRECForRelatedItemsWithCongVotes : parseCRECForRelatedItemsWithCongVotes,
}