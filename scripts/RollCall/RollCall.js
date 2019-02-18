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
        console.log(result)
    })

}

let rollCallObj = convertRollCallXMLToObject("./test/ROLL-2019-003.txt");
