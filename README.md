### This project will entail creating a website for my Mother's tutoring business.  

## TODO ATM  

- **Set up appointment cancellations and reschedule request and approval**
- **Request to change all of their appointments to a new date and time**
- **Test the appointment reminder function**
- **Ensure no autofilling for passwords, ESPECIALLY for admin credentials
- **Reset invoice statuses at the end of the month**


TODO ASAP
- Finish implementing the rescheudling for both admin and client
- Allow admin to cancel a specific session
- Allow admin to reschdule a specifc session


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
