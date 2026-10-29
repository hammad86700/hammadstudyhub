// ==============================================================================
// HAMMAD STUDYHUB — SEO & HEAD TITLE CONTROLLER
// ==============================================================================

import React, { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ title, description }) => {
  useEffect(() => {
    const fullTitle = `${title} | Hammad StudyHub — Muhammad Hammad`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
};
