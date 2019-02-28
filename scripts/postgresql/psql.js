
/**
 * Populates the roll_call_votes_hr table.
 * @param {*} rollDataClerk Roll Call data object received from getRollCallDataFromHRClerk()
 * @param {*} congVote congVote data object. Is an element in an array outputed from getAllHRRollCallsFromCREC()
 */
const insertIntoTable_roll_call_votes_hr = async (rollDataClerk, congVote) => {
    await postgres("roll_call_votes_hr").insert({
            roll : rollDataClerk.roll,
            congressterm : rollDataClerk.congressTerm,
            session : rollDataClerk.session,
            result : rollDataClerk.voteResult,
            crecofvote : congVote.CRECVolumeAndNumber,
            date : rollDataClerk.voteDate,
            issue : rollDataClerk.legislatureNumber,
            question : rollDataClerk.voteQuestion,
        }
        ).then(res=>{
            console.log("inserted");
        }).catch(err=>{
            if(err.code == '23505'){
                console.log("Duplicate key found: ", err.detail);
            }else{
                console.log(err);
            }
        });
};



/**
 * Upserts a single column and its values.
 * @param {*} tableName 
 * @param {*} columnName 
 * @param {*} columnListFromSQL A list of a single column's {column : value} objects returned from a knex SELECT query
 * @param {*} conflict 
 * @param {*} action 
 */
let upsertQueryRaw = (tableName, columnName, columnListFromSQL, conflict="", action="DO NOTHING" ) =>{
    let valuesList = columnListFromSQL.map((columnObj)=>{
        return "('" + Object.values(columnObj)[0] + "')";
    });
    let valuesString = valuesList.join(",")
    let upsert = `INSERT INTO ${tableName} (${columnName}) VALUES ${valuesString} ON CONFLICT ${conflict} ${action};`;
    return upsert;
}


module.exports = {
    insertIntoTable_roll_call_votes_hr,
    upsertQueryRaw,
}