## Tutor App  
**KBT Reading Support is requesting your help designing a platform that would:**  

>- Allow parents to register their child for a session (30 minutes) on the weekends of the month. 
>- When the parent registers, they will schedule their sessions for the month. (session each weekned) 
>- Allow admin to: 
   >- view invoice status for each parents
   >- cancel or reschedule an appointment, and an email will be sent to the parents notifying them of this
   >- send them session notes for the month
   >- At the end of the month, admin will be able to:
   >   - Upload an invoice doc, convert to pdf, send invoice, and send monthly notes. isInvoice field of parent set to true
   >   - have the option to upload a receipt and send via email, only some parents want this. Instead of it being a bool field for parents, 
   >     admin will just be asked whens sending the invoice and notes.
>- Allow clients to view booked appointment time when scheduling their childs sessions for the month
>- Each new month, parents will schedule the sessions for the new month. Only weekends still holds
>- The program will allow my mom to upload an invoice, convert it to a pdf, and send to a parent. Then, isInvoice will be true. isInvoice is false on registration.
>- Allow her to see what invoices she has to do, this will be a boolean for each parent, isInvoice.
>- Allow a minimum of 10 minutes between sessions
>- Send the parents a reminder and link (Zoom) for their session and the invite should be in the parents” time zone as well as EST
### This project will entail creating a website for my Mother's tutoring business.  
### Project Structure  
```
/project-root
├── /public
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── /src
│   ├── /components
│   │   ├── AdminDashboard.js
│   │   ├── UserDashboard.js
│   │   ├── RegistrationForm.js
│   │   ├── LoginForm.js
│   │   ├── ScheduleForm.js
│   │   └── SessionList.js
│   ├── /services
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   └── zoom.js
│   ├── App.js
│   ├── index.js
│   └── firebaseConfig.js
├── /functions
│   ├── index.js
│   ├── sendReminder.js
│   └── generateZoomLink.js
├── .firebaserc
├── firebase.json
├── firestore.rules
├── package.json
└── README.md
```

### Detailed Plan

#### 1. Project Setup

1. **Initialize Firebase Project**:
   - Go to the Firebase Console and create a new project.
   - Initialize Firebase in your project directory using `firebase init`.

2. **Install Dependencies**:
   - Install Firebase SDK.
   - Install additional libraries such as `react-router-dom`, `moment`, and `axios`.

#### 2. User Registration and Authentication

1. **Set up Firebase Authentication**:
   - In the Firebase Console, enable Email/Password authentication.

2. **Create Authentication Service**:
   - Set up a service to handle user registration, login, logout, and authentication state changes.

3. **Create Registration and Login Forms**:
   - Design forms for user registration and login.
   - Implement form validation and user feedback.

#### 3. Parent and Child Registration

1. **Set up Firestore**:
   - Enable Firestore in the Firebase Console.
   - Define Firestore rules for data security.

2. **Create Firestore Service**:
   - Set up a service to handle adding and retrieving data from Firestore for parents and children.

3. **Create Registration Forms**:
   - Extend the registration forms to handle parent and child data.
   - Implement form validation and user feedback.

#### 4. Session Scheduling

1. **Create Scheduling Logic**:
   - Set up a collection for sessions in Firestore.
   - Implement logic to ensure a minimum of 10 minutes between sessions.

2. **Firestore Service for Sessions**:
   - Set up a service to handle adding and retrieving session data from Firestore.

#### 5. Reminder and Zoom Link Generation

1. **Set up Cloud Functions**:
   - Initialize Cloud Functions in your Firebase project.
   - Install necessary dependencies for Cloud Functions.

2. **Create Cloud Function for Zoom Link Generation**:
   - Implement a Cloud Function to generate Zoom links via the Zoom API when a session is created.

3. **Create Cloud Function for Sending Reminders**:
   - Implement a Cloud Function to send email reminders to parents before their scheduled sessions.

#### 6. Session Tracking and Invoicing

1. **Log Sessions in Firestore**:
   - Ensure each session is logged in the sessions collection in Firestore.

2. **Create Admin Dashboard**:
   - Design and implement a dashboard for the admin to view session logs and generate invoices.

#### 7. Front-End Development

1. **Set up Front-End Framework**:
   - Set up a front-end framework such as React.
   - Configure the project to use the necessary libraries and tools.

2. **Build and Style Components**:
   - Build and style UI components for the application.
   - Ensure the application is responsive and accessible.

3. **Connect Front-End to Back-End APIs**:
   - Integrate the front-end with back-end services and APIs.

#### 8. Testing and Deployment

1. **Testing**:
   - Write tests for various components and endpoints.
   - Ensure everything works as expected through thorough testing.

2. **Deployment**:
   - Deploy the back-end on chosen platforms (e.g., Firebase Hosting, Heroku).
   - Deploy the front-end on chosen platforms if separated.
   - Configure environment variables and ensure smooth operation.