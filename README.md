### This is a website for my mothers tutoring business built with node, react, firebase  
[link](https://kbt-reading-support.web.app)  
## TODO ATM  

- **change the link sent by registration email back to web app from local host**
- **implement cloud function to remove a parent and all of their sessions without using firebase console or site UI**
- **change margin on back button in day click admin dash**
- **change main container margin for phone displays when registering and the user dash**



## test cases

- **Make sure it goes back to options or dash after admin reschedule**
- when client cancels or reschedules, available slots must be updated to accomidate the opening, test this by canceling and rescheduling, and then checking with another account registration and reschedule 
- test the invoice reset without waiting for the first of a new month
- Test adding a client with an email, and registering with a different email than the one added


## test cases post time zone bug fix
- **Registering in another time zone, this case has been passed, but test it more throughly
- **Rescheduling in another time zone, check that the availability is correct, 
- **Rescheduling, check for the time of the new session
- **for every check you do for another time zone, do the same for EST to make sure fixing other time zones didn't mess up EST
- **Check the email messages and make sure they display time in UTC for consistency




*notes for me*  
**DONT FORGET TO UPDATE WHEN PUSHING TO PRODUCTION OR EDITING ON LOCAL HOST**
*post prod problems and resolutions*
web app: registering in london for 1:00PM EST: session_time: T13:00:00.000Z
local host: registering in london for 1:00PM EST: session_time: 

problem: when a user in another time zone registers and clicks a time in EST, it actually registers as that EST time but in their time zone, so then the admin dash sees it is as the selected time in their time zone, converted to EST. Ex. user in london registers for 1:00PM EST, the time gets stored as 13:00 UTC, and admin sees it as 8:00AM when it should be 1:00PM. 

fix: Setting time in EST explicitly: We use moment.tz to handle the date in EST by setting it directly in 'America/New_York'. No longer using time.toLocaleString(). We then convert this to UTC

problem: time zone affects the availability of sessions. example: user can now register in london for 1:00PM EST and it is now correctly stored as UTC 18:00. New users in the Eastern Standard time zone can now see this session as unavailable. However, I noticed that when I switch the time zone when registering, it is no longer unavailable. The availability is dependent on the users time zone, when it should rely soley on the UTC stored time for that session

fix: Generate and check time slots exclusively in EST regardless of the user’s device timezone. I modified generateTimeSlots to use the moment timezone module to explicitly set and display the times in EST. since the times are now all in EST, the availablity and filtering will work regardless of the users time zone. 
And when checking for the slots that are booked in the filterAvailableSlots function, we convert all booked times from UTC to EST, effectively making the comparison from the slots to the prospective slots EST to EST. 
the date object and the toLocaleString method have been removed from these functions


problem: when there is a slot booked at 11:40AM EST for example, when I am registering in eastern time, they can see that the slot at 11:40AM is availble. However, when I switch to another time zone, the fitler availble slots funciton converts the booked times to that time zone, meaning I cannot see that 11:40AM is unavailable. Either an incorrect/unbooked slot is unavailbale, or not slot is unavailable at all

fix: in the filter function, I converted the selected date to an EST string. I also converted bookedSlots to an EST string. Because of this consistency, the selected date is used to fetch the slots for that day in est, and the booked slots are converted to EST. This fixes the issue, because the problem was the users time zone was being affected by their time zone. 