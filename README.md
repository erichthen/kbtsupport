### This project will entail creating a website for my Mother's tutoring business.  

## TODO ATM  
- **Cancel a day feature. Make the day unavailable to schedule, and whoever has a session on that day, remove it and send them an email**
- **Set up appointment cancellations and reschedule request and approval**
- **Request to change all of their appointments to a new date and time**
- **If no invoices, display message**
- **Test the appointment reminder function**
- **Redo the styling of the session popup, allow for a new window because it will look bad if lots of sessions

**Emailing**

An email will be sent:  
- When admin cancels a day, sent to client if client appointment is on that day
- When a session is 24 hours out, sent to client (with zoom link)  
  to client
- When client wants to reschedule all appointments, sent to admin
- When invoice is sent, sent to client


#### cases to implement and test  

- when registering, times that are already booked need to be unavailable  
- when admin cancel day, test case of multiple parents, and their sessions removed from the db and from the calendar  
- when user cancels day, note + notifcation -> email to admin. ensure it is removed from the calendar for both amdin and client.  
- appointment reminder function  
- when admin reschedules a session, (ask about this) approval? or automatic schedule change  
- when client cancels or reschedules, available slots must be updated to accomidate the opening  
- invoice sending 
