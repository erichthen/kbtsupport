### This project will entail creating a website for my Mother's tutoring business.  

## TODO ATM  

-**Think about implementing a report issue if a user cannot register**  


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
- Test adding a client with an email, and registering with a different email than the one added


### hosting and transitioning
- Once deployed, change instances of your email to mothers
- create her an app password, test thoroughly

