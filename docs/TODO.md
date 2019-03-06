# Open  
  * Use Google's geolocating api to allow users to find their congressional district with a button click instead of adding an address. [Posted 3/1/2019].
  * Remove API key for Google Civic Info API and use a service account's instead. [Posted 3/1/2019].
  * Set API keys to environment variables. [Posted 3/1/2019].
  * The current form of updateVoteHistoriesActiveBioGuideIds() only ignores duplicates and adds any bioguideid's that aren't currently in the table. Need to add logic that removes old bioguideid's and move their data into vote_histories_hr_inactive if the 'date_of_last_hr_members_update' table's 'date' value is later than the representative's 'dateoflastupdate' column value in the 'representatives_of_hr_active' table. [Posted 3/6/2019].
  


# CLOSED
  * For a given user-provided address (guest), match them with their congressmen from the psql table. [Posted 3/1/2019] [Closed 3/5/2019].
  * Add function descriptions /** to all functions. [Posted 3/5/2019] [Closed 3/6/2010].