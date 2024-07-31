import React from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import SignInHandler from './components/SignInHandler';

const App = () => {
    return(
        <Router>
          <Switch>
            <Route path="/finishSignUp" component={SignInHandler} />
            <Route path="/" component={RegistrationForm} />
          </Switch>
        </Router>
    );
};

export default App;