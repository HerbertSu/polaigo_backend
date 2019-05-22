const handleLogin = async (request, response, postgres, bcrypt) => {
    
    const {username, password} = request.body;

    try{
        const idObj = await postgres('users')
            .first('id')
            .where('username', username)
            

        const hashObj = await postgres('hash')
            .first('hash')
            .where('id', parseInt(idObj.id))

        bcrypt.compare(password, hashObj.hash, (err, result) => {
            if(result){
                response.status(200).send("Welcome!");
            }else{
                response.status(504).send("Incorrect username or password.");
            };
        })
    }catch(error){
        response.status(504).send("Incorrect username or password.");
    };
};

module.exports = {
    handleLogin : handleLogin
};