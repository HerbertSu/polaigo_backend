const handleCreateUser = async (request, response, postgres, bcrypt) => {
    const user = request.body;

    await bcrypt.hash(user.password, 0, (err, hash) => {
        postgres.transaction(trx => {
            trx.table("users")
                .returning("id")
                .insert({
                    username : user.username,
                    firstname : user.firstname,
                    lastname : user.lastname,
                    middlename : user.middlename,
                    email : user.email
                })
                .catch(error=> {
                    throw error;
                })
                .then((id) => {
                    return trx("hash")
                        .insert({
                            id : parseInt(id),
                            hash : hash
                        })
                        .catch(error => {
                            throw error;
                        });
                })
            .then(trx.commit)
            .then(()=>{
                response.send("New user has been created.");
            })
            .catch(err => {
                console.log(err);
                trx.rollback;
                response.status(500).send("Could not create new user.")
                throw err;
                
            });
        });
    });
};

module.exports = {
    handleCreateUser
};