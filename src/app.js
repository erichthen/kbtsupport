import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SignIn from './components/SignIn.jsx';
import RegistrationForm from './components/RegistrationForm.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import DashBoard from './components/DashBoard.jsx'; 
import Invoices from './components/Invoices';
import CancelSession from './components/CancelSession.jsx';
import { AuthProvider } from './context/authContext.js';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path="/login" component={SignIn} />
          <Route path="/register" component={RegistrationForm} />
          <Route exact path="/dashboard/cancel-session" component={CancelSession} />
          <Route path="/dashboard" component={DashBoard} />
          <Route exact path="/admin/invoices" component={Invoices} />
          <Route exact path="/admin" component={AdminDashboard} />
          <Route path="/" component={SignIn} exact /> {/* Redirect root to login */}
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;