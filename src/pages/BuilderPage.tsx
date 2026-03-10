import React, { useEffect, useState } from 'react';
import { BuilderComponent, builder } from '@builder.io/react';

// Initialize Builder with the API Key
builder.init('f450ca45929045f782ca4fdfb394abb9');

const BuilderPage: React.FC = () => {
  const [content, setContent] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const urlPath = window.location.pathname || '/';
      const page = await builder.get('page', {
        userAttributes: {
          urlPath: urlPath,
        },
      }).toPromise();

      setContent(page);
      setLoading(false);
    }
    fetchContent();
  }, []);

  if (loading) {
    return null;
  }

  if (!content) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <BuilderComponent model="page" content={content as any} />;
};

export default BuilderPage;
