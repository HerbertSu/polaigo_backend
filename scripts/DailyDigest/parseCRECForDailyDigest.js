async function parseCRECForDailyDigest(relatedItems, relatedObjects, dailyDigestIDs, markedRelatedItems){
    //Grabbing the items the daily digest items from the cumulative CREC and
        //storing them in arrays
    // console.log("parse running")

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

module.exports = {
    parseCRECForDailyDigest : parseCRECForDailyDigest
}
