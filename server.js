const express = require('express');
const app = express();
const CREC = require("./scripts/CREC/CREC");
const DailyDigest = require("./scripts/DailyDigest/DailyDigest");


// console.log("-------------------------------THE RESULT----------------------------\n",
// CREC.relatedItems[0]
// // relatedItems[1].length
// );

//TODO: Find the indices of relatedItems that pertain to the pages returned in passedMeasureList and
    //failedMeasureList
    /*
        DailyDigest.passedMeasureList is a list of objects with 
            {
                rollCall: String,
                billDescription: String,
                pages: [ [Array], [Array] ]
            }

        Possible tags to match for <identifier> type = "congressional vote number", check content if
            includes rollCall. If so, grab the accompanying <extension> object
    */

let relatedItems = CREC.relatedItems;
for(let item = 0; item < relatedItems.length; item++){
    if(relatedItems[item].attr.ID.includes("H10532")){
        if(relatedItems[item].extension !== undefined){
            if(Object.keys(relatedItems[item].extension[0]).includes("congVote")){
                console.log(relatedItems[item].extension[0]);
                break
            }
        } else {
            
        }
    }
}


// console.log(DailyDigest.passedMeasureList)

// //-----------Uncomment to get the congVote of the Lincoln room item ---------------------------------
// let lincolnSpeech = 0;
// let lincolnVote = 0;
// //TODO Find a way to identify the vote records. Example of relatedItem that includes the votes is
//     //relatedItems[1][68] for 12/21/2018 CREC
// for( let i = 0; i < relatedItems.length; i++){
//     if(String(relatedItems[i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10514-2"){
//         console.log("Found speech");
//         lincolnSpeech = i;
//     }else if(String(relatedItems[i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10532"){
//         console.log("Found vote");
//         lincolnVote = i;
//         break;
//     }
//     //find out how each item/title in the pdf is sectioned off
//     // console.log(`${i}, ${util.inspect(relatedItems[1][i],false, null)}`)
// }

// console.log("-------------------------------THE RESULT----------------------------\n",
//     relatedItems[lincolnVote].extension[0].congVote[0])
////---------------------------------------------------------------------------------------------------


// console.dir(Object.keys(result.mods))
// console.log(Object.values(result.mods)[15])
// console.log(util.inspect(Object.values(result.mods)[15][4], false, null))



// var xml = "<root>Hello xml2js!</root>"
// parseString(xml, function (err, result) {
//     console.dir(result);
// });

app.listen(3000);