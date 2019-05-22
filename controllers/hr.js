const handleGetRepVoteHistory = async (request, response, postgres, ACCESS_ARRAY) => {
    const {bioguideid} = request.body;

    let isRepresentativeActive = await postgres("representatives_of_hr_active")
        .select("bioguideid")
        .where("bioguideid", bioguideid);
    
    if(isRepresentativeActive.length === 0 || isRepresentativeActive === undefined){
        response.status(404).send({
            "message" : `${bioguideid} is either inactive or contains incorrect syntax.`,
            "controller" : '/getHRRepVoteHistoryActiveFull'
        });
        return;
    };

    let repVoteHistory = await postgres("vote_histories_hr_active")
        .select("votinghistory")
        .where("bioguideid", bioguideid)
        .then(res => {
            return res[ACCESS_ARRAY];
        });

    let voteHistoryObject = Object.values(repVoteHistory)[ACCESS_ARRAY];
    let voteHistoryArray = Object.entries(voteHistoryObject).sort();

    let congressterm_session_roll_Array = [];

    for(let key in voteHistoryObject){
        let entries = key.split("_");
        let congressterm_session_roll = entries.map((element) => parseInt(element));
        
        congressterm_session_roll_Array.push(congressterm_session_roll);
    };

    let selectedRollCallVotes = await postgres("roll_call_votes_hr")
        .select(
            'congressterm',
            'session',
            'roll',
            'result',
            'date',
            'issue',
            'question'
        )
        .whereIn(['congressterm', 'session', 'roll'], congressterm_session_roll_Array)
        .orderByRaw('congressterm::int DESC, session::int DESC, roll::int DESC');

    let representativeVoteObjectArray = selectedRollCallVotes.map((rollCallObj) => {
        rollCallObj.roll = String(parseInt(rollCallObj.roll));

        if(rollCallObj.roll.length == 1){
            rollCallObj.roll = "00"+ rollCallObj.roll;
        }else if(rollCallObj.roll.length == 2){
            rollCallObj.roll = "0"+ rollCallObj.roll;
        }

        let congressterm_session_roll = `${rollCallObj.congressterm}_${rollCallObj.session}_${rollCallObj.roll}`; 

        let match = voteHistoryArray.find((congressterm_session_roll_AND_voted) => congressterm_session_roll_AND_voted[0] == congressterm_session_roll);

        return {
            ...rollCallObj,
            ...match[1]
        };
    });
    response.send(representativeVoteObjectArray);
};

module.exports = {
    handleGetRepVoteHistory : handleGetRepVoteHistory
};