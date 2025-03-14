import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { Helmet } from 'react-helmet-async';

// Lazy load components
const FormList = React.lazy(() => import('./components/forms/FormList'));
const FormBuilder = React.lazy(() => import('./components/forms/FormBuilder'));
const FormResponse = React.lazy(() => import('./components/forms/FormResponse'));
const FormSuccess = React.lazy(() => import('./components/forms/FormSuccess'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={
          <>
            <Helmet>
              <title>Dashboard - FormFlow</title>
              <meta name="description" content="View and manage your forms in one place. Create new forms, track responses, and more." />
            </Helmet>
            <FormList />
          </>
        } />
        <Route path="/forms/new" element={
          <>
            <Helmet>
              <title>Create Form - FormFlow</title>
              <meta name="description" content="Create a new form with our easy-to-use form builder. Add fields, customize settings, and share with your audience." />
            </Helmet>
            <FormBuilder />
          </>
        } />
        <Route path="/forms/:id" element={
          <>
            <Helmet>
              <title>Form Response - FormFlow</title>
              <meta name="description" content="Submit your response to this form. Your data is secure and will be handled with care." />
            </Helmet>
            <FormResponse />
          </>
        } />
        <Route path="/forms/:id/success" element={
          <>
            <Helmet>
              <title>Submission Success - FormFlow</title>
              <meta name="description" content="Thank you for your submission! Your response has been recorded successfully." />
            </Helmet>
            <FormSuccess />
          </>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
} 