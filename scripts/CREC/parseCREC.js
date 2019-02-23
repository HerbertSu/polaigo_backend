const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {ACCESS_ARRAY} = require('../../constants/constants');

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

let isObjectEmpty = (object) => {
    return Object.keys(object).length === 0 && object.constructor === Object;
}

let matchRollCallsWithCongVotes = (listOfVotedMeasuresObjects) => {
    if(listOfVotedMeasuresObjects.length > 0){
        listOfVotedMeasuresObjects.forEach( extensionObj => {
            if(!isObjectEmpty(extensionObj)){
                for(let i = 0; i < extensionObj.congVote.length; i++){
                    extensionObj.congVote[i].rollCall = extensionObj.rollCalls[i];
                }
                delete extensionObj.rollCalls;
            }
        })
    }
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

    if(!isObjectEmpty(senateVotedMeasuresObj)){
        matchRollCallsWithCongVotes(senateVotedMeasuresObj.votedMeasures)
    }

    if(!isObjectEmpty(hrVotedMeasuresObj)){
        matchRollCallsWithCongVotes(hrVotedMeasuresObj.votedMeasures)
    }

    return {
        senateVotedMeasuresObj : senateVotedMeasuresObj,
        hrVotedMeasuresObj : hrVotedMeasuresObj,
    };
};

let getDataOfCREC = (CRECObj) => {
    let CRECVolumeAndNumber = CRECObj.titleInfo[ACCESS_ARRAY].partNumber[ACCESS_ARRAY];
    let congressionalTermCREC = "";
    let sessionCREC = "";

    for(let i = 0; i < CRECObj.extension.length; i++){
        let obj = CRECObj.extension[i];
        if(obj.congress != undefined){
            congressionalTermCREC = obj.congress[ACCESS_ARRAY];
            sessionCREC = obj.session[ACCESS_ARRAY];
            break;
        }
    }

    console.log(sessionCREC);
}

module.exports = {
    convertCRECXMLToObject : convertCRECXMLToObject,
    retrieveCRECSubSections : retrieveCRECSubSections,
    parseCRECForDailyDigest : parseCRECForDailyDigest,
    parseDailyDigestForHTMLLinks : parseDailyDigestForHTMLLinks,
    parseCRECForCongVotes : parseCRECForCongVotes,
    fetchCRECXMLFromDate : fetchCRECXMLFromDate,
    parseCRECForRelatedItemsWithCongVotes : parseCRECForRelatedItemsWithCongVotes,
    isObjectEmpty : isObjectEmpty,
    getDataOfCREC, 
}