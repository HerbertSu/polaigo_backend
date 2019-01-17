const fetch = require('node-fetch');
const express = require('express');
const parseString = require('xml2js').parseString;
const fs = require('fs');
const util = require('util');
const app = express();


// app.get("https://api.govinfo.gov/packages/CREC-2018-12-21/mods?api_key=UPY9jQU6CVq80XXWXWoDZzQ7JTm29GsvdJzACahT", (req, res) => {
//     res.send("hello")
// })

// let date = "2018-12-21"

// fetch(`https://api.govinfo.gov/packages/CREC-${date}/mods?api_key=DEMO_KEY`)
//     .then(res => res.text())
//     .then(fullCR => {
//         // let jsCR = parseString(fullCR, (err, result)=>{
//         //     console.log(result)
//         // })
//         fs.writeFile("./test/CREC-2018-12-21.txt", fullCR, err=>{
//             if(err){
//                 console.log(err)
//             }
//         })
//     })

let xmlCR = fs.readFileSync("./test/CREC-2018-12-21.txt").toString();

//The base result of parsing CREC is an object of size 1 with key "mods".
//Object.keys(result.mods)) returns an array of the unique keys of the keys in the object that is the value to "mods"


async function parseCRECForDailyDigest(relatedItems, relatedObjects, dailyDigestIDs, markedRelatedItems){
    //Grabbing the items the daily digest items from the cumulative CREC and
        //storing them in arrays
    console.log("parse running")

    if(relatedItems.length > 0){
        for(let j = 0; j < relatedObjects.length; j++){
            if(relatedObjects[j].attr.ID.includes("PgD") ){
                let includes = false;
                for(let z = 0; z < dailyDigestIDs.length; z++){
                    if(relatedObjects[j].attr.ID.includes(dailyDigestIDs[z])){
                        includes = true;
                        break;
                    }
                }
                if(includes === false){
                    dailyDigestIDs.push(relatedObjects[j].attr.ID);
                    markedRelatedItems.push(relatedObjects[j]);
                }
            }
        }
    }

    if(dailyDigestIDs.length > 0 && markedRelatedItems.length > 0){
        return [dailyDigestIDs, markedRelatedItems];
    }
}



async function parseDailyDigestForLinks(markedRelatedItems){
    //Retrieving the html links for all of the daily digest pages referrenced
    let dailyDigestHTMLLinks = [];
    markedRelatedItems.forEach( dailyDigestObject => {
        let relatedItemsArray = dailyDigestObject.relatedItem;
        

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


async function fetchDailyDigests(dailyDigestHTMLLinks){
    //Visit each link and see if it contains NEW PUBLIC LAWS, what the HR voted, 
        //what the HR passed, what the HR failed to pass, what the Senate passed,
        //what the Senate failed to pass
    dailyDigestHTMLLinks.forEach((link)=>{
        fetch(link)
            .then(res => res.text())
            .then(dailyDigest => {
                console.log(dailyDigest)
                let urlParameters = link.split("/");
                    let newLawsFileName = "";
                    for(let parameter = 0; parameter < urlParameters.length; parameter++){
                        if(urlParameters[parameter].includes("PgD")){
                            newLawsFileName = urlParameters[parameter];
                        }
                    }
                
                if(dailyDigest.includes("NEW PUBLIC LAWS") 
                    || dailyDigest.includes("House of Representatives")
                    || dailyDigest.includes("Senate")){

                    fs.writeFile(`./test/${newLawsFileName}`, dailyDigest, err=>{
                        if(err){
                            console.log(err) 
                        } 
                    })
                }
            })

    })
}


parseString(xmlCR, {
        trim: true, 
        attrkey: 'attr',
    }, 
    function (err, result){
        console.log("parseString running")
        let mods = result.mods;
        let modsKeys = Object.keys(mods);
        let modsValues = Object.values(mods);
        let modsEntries = Object.entries(mods);
        // let relatedItems = modsEntries[15]; // pick out related items
        let relatedItems = [];
        let relatedObjects = [];
        let markedRelatedItems = [];
        let dailyDigestIDs = [];
        let dailyDigestHTMLLinks = [];
        

        for(let i = 0; i < modsEntries.length; i++){
            if(modsEntries[i][0] === 'relatedItem'){
                relatedItems = modsEntries[i];
                relatedObjects = relatedItems[1];
                break;
            }
        }
        
        //-----------------------Uncomment to fetch daily digests---------------
        // parseCRECForDailyDigest(relatedItems, relatedObjects, dailyDigestIDs, markedRelatedItems)
        //     .then(res=>{
        //         dailyDigestIDs = res[0];
        //         markedRelatedItems = res[1];
        //         return;
        //     })        

        // parseDailyDigestForLinks(markedRelatedItems)
        //     .then(res=>{
        //         dailyDigestHTMLLinks = res;
        //         fetchDailyDigests(dailyDigestHTMLLinks);
        //     });
        
        // let newLawsDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1317.htm").toString();
        // let senateDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1313.htm").toString();
        let hrDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1314.htm").toString();
        // console.log(hrDailyDigest)
        let hrDailyDigestItems = hrDailyDigest.split('\n');
        console.log(hrDailyDigestItems)

        
        

        // console.log("-------------------------------THE RESULT----------------------------\n",
        //     "digestIDs ",dailyDigestIDs,
        //     "\nrelatedItems objects", markedRelatedItems)
        
        // console.log("-------------------------------THE RESULT----------------------------\n",
        // // relatedItems[1][2].attr
        // // relatedItems[1].length
        // relatedItems
        // );
        
        ////-----------Uncomment to get the congVote of the Lincoln room item ---------------------------------
        // let lincolnSpeech = 0;
        // let lincolnVote = 0;
        // //TODO Find a way to identify the vote records. Example of relatedItem that includes the votes is
        //     //relatedItems[1][68] for 12/21/2018 CREC
        // for( let i = 0; i < relatedItems[1].length; i++){
        //     if(String(relatedItems[1][i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10514-2"){
        //         console.log("Found speech");
        //         lincolnSpeech = i;
        //     }else if(String(relatedItems[1][i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10532"){
        //         console.log("Found vote");
        //         lincolnVote = i;
        //         break;
        //     }
        //     //find out how each item/title in the pdf is sectioned off
        //     // console.log(`${i}, ${util.inspect(relatedItems[1][i],false, null)}`)
        // }

        // console.log("-------------------------------THE RESULT----------------------------\n",
        //     relatedItems[1][lincolnVote])
        ////---------------------------------------------------------------------------------------------------
        

    // console.dir(Object.keys(result.mods))
    // console.log(Object.values(result.mods)[15])
    // console.log(util.inspect(Object.values(result.mods)[15][4], false, null))
})

// var xml = "<root>Hello xml2js!</root>"
// parseString(xml, function (err, result) {
//     console.dir(result);
// });

app.listen(3000);