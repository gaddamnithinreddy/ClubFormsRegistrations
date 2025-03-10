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
  const defaultTitle = 'Club Forms & Registrations | Create and Manage Club Registration Forms';
  const defaultDescription = 'Create and manage club registration forms, membership applications, event signups, and club management tools. Easy-to-use form builder for clubs, organizations, and associations.';
  const defaultKeywords = 'club forms, club registration form, membership registration, club membership form, event registration, club management system, online registration form, club signup form, organization registration';
  const defaultImage = '/logo.png'; // Assuming you have a logo image in the public folder
  const defaultUrl = 'https://clubforms.com'; // Replace with your actual domain

  // Dynamic meta tags based on route
  const getMetaData = () => {
    switch (currentPath) {
      case '/auth':
        return {
          title: 'Sign In | Club Forms & Registrations',
          description: 'Sign in to create and manage your club registration forms, membership applications, and event signups.',
          keywords: 'club forms login, registration system login, club management signin'
        };
      case '/role':
        return {
          title: 'Select Role | Club Forms & Registrations',
          description: 'Choose your role to manage club forms, handle registrations, and oversee club membership applications.',
          keywords: 'club administrator, form manager, registration handler, club management roles'
        };
      case '/dashboard':
        return {
          title: 'Dashboard | Club Forms & Registrations',
          description: 'Manage your club registration forms, view submissions, track memberships, and organize club events all in one place.',
          keywords: 'club dashboard, registration management, form submissions, membership tracking'
        };
      case '/forms/new':
        return {
          title: 'Create Club Registration Form | Club Forms & Registrations',
          description: 'Build custom registration forms for your club events, membership applications, and signups with our easy-to-use form builder.',
          keywords: 'create club form, registration form builder, membership form creator, club signup form'
        };
      default:
        if (currentPath.startsWith('/forms/') && currentPath.endsWith('/respond')) {
          return {
            title: 'Club Registration Form | Club Forms & Registrations',
            description: 'Submit your club registration, membership application, or event signup form.',
            keywords: 'club registration, form submission, membership application, event signup'
          };
        }
        if (currentPath.startsWith('/forms/')) {
          return {
            title: 'View Club Form | Club Forms & Registrations',
            description: 'View and manage your club registration form details, responses, and submissions.',
            keywords: 'view club form, registration responses, form management, submission tracking'
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