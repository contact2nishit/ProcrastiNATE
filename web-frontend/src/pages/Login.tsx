import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const backendURL = config.backendURL;
  const navigate = useNavigate();

  const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!backendURL) {
        alert('Backend URL not set.');
        return;
      }
      const formBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });
      if (!response.ok) {
        const err = await response.text();
        alert('Login failed: ' + err);
        return;
      }
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      navigate('/requiresCurrentSchedule/Home');
    } catch (e) {
      alert('Login error: ' + e);
    }
  };

  const handleSignup = () => {
    navigate('/Signup');
  };

  // Google login handler (simplified for web)
  const handleGoogleLogin = async () => {
    try {
      if (!backendURL) {
        alert('Backend URL not set.');
        return;
      }
      const resp = await fetch(`${backendURL}/login/google`);
      if (!resp.ok) {
        alert('Failed to get Google login URL');
        return;
      }
      const data = await resp.json();
      const googleAuthUrl = data.redirect_url;
      window.location.href = googleAuthUrl;
    } catch (e) {
      alert('Google login error: ' + e);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.welcomeText}>Welcome to ProcrastiNATE!</h1>
      <form style={styles.loginBox} onSubmit={handleSubmit}>
        <div style={styles.inputContainer}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div style={styles.inputContainer}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" style={styles.loginButton}>Sign In</button>
        <button type="button" onClick={handleGoogleLogin} style={styles.googleButton}>
          Sign In with Google
        </button>
        <div style={styles.noAccount}>
          Don't have an account?{' '}
          <span style={styles.signupButtonText} onClick={handleSignup}>Sign Up</span>
        </div>
      </form>
    </div>
  );
};

const styles = { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 30,
    textAlign: 'center',
    fontWeight: '900', // Use string for fontWeight
    color: 'white',
    marginBottom: 40,
  },
  loginBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center', // This is fine with flex
    marginBottom: 10,
    boxShadow: '0 0px 16px #ccc', // Use a subtle shadow color
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 16,
    fontWeight: '400', // Use string for fontWeight
    color: '#333',
    marginBottom: 5,
  },
  input: {
    border: '1px solid #ccc', // Use border instead of borderWidth/borderColor
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    outline: 'none',
  },
  loginButton: {
    backgroundColor: '#353738',
    padding: '12px 30px',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '400', // Use string for fontWeight
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: '12px 30px',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '400', // Use string for fontWeight
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginBottom: 10,
  },
  signupButtonText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '400', // Use string for fontWeight
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  noAccount: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    fontWeight: '400', // Use string for fontWeight
  },
};

export default Login;