const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {ACCESS_ARRAY} = require('../../constants/constants');

let fetchAndWriteRollCall = (year, roll) => {
    let rollString = String(roll);
    if(rollString.length < 3){
        roll = rollString.padStart(3, "0");
    }

    let hrClerkRollCallXMLFileName = `./test/ROLL-${year}-${roll}.txt`;
    if(!fs.existsSync(hrClerkRollCallXMLFileName)){
        fetch(`http://clerk.house.gov/evs/${year}/roll${roll}.xml`)
            .then(res => {
                if(res.status == 404){
                    throw 404;
                } else {
                    return res.text()
                }
            })
            .then(xml => {
                fs.writeFile(hrClerkRollCallXMLFileName, xml, err=>{
                    if(err){
                        console.log(err)
                    }
                })
            })
            .catch(err => {
                console.log(err)
            })
    }
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


/*
items of interest:
    vote-metadata
        congress
        session
        chamber     ?
        rollcall-num
        legis-num           (bill/resolution number)
        vote-question
        vote-result
        action-date
        action-time.attr.etz
        vote-desc   ?
    vote-data
        recorded-vote
            legislator.attr.name-id
            legislator.attr.state
            legislator value (last name of rep)
            vote value (Yea or Nay)


*/
    
let getRollCallDataFromHRClerk = () => {
    let rollCallObj = convertRollCallXMLToObject("./test/ROLL-2019-003.txt");
    let voteMetaData = rollCallObj["vote-metadata"];
    let voteData = rollCallObj["vote-data"][ACCESS_ARRAY]["recorded-vote"];

    let congressTerm = voteMetaData[ACCESS_ARRAY].congress[ACCESS_ARRAY];
    let session = voteMetaData[ACCESS_ARRAY].session[ACCESS_ARRAY];
    let chamber = voteMetaData[ACCESS_ARRAY].chamber[ACCESS_ARRAY];
    let roll = voteMetaData[ACCESS_ARRAY]["rollcall-num"][ACCESS_ARRAY];
    let legislatureNumber = voteMetaData[ACCESS_ARRAY]["legis-num"][ACCESS_ARRAY];
    let voteQuestion = voteMetaData[ACCESS_ARRAY]["vote-question"][ACCESS_ARRAY];
    let voteResult = voteMetaData[ACCESS_ARRAY]["vote-result"][ACCESS_ARRAY];
    let voteDate = voteMetaData[ACCESS_ARRAY]["action-date"][ACCESS_ARRAY];
    let voteTime = voteMetaData[ACCESS_ARRAY]["action-time"][ACCESS_ARRAY].attr['time-etz'];
    let voteDescription = voteMetaData[ACCESS_ARRAY]["vote-desc"][ACCESS_ARRAY];

    let representativesVotesList = voteData.map((legislatorVoteObj) => {
        let bioguideid = legislatorVoteObj.legislator[ACCESS_ARRAY].attr["name-id"];
        let vote = legislatorVoteObj.vote[ACCESS_ARRAY];
        return {
            bioguideid,
            vote
        }
    })
    console.log(representativesVotesList)
}

getRollCallDataFromHRClerk()


module.exports = {
    fetchAndWriteRollCall : fetchAndWriteRollCall,
    convertRollCallXMLToObject : convertRollCallXMLToObject,
}