const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {ACCESS_ARRAY} = require('../../constants/constants');

let fetchAndWriteRollCall = async (year, roll) => {
    let rollString = String(roll);
    if(rollString.length < 3){
        roll = rollString.padStart(3, "0");
    }
    let hrClerkRollCallXMLFileName = `./test/ROLL-${year}-${roll}.txt`;
    if(!fs.existsSync(hrClerkRollCallXMLFileName)){
        try{
            let response = await fetch(`http://clerk.house.gov/evs/${year}/roll${roll}.xml`);
            let xml = undefined;
            if(response.status == 404){
                throw 404;
            }else{
                xml = await response.text();
            }
            fs.writeFileSync(hrClerkRollCallXMLFileName, xml, err=>{
                if(err){
                    throw (err);
                }
            })
        }catch(err){
            console.log(err);
        }
    }
    return hrClerkRollCallXMLFileName;
}



let convertRollCallXMLToObject = (xmlFilepath) => {
    let xmlRollCall = fs.readFileSync(xmlFilepath).toString();
    let rollCallObj = {};

    parseString(xmlRollCall, {
        trim: true, 
        attrkey: 'attr',
    }, 
    function (err, result){
        rollCallObj = result["rollcall-vote"];
    })
    return rollCallObj;
}
    
let getRollCallDataFromHRClerk = (xmlFilePath) => {
    let rollCallObj = convertRollCallXMLToObject(xmlFilePath);
    let voteMetaData = rollCallObj["vote-metadata"];
    let voteData = rollCallObj["vote-data"][ACCESS_ARRAY]["recorded-vote"];

    let congressTerm = voteMetaData[ACCESS_ARRAY].congress[ACCESS_ARRAY];
    let session = parseInt(voteMetaData[ACCESS_ARRAY].session[ACCESS_ARRAY]);
    let chamber = voteMetaData[ACCESS_ARRAY].chamber[ACCESS_ARRAY];
    let roll = voteMetaData[ACCESS_ARRAY]["rollcall-num"][ACCESS_ARRAY];
    
    let legislatureNumber = "";
    let voteQuestion = "";
    let voteResult = "";
    let voteDate = "";
    let voteTime = "";
    let voteDescription = "";

    if(voteMetaData[ACCESS_ARRAY]["legis-num"] != undefined){
        legislatureNumber = voteMetaData[ACCESS_ARRAY]["legis-num"][ACCESS_ARRAY];
    }
    if(voteMetaData[ACCESS_ARRAY]["vote-question"] != undefined){
        voteQuestion = voteMetaData[ACCESS_ARRAY]["vote-question"][ACCESS_ARRAY];
    }
    if(voteMetaData[ACCESS_ARRAY]["vote-result"] != undefined){
        voteResult = voteMetaData[ACCESS_ARRAY]["vote-result"][ACCESS_ARRAY];
    }
    if(voteMetaData[ACCESS_ARRAY]["action-date"] != undefined){
        voteDate = voteMetaData[ACCESS_ARRAY]["action-date"][ACCESS_ARRAY];
    }
    if(voteMetaData[ACCESS_ARRAY]["action-time"] != undefined){
        voteTime = voteMetaData[ACCESS_ARRAY]["action-time"][ACCESS_ARRAY].attr['time-etz'];
    }
    if(voteMetaData[ACCESS_ARRAY]["vote-desc"] != undefined){
        voteDescription = voteMetaData[ACCESS_ARRAY]["vote-desc"][ACCESS_ARRAY];
    }


    let representativesVotesList = voteData.map((legislatorVoteObj) => {
        let bioguideid = legislatorVoteObj.legislator[ACCESS_ARRAY].attr["name-id"];
        let vote = legislatorVoteObj.vote[ACCESS_ARRAY];
        return {
            bioguideid,
            vote
        }
    })

    return {
        congressTerm,
        session,
        chamber,
        roll,
        legislatureNumber,
        voteQuestion,
        voteResult,
        voteDate,
        voteTime,
        voteDescription,
        representativesVotesList,
    
    };
}


module.exports = {
    fetchAndWriteRollCall : fetchAndWriteRollCall,
    convertRollCallXMLToObject : convertRollCallXMLToObject,
    getRollCallDataFromHRClerk,
}