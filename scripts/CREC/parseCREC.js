const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {dateify} = require('../dateify');
const {ACCESS_ARRAY} = require('../../constants/constants');

//date format should be a string in yyyy-mm-dd
    //e.g. "2018-12-21"

/**
 * Fetches and writes a Congressional Record (CREC) in xml format retrieved from govinfo.gov.
 * Returns the filepath.
 * @param {string} date Date of the desired CREC. Should be in yyyy-mm-dd format.
 * @returns A path to the file in which the CREC XML was written into.
 */
let fetchAndWriteCRECXMLFromDate = async (date) =>{
    date = dateify(date);
    let filepath = `./test/CREC-${date}.txt`;
    if(!fs.existsSync(filepath)){
        try{
            let res = await fetch(`https://api.govinfo.gov/packages/CREC-${date}/mods?api_key=DEMO_KEY`);
            let text = await res.text();
            fs.writeFileSync(filepath, text, err=>{
                if(err){
                    console.log(err);
                    throw err;
                }
            })
        }catch(err){
            throw err;
        }
    }
    return filepath;
}


//TODO Replace xmlFilePath with the XML string fetched from the govinfo API 
    //for production version.
/**
 * Reads in a filepath to the CREC xml data retrieved from and written in fetchCRECXMLFromDate().
 * Returns the CREC data as an object. Parsing is done with the parseString() function from the 'xml2js' module.
 * @param {string} xmlFilePath Filepath to the CREC xml file.
 * @returns The CREC as an Object.
 */
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


/**
 * Parses the CREC object returned from convertCRECXMLToObject() for 'relatedItem' key-value pairs.
 * Returns a list of them. 
 * Each subsection (headings separated by horizontal lines) in a CREC is stored/enclosed in a 'relatedItem' element
 * @param {Object} CRECObj CREC object returned from convertCRECXMLToObject().
 * @returns A list of relatedItem objects.
 */
let retrieveCRECSubSections = (CRECObj) =>{
    let CRECObjEntries = Object.entries(CRECObj);
    let relatedItems = [];
    
    for(let i = 0; i < CRECObjEntries.length; i++){
        if(CRECObjEntries[i][ACCESS_ARRAY] === 'relatedItem'){
            relatedItems = CRECObjEntries[i][1];
            break;
        }
    }
    return relatedItems;
}



/**
 * Given a list of relatedItem objects from retrieveCRECSubSections(), this function parses them for Daily Digest items, and returns a list of lists.
 * The returning array is length two. Each element is another array.
 * @param {Array} relatedItems List of relatedItem objects returned from retrieveCRECSubSections().
 * @returns The first element (index 0) is a list of the unique daily digest page IDs found in the given CREC. Some digital digest objects may contain duplicate IDs, which mean the information related to it show up on the same page of the Daily Digest as another item. These can be used to search for the daily digest summaries in govinfo.gov. The second element (index 1) is a list of the unique relatedItem objects. (No duplicate ones with the same page IDs).
 */
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
    } else {
        console.log("No Daily Digest IDs found.");
        throw "No Daily Digest IDs found";
    }
}


/**
 *Retrieves the HTML links from all of the daily digest pages referenced in parseCRECForDailyDigest() and returns them in a list.
 * @param {Array} dailyDigestContainers A list of relatedItem objects returned from parseCRECForDailyDigest()[1].
 * @returns List of HTML links to Daily Digest pages.
 */
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


/**
 * Parses a list of relatedItem objects returned from retrieveCRECSubSections() for any relatedItem objects that contains congressional votess (congVote).
 * @param {Array} relatedItems List of relatedItem objects returned from retrieveCRECSubSections().
 * @returns List of relatedItem objects containing congVote objects.
 */
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


/**
 * A function that specifically deals with objects with array values. Returns the last index of an array that is also a value within an object.
 * @param {Object} objectName 
 * @param {string} arrayName Key to the array value.
 * @returns Returns the last index of an array that is also a value within an object.
 */
let getObjectArrayIndex = (objectName, arrayName) => {
    return objectName[arrayName].length - 1;
}


/**
 * A curried function for creating an object containing lists of measures that were voted on in a CREC by the Senate or House of Representatives.
 * @param {Object} relatedItemsEntry An relatedItem object. Also an element of the list of relatedItem's returned from retrieveCRECSubSections().
 */
let populateVotedMeasuresObjCurried = (relatedItemsEntry) => (votedMeasuresObj) =>{
    
    let rollCallList = [];
    for(let i = 0; i < relatedItemsEntry.identifier.length; i++){
        if(relatedItemsEntry.identifier[i].attr.type == "congressional vote number"){
            rollCallList.push(relatedItemsEntry.identifier[i]["_"]);
        }
    }

    if(votedMeasuresObj.votedMeasures == undefined){
        votedMeasuresObj["votedMeasures"] = [relatedItemsEntry.extension[ACCESS_ARRAY]];
    } else {
        votedMeasuresObj.votedMeasures.push(relatedItemsEntry.extension[ACCESS_ARRAY]);
    }

    //Add list of associated roll calls to the object
    votedMeasuresObj.votedMeasures[getObjectArrayIndex(votedMeasuresObj, "votedMeasures")]["rollCalls"] = rollCallList;
}



/**
 * Checks if an object is empty.
 * @param {Object} object 
 * @returns boolean.
 */
let isObjectEmpty = (object) => {
    return Object.keys(object).length === 0 && object.constructor === Object;
}


/**
 * Implants the roll call data of a congVote (located outside of the congVote object) into the congVote object by creating a new key-value pair entry.
 * UNNECESSARY, as congVote objects have an attr entry "number" that includes the number of the rollc all.
 * @param {Array} listOfVotedMeasuresObjects List of 'extension' objects (ie objects that contain 'congVote' objects). 'extension' objects are contained within 'relatedItem' objects.
 */
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

/**
 * Parses a CREC's related items for ones with 'congVote' objects and returns an object with the measures the Senate voted on and ones the House voted on that were recorded in the CREC.
 * A congVote object, if it exists in a relatedItem object, lives two levels deep inside the relatedItem object. In between the two is the 'extension' object. This function returns lists of extension objects.
 * @param {Array} relatedItemsRaw List of relatedItem objects returned from retrieveCRECSubSections().
 * @returns Object returned: { senateVotedMeasuresObj, hrVotedMeasuresObj }.
 */
let parseCRECForCongVotes = (relatedItemsRaw) => {
    let hrVotedMeasuresObj = {};
    let senateVotedMeasuresObj = {};

    let relatedItems = parseCRECForRelatedItemsWithCongVotes(relatedItemsRaw);
    
    for(let item = 0; item < relatedItems.length; item++){
        if(relatedItems[item].extension[ACCESS_ARRAY].granuleClass[ACCESS_ARRAY] == "HOUSE"){
            populateVotedMeasuresObjCurried(relatedItems[item])(hrVotedMeasuresObj);
        }else if(relatedItems[item].extension[0].granuleClass[ACCESS_ARRAY] == "SENATE"){
            populateVotedMeasuresObjCurried(relatedItems[item])(senateVotedMeasuresObj);
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


/**
 * Every CREC contains meta-data about it. This function returns the CREC's volumne and number, its congressional term, and it's session.
 * @param {Object} CRECObj CREC object returned from convertCRECXMLToObject().
 * @returns Object: { CRECVolumeAndNumber, congressionalTermCREC, sessionCREC }
 */
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

    return {
        CRECVolumeAndNumber,
        congressionalTermCREC,
        sessionCREC,
    }
}


/**
 * Returns a list of objects. Each object is a roll call recorded in the CREC.
 * @param {Array} votedMeasuresExtensionElements The object returned from parseCRECForCongVotes()
 * @param {Array} CRECObj A CREC in object form convertCRECXMLToObject().
 * @returns List of objects containing information regarding the different HR roll call votes that occurred in a given CREC.
 */
let getAllHRRollCallsFromCREC = (votedMeasuresExtensionElements, CRECObj) => {
    let {CRECVolumeAndNumber, congressionalTermCREC, sessionCREC} = getDataOfCREC(CRECObj);
    let listOfCRECCongVotes = [];

    votedMeasuresExtensionElements.hrVotedMeasuresObj.votedMeasures.forEach((voteExtensionObj) => {
        let dateOfVote = voteExtensionObj.granuleDate[ACCESS_ARRAY];
        let chamber = voteExtensionObj.chamber[ACCESS_ARRAY];
        let timeOfVote = voteExtensionObj.time[ACCESS_ARRAY].attr;
        voteExtensionObj.congVote.forEach((voteObj) => {
            let rollNumber = voteObj.attr.number;
            // delete voteObj.congMember;
            listOfCRECCongVotes.push({
                CRECVolumeAndNumber,
                congressionalTermCREC,
                sessionCREC,
                chamber,
                dateOfVote,
                timeOfVote,
                rollNumber,
                ...voteObj,
            })
        })
    })
    return listOfCRECCongVotes
}


/**
 * Returns a list of objects. Each object is a roll call recorded in the CREC.
 * @param {Array} votedMeasuresExtensionElements The object returned from parseCRECForCongVotes()
 * @param {Array} CRECObj A CREC in object form convertCRECXMLToObject().
 * @returns List of objects containing information regarding the different HR roll call votes that occurred in a given CREC.
 */
let getAllSenateRollCallsFromCREC = (votedMeasuresExtensionElements, CRECObj) => {
    let {CRECVolumeAndNumber, congressionalTermCREC, sessionCREC} = getDataOfCREC(CRECObj);
    let listOfCRECCongVotes = [];

    votedMeasuresExtensionElements.senateVotedMeasuresObj.votedMeasures.forEach((voteExtensionObj) => {
        let dateOfVote = undefined;
        if(voteExtensionObj.granuleDate[ACCESS_ARRAY] != undefined){
            dateOfVote = voteExtensionObj.granuleDate[ACCESS_ARRAY];
        }
        
        let chamber = undefined;
        if(voteExtensionObj.chamber[ACCESS_ARRAY] != undefined){
            chamber = voteExtensionObj.chamber[ACCESS_ARRAY];
        }

        // let timeOfVote = undefined;
        // if(voteExtensionObj.time[ACCESS_ARRAY].attr != undefined){
        //     timeOfVote = voteExtensionObj.time[ACCESS_ARRAY].attr;
        // }
        
        voteExtensionObj.congVote.forEach((voteObj) => {
            let rollNumber = voteObj.attr.number;
            // delete voteObj.congMember;
            listOfCRECCongVotes.push({
                CRECVolumeAndNumber,
                congressionalTermCREC,
                sessionCREC,
                chamber,
                dateOfVote,
                // timeOfVote,
                rollNumber,
                ...voteObj,
            })
        })
    })
    return listOfCRECCongVotes
}


module.exports = {
    convertCRECXMLToObject : convertCRECXMLToObject,
    retrieveCRECSubSections : retrieveCRECSubSections,
    parseCRECForDailyDigest : parseCRECForDailyDigest,
    parseDailyDigestForHTMLLinks : parseDailyDigestForHTMLLinks,
    parseCRECForCongVotes : parseCRECForCongVotes,
    fetchAndWriteCRECXMLFromDate : fetchAndWriteCRECXMLFromDate,
    parseCRECForRelatedItemsWithCongVotes : parseCRECForRelatedItemsWithCongVotes,
    isObjectEmpty : isObjectEmpty,
    getDataOfCREC, 
    getAllHRRollCallsFromCREC,
    getAllSenateRollCallsFromCREC,
}