const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;

let year = 2019;
let rollCall = "003";

let fetchAndWriteRollCall = (year, rollCallNumber) => {
    fetch(`http://clerk.house.gov/evs/${year}/roll${rollCallNumber}.xml`)
        .then(xml => xml.text())
        .then(data => {
            let rollCallXMLFileName = `./test/ROLL-${year}-${rollCallNumber}.txt`;
            fs.writeFile(rollCallXMLFileName, data, err=>{
                if(err){
                    console.log(err)
                }
            })
        })
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
    
let rollCallObj = convertRollCallXMLToObject("./test/ROLL-2019-003.txt");

module.exports = {
    fetchAndWriteRollCall : fetchAndWriteRollCall,
    convertRollCallXMLToObject : convertRollCallXMLToObject,
}