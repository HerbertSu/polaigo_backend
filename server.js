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


parseString(xmlCR, {
        trim: true, 
        attrkey: 'attr',
    }, 
    function (err, result){
        let mods = result.mods;
        let modsKeys = Object.keys(mods);
        let modsValues = Object.values(mods);
        let modsEntries = Object.entries(mods);
        // let relatedItems = modsEntries[15]; // pick out related items
        let relatedItems = [];
        let relatedObjects = [];
        let dailyDigestIDs = [];

        for(let i = 0; i < modsEntries.length; i++){
            if(modsEntries[i][0] === 'relatedItem'){
                relatedItems = modsEntries[i];
                relatedObjects = relatedItems[1];
                break;
            }
        }
        
        if(relatedItems.length > 0){
            console.log("nonzero related items")
            // console.log(relatedObjects)
            for(let j = 0; j < relatedObjects.length; j++){
                // console.log(relatedObjects[j].attr.ID)
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
                    }
                }
            }
        }

        console.log("-------------------------------THE RESULT----------------------------\n",
            dailyDigestIDs)
        
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