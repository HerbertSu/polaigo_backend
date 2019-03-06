const {ACCESS_ARRAY} =  require('../../constants/constants');
/**
 * Populates the roll_call_votes_hr table.
 * @param {*} rollDataClerk Roll Call data object received from getRollCallDataFromHRClerk()
 * @param {*} congVote congVote data object. Is an element in an array outputed from getAllHRRollCallsFromCREC()
 */
const insertIntoTable_roll_call_votes_hr = async (rollDataClerk, congVote, postgres) => {
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
            console.log("Inserted");
        }).catch(err=>{
            if(err.code == '23505'){
                console.log("Duplicate key found: ", err.detail);
            }else{
                console.log(err)
                throw `Could not insert ${congressterm}, ${session}, ${roll} into roll_call_votes_hr.`;
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


/**
 * Fetch a representative's information from representatives_of_hr_active.
 * @param {string} state The two-letter acronym for a state.
 * @param {string} district A district number.
 * @param {*} postgres 
 */
const fetchRepresentativeGivenDistrict = async (state, district, postgres) => {
    if(String(district).length < 2){
        district = '0' + district;
    };
    const representative = await postgres("representatives_of_hr_active")
        .select('bioguideid', 'firstname', 'lastname', 'state', 'party')
        .where({
            state : state,
            district : district
        })
        .catch(err => {
            console.log("Could not fetch representative from representatives_of_hr_active.");
            throw err;
        })
    return representative[ACCESS_ARRAY];
}


module.exports = {
    insertIntoTable_roll_call_votes_hr,
    upsertQueryRaw,
    fetchRepresentativeGivenDistrict,
}