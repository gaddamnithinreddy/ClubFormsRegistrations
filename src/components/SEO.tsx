import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Default values
  const defaultTitle = 'Club Forms & Registrations';
  const defaultDescription = 'Create and manage club registration forms, events, and member signups easily.';
  const defaultKeywords = 'club forms, registration, events, members, signup';
  const defaultImage = '/logo.png'; // Assuming you have a logo image in the public folder
  const defaultUrl = 'https://clubforms.com'; // Replace with your actual domain

  // Dynamic meta tags based on route
  const getMetaData = () => {
    switch (currentPath) {
      case '/auth':
        return {
          title: 'Sign In | Club Forms',
          description: 'Sign in or create an account to manage your club forms and registrations.',
          keywords: 'login, signup, authentication, club forms'
        };
      case '/role':
        return {
          title: 'Select Role | Club Forms',
          description: 'Choose your role to access the appropriate features and permissions.',
          keywords: 'roles, permissions, club management'
        };
      case '/dashboard':
        return {
          title: 'Dashboard | Club Forms',
          description: 'View and manage your forms, submissions, and club activities.',
          keywords: 'dashboard, forms, submissions, management'
        };
      case '/forms/new':
        return {
          title: 'Create Form | Club Forms',
          description: 'Create a new form for your club events, registrations, or member signups.',
          keywords: 'create form, form builder, club events'
        };
      default:
        if (currentPath.startsWith('/forms/') && currentPath.endsWith('/respond')) {
          return {
            title: 'Form Response | Club Forms',
            description: 'Submit your response to the club form.',
            keywords: 'form response, submission, signup'
          };
        }
        if (currentPath.startsWith('/forms/')) {
          return {
            title: 'View Form | Club Forms',
            description: 'View and manage your club form details and responses.',
            keywords: 'view form, form details, responses'
          };
        }
        return {
          title: defaultTitle,
          description: defaultDescription,
          keywords: defaultKeywords
        };
    }
  };

  const metaData = getMetaData();
  const finalTitle = title || metaData.title;
  const finalDescription = description || metaData.description;
  const finalKeywords = keywords || metaData.keywords;
  const finalImage = image || defaultImage;
  const finalUrl = url || `${defaultUrl}${currentPath}`;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Open Graph meta tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={finalUrl} />
    </Helmet>
  );
}; 