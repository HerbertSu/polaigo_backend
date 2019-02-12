const fs = require('fs');
const parseString = require('xml2js').parseString;

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


let parseCRECForCongVotes = (relatedItems) => {
    let hrVotedMeasuresObj = {};
    let senateVotedMeasuresObj = {};

    for(let item = 0; item < relatedItems.length; item++){
        if(relatedItems[item].extension !== undefined){
            if(Object.keys(relatedItems[item].extension[0]).includes("congVote")){
                if(relatedItems[item].extension[0].granuleClass[0] == "SENATE"){
                    if(senateVotedMeasuresObj.votedMeasures == undefined){
                        senateVotedMeasuresObj["votedMeasures"] = [relatedItems[item].extension[0]]
                    } else {
                        senateVotedMeasuresObj.votedMeasures.push(relatedItems[item].extension[0]);
                    }
                } else if(relatedItems[item].extension[0].granuleClass[0] == "HOUSE" ) {
                    let congVote = relatedItems[item].extension[0].congVote[0];
                    if(congVote.isBillPassageQuestion !== undefined){
                        if(congVote.isBillPassageQuestion[0] == "true"){
                            if(hrVotedMeasuresObj.passedBills == undefined){
                                hrVotedMeasuresObj["passedBills"] = [relatedItems[item].extension[0]]
                            } else {
                                hrVotedMeasuresObj.passedBills.push(relatedItems[item].extension[0]);
                            }
                        } 
                    } else if (congVote.result[0].includes("rejected")){
                        if(hrVotedMeasuresObj.failedBills == undefined){
                            hrVotedMeasuresObj["failedBills"] = [relatedItems[item].extension[0]]
                        } else {
                            hrVotedMeasuresObj.failedBills.push(relatedItems[item].extension[0]);
                        }
                    } else {
                        if(hrVotedMeasuresObj.votedMeasures == undefined){
                            hrVotedMeasuresObj["votedMeasures"] = [relatedItems[item].extension[0]]
                        } else {
                            hrVotedMeasuresObj.votedMeasures.push(relatedItems[item].extension[0]);
                        }
                    }
                }
                //if congVote.result tag includes rejected, then put in failedMeasures, else put into resolutionsList
            }
        } else {}
    }

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
}