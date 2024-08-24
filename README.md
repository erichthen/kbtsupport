### This project will entail creating a website for my Mother's tutoring business.  

## TODO ATM  

- **Test the appointment reminder function**
- **Ensure no autofilling for passwords, ESPECIALLY for admin credentials
- **Reset invoice statuses at the end of the month**


**Emailing**

An email will be sent:  
- When admin cancels a day, sent to client if client appointment is on that day
- When a session is 24 hours out, sent to client (with zoom link)  
  to client
- When client wants to reschedule all appointments, sent to admin
- When invoice is sent, sent to client

**You need to find a way to extend session registration once the span of a few months passes**


#### cases to implement and test  


- **Make sure it goes back to options or dash after admin reschedule**
- when registering, times that are already booked need to be unavailable  
- when admin cancel day, test case of multiple parents, and their sessions removed from the db and from the calendar  
- appointment reminder function  
- when client cancels or reschedules, available slots must be updated to accomidate the opening  
- invoice sending (parents invoice goes away for the month when invoice is sent, also resets at beginning of each new month)


### hosting and transitioning
- Once deployed, change instances of your email to mothers
- create her an app password, test thoroughly

