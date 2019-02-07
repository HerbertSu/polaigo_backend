const flatten = require("../node_modules/arr-flatten");

//parseCRECForHRVotedMeasures is a function that takes in a list of <relatedItems> elements
    //parsed from a CREC (relatedItems) and a list of passed/failed measures parsed from HR's
    //Daily Digest (measuresVotedOnList). It returns a list of the data held in the <extension>
    //element of the <relatedItem> holding the congressional votes for each passed/failed measure.
let parseCRECForHRVotedMeasures = (measuresVotedOnList, relatedItems) =>{
    
    //Retrieve the roll call vote numbers
    let rollCallArray = measuresVotedOnList.map((measureObj) => {
        let number = measureObj.rollCall.replace(/[^\d]+/, '');
        return number;
    })
    rollCallArray = rollCallArray.sort();
    let votesArray = [];

    let measuresVotedOnPagesList = measuresVotedOnList.map((measureObj)=>{
        return flatten(measureObj.pages);
    })

    //Only pick out unique pages numbers
    measuresVotedOnPagesList = [...new Set(flatten(measuresVotedOnPagesList))].sort();

    for(let item = 0; item < relatedItems.length; item++){
        measuresVotedOnPagesList.some((page)=>{
            if(relatedItems[item].attr.ID.includes(page)){
                if(relatedItems[item].extension !== undefined){
                    if(Object.keys(relatedItems[item].extension[0]).includes("congVote")){
                        for(let roll = 0; roll < rollCallArray.length; roll++){
                            if(rollCallArray[roll] === relatedItems[item].extension[0].congVote[0].attr.number){
                                votesArray.push(relatedItems[item].extension[0])
                                break;
                            }
                        }
                    }
                } else {}
            }
        })
    }
    return votesArray;
}

module.exports = {
    parseCRECForHRVotedMeasures : parseCRECForHRVotedMeasures,
}