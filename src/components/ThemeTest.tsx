import React, { useEffect, useState } from 'react';

const ThemeTest: React.FC = () => {
  const [themeData, setThemeData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/theme')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setThemeData(json.data as Record<string, unknown>);
        } else {
          setError(json.error || 'Failed to fetch theme data from API');
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const renderValue = (key: string, value: unknown) => {
    if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'))) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border border-gray-200" 
            style={{ backgroundColor: value }}
          />
          <span>{value}</span>
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="p-8 space-y-8 bg-[var(--beluga-color-surface)] min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-[var(--beluga-color-primary)]">Theme Test & Builder.io Data</h1>
        <div className="text-xs text-gray-500">
          Entry ID: <code className="bg-gray-100 px-1 rounded">993e7845a53244f9ab8cae40bb7bb2fd</code>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--beluga-color-primary)]"></div>
          <span className="ml-3 text-gray-600">Loading Builder.io data...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          Error: {error}
        </div>
      ) : themeData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visual Preview Section */}
          <div className="space-y-8">
            <section className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold border-b pb-2">Visual Preview</h2>
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Typography</h3>
                <div className="space-y-2">
                  <h1>Heading 1 (H1)</h1>
                  <h2>Heading 2 (H2)</h2>
                  <h3>Heading 3 (H3)</h3>
                  <h4>Heading 4 (H4)</h4>
                  <h5>Heading 5 (H5)</h5>
                  <h6>Heading 6 (H6)</h6>
                  <p>Body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  <p className="text-sm">Small text: This is how small text looks.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Interactive Elements</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="button">Primary Button</button>
                  <a href="#" className="underline">Link Style</a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Input field..." className="w-full" />
                  <select className="w-full">
                    <option>Select option...</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Color Palette</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {Object.entries(themeData)
                    .filter(([key]) => key.toLowerCase().includes('palette') || key.toLowerCase().includes('color'))
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col items-center p-2 rounded bg-gray-50 border border-gray-100">
                        <div 
                          className="w-full aspect-square rounded mb-1 shadow-sm" 
                          style={{ backgroundColor: String(value) }}
                        />
                        <span className="text-[10px] truncate w-full text-center font-mono">{key.replace('palette', '').replace('color', '')}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>

            <section className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold border-b pb-2 mb-4">CSS Variables Status</h2>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                <div className="flex justify-between border-b py-1">
                  <span>CSS Loaded Check:</span>
                  {getComputedStyle(document.body, '::after').content.includes('Theme Loaded') 
                    ? <span className="text-green-600 font-bold">SUCCESS</span> 
                    : <span className="text-red-600 font-bold">FAILED</span>
                  }
                </div>
                {[
                  '--beluga-color-primary',
                  '--beluga-color-accent',
                  '--beluga-font-heading',
                  '--beluga-font-body',
                  '--beluga-radius-button',
                  '--beluga-radius-input'
                ].map(variable => (
                  <div key={variable} className="flex justify-between border-b py-1">
                    <span className="text-gray-500">{variable}:</span>
                    <span className="text-gray-900">{getComputedStyle(document.documentElement).getPropertyValue(variable)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Raw Data Section */}
          <div className="space-y-8">
            <section className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold border-b pb-2 mb-4">Builder.io Model Data</h2>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(themeData).sort().map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 font-mono">{key}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                          {renderValue(key, value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeTest;
