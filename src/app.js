import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/authContext';
import SignIn from './components/SignIn';
import RegistrationForm from './components/RegistrationForm';
import DashBoard from './components/DashBoard';
import AdminDashboard from './components/AdminDashboard';
import ReportIssue from './components/ReportIssue';
import Contact from './components/Contact';
import About from './components/About';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) =>
        user ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

const AdminRoute = ({ component: Component, ...rest }) => {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) =>
        user && user.email === 'kelli.b.then@gmail.com' ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path="/login" component={SignIn} />
          <Route path="/register" component={RegistrationForm} />
          <Route path="/report-an-issue" component={ReportIssue} />
          <PrivateRoute path="/dashboard" component={DashBoard} />
          <AdminRoute exact path="/admin" component={AdminDashboard} />
          <Route path="/contact-us" component={Contact} />
          <Route path="/about-us" component={About} />
          <Route exact path="/" render={() => <Redirect to="/login" />} />
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;