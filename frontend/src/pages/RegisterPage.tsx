/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // --- Frontend validation ---
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      // --- API call to the backend ---
      await apiClient.post('/auth/register', { email, password });

      // --- On success, redirect to login ---
      alert('Registration successful! Please log in.'); // Optional: give user feedback
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); // Show backend error (e.g., "User already exists")
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-xl h-fit w-full max-w-[400px] shadow-xl border border-gray-200 flex flex-col gap-4"
      >
        <h2 className="text-lg font-bold">Create Account</h2>
        {error && <p className="error-message">{error}</p>}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit">Register</Button>
        <p className="text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link className="underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
