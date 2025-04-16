# A webapp for KBT Reading Support (A tutoring business)  
---
## Built with node, react, firebase. Handles operations with clients throughout the world
---
### Going through a major redesign arc 
---
### Allows owner to have a platform to...
* **Onboard clients**
* **View schedule on a calendar**
* **Send out emails with files to one or all parents**  
* **Send out and recieve invoices**
* **Cancel and reschedule sessions (one session, all sessions for one parent, all sessions in general)**
* **Join zoom session**
---
### Users, through their dashboard can...
* **Cancel sessions (one or all)**  
* **Reschedule sessions (one or all)**  
* **View their sessions on a calendar**
* **Join zoom session**
* **Email Owner**
* **Recieve and view invoices**
* **Report an issue** 
---
### Features coming soon...  
* **Write session notes (owner) and view session notes (parent)**
* **Assign homework or tasks that parents can access, download, and submit through the platform**
* **Show and keep track of session attendance records**
* **Implement SMS messages for a some of the operations**

**Used nodemailer to automatically compose and send emails when any operation is done, as well as send session reminder emails**

## TODO ATM  
### Redesigns: common header and footer, better color theme, less blockly, more modern looking
- **Make sure pages switch properly**
- **Finish redesigning the admin side (still have to do send a message page)**
- **Once you have finished redesigning admin, make sure everything still works (emails, reminders, invoice sends, canceling and rescheduling)**
- **Redesign the login page**
- **Redesign registration pages**
- **Redesign User side pages**
- **Add session notes feature**
- **Find a way to allow teacher to access pages to grade it**
- **Deploy the site to webpages.charlotte and push to current domain as well**

## test cases

- **Make sure it goes back to options or dash after admin reschedule**
- **Test all cases of page swithces, make sure you are updating the states correctly
- when client cancels or reschedules, available slots must be updated to accomidate the opening, test this by canceling and rescheduling, and then registering and rescheduling (all and one) with another account. Do this in different timezones 
- test the invoice reset without waiting for the first of a new month
- Test adding a client with an email, and registering with a different email than the one added


## test cases post time zone bug fix
- **Registering in another time zone, this case has been passed, but test it more throughly
- **Rescheduling in another time zone, check that the availability is correct, 
- **Rescheduling, check for the time of the new session
- **for every check you do for another time zone, do the same for EST to make sure fixing other time zones didn't mess up EST
- **Check the email messages and make sure they display time in UTC for consistency

---

## notes for me 
**DONT FORGET TO UPDATE WHEN PUSHING TO PRODUCTION OR EDITING ON LOCAL HOST**  

*post prod problems and resolutions*  

**web app**: registering in london for 1:00PM EST: session_time: T13:00:00.000Z
**local host**: registering in london for 1:00PM EST: session_time: 

**problem** 
  : when a user in another time zone registers and clicks a time in EST, it actually registers as that EST time but in their time zone, so then the admin dash sees it is as the selected time in their time zone, converted to EST. Ex. user in london registers for 1:00PM EST, the time gets stored as 13:00 UTC, and admin sees it as 8:00AM when it should be 1:00PM. 

**fix**
  : Setting time in EST explicitly: We use moment.tz to handle the date in EST by setting it directly in 'America/New_York'. No longer using time.toLocaleString(). We then convert this to UTC

**problem**
  : time zone affects the availability of sessions. example: user can now register in london for 1:00PM EST and it is now correctly stored as UTC 18:00. New users in the Eastern Standard time zone can now see this session as unavailable. However, I noticed that when I switch the time zone when registering, it is no longer unavailable. The availability is dependent on the users time zone, when it should rely soley on the UTC stored time for that session

**fix**
  : Generate and check time slots exclusively in EST regardless of the user’s device timezone. I modified generateTimeSlots to use the moment timezone module to explicitly set and display the times in EST. since the times are now all in EST, the availablity and filtering will work regardless of the users time zone. 
And when checking for the slots that are booked in the filterAvailableSlots function, we convert all booked times from UTC to EST, effectively making the comparison from the slots to the prospective slots EST to EST. 
the date object and the toLocaleString method have been removed from these functions

**problem**: when there is a slot booked at 11:40AM EST for example, when I am registering in eastern time, they can see that the slot at 11:40AM is availble. However, when I switch to another time zone, the fitler availble slots funciton converts the booked times to that time zone, meaning I cannot see that 11:40AM is unavailable. Either an incorrect/unbooked slot is unavailbale, or not slot is unavailable at all

fix: in the filter function, I converted the selected date to an EST string. I also converted bookedSlots to an EST string. Because of this consistency, the selected date is used to fetch the slots for that day in est, and the booked slots are converted to EST. This fixes the issue, because the problem was the users time zone was being affected by their time zone. 

**problem**: Could not get header to be at the top of the screen and span the entire viewport width. Also could not get footer at the bottom. 

fix: Removed `justify content: space-between` from the body attribute in admindash.css.  
Set `position: fixed` to the header, as well as `top: 0; left: 0;`.  
Set the width to 100vh; Did the same things with the footer.

**problem**: On my laptop, the main content is in the middle vertically and looks nice. However, on my monitor everything in the main element is towards the top. I need the main content to  
be vertically centered regardless of the size of the display

fix: Made a content wrapper to wrap all of the contents of main. Set its min-height to 100vh (height of display) minus (header height + footer height). This way, 
it stretches out in between the header and the footer. With `justify-content: center;`, `display: flex;`, and `flex-direction: column`, the height is stretched from the header to the footer, 
and the content will be in the middle (vertically & horizontally)


